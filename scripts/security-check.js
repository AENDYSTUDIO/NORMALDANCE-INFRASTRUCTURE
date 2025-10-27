#!/usr/bin/env node

/**
 * Security Check Script for NORMALDANCE
 * Checks for common security issues in the project
 */

import fs from 'fs';;
import path from 'path';;

// Check for exposed API keys and secrets
function checkForSecrets() {
  const secretPatterns = [
    /API_KEY\s*=\s*["'][^"']+["']/,
    /SECRET\s*=\s*["'][^"']+["']/,
    /PASSWORD\s*=\s*["'][^"']+["']/,
    /TOKEN\s*=\s*["'][^"']+["']/,
    /PRIVATE_KEY\s*=\s*["'][^"']+["']/,
    /DATABASE_URL\s*=\s*["'][^"']+["']/,
  ];

  const filesToCheck = [
    '.env',
    '.env.local',
    '.env.production',
    'package.json',
    'src/**/*.{js,ts,tsx,jsx}',
    'scripts/**/*.{js,ts}',
  ];

  const issues = [];

  for (const filePattern of filesToCheck) {
    try {
      import files from 'glob';.sync(filePattern);
      
      for (const file of files) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          
          for (const pattern of secretPatterns) {
            if (pattern.test(content)) {
              issues.push({
                file,
                type: 'potential_secret',
                pattern: pattern.source,
              });
            }
          }
        }
      }
    } catch (error) {
      console.log(`Could not check ${file}: ${error.message}`);
    }
  }

  return issues;
}

// Check package.json for vulnerable dependencies
function checkPackageJson() {
  try {
    import packageJson from '../package.json';;
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for known vulnerable packages (as of 2025)
    const vulnerablePackages = {
      'axios': '<1.7.0',
      'lodash': '<4.17.21',
      'express': '<4.19.0',
      'handlebars': '<4.7.8',
      'node-forge': '<1.3.0',
      'serialize-javascript': '<6.0.0',
      'ssri': '<8.0.0',
      'tar': '<6.1.0',
      'ws': '<8.0.0',
    };

    const issues = [];

    for (const [pkg, version] of Object.entries(deps)) {
      if (vulnerablePackages[pkg]) {
        // Check if the installed version is vulnerable
        // This is a simplified check - in production you'd use semver
        const installedVersion = version.replace(/[\^~]/, '');
        const vulnerableVersion = vulnerablePackages[pkg].replace(/[<>=]/, '');
        
        if (installedVersion < vulnerableVersion) {
          issues.push({
            package: pkg,
            currentVersion: version,
            recommendation: `Update to latest version (> ${vulnerablePackages[pkg]})`,
          });
        }
      }
    }

    return issues;
  } catch (error) {
    console.error('Error checking package.json:', error.message);
    return [];
  }
}

// Check for insecure configurations
function checkConfigurations() {
  const issues = [];

  // Check ESLint configuration
  try {
    import eslintConfig from '../eslint.config.mjs';;
    if (eslintConfig.ignoreDuringBuilds) {
      issues.push({
        file: 'eslint.config.mjs',
        type: 'insecure_config',
        issue: 'ESLint is disabled during builds',
        recommendation: 'Enable ESLint for better code security',
      });
    }
  } catch (error) {
    // ESLint config might not exist or be accessible
  }

  // Check TypeScript configuration
  try {
    import tsConfig from '../tsconfig.json';;
    if (tsConfig.compilerOptions?.noImplicitAny === false) {
      issues.push({
        file: 'tsconfig.json',
        type: 'insecure_config',
        issue: 'TypeScript allows any types',
        recommendation: 'Enable "noImplicitAny": true for better type safety',
      });
    }
  } catch (error) {
    // TypeScript config might not be accessible
  }

  return issues;
}

// Main security check function
function runSecurityCheck() {
  console.log('🔒 Starting Security Check for NORMALDANCE...\n');

  const issues = {
    secrets: checkForSecrets(),
    dependencies: checkPackageJson(),
    configurations: checkConfigurations(),
  };

  let totalIssues = 0;

  // Report secrets
  if (issues.secrets.length > 0) {
    console.log('🚨 Potential secrets found:');
    issues.secrets.forEach(issue => {
      console.log(`  File: ${issue.file}`);
      console.log(`  Pattern: ${issue.pattern}`);
      console.log('');
    });
    totalIssues += issues.secrets.length;
  }

  // Report dependency issues
  if (issues.dependencies.length > 0) {
    console.log('⚠️  Vulnerable dependencies found:');
    issues.dependencies.forEach(issue => {
      console.log(`  Package: ${issue.package}`);
      console.log(`  Current: ${issue.currentVersion}`);
      console.log(`  Fix: ${issue.recommendation}`);
      console.log('');
    });
    totalIssues += issues.dependencies.length;
  }

  // Report configuration issues
  if (issues.configurations.length > 0) {
    console.log('⚙️  Insecure configurations found:');
    issues.configurations.forEach(issue => {
      console.log(`  File: ${issue.file}`);
      console.log(`  Issue: ${issue.issue}`);
      console.log(`  Fix: ${issue.recommendation}`);
      console.log('');
    });
    totalIssues += issues.configurations.length;
  }

  // Summary
  if (totalIssues === 0) {
    console.log('✅ Security check passed! No critical issues found.');
  } else {
    console.log(`📊 Security Summary: ${totalIssues} issue(s) found`);
    console.log('🔧 Please address these issues to improve security.');
  }

  return totalIssues;
}

// Run the security check
if (require.main === module) {
  const issueCount = runSecurityCheck();
  process.exit(issueCount > 0 ? 1 : 0);
}

module.exports = { runSecurityCheck };
