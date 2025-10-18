#!/usr/bin/env node

/**
 * Automatic Setup Script for NORMALDANCE Secrets Management
 * 
 * This script automatically sets up the complete secrets management system
 * for NORMALDANCE project, including Vercel CLI configuration, templates,
 * and integration with CI/CD.
 * 
 * Usage:
 *   node scripts/setup-secrets-management.js [options]
 * 
 * Options:
 *   --env <env>      Environment to setup (dev, staging, production, all)
 *   --force          Force setup without confirmation
 *   --skip-tests     Skip running tests
 *   --help          Show help message
 */

import fs from 'fs';.promises;
import path from 'path';;
import { execSync  } from 'child_process';;
import { SecretsTemplateManager  } from '../config/secrets-templates';;
import axios from 'axios';;

class SecretsManagementSetup {
  constructor() {
    this.templateManager = new SecretsTemplateManager();
    this.environments = ['dev', 'staging', 'production'];
    this.githubToken = process.env.GITHUB_TOKEN;
    this.owner = 'normaldance';
    this.repo = 'normaldance';
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.vercelOrgId = process.env.VERCEL_ORG_ID;
    this.vercelProjectId = process.env.VERCEL_PROJECT_ID;
    this.slackWebhook = process.env.SLACK_WEBHOOK;
    this.setupDir = path.join(__dirname, '../setup');
    this.backupDir = path.join(__dirname, '../backups');
    this.logDir = path.join(__dirname, '../logs');
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
      console.log('🚀 Starting secrets management setup...');
      
      // Validate environment
      if (options.environment !== 'all' && !this.environments.includes(options.environment)) {
        throw new Error(`Invalid environment: ${options.environment}`);
      }

      // Create necessary directories
      await this.createDirectories();

      // Check prerequisites
      await this.checkPrerequisites();

      // Setup Vercel CLI
      await this.setupVercelCLI();

      // Setup GitHub integration
      if (this.githubToken) {
        await this.setupGitHubIntegration();
      }

      // Setup secrets templates
      await this.setupSecretsTemplates();

      // Setup CI/CD integration
      await this.setupCICDIntegration();

      // Setup monitoring and alerts
      await this.setupMonitoring();

      // Run tests if requested
      if (!options.skipTests) {
        await this.runTests();
      }

      // Generate documentation
      await this.generateDocumentation();

      console.log('✅ Secrets management setup completed successfully!');
      
      // Send completion notification
      await this.sendCompletionNotification(options);
    } catch (error) {
      console.error(`❌ Setup failed: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  parseOptions(args) {
    const options = {
      environment: 'all',
      force: false,
      skipTests: false,
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
            if (env === 'all' || this.environments.includes(env)) {
              options.environment = env;
              i++;
            } else {
              console.error(`❌ Invalid environment: ${env}`);
              console.error(`Valid environments: all, ${this.environments.join(', ')}`);
              process.exit(1);
            }
          }
          break;
        case '--force':
        case '-f':
          options.force = true;
          break;
        case '--skip-tests':
          options.skipTests = true;
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

  async createDirectories() {
    const directories = [
      this.setupDir,
      this.backupDir,
      this.logDir,
      path.join(__dirname, '../config'),
      path.join(__dirname, '../scripts'),
      path.join(__dirname, '../tests')
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }

    console.log('✅ Created necessary directories');
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (majorVersion < 18) {
      throw new Error(`Node.js version 18 or higher required. Current: ${nodeVersion}`);
    }
    console.log(`✅ Node.js version: ${nodeVersion}`);

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ npm version: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm is not installed');
    }

    // Check required environment variables
    const requiredEnvVars = [
      'GITHUB_TOKEN',
      'VERCEL_TOKEN',
      'VERCEL_ORG_ID',
      'VERCEL_PROJECT_ID'
    ];

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      console.warn(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
      console.warn('Some features may not work without these variables');
    }

    console.log('✅ Prerequisites check completed');
  }

  async setupVercelCLI() {
    console.log('🔧 Setting up Vercel CLI...');

    try {
      // Check if Vercel CLI is installed
      execSync('vercel --version', { stdio: 'ignore' });
      console.log('✅ Vercel CLI is already installed');
    } catch (error) {
      console.log('Installing Vercel CLI...');
      execSync('npm install -g vercel', { stdio: 'inherit' });
    }

    // Authenticate with Vercel
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Already authenticated with Vercel');
    } catch (error) {
      console.log('Please authenticate with Vercel:');
      console.log('vercel login');
      // Wait for user to authenticate
      import readline from 'readline';;
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const question = (query) => new Promise(resolve => rl.question(query, resolve));
      
      const authenticated = await question('Press Enter after completing Vercel login...');
      rl.close();
    }

    // Configure Vercel project
    if (this.vercelOrgId && this.vercelProjectId) {
      try {
        execSync(`vercel env ls dev`, { stdio: 'ignore' });
        console.log('✅ Vercel project is already configured');
      } catch (error) {
        console.log('Configuring Vercel project...');
        // This would typically be done through Vercel dashboard
        console.log('Please configure your Vercel project through the dashboard');
      }
    }

    console.log('✅ Vercel CLI setup completed');
  }

  async setupGitHubIntegration() {
    console.log('🔧 Setting up GitHub integration...');

    try {
      // Check GitHub CLI
      execSync('gh --version', { stdio: 'ignore' });
      console.log('✅ GitHub CLI is already installed');
    } catch (error) {
      console.log('Installing GitHub CLI...');
      execSync('winget install --id GitHub.cli', { stdio: 'inherit' });
    }

    // Authenticate with GitHub
    try {
      execSync('gh auth status', { stdio: 'ignore' });
      console.log('✅ Already authenticated with GitHub');
    } catch (error) {
      console.log('Please authenticate with GitHub:');
      console.log('gh auth login');
      // Wait for user to authenticate
      import readline from 'readline';;
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const question = (query) => new Promise(resolve => rl.question(query, resolve));
      
      const authenticated = await question('Press Enter after completing GitHub login...');
      rl.close();
    }

    // Setup GitHub repository secrets
    if (this.githubToken) {
      await this.setupGitHubSecrets();
    }

    console.log('✅ GitHub integration setup completed');
  }

  async setupGitHubSecrets() {
    console.log('🔧 Setting up GitHub repository secrets...');

    const secrets = this.templateManager.getRequiredSecrets('production');
    
    for (const secret of secrets) {
      try {
        const template = this.templateManager.getTemplate('production');
        const defaultValue = template.secrets[secret]?.default || '';
        
        if (defaultValue) {
          execSync(`gh secret set ${secret} --body "${defaultValue}"`, { 
            stdio: 'inherit',
            env: { ...process.env, GITHUB_TOKEN: this.githubToken }
          });
          console.log(`✅ Set GitHub secret: ${secret}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to set GitHub secret ${secret}: ${error.message}`);
      }
    }
  }

  async setupSecretsTemplates() {
    console.log('🔧 Setting up secrets templates...');

    // Create secrets configuration
    const config = {
      environments: {
        development: this.templateManager.getTemplate('development'),
        staging: this.templateManager.getTemplate('staging'),
        production: this.templateManager.getTemplate('production')
      },
      validation: {
        rules: {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: true,
          noCommonPasswords: true,
          noPersonalInfo: true
        }
      },
      rotation: {
        schedule: '0 2 * * *', // Daily at 2 AM
        retention: 30, // Keep 30 days of backups
        notifications: true
      }
    };

    // Save configuration
    const configPath = path.join(__dirname, '../config/secrets-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Created secrets configuration: ${configPath}`);

    // Create environment files
    for (const env of this.environments) {
      const template = this.templateManager.getTemplate(env);
      const envFile = path.join(__dirname, `../.env.${env}`);
      
      let envContent = '';
      for (const [key, config] of Object.entries(template.secrets)) {
        if (config.default) {
          envContent += `${key}=${config.default}\n`;
        } else {
          envContent += `${key}=\n`;
        }
      }
      
      await fs.writeFile(envFile, envContent);
      console.log(`✅ Created environment file: .env.${env}`);
    }

    console.log('✅ Secrets templates setup completed');
  }

  async setupCICDIntegration() {
    console.log('🔧 Setting up CI/CD integration...');

    // Create GitHub workflow if it doesn't exist
    const workflowDir = path.join(__dirname, '../.github/workflows');
    await fs.mkdir(workflowDir, { recursive: true });

    const workflowContent = `name: Secrets Management

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to manage'
        required: true
        default: 'staging'
        type: choice
        options:
          - dev
          - staging
          - production

jobs:
  validate-secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: node scripts/secrets-manager.js validate --env \${{ matrix.environment }}
      - name: Upload validation results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: validation-results
          path: validation-report.json

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: node scripts/security-monitor.js --env \${{ matrix.environment }} --format json --output security-report.json
      - name: Upload security report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: security-report
          path: security-report.json

  rotate-secrets:
    runs-on: ubuntu-latest
    if: github.event_name == 'workflow_dispatch'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: node scripts/rotate-secrets.js --env \${{ matrix.environment }} --notify
      - name: Upload rotation log
        uses: actions/upload-artifact@v3
        with:
          name: rotation-log
          path: secrets-rotation.log
`;

    const workflowPath = path.join(workflowDir, 'secrets-management.yml');
    await fs.writeFile(workflowPath, workflowContent);
    console.log(`✅ Created GitHub workflow: ${workflowPath}`);

    // Update package.json with scripts
    const packageJsonPath = path.join(__dirname, '../package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts['secrets:validate'] = 'node scripts/secrets-manager.js validate --env';
    packageJson.scripts['secrets:rotate'] = 'node scripts/rotate-secrets.js --env';
    packageJson.scripts['secrets:monitor'] = 'node scripts/security-monitor.js --env';
    packageJson.scripts['secrets:setup'] = 'node scripts/setup-secrets-management.js';
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json with secrets management scripts');

    console.log('✅ CI/CD integration setup completed');
  }

  async setupMonitoring() {
    console.log('🔧 Setting up monitoring and alerts...');

    // Create monitoring configuration
    const monitoringConfig = {
      alerts: {
        enabled: true,
        channels: ['slack'],
        thresholds: {
          securityScore: 80,
          rotationDays: 90,
          errorRate: 0.05
        }
      },
      reporting: {
        enabled: true,
        formats: ['json', 'html'],
        schedule: '0 6 * * *' // Daily at 6 AM
      },
      audit: {
        enabled: true,
        retention: 365, // Keep 1 year of audit logs
        sensitiveActions: ['add', 'remove', 'rotate']
      }
    };

    // Save monitoring configuration
    const monitoringPath = path.join(__dirname, '../config/monitoring-config.json');
    await fs.writeFile(monitoringPath, JSON.stringify(monitoringConfig, null, 2));
    console.log(`✅ Created monitoring configuration: ${monitoringPath}`);

    // Create alert scripts
    const alertScript = `#!/usr/bin/env node

import { SecurityMonitor  } from '../scripts/security-monitor';;

const monitor = new SecurityMonitor();

async function runAlerts() {
  try {
    const report = await monitor.monitorEnvironment('production');
    
    if (report.score < 80) {
      console.log('🚨 Security score below threshold:', report.score);
      // Send alert notification
      await monitor.sendAlerts([report]);
    }
    
    console.log('✅ Alert check completed');
  } catch (error) {
    console.error('❌ Alert check failed:', error.message);
  }
}

runAlerts();
`;

    const alertPath = path.join(__dirname, '../scripts/check-alerts.js');
    await fs.writeFile(alertPath, alertScript);
    await fs.chmod(alertPath, '755');
    console.log(`✅ Created alert script: ${alertPath}`);

    console.log('✅ Monitoring setup completed');
  }

  async runTests() {
    console.log('🧪 Running tests...');

    try {
      // Install test dependencies
      execSync('npm install --save-dev jest @types/jest ts-jest', { stdio: 'inherit' });

      // Create Jest configuration
      const jestConfig = {
        testEnvironment: 'node',
        testMatch: ['**/tests/**/*.test.js'],
        collectCoverage: true,
        coverageDirectory: 'coverage',
        coverageReporters: ['text', 'lcov', 'html']
      };

      const jestConfigPath = path.join(__dirname, '../jest.config.json');
      await fs.writeFile(jestConfigPath, JSON.stringify(jestConfig, null, 2));

      // Run tests
      execSync('npm test', { stdio: 'inherit' });
      console.log('✅ Tests completed successfully');
    } catch (error) {
      console.warn('⚠️  Tests failed:', error.message);
      console.warn('You may need to fix the test failures manually');
    }
  }

  async generateDocumentation() {
    console.log('📚 Generating documentation...');

    // Create README for secrets management
    const readmeContent = `# Secrets Management for NORMALDANCE

This directory contains the secrets management system for NORMALDANCE project.

## Files

- \`scripts/secrets-manager.js\` - Main secrets management script
- \`scripts/security-monitor.js\` - Security monitoring script
- \`scripts/rotate-secrets.js\` - Secret rotation script
- \`scripts/check-hardcoded-secrets.js\` - Hardcoded secrets checker
- \`config/secrets-templates.js\` - Secrets templates configuration
- \`config/secrets-config.json\` - Secrets configuration
- \`tests/secrets-management.test.js\` - Test suite

## Usage

\`\`\`bash
# Validate secrets
npm run secrets:validate -- --env production

# Rotate secrets
npm run secrets:rotate -- --env production

# Monitor security
npm run secrets:monitor -- --env production

# Setup secrets management
npm run secrets:setup
\`\`\`

## Configuration

See \`docs/secrets-management-guide.md\` for detailed documentation.
`;

    const readmePath = path.join(__dirname, '../README-secrets.md');
    await fs.writeFile(readmePath, readmeContent);
    console.log(`✅ Created documentation: ${readmePath}`);

    console.log('✅ Documentation generation completed');
  }

  async sendCompletionNotification(options) {
    if (!this.slackWebhook) {
      console.log('⚠️  No Slack webhook configured, skipping notification');
      return;
    }

    const message = {
      text: '🎉 Secrets Management Setup Completed',
      attachments: [
        {
          color: 'good',
          fields: [
            {
              title: 'Environment',
              value: options.environment === 'all' ? 'All environments' : options.environment,
              short: true
            },
            {
              title: 'Status',
              value: '✅ Setup completed successfully',
              short: true
            },
            {
              title: 'Timestamp',
              value: new Date().toISOString(),
              short: false
            },
            {
              title: 'Next Steps',
              value: 'Run `npm run secrets:validate -- --env production` to test the setup',
              short: false
            }
          ]
        }
      ]
    };

    try {
      await axios.post(this.slackWebhook, message);
      console.log('✅ Completion notification sent');
    } catch (error) {
      console.error(`❌ Failed to send notification: ${error.message}`);
    }
  }

  showHelp() {
    console.log(`
Secrets Management Setup Script for NORMALDANCE

Usage: node scripts/setup-secrets-management.js [options]

Options:
  --env, -e <env>      Environment to setup (dev, staging, production, all)
  --force, -f          Force setup without confirmation
  --skip-tests         Skip running tests
  --verbose, -v        Enable verbose output
  --help, -h          Show help message

Examples:
  node scripts/setup-secrets-management.js --env production
  node scripts/setup-secrets-management.js --env all --force
  node scripts/setup-secrets-management.js --env staging --skip-tests
    `);
  }
}

// Run the script
if (require.main === module) {
  const setup = new SecretsManagementSetup();
  setup.run();
}

module.exports = SecretsManagementSetup;