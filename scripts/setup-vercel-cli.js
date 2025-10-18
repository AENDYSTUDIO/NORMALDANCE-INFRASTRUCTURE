#!/usr/bin/env node

/**
 * Vercel CLI Setup Script for NORMALDANCE
 * 
 * This script automates the setup of Vercel CLI for the NORMALDANCE project,
 * including authentication, project configuration, and environment setup.
 * 
 * Usage:
 *   node scripts/setup-vercel-cli.js [options]
 * 
 * Options:
 *   --force          Force re-setup even if already configured
 *   --env <env>      Setup specific environment (dev, staging, production)
 *   --skip-auth      Skip authentication step
 *   --skip-secrets   Skip secrets setup
 *   --help           Show help message
 */

import fs from 'fs';.promises;
import path from 'path';;
import { execSync  } from 'child_process';;
import readline from 'readline';;

class VercelCLISetup {
  constructor() {
    this.projectId = 'prj_EHz31iPa5ZW2rpV31JDVQKuyHvW2';
    this.projectName = 'normaldance/normaldance';
    this.environments = ['dev', 'staging', 'production'];
    this.configFile = path.join(__dirname, '../vercel-setup-config.json');
    this.requiredSecrets = {
      dev: [
        'NEXTAUTH_SECRET',
        'DATABASE_URL',
        'SOLANA_RPC_URL',
        'REDIS_URL',
        'LOG_LEVEL',
        'ENABLE_DEBUG',
        'ENABLE_MOCK_DATA'
      ],
      staging: [
        'NEXTAUTH_SECRET',
        'DATABASE_URL',
        'SOLANA_RPC_URL',
        'REDIS_URL',
        'LOG_LEVEL',
        'ANALYTICS_ENABLED',
        'MONITORING_ENABLED',
        'SENTRY_DSN',
        'DATADOG_API_KEY'
      ],
      production: [
        'NEXTAUTH_SECRET',
        'DATABASE_URL',
        'SOLANA_RPC_URL',
        'REDIS_URL',
        'LOG_LEVEL',
        'ANALYTICS_ENABLED',
        'MONITORING_ENABLED',
        'SENTRY_DSN',
        'DATADOG_API_KEY',
        'GOOGLE_ANALYTICS_ID',
        'MIXPANEL_TOKEN',
        'JWT_SECRET',
        'ENCRYPTION_KEY',
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'CLOUDFLARE_API_TOKEN'
      ]
    };
  }

  async run() {
    const args = process.argv.slice(2);
    
    // Parse arguments
    const options = this.parseArguments(args);
    
    if (options.help) {
      this.showHelp();
      return;
    }

    try {
      console.log('🚀 Starting Vercel CLI setup for NORMALDANCE...');
      
      // Check if already configured
      const isConfigured = await this.checkIfConfigured();
      if (isConfigured && !options.force) {
        console.log('✅ Vercel CLI is already configured.');
        console.log('Use --force to reconfigure.');
        return;
      }

      // Step 1: Authentication
      if (!options.skipAuth) {
        await this.setupAuthentication();
      }

      // Step 2: Project configuration
      await this.setupProject();

      // Step 3: Environment setup
      if (!options.skipSecrets) {
        const environments = options.env ? [options.env] : this.environments;
        for (const env of environments) {
          await this.setupEnvironment(env);
        }
      }

      // Step 4: Save configuration
      await this.saveConfiguration();

      console.log('✅ Vercel CLI setup completed successfully!');
      console.log('🎉 You can now use the secrets manager and deploy to Vercel.');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  parseArguments(args) {
    const options = {
      force: false,
      skipAuth: false,
      skipSecrets: false,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--force':
          options.force = true;
          break;
        case '--skip-auth':
          options.skipAuth = true;
          break;
        case '--skip-secrets':
          options.skipSecrets = true;
          break;
        case '--help':
          options.help = true;
          break;
        case '--env':
          if (i + 1 < args.length) {
            const env = args[i + 1];
            if (this.environments.includes(env)) {
              options.env = env;
              i++;
            } else {
              console.error(`❌ Invalid environment: ${env}`);
              console.error(`Valid environments: ${this.environments.join(', ')}`);
              process.exit(1);
            }
          }
          break;
        default:
          console.error(`❌ Unknown argument: ${arg}`);
          this.showHelp();
          process.exit(1);
      }
    }

    return options;
  }

  showHelp() {
    console.log(`
Vercel CLI Setup for NORMALDANCE

Usage: node scripts/setup-vercel-cli.js [options]

Options:
  --force          Force re-setup even if already configured
  --env <env>      Setup specific environment (dev, staging, production)
  --skip-auth      Skip authentication step
  --skip-secrets   Skip secrets setup
  --help           Show this help message

Examples:
  node scripts/setup-vercel-cli.js                    # Setup all environments
  node scripts/setup-vercel-cli.js --env production   # Setup production only
  node scripts/setup-vercel-cli.js --force            # Force re-setup
  node scripts/setup-vercel-cli.js --skip-auth        # Skip authentication
    `);
  }

  async checkIfConfigured() {
    try {
      const config = await fs.readFile(this.configFile, 'utf8');
      const parsed = JSON.parse(config);
      return parsed.configured && parsed.projectId === this.projectId;
    } catch (error) {
      return false;
    }
  }

  async setupAuthentication() {
    console.log('🔐 Setting up Vercel authentication...');
    
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Already authenticated to Vercel');
    } catch (error) {
      console.log('📝 Please authenticate with Vercel...');
      console.log('Open the following URL in your browser:');
      console.log('https://vercel.com/account/tokens');
      console.log('Create a new token with "Project" scope and paste it below:');
      
      const token = await this.promptForToken();
      
      try {
        execSync(`vercel login ${token}`, { stdio: 'inherit' });
        console.log('✅ Authentication successful');
      } catch (authError) {
        throw new Error('Authentication failed. Please check your token and try again.');
      }
    }
  }

  async setupProject() {
    console.log('📁 Setting up project configuration...');
    
    try {
      // Set project scope
      execSync(`vercel scope ${this.projectName}`, { stdio: 'inherit' });
      
      // Verify project
      const output = execSync('vercel ls', { encoding: 'utf8' });
      if (output.includes(this.projectName)) {
        console.log('✅ Project configured successfully');
      } else {
        throw new Error('Project configuration failed');
      }
    } catch (error) {
      throw new Error(`Project setup failed: ${error.message}`);
    }
  }

  async setupEnvironment(environment) {
    console.log(`🔧 Setting up ${environment} environment...`);
    
    const requiredSecrets = this.requiredSecrets[environment];
    console.log(`📝 Required secrets for ${environment}: ${requiredSecrets.join(', ')}`);
    
    for (const secret of requiredSecrets) {
      try {
        // Check if secret already exists
        execSync(`vercel env ls ${environment} | grep ${secret}`, { stdio: 'ignore' });
        console.log(`✅ ${secret} already exists`);
      } catch (error) {
        // Secret doesn't exist, prompt for it
        const value = await this.promptForSecret(secret, environment);
        await this.addSecret(environment, secret, value);
      }
    }
    
    console.log(`✅ ${environment} environment setup completed`);
  }

  async addSecret(environment, key, value) {
    try {
      execSync(`vercel env add ${environment} ${key}`, { 
        stdio: 'pipe',
        input: `${value}\n`,
        encoding: 'utf8'
      });
      console.log(`✅ ${key} added to ${environment}`);
    } catch (error) {
      // If secret already exists, update it
      try {
        execSync(`vercel env rm ${environment} ${key}`, { stdio: 'ignore' });
        execSync(`vercel env add ${environment} ${key}`, { 
          stdio: 'pipe',
          input: `${value}\n`,
          encoding: 'utf8'
        });
        console.log(`✅ ${key} updated in ${environment}`);
      } catch (updateError) {
        throw new Error(`Failed to add secret '${key}': ${updateError.message}`);
      }
    }
  }

  async promptForToken() {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      rl.question('Vercel Token: ', (token) => {
        rl.close();
        resolve(token.trim());
      });
    });
  }

  async promptForSecret(key, environment) {
    return new Promise((resolve) => {
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

  async saveConfiguration() {
    const config = {
      configured: true,
      projectId: this.projectId,
      projectName: this.projectName,
      setupDate: new Date().toISOString(),
      environments: this.environments
    };
    
    await fs.writeFile(this.configFile, JSON.stringify(config, null, 2));
    console.log(`📄 Configuration saved to: ${this.configFile}`);
  }
}

// Run the script
if (require.main === module) {
  const setup = new VercelCLISetup();
  setup.run();
}

module.exports = VercelCLISetup;