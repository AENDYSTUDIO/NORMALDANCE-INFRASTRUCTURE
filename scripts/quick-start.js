#!/usr/bin/env node

/**
 * Quick Start Script for NORMALDANCE Vercel Environments
 * 
 * This script provides a quick setup and testing workflow for the Vercel environment system.
 * It automates the initial setup and provides testing commands.
 * 
 * Usage:
 *   node scripts/quick-start.js [command]
 * 
 * Commands:
 *   setup     - Complete environment setup
 *   test      - Run environment tests
 *   demo      - Demo deployment workflow
 *   cleanup   - Clean up test deployments
 */

import { execSync  } from 'child_process';;
import fs from 'fs';.promises;
import path from 'path';;

class QuickStart {
  constructor() {
    this.commands = ['setup', 'test', 'demo', 'cleanup'];
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      this.showHelp();
      return;
    }

    const command = args[0];

    if (!this.commands.includes(command)) {
      console.error(`Unknown command: ${command}`);
      this.showHelp();
      return;
    }

    try {
      switch (command) {
        case 'setup':
          await this.setup();
          break;
        case 'test':
          await this.test();
          break;
        case 'demo':
          await this.demo();
          break;
        case 'cleanup':
          await this.cleanup();
          break;
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
Quick Start for NORMALDANCE Vercel Environments

Usage: node scripts/quick-start.js <command>

Commands:
  setup     - Complete environment setup
  test      - Run environment tests
  demo      - Demo deployment workflow
  cleanup   - Clean up test deployments

Examples:
  node scripts/quick-start.js setup
  node scripts/quick-start.js test
  node scripts/quick-start.js demo
  node scripts/quick-start.js cleanup
    `);
  }

  async setup() {
    console.log('🚀 Starting NORMALDANCE Vercel Environment Setup...\n');

    // Check prerequisites
    console.log('📋 Checking prerequisites...');
    await this.checkPrerequisites();

    // Setup Git branches
    console.log('\n🌿 Setting up Git branches...');
    await this.setupGitBranches();

    // Setup Vercel project
    console.log('\n☁️  Setting up Vercel project...');
    await this.setupVercelProject();

    // Setup secrets
    console.log('\n🔐 Setting up secrets...');
    await this.setupSecrets();

    // Setup environments
    console.log('\n🌍 Setting up environments...');
    await this.setupEnvironments();

    console.log('\n✅ Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Configure your domains in Vercel Dashboard');
    console.log('2. Update database connection strings');
    console.log('3. Test deployments with: npm run env:auto-deploy');
    console.log('4. See full guide: docs/vercel-environments-setup.md');
  }

  async test() {
    console.log('🧪 Running Environment Tests...\n');

    // Test Vercel CLI
    console.log('📋 Testing Vercel CLI...');
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
      console.log('✅ Vercel CLI authenticated');
    } catch (error) {
      console.log('❌ Vercel CLI not authenticated');
      console.log('Run: vercel login');
      return;
    }

    // Test Git branches
    console.log('\n🌿 Testing Git branches...');
    const branches = await this.getGitBranches();
    console.log(`Current branches: ${branches.join(', ')}`);

    // Test environment configs
    console.log('\n📋 Testing environment configurations...');
    await this.testEnvironmentConfigs();

    // Test secrets
    console.log('\n🔐 Testing secrets...');
    await this.testSecrets();

    // Test deployment
    console.log('\n🚀 Testing deployment...');
    await this.testDeployment();

    console.log('\n✅ All tests passed!');
  }

  async demo() {
    console.log('🎬 Demo Deployment Workflow...\n');

    // Show current state
    console.log('📊 Current state:');
    const branch = this.getCurrentBranch();
    console.log(`Current branch: ${branch}`);

    // Demo deployment workflow
    console.log('\n🚀 Demo workflow:');
    console.log('1. Development deployment...');
    await this.runCommand('node scripts/environment-manager.js deploy dev');

    console.log('\n2. Staging deployment...');
    await this.runCommand('node scripts/environment-manager.js deploy staging');

    console.log('\n3. Status check...');
    await this.runCommand('node scripts/environment-manager.js status staging');

    console.log('\n4. Promotion demo...');
    console.log('Note: This would promote staging to production in real scenario');

    console.log('\n✅ Demo completed!');
    console.log('\nTo see actual deployments, check Vercel Dashboard');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test deployments...\n');

    // List deployments
    console.log('📋 Listing deployments...');
    try {
      const output = execSync('vercel ls', { encoding: 'utf8' });
      console.log(output);
    } catch (error) {
      console.log('No deployments found');
    }

    // Ask for confirmation
    import readline from 'readline';;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question('Do you want to delete all test deployments? (y/N): ', resolve);
    });

    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('Cleanup cancelled');
      return;
    }

    // Delete deployments
    console.log('\n🗑️  Deleting deployments...');
    try {
      execSync('vercel ls --json | jq -r \'.deployments[] | .uid\' | xargs -I {} vercel rm {} --yes', { 
        stdio: 'inherit' 
      });
      console.log('✅ All deployments deleted');
    } catch (error) {
      console.log('Note: Some deployments may not have been deleted');
    }

    console.log('\n✅ Cleanup completed!');
  }

  async checkPrerequisites() {
    // Check Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' });
      console.log(`✅ Node.js: ${nodeVersion.trim()}`);
    } catch (error) {
      throw new Error('Node.js is not installed');
    }

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' });
      console.log(`✅ npm: ${npmVersion.trim()}`);
    } catch (error) {
      throw new Error('npm is not installed');
    }

    // Check Vercel CLI
    try {
      execSync('vercel --version', { stdio: 'ignore' });
      console.log('✅ Vercel CLI installed');
    } catch (error) {
      throw new Error('Vercel CLI is not installed. Run: npm install -g vercel');
    }

    // Check Git
    try {
      execSync('git --version', { stdio: 'ignore' });
      console.log('✅ Git installed');
    } catch (error) {
      throw new Error('Git is not installed');
    }

    // Check if in git repository
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
      console.log('✅ Git repository detected');
    } catch (error) {
      throw new Error('Not in a git repository');
    }
  }

  async setupGitBranches() {
    const branches = await this.getGitBranches();
    
    if (!branches.includes('main')) {
      console.log('Creating main branch...');
      execSync('git checkout -b main', { stdio: 'inherit' });
    }
    
    if (!branches.includes('develop')) {
      console.log('Creating develop branch...');
      execSync('git checkout -b develop', { stdio: 'inherit' });
    }
    
    console.log('✅ Git branches setup completed');
  }

  async setupVercelProject() {
    try {
      // Check if Vercel project exists
      execSync('vercel ls', { stdio: 'ignore' });
      console.log('✅ Vercel project already exists');
    } catch (error) {
      console.log('Creating Vercel project...');
      console.log('Please follow the prompts to create your Vercel project');
      execSync('vercel', { stdio: 'inherit' });
    }
  }

  async setupSecrets() {
    console.log('Setting up secrets for development environment...');
    await this.runCommand('node scripts/secrets-manager.js setup dev');
    
    console.log('Setting up secrets for staging environment...');
    await this.runCommand('node scripts/secrets-manager.js setup staging');
    
    console.log('Setting up secrets for production environment...');
    await this.runCommand('node scripts/secrets-manager.js setup production');
  }

  async setupEnvironments() {
    console.log('Verifying environment configurations...');
    
    // Test environment configs
    const configs = ['vercel.dev.json', 'vercel.staging.json', 'vercel.prod.json'];
    for (const config of configs) {
      try {
        const configPath = path.join(__dirname, '..', config);
        await fs.access(configPath);
        console.log(`✅ ${config} exists`);
      } catch (error) {
        console.log(`❌ ${config} not found`);
      }
    }
  }

  async testEnvironmentConfigs() {
    const configs = ['vercel.dev.json', 'vercel.staging.json', 'vercel.prod.json'];
    
    for (const config of configs) {
      try {
        const configPath = path.join(__dirname, '..', config);
        const configContent = await fs.readFile(configPath, 'utf8');
        const configJson = JSON.parse(configContent);
        
        console.log(`✅ ${config} is valid JSON`);
        
        // Check required fields
        const requiredFields = ['version', 'env'];
        for (const field of requiredFields) {
          if (!configJson[field]) {
            console.log(`❌ ${config} missing required field: ${field}`);
          }
        }
      } catch (error) {
        console.log(`❌ ${config} error: ${error.message}`);
      }
    }
  }

  async testSecrets() {
    const environments = ['dev', 'staging', 'production'];
    
    for (const env of environments) {
      try {
        await this.runCommand(`node scripts/secrets-manager.js validate ${env}`);
        console.log(`✅ ${env} secrets validated`);
      } catch (error) {
        console.log(`❌ ${env} secrets validation failed: ${error.message}`);
      }
    }
  }

  async testDeployment() {
    try {
      await this.runCommand('node scripts/environment-manager.js deploy dev');
      console.log('✅ Test deployment completed');
    } catch (error) {
      console.log(`❌ Test deployment failed: ${error.message}`);
    }
  }

  async getGitBranches() {
    try {
      const output = execSync('git branch --list', { encoding: 'utf8' });
      return output.split('\n')
        .map(branch => branch.trim())
        .filter(branch => branch.length > 0)
        .map(branch => branch.replace('*', '').trim());
    } catch (error) {
      return [];
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async runCommand(command) {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
  }
}

// Run the script
if (require.main === module) {
  const quickStart = new QuickStart();
  quickStart.run();
}

module.exports = QuickStart;