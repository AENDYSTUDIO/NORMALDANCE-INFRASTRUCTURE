#!/usr/bin/env node

/**
 * Environment Manager for NORMALDANCE Vercel Deployments
 * 
 * This script handles automatic environment switching based on Git branches
 * and manages Vercel deployments across different environments.
 * 
 * Usage:
 *   node scripts/environment-manager.js <command> [options]
 * 
 * Commands:
 *   deploy <env>    - Deploy to specific environment
 *   auto-deploy     - Auto-deploy based on current branch
 *   promote <from> <to> - Promote deployment from one environment to another
 *   rollback <env>  - Rollback to previous deployment
 *   status <env>    - Check deployment status
 *   logs <env>      - View deployment logs
 */

import { execSync  } from 'child_process';;
import fs from 'fs';.promises;
import path from 'path';;

class EnvironmentManager {
  constructor() {
    this.environments = {
      dev: {
        branch: 'develop',
        domain: 'dev.dnb1st.ru',
        vercelConfig: 'vercel.dev.json',
        autoDeploy: true
      },
      staging: {
        branch: 'release',
        domain: 'staging.dnb1st.ru',
        vercelConfig: 'vercel.staging.json',
        autoDeploy: true
      },
      production: {
        branch: 'main',
        domain: 'dnb1st.ru',
        vercelConfig: 'vercel.prod.json',
        autoDeploy: true
      }
    };
  }

  async run() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      this.showHelp();
      return;
    }

    const command = args[0];
    const options = args.slice(1);

    try {
      switch (command) {
        case 'deploy':
          await this.deploy(options[0]);
          break;
        case 'auto-deploy':
          await this.autoDeploy();
          break;
        case 'promote':
          await this.promote(options[0], options[1]);
          break;
        case 'rollback':
          await this.rollback(options[0]);
          break;
        case 'status':
          await this.checkStatus(options[0]);
          break;
        case 'logs':
          await this.showLogs(options[0]);
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
Environment Manager for NORMALDANCE Vercel Deployments

Usage: node scripts/environment-manager.js <command> [options]

Commands:
  deploy <env>        - Deploy to specific environment (dev, staging, production)
  auto-deploy         - Auto-deploy based on current Git branch
  promote <from> <to> - Promote deployment from one environment to another
  rollback <env>      - Rollback to previous deployment
  status <env>        - Check deployment status
  logs <env>          - View deployment logs

Examples:
  node scripts/environment-manager.js deploy staging
  node scripts/environment-manager.js auto-deploy
  node scripts/environment-manager.js promote staging production
  node scripts/environment-manager.js rollback production
  node scripts/environment-manager.js status staging
  node scripts/environment-manager.js logs production
    `);
  }

  async deploy(environment) {
    if (!this.environments[environment]) {
      throw new Error(`Invalid environment: ${environment}. Use: ${Object.keys(this.environments).join(', ')}`);
    }

    console.log(`🚀 Deploying to ${environment} environment...`);
    
    // Check if Vercel CLI is authenticated
    this.checkVercelAuth();
    
    // Get current branch
    const currentBranch = this.getCurrentBranch();
    console.log(`Current branch: ${currentBranch}`);
    
    // Deploy with environment-specific configuration
    const vercelConfig = this.environments[environment].vercelConfig;
    const deployCommand = `vercel --yes`;
    
    try {
      console.log(`Running: ${deployCommand}`);
      execSync(deployCommand, { stdio: 'inherit' });
      
      console.log(`✅ Deployment to ${environment} environment completed successfully`);
      
      // Show deployment URL
      this.showDeploymentUrl(environment);
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  async autoDeploy() {
    const currentBranch = this.getCurrentBranch();
    console.log(`Auto-deploying based on branch: ${currentBranch}`);
    
    let targetEnvironment = null;
    
    // Determine target environment based on branch
    if (currentBranch === 'main') {
      targetEnvironment = 'production';
    } else if (currentBranch === 'develop') {
      targetEnvironment = 'dev';
    } else if (currentBranch.startsWith('release/')) {
      targetEnvironment = 'staging';
    } else {
      console.log(`⚠️  No auto-deploy configuration for branch: ${currentBranch}`);
      console.log('Use "deploy <env>" command for manual deployment');
      return;
    }
    
    await this.deploy(targetEnvironment);
  }

  async promote(fromEnvironment, toEnvironment) {
    if (!this.environments[fromEnvironment]) {
      throw new Error(`Invalid source environment: ${fromEnvironment}`);
    }
    
    if (!this.environments[toEnvironment]) {
      throw new Error(`Invalid target environment: ${toEnvironment}`);
    }
    
    console.log(`🚀 Promoting ${fromEnvironment} to ${toEnvironment}...`);
    
    // Check if Vercel CLI is authenticated
    this.checkVercelAuth();
    
    // Get latest deployment URL from source environment
    const sourceUrl = await this.getLatestDeploymentUrl(fromEnvironment);
    if (!sourceUrl) {
      throw new Error(`No deployments found in ${fromEnvironment} environment`);
    }
    
    console.log(`Source deployment: ${sourceUrl}`);
    
    // Deploy to target environment using source as reference
    const vercelConfig = this.environments[toEnvironment].vercelConfig;
    const promoteCommand = `vercel --yes --prebuilt`;
    
    try {
      console.log(`Running: ${promoteCommand}`);
      execSync(promoteCommand, { stdio: 'inherit' });
      
      console.log(`✅ Promotion from ${fromEnvironment} to ${toEnvironment} completed successfully`);
      
      // Show deployment URL
      this.showDeploymentUrl(toEnvironment);
    } catch (error) {
      console.error('❌ Promotion failed:', error.message);
      throw error;
    }
  }

  async rollback(environment) {
    if (!this.environments[environment]) {
      throw new Error(`Invalid environment: ${environment}. Use: ${Object.keys(this.environments).join(', ')}`);
    }

    console.log(`🔄 Rolling back ${environment} environment...`);
    
    // Check if Vercel CLI is authenticated
    this.checkVercelAuth();
    
    // Get list of deployments
    const deployments = await this.getDeployments(environment);
    
    if (deployments.length < 2) {
      console.log('No previous deployments to rollback to');
      return;
    }
    
    // Get the second most recent deployment (skip the current one)
    const targetDeployment = deployments[1];
    console.log(`Rolling back to deployment: ${targetDeployment.url} (${targetDeployment.uid})`);
    
    // Rollback using Vercel CLI
    const rollbackCommand = `vercel rollback ${targetDeployment.uid} --yes`;
    
    try {
      console.log(`Running: ${rollbackCommand}`);
      execSync(rollbackCommand, { stdio: 'inherit' });
      
      console.log(`✅ Rollback to ${environment} environment completed successfully`);
      
      // Show deployment URL
      this.showDeploymentUrl(environment);
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }

  async checkStatus(environment) {
    if (!this.environments[environment]) {
      throw new Error(`Invalid environment: ${environment}. Use: ${Object.keys(this.environments).join(', ')}`);
    }

    console.log(`📊 Checking deployment status for ${environment} environment...`);
    
    try {
      const output = execSync(`vercel ls`, { encoding: 'utf8' });
      const deployments = this.parseDeployments(output);
      
      const envDeployments = deployments.filter(d => d.environment === environment);
      
      if (envDeployments.length === 0) {
        console.log(`No deployments found for ${environment} environment`);
        return;
      }
      
      console.log(`\n📋 Deployments for ${environment} environment:`);
      envDeployments.forEach((deployment, index) => {
        const status = deployment.state === 'READY' ? '✅' : deployment.state === 'BUILDING' ? '🔄' : '❌';
        console.log(`${index + 1}. ${status} ${deployment.url} (${deployment.uid})`);
        console.log(`   State: ${deployment.state}`);
        console.log(`   Created: ${deployment.created}`);
        console.log(`   Framework: ${deployment.framework}`);
      });
    } catch (error) {
      console.error('Error checking status:', error.message);
    }
  }

  async showLogs(environment) {
    if (!this.environments[environment]) {
      throw new Error(`Invalid environment: ${environment}. Use: ${Object.keys(this.environments).join(', ')}`);
    }

    console.log(`📝 Showing logs for ${environment} environment...`);
    
    try {
      const output = execSync(`vercel logs ${environment}`, { encoding: 'utf8' });
      console.log(output);
    } catch (error) {
      console.error('Error showing logs:', error.message);
    }
  }

  checkVercelAuth() {
    try {
      execSync('vercel whoami', { stdio: 'ignore' });
    } catch (error) {
      console.error('❌ Vercel CLI not authenticated. Please run:');
      console.error('   vercel login');
      process.exit(1);
    }
  }

  getCurrentBranch() {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      throw new Error('Failed to get current Git branch');
    }
  }

  async getLatestDeploymentUrl(environment) {
    try {
      const output = execSync(`vercel ls`, { encoding: 'utf8' });
      const deployments = this.parseDeployments(output);
      
      const envDeployments = deployments.filter(d => d.environment === environment);
      return envDeployments.length > 0 ? envDeployments[0].url : null;
    } catch (error) {
      return null;
    }
  }

  async getDeployments(environment) {
    try {
      const output = execSync(`vercel ls`, { encoding: 'utf8' });
      return this.parseDeployments(output).filter(d => d.environment === environment);
    } catch (error) {
      return [];
    }
  }

  showDeploymentUrl(environment) {
    try {
      const output = execSync(`vercel ls`, { encoding: 'utf8' });
      const deployments = this.parseDeployments(output);
      
      const envDeployments = deployments.filter(d => d.environment === environment);
      if (envDeployments.length > 0) {
        const latest = envDeployments[0];
        console.log(`\n🎉 Deployment URL: ${latest.url}`);
        console.log(`📋 Deployment ID: ${latest.uid}`);
        console.log(`🕒 Created: ${latest.created}`);
      }
    } catch (error) {
      console.error('Error getting deployment URL:', error.message);
    }
  }

  parseDeployments(output) {
    const deployments = [];
    const lines = output.split('\n');
    
    let currentDeployment = null;
    
    for (const line of lines) {
      // Match deployment line
      const deploymentMatch = line.match(/^(\w+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(.+)$/);
      if (deploymentMatch) {
        if (currentDeployment) {
          deployments.push(currentDeployment);
        }
        
        currentDeployment = {
          uid: deploymentMatch[1],
          environment: deploymentMatch[2],
          state: deploymentMatch[3],
          framework: deploymentMatch[4],
          created: deploymentMatch[5],
          url: deploymentMatch[6]
        };
      }
    }
    
    if (currentDeployment) {
      deployments.push(currentDeployment);
    }
    
    return deployments;
  }
}

// Run the script
if (require.main === module) {
  const manager = new EnvironmentManager();
  manager.run();
}

module.exports = EnvironmentManager;