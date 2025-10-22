#!/usr/bin/env node

/**
 * GitHub Secrets Updater for NORMALDANCE
 * 
 * This script synchronizes Vercel secrets with GitHub repository secrets,
 * ensuring both environments have consistent secret values.
 * 
 * Usage:
 *   node scripts/update-github-secrets.js [options]
 * 
 * Options:
 *   --env <env>      Environment to update (dev, staging, production)
 *   --force          Force update without confirmation
 *   --dry-run       Show what would be updated without actually updating
 *   --help          Show help message
 */

import fs from 'fs';.promises;
import path from 'path';;
import { execSync  } from 'child_process';;
import { SecretsTemplateManager  } from '../config/secrets-templates';;
import axios from 'axios';;

class GitHubSecretsUpdater {
  constructor() {
    this.templateManager = new SecretsTemplateManager();
    this.githubToken = process.env.GITHUB_TOKEN;
    this.owner = 'normaldance';
    this.repo = 'normaldance';
    this.environments = ['dev', 'staging', 'production'];
    this.configFile = path.join(__dirname, '../config/secrets-config.json');
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      this.showHelp();
      return;
    }

    const options = this.parseOptions(args);
    
    if (options.help) {
      this.showHelp();
      return;
    }

    try {
      console.log('🔄 Starting GitHub Secrets update...');
      
      // Validate GitHub token
      if (!this.githubToken) {
        throw new Error('GITHUB_TOKEN environment variable is required');
      }

      // Update secrets for specified environment
      await this.updateEnvironmentSecrets(options);
      
      console.log('✅ GitHub Secrets update completed successfully!');
    } catch (error) {
      console.error(`❌ Update failed: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  parseOptions(args) {
    const options = {
      environment: 'dev',
      force: false,
      dryRun: false,
      verbose: false,
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
        case '--force':
        case '-f':
          options.force = true;
          break;
        case '--dry-run':
          options.dryRun = true;
          break;
        case '--verbose':
        case '-v':
          options.verbose = true;
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

  async updateEnvironmentSecrets(options) {
    const { environment, force, dryRun } = options;
    
    console.log(`🔧 Updating GitHub secrets for ${environment} environment...`);
    
    // Get Vercel secrets
    const vercelSecrets = await this.getVercelSecrets(environment);
    
    // Get GitHub secrets
    const githubSecrets = await this.getGitHubSecrets();
    
    // Compare and update secrets
    const updates = await this.compareSecrets(vercelSecrets, githubSecrets, environment);
    
    if (updates.length === 0) {
      console.log('✅ No updates needed - secrets are already synchronized');
      return;
    }

    if (!force) {
      const confirm = await this.promptForConfirmation(`Found ${updates.length} secrets to update. Continue?`);
      if (!confirm) {
        console.log('Operation cancelled');
        return;
      }
    }

    // Perform updates
    for (const update of updates) {
      if (dryRun) {
        console.log(`[DRY RUN] Would update ${update.key}: ${this.maskSecretValue(update.key, update.value)}`);
      } else {
        await this.updateGitHubSecret(update.key, update.value);
        console.log(`✅ Updated ${update.key} in GitHub`);
      }
    }

    if (!dryRun) {
      // Log the update
      await this.logUpdate(environment, updates);
    }
  }

  async getVercelSecrets(environment) {
    try {
      const output = execSync(`vercel env pull ${environment}`, { encoding: 'utf8' });
      const secrets = this.parseSecretsOutput(output);
      
      console.log(`📋 Retrieved ${Object.keys(secrets).length} secrets from Vercel ${environment}`);
      return secrets;
    } catch (error) {
      throw new Error(`Failed to get Vercel secrets: ${error.message}`);
    }
  }

  async getGitHubSecrets() {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${this.owner}/${this.repo}/actions/secrets`,
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      
      const secrets = {};
      for (const secret of response.data.secrets) {
        secrets.secret_name = secret.name;
      }
      
      console.log(`📋 Retrieved ${Object.keys(secrets).length} secrets from GitHub`);
      return secrets;
    } catch (error) {
      throw new Error(`Failed to get GitHub secrets: ${error.message}`);
    }
  }

  async compareSecrets(vercelSecrets, githubSecrets, environment) {
    const updates = [];
    const template = this.templateManager.getTemplate(environment);
    
    if (!template) {
      throw new Error(`Template not found for environment: ${environment}`);
    }

    // Get required secrets for this environment
    const requiredSecrets = this.templateManager.getRequiredSecrets(environment);
    
    for (const key of requiredSecrets) {
      const vercelValue = vercelSecrets[key];
      const githubValue = githubSecrets[key];
      
      if (!vercelValue) {
        console.log(`⚠️  Secret ${key} not found in Vercel`);
        continue;
      }
      
      if (!githubValue) {
        // Secret exists in Vercel but not in GitHub
        updates.push({
          key,
          value: vercelValue,
          action: 'add'
        });
      } else if (vercelValue !== githubValue) {
        // Secret values differ
        updates.push({
          key,
          value: vercelValue,
          action: 'update'
        });
      }
    }
    
    return updates;
  }

  async updateGitHubSecret(key, value) {
    try {
      // Create or update secret
      const response = await axios.put(
        `https://api.github.com/repos/${this.owner}/${this.repo}/actions/secrets/${key}`,
        {
          encrypted_value: this.encryptSecretValue(value),
          key_id: process.env.GITHUB_SECRET_KEY_ID
        },
        {
          headers: {
            'Authorization': `token ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to update GitHub secret ${key}: ${error.message}`);
    }
  }

  encryptSecretValue(value) {
    // This is a simplified version - in production, you'd use the GitHub API's public key
    // to encrypt the secret value before sending it
    import crypto from 'crypto';;
    const algorithm = 'aes-256-cbc';
    const key = crypto.createHash('sha256').update(process.env.GITHUB_SECRET_KEY || 'default-key').digest('base64').substr(0, 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return encrypted;
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

  async logUpdate(environment, updates) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      environment,
      updates: updates.map(update => ({
        key: update.key,
        action: update.action,
        value: this.maskSecretValue(update.key, update.value)
      }))
    };
    
    const logFile = path.join(__dirname, '../github-secrets-update.log');
    await fs.appendFile(logFile, JSON.stringify(logEntry) + '\n');
  }

  showHelp() {
    console.log(`
GitHub Secrets Updater for NORMALDANCE

Usage: node scripts/update-github-secrets.js [options]

Options:
  --env, -e <env>      Environment to update (dev, staging, production)
  --force, -f          Force update without confirmation
  --dry-run           Show what would be updated without actually updating
  --verbose, -v        Enable verbose output
  --help, -h          Show help message

Examples:
  node scripts/update-github-secrets.js --env production
  node scripts/update-github-secrets.js --env staging --force
  node scripts/update-github-secrets.js --env dev --dry-run
    `);
  }
}

// Run the script
if (require.main === module) {
  const updater = new GitHubSecretsUpdater();
  updater.run();
}

module.exports = GitHubSecretsUpdater;