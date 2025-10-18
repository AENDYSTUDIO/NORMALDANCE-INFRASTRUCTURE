#!/usr/bin/env node

/**
 * Enhanced Secrets Manager for NORMALDANCE Vercel
 * 
 * This script provides comprehensive secret management for Vercel environments,
 * including bulk operations, validation, rotation, and audit logging.
 * 
 * Usage:
 *   node scripts/secrets-manager.js [command] [options]
 * 
 * Commands:
 *   setup              Setup Vercel CLI and configure secrets
 *   add                Add secrets to environment
 *   list               List secrets for environment
 *   remove             Remove secrets from environment
 *   validate           Validate secrets against templates
 *   rotate             Rotate secrets automatically
 *   backup             Backup secrets to file
 *   restore            Restore secrets from file
 *   audit              Show audit log for secrets
 *   sync               Sync secrets between environments
 *   export             Export secrets to file
 *   import             Import secrets from file
 *   help               Show help message
 */

import fs from 'fs';.promises;
import path from 'path';;
import { execSync  } from 'child_process';;
import { SecretsTemplateManager  } from '../config/secrets-templates';;
import crypto from 'crypto';;

class SecretsManager {
  constructor() {
    this.templateManager = new SecretsTemplateManager();
    this.auditLogFile = path.join(__dirname, '../secrets-audit.log');
    this.configFile = path.join(__dirname, '../secrets-config.json');
    this.environments = ['dev', 'staging', 'production'];
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const command = args[0];
    const options = this.parseOptions(args.slice(1));

    try {
      switch (command) {
        case 'setup':
          await this.setup();
          break;
        case 'add':
          await this.addSecrets(options);
          break;
        case 'list':
          await this.listSecrets(options);
          break;
        case 'remove':
          await this.removeSecrets(options);
          break;
        case 'validate':
          await this.validateSecrets(options);
          break;
        case 'rotate':
          await this.rotateSecrets(options);
          break;
        case 'backup':
          await this.backupSecrets(options);
          break;
        case 'restore':
          await this.restoreSecrets(options);
          break;
        case 'audit':
          await this.showAuditLog(options);
          break;
        case 'sync':
          await this.syncSecrets(options);
          break;
        case 'export':
          await this.exportSecrets(options);
          break;
        case 'import':
          await this.importSecrets(options);
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Command failed: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  parseOptions(args) {
    const options = {
      environment: 'dev',
      verbose: false,
      force: false,
      dryRun: false,
      file: null,
      key: null,
      value: null,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--env':
        case '-e':
          if (i + 1 < args.length) {
            const env = args[i + 1];
            if (this.environments.includes(env)) {
              options.environment = env;
              i++;
            } else {
              console.error(`❌ Invalid environment: ${env}`);
              console.error(`Valid environments: ${this.environments.join(', ')}`);
              process.exit(1);
            }
          }
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
          break;
        case '--force':
        case '-f':
          options.force = true;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--file':
        case '-F':
          if (i + 1 < args.length) {
            options.file = args[i + 1];
            i++;
          }
          break;
        case '--key':
        case '-k':
          if (i + 1 < args.length) {
            options.key = args[i + 1];
            i++;
          }
          break;
        case '--value':
        case '-V':
          if (i + 1 < args.length) {
            options.value = args[i + 1];
            i++;
          }
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
        default:
          console.error(`❌ Unknown option: ${arg}`);
          process.exit(1);
      }
    }

    return options;
  }

  async setup() {
    console.log('🚀 Setting up Vercel Secrets Manager...');
    
    // Check if Vercel CLI is installed
    try {
      execSync('vercel --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Vercel CLI is not installed. Please install it first.');
    }

    // Check authentication
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Vercel CLI is authenticated');
    } catch (error) {
      throw new Error('Vercel CLI is not authenticated. Please run `vercel login` first.');
    }

    // Setup each environment
    for (const env of this.environments) {
      console.log(`\n🔧 Setting up ${env} environment...`);
      await this.setupEnvironment(env);
    }

    // Save configuration
    await this.saveConfiguration();
    
    console.log('\n✅ Setup completed successfully!');
  }

  async setupEnvironment(environment) {
    const template = this.templateManager.getTemplate(environment);
    if (!template) {
      throw new Error(`Template not found for environment: ${environment}`);
    }

    console.log(`📝 Required secrets for ${environment}:`);
    const requiredSecrets = this.templateManager.getRequiredSecrets(environment);
    
    for (const secret of requiredSecrets) {
      try {
        // Check if secret already exists
        execSync(`vercel env ls ${environment} | grep ${secret}`, { stdio: 'ignore' });
        console.log(`  ✅ ${secret} already exists`);
      } catch (error) {
        // Secret doesn't exist, prompt for it
        const value = await this.promptForSecret(secret, environment);
        await this.addSecret(environment, secret, value);
      }
    }
  }

  async addSecrets(options) {
    if (options.help) {
      this.showCommandHelp('add');
      return;
    }

    const { environment, file, key, value, dryRun } = options;
    
    if (file) {
      // Add secrets from file
      await this.addSecretsFromFile(environment, file, dryRun);
    } else if (key && value !== undefined) {
      // Add single secret
      await this.addSecret(environment, key, value, dryRun);
    } else {
      // Add all required secrets
      await this.addRequiredSecrets(environment, dryRun);
    }
  }

  async addSecretsFromFile(environment, filePath, dryRun = false) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const secrets = JSON.parse(content);
      
      console.log(`📁 Adding secrets from ${filePath} to ${environment}...`);
      
      for (const [key, value] of Object.entries(secrets)) {
        await this.addSecret(environment, key, value, dryRun);
      }
      
      console.log('✅ All secrets added successfully');
    } catch (error) {
      throw new Error(`Failed to add secrets from file: ${error.message}`);
    }
  }

  async addSecret(environment, key, value, dryRun = false) {
    const template = this.templateManager.getTemplate(environment);
    const secretConfig = template?.secrets[key];
    
    // Validate secret
    if (secretConfig && !this.templateManager.validateSecret(environment, key, value)) {
      throw new Error(`Invalid value for secret '${key}': ${value}`);
    }

    if (dryRun) {
      console.log(`[DRY RUN] Would add ${key} to ${environment}`);
      return;
    }

    try {
      // Check if secret already exists
      execSync(`vercel env ls ${environment} | grep ${key}`, { stdio: 'ignore' });
      
      // Update existing secret
      execSync(`vercel env rm ${environment} ${key}`, { stdio: 'ignore' });
      execSync(`vercel env add ${environment} ${key}`, { 
        stdio: 'pipe',
        input: `${value}\n`,
        encoding: 'utf8'
      });
      console.log(`✅ Updated ${key} in ${environment}`);
    } catch (error) {
      // Add new secret
      execSync(`vercel env add ${environment} ${key}`, { 
        stdio: 'pipe',
        input: `${value}\n`,
        encoding: 'utf8'
      });
      console.log(`✅ Added ${key} to ${environment}`);
    }

    // Log the action
    await this.logAudit({
      action: 'add',
      environment,
      key,
      value: this.maskSecretValue(key, value),
      timestamp: new Date().toISOString()
    });
  }

  async addRequiredSecrets(environment, dryRun = false) {
    const requiredSecrets = this.templateManager.getRequiredSecrets(environment);
    
    console.log(`📝 Adding required secrets to ${environment}...`);
    
    for (const secret of requiredSecrets) {
      try {
        // Check if secret already exists
        execSync(`vercel env ls ${environment} | grep ${secret}`, { stdio: 'ignore' });
        console.log(`  ✅ ${secret} already exists`);
      } catch (error) {
        // Secret doesn't exist, prompt for it
        const value = await this.promptForSecret(secret, environment);
        await this.addSecret(environment, secret, value, dryRun);
      }
    }
  }

  async listSecrets(options) {
    if (options.help) {
      this.showCommandHelp('list');
      return;
    }

    const { environment, verbose } = options;
    
    try {
      const output = execSync(`vercel env ls ${environment}`, { encoding: 'utf8' });
      console.log(`📋 Secrets for ${environment} environment:\n`);
      console.log(output);
      
      if (verbose) {
        const template = this.templateManager.getTemplate(environment);
        if (template) {
          console.log('\n📝 Template information:');
          console.log(`Environment: ${template.name}`);
          console.log(`Description: ${template.description}`);
          console.log(`Required secrets: ${this.templateManager.getRequiredSecrets(environment).length}`);
          console.log(`Optional secrets: ${this.templateManager.getOptionalSecrets(environment).length}`);
        }
      }
    } catch (error) {
      throw new Error(`Failed to list secrets: ${error.message}`);
    }
  }

  async removeSecrets(options) {
    if (options.help) {
      this.showCommandHelp('remove');
      return;
    }

    const { environment, key, force } = options;
    
    if (!key) {
      throw new Error('Key is required for remove operation');
    }

    if (!force) {
      const confirm = await this.promptForConfirmation(`Are you sure you want to remove ${key} from ${environment}?`);
      if (!confirm) {
        console.log('Operation cancelled');
        return;
      }
    }

    try {
      execSync(`vercel env rm ${environment} ${key}`, { stdio: 'inherit' });
      console.log(`✅ Removed ${key} from ${environment}`);
      
      // Log the action
      await this.logAudit({
        action: 'remove',
        environment,
        key,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Failed to remove secret: ${error.message}`);
    }
  }

  async validateSecrets(options) {
    if (options.help) {
      this.showCommandHelp('validate');
      return;
    }

    const { environment, file } = options;
    
    if (file) {
      // Validate secrets from file
      await this.validateSecretsFromFile(environment, file);
    } else {
      // Validate current secrets
      await this.validateCurrentSecrets(environment);
    }
  }

  async validateSecretsFromFile(environment, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const secrets = JSON.parse(content);
      
      console.log(`🔍 Validating secrets from ${filePath} against ${environment} template...`);
      
      const template = this.templateManager.getTemplate(environment);
      if (!template) {
        throw new Error(`Template not found for environment: ${environment}`);
      }

      const errors = [];
      const warnings = [];

      for (const [key, value] of Object.entries(secrets)) {
        const secretConfig = template.secrets[key];
        if (!secretConfig) {
          warnings.push(`Unknown secret: ${key}`);
          continue;
        }

        if (!this.templateManager.validateSecret(environment, key, value)) {
          errors.push(`Invalid value for ${key}: ${value}`);
        }
      }

      if (errors.length > 0) {
        console.log('\n❌ Validation errors:');
        errors.forEach(error => console.log(`  - ${error}`));
      }

      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      if (errors.length === 0) {
        console.log('\n✅ All secrets are valid');
      }
    } catch (error) {
      throw new Error(`Failed to validate secrets: ${error.message}`);
    }
  }

  async validateCurrentSecrets(environment) {
    try {
      const output = execSync(`vercel env ls ${environment}`, { encoding: 'utf8' });
      const secrets = this.parseSecretsList(output);
      
      console.log(`🔍 Validating current secrets in ${environment}...`);
      
      const template = this.templateManager.getTemplate(environment);
      if (!template) {
        throw new Error(`Template not found for environment: ${environment}`);
      }

      const errors = [];
      const warnings = [];

      for (const secret of secrets) {
        const secretConfig = template.secrets[secret];
        if (!secretConfig) {
          warnings.push(`Unknown secret: ${secret}`);
          continue;
        }

        // Get secret value for validation
        try {
          const valueOutput = execSync(`vercel env pull ${environment} ${secret}`, { encoding: 'utf8' });
          const value = valueOutput.trim();
          
          if (!this.templateManager.validateSecret(environment, secret, value)) {
            errors.push(`Invalid value for ${secret}`);
          }
        } catch (error) {
          errors.push(`Could not validate ${secret}: ${error.message}`);
        }
      }

      if (errors.length > 0) {
        console.log('\n❌ Validation errors:');
        errors.forEach(error => console.log(`  - ${error}`));
      }

      if (warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        warnings.forEach(warning => console.log(`  - ${warning}`));
      }

      if (errors.length === 0) {
        console.log('\n✅ All secrets are valid');
      }
    } catch (error) {
      throw new Error(`Failed to validate secrets: ${error.message}`);
    }
  }

  async rotateSecrets(options) {
    if (options.help) {
      this.showCommandHelp('rotate');
      return;
    }

    const { environment, force, dryRun } = options;
    
    if (!force) {
      const confirm = await this.promptForConfirmation(`Are you sure you want to rotate secrets in ${environment}?`);
      if (!confirm) {
        console.log('Operation cancelled');
        return;
      }
    }

    const template = this.templateManager.getTemplate(environment);
    if (!template) {
      throw new Error(`Template not found for environment: ${environment}`);
    }

    console.log(`🔄 Rotating secrets in ${environment}...`);
    
    const rotatedSecrets = [];
    
    for (const [key, config] of Object.entries(template.secrets)) {
      if (config.generator) {
        const newValue = config.generator();
        
        if (dryRun) {
          console.log(`[DRY RUN] Would rotate ${key}`);
        } else {
          await this.addSecret(environment, key, newValue, false);
          rotatedSecrets.push(key);
        }
      }
    }

    if (rotatedSecrets.length > 0) {
      console.log(`✅ Rotated ${rotatedSecrets.length} secrets: ${rotatedSecrets.join(', ')}`);
    } else {
      console.log('ℹ️  No secrets with generators found');
    }
  }

  async backupSecrets(options) {
    if (options.help) {
      this.showCommandHelp('backup');
      return;
    }

    const { environment, file } = options;
    
    if (!file) {
      throw new Error('Output file is required for backup operation');
    }

    try {
      console.log(`💾 Backing up secrets from ${environment} to ${file}...`);
      
      const output = execSync(`vercel env pull ${environment}`, { encoding: 'utf8' });
      const secrets = this.parseSecretsOutput(output);
      
      // Encrypt the backup file
      const encrypted = this.encryptSecrets(secrets);
      await fs.writeFile(file, encrypted);
      
      console.log(`✅ Backup completed: ${file}`);
      
      // Log the action
      await this.logAudit({
        action: 'backup',
        environment,
        file,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Failed to backup secrets: ${error.message}`);
    }
  }

  async restoreSecrets(options) {
    if (options.help) {
      this.showCommandHelp('restore');
      return;
    }

    const { environment, file, force } = options;
    
    if (!file) {
      throw new Error('Input file is required for restore operation');
    }

    if (!force) {
      const confirm = await this.promptForConfirmation(`Are you sure you want to restore secrets to ${environment} from ${file}?`);
      if (!confirm) {
        console.log('Operation cancelled');
        return;
      }
    }

    try {
      console.log(`🔄 Restoring secrets to ${environment} from ${file}...`);
      
      // Read and decrypt the backup file
      const encrypted = await fs.readFile(file, 'utf8');
      const secrets = this.decryptSecrets(encrypted);
      
      // Restore secrets
      for (const [key, value] of Object.entries(secrets)) {
        await this.addSecret(environment, key, value, false);
      }
      
      console.log(`✅ Restore completed: ${Object.keys(secrets).length} secrets restored`);
      
      // Log the action
      await this.logAudit({
        action: 'restore',
        environment,
        file,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      throw new Error(`Failed to restore secrets: ${error.message}`);
    }
  }

  async showAuditLog(options) {
    if (options.help) {
      this.showCommandHelp('audit');
      return;
    }

    try {
      const content = await fs.readFile(this.auditLogFile, 'utf8');
      const entries = content.split('\n').filter(line => line.trim());
      
      console.log('📋 Secret Audit Log:\n');
      
      for (const entry of entries.reverse()) {
        const log = JSON.parse(entry);
        console.log(`[${log.timestamp}] ${log.action.toUpperCase()} ${log.key} in ${log.environment}`);
        if (log.value) {
          console.log(`  Value: ${log.value}`);
        }
        if (log.file) {
          console.log(`  File: ${log.file}`);
        }
        console.log('');
      }
    } catch (error) {
      throw new Error(`Failed to read audit log: ${error.message}`);
    }
  }

  async syncSecrets(options) {
    if (options.help) {
      this.showCommandHelp('sync');
      return;
    }

    const { from, to, force } = options;
    
    if (!from || !to) {
      throw new Error('Both --from and --to options are required for sync operation');
    }

    if (!this.environments.includes(from) || !this.environments.includes(to)) {
      throw new Error('Invalid environment specified');
    }

    if (from === to) {
      throw new Error('Cannot sync to the same environment');
    }

    if (!force) {
      const confirm = await this.promptForConfirmation(`Are you sure you want to sync secrets from ${from} to ${to}?`);
      if (!confirm) {
        console.log('Operation cancelled');
        return;
      }
    }

    try {
      console.log(`🔄 Syncing secrets from ${from} to ${to}...`);
      
      // Get secrets from source environment
      const output = execSync(`vercel env pull ${from}`, { encoding: 'utf8' });
      const secrets = this.parseSecretsOutput(output);
      
      // Sync to target environment
      for (const [key, value] of Object.entries(secrets)) {
        await this.addSecret(to, key, value, false);
      }
      
      console.log(`✅ Sync completed: ${Object.keys(secrets).length} secrets synced`);
    } catch (error) {
      throw new Error(`Failed to sync secrets: ${error.message}`);
    }
  }

  async exportSecrets(options) {
    if (options.help) {
      this.showCommandHelp('export');
      return;
    }

    const { environment, file } = options;
    
    if (!file) {
      throw new Error('Output file is required for export operation');
    }

    try {
      console.log(`📤 Exporting secrets from ${environment} to ${file}...`);
      
      const output = execSync(`vercel env pull ${environment}`, { encoding: 'utf8' });
      const secrets = this.parseSecretsOutput(output);
      
      await fs.writeFile(file, JSON.stringify(secrets, null, 2));
      
      console.log(`✅ Export completed: ${Object.keys(secrets).length} secrets exported`);
    } catch (error) {
      throw new Error(`Failed to export secrets: ${error.message}`);
    }
  }

  async importSecrets(options) {
    if (options.help) {
      this.showCommandHelp('import');
      return;
    }

    const { environment, file, force } = options;
    
    if (!file) {
      throw new Error('Input file is required for import operation');
    }

    if (!force) {
      const confirm = await this.promptForConfirmation(`Are you sure you want to import secrets to ${environment} from ${file}?`);
      if (!confirm) {
        console.log('Operation cancelled');
        return;
      }
    }

    try {
      console.log(`📥 Importing secrets to ${environment} from ${file}...`);
      
      const content = await fs.readFile(file, 'utf8');
      const secrets = JSON.parse(content);
      
      for (const [key, value] of Object.entries(secrets)) {
        await this.addSecret(environment, key, value, false);
      }
      
      console.log(`✅ Import completed: ${Object.keys(secrets).length} secrets imported`);
    } catch (error) {
      throw new Error(`Failed to import secrets: ${error.message}`);
    }
  }

  // Helper methods
  async promptForSecret(key, environment) {
    return new Promise((resolve) => {
      import readline from 'readline';;
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question(`Enter value for ${key} (${environment}): `, (value) => {
        rl.close();
        resolve(value.trim());
      });
    });
  }

  async promptForConfirmation(message) {
    return new Promise((resolve) => {
      import readline from 'readline';;
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question(`${message} (y/N): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y');
      });
    });
  }

  maskSecretValue(key, value) {
    const sensitiveKeys = ['password', 'secret', 'key', 'token', 'dsn'];
    const isSensitive = sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
    return isSensitive ? '***' : value;
  }

  parseSecretsList(output) {
    const lines = output.split('\n');
    const secrets = [];
    
    for (const line of lines) {
      const match = line.match(/^(\w+)/);
      if (match) {
        secrets.push(match[1]);
      }
    }
    
    return secrets;
  }

  parseSecretsOutput(output) {
    const secrets = {};
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+)=(.+)$/);
      if (match) {
        secrets[match[1]] = match[2];
      }
    }
    
    return secrets;
  }

  encryptSecrets(secrets) {
    const password = process.env.SECRETS_ENCRYPTION_PASSWORD || 'default-password';
    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(password).digest('base64').substr(0, 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(JSON.stringify(secrets), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return JSON.stringify({
      iv: iv.toString('hex'),
      encrypted: encrypted
    });
  }

  decryptSecrets(encryptedData) {
    const password = process.env.SECRETS_ENCRYPTION_PASSWORD || 'default-password';
    const data = JSON.parse(encryptedData);
    
    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(password).digest('base64').substr(0, 32);
    const iv = Buffer.from(data.iv, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  async logAudit(entry) {
    const logEntry = JSON.stringify(entry);
    await fs.appendFile(this.auditLogFile, logEntry + '\n');
  }

  async saveConfiguration() {
    const config = {
      version: '1.0.0',
      environments: this.environments,
      auditLogFile: this.auditLogFile,
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
  }

  showHelp() {
    console.log(`
Enhanced Secrets Manager for NORMALDANCE Vercel

Usage: node scripts/secrets-manager.js [command] [options]

Commands:
  setup              Setup Vercel CLI and configure secrets
  add                Add secrets to environment
  list               List secrets for environment
  remove             Remove secrets from environment
  validate           Validate secrets against templates
  rotate             Rotate secrets automatically
  backup             Backup secrets to file
  restore            Restore secrets from file
  audit              Show audit log for secrets
  sync               Sync secrets between environments
  export             Export secrets to file
  import             Import secrets from file
  help               Show help message

Global Options:
  --env, -e <env>    Environment to operate on (dev, staging, production)
  --verbose, -v      Enable verbose output
  --force, -f        Force operation without confirmation
  --dry-run          Show what would be done without actually doing it
  --help, -h         Show help message

Examples:
  node scripts/secrets-manager.js setup
  node scripts/secrets-manager.js add --env production --key DATABASE_URL --value "postgresql://..."
  node scripts/secrets-manager.js add --env staging --file secrets-staging.json
  node scripts/secrets-manager.js list --env production --verbose
  node scripts/secrets-manager.js validate --env dev --file secrets-dev.json
  node scripts/secrets-manager.js rotate --env production --force
  node scripts/secrets-manager.js backup --env production --file backup-prod.json
  node scripts/secrets-manager.js sync --from staging --to production --force
    `);
  }

  showCommandHelp(command) {
    const commands = {
      add: `
Add secrets to environment

Usage: node scripts/secrets-manager.js add [options]

Options:
  --env, -e <env>    Environment to add secrets to
  --file, -F <file>  Add secrets from JSON file
  --key, -k <key>    Specific secret key to add
  --value, -V <val>  Value for the secret
  --dry-run          Show what would be done

Examples:
  node scripts/secrets-manager.js add --env production --key DATABASE_URL --value "postgresql://..."
  node scripts/secrets-manager.js add --env staging --file secrets-staging.json
      `,
      list: `
List secrets for environment

Usage: node scripts/secrets-manager.js list [options]

Options:
  --env, -e <env>    Environment to list secrets for
  --verbose          Show detailed information

Examples:
  node scripts/secrets-manager.js list --env production
  node scripts/secrets-manager.js list --env dev --verbose
      `,
      remove: `
Remove secrets from environment

Usage: node scripts/secrets-manager.js remove [options]

Options:
  --env, -e <env>    Environment to remove secrets from
  --key, -k <key>    Secret key to remove
  --force            Remove without confirmation

Examples:
  node scripts/secrets-manager.js remove --env production --key DATABASE_URL --force
      `,
      validate: `
Validate secrets against templates

Usage: node scripts/secrets-manager.js validate [options]

Options:
  --env, -e <env>    Environment to validate against
  --file <file>      Validate secrets from JSON file

Examples:
  node scripts/secrets-manager.js validate --env dev --file secrets-dev.json
      `,
      rotate: `
Rotate secrets automatically

Usage: node scripts/secrets-manager.js rotate [options]

Options:
  --env, -e <env>    Environment to rotate secrets in
  --force            Rotate without confirmation
  --dry-run          Show what would be rotated

Examples:
  node scripts/secrets-manager.js rotate --env production --force
      `,
      backup: `
Backup secrets to file

Usage: node scripts/secrets-manager.js backup [options]

Options:
  --env, -e <env>    Environment to backup
  --file <file>      Output file for backup

Examples:
  node scripts/secrets-manager.js backup --env production --file backup-prod.json
      `,
      restore: `
Restore secrets from file

Usage: node scripts/secrets-manager.js restore [options]

Options:
  --env, -e <env>    Environment to restore to
  --file <file>      Input file to restore from
  --force            Restore without confirmation

Examples:
  node scripts/secrets-manager.js restore --env production --file backup-prod.json --force
      `,
      audit: `
Show audit log for secrets

Usage: node scripts/secrets-manager.js audit [options]

Examples:
  node scripts/secrets-manager.js audit
      `,
      sync: `
Sync secrets between environments

Usage: node scripts/secrets-manager.js sync [options]

Options:
  --from <env>       Source environment
  --to <env>         Target environment
  --force            Sync without confirmation

Examples:
  node scripts/secrets-manager.js sync --from staging --to production --force
      `,
      export: `
Export secrets to file

Usage: node scripts/secrets-manager.js export [options]

Options:
  --env, -e <env>    Environment to export
  --file <file>      Output file for export

Examples:
  node scripts/secrets-manager.js export --env production --file secrets-prod.json
      `,
      import: `
Import secrets from file

Usage: node scripts/secrets-manager.js import [options]

Options:
  --env, -e <env>    Environment to import to
  --file <file>      Input file to import from
  --force            Import without confirmation

Examples:
  node scripts/secrets-manager.js import --env production --file secrets-prod.json --force
      `
    };

    console.log(commands[command] || 'Unknown command');
  }
}

// Run the script
if (require.main === module) {
  const manager = new SecretsManager();
  manager.run();
}

module.exports = SecretsManager;