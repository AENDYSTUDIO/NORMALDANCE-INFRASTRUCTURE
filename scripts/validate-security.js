#!/usr/bin/env node

/**
 * Security Validation Script
 * Checks for common security issues and hardcoded credentials
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class SecurityValidator {
  constructor() {
    this.issues = [];
    this.patterns = {
      // Common credential patterns
      credentials: [
        /password\s*[:=]\s*["'][^"']+["']/gi,
        /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
        /secret\s*[:=]\s*["'][^"']+["']/gi,
        /token\s*[:=]\s*["'][^"']+["']/gi,
        /private[_-]?key\s*[:=]\s*["'][^"']+["']/gi,
      ],
      // SQL injection patterns
      sqlInjection: [
        /\$\{[^}]*\}/g, // Template literals in SQL
        /['"][^'"]*\+[^'"]*['"]/g, // String concatenation
        /exec\s*\(/gi,
        /eval\s*\(/gi,
      ],
      // XSS patterns
      xss: [
        /innerHTML\s*=/gi,
        /outerHTML\s*=/gi,
        /document\.write\s*\(/gi,
        /\.html\s*\(/gi,
      ]
    };
  }

  async validate() {
    console.log('🔍 Starting security validation...\n');

    await this.checkEnvironmentFiles();
    await this.scanSourceFiles();
    await this.checkDependencies();
    await this.validateConfiguration();

    this.generateReport();
  }

  async checkEnvironmentFiles() {
    console.log('📋 Checking environment files...');
    
    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    
    for (const file of envFiles) {
      const filePath = path.join(process.cwd(), file);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for hardcoded values
        if (content.includes('your-') || content.includes('example-') || content.includes('test-')) {
          this.issues.push({
            type: 'warning',
            file,
            message: 'Environment file contains placeholder values'
          });
        }

        // Check for exposed secrets
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes('=') && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (value && value.length > 10 && !value.includes('your-') && !value.includes('localhost')) {
              this.issues.push({
                type: 'critical',
                file,
                line: index + 1,
                message: `Potential hardcoded secret: ${key}`
              });
            }
          }
        });
      }
    }
  }

  async scanSourceFiles() {
    console.log('🔍 Scanning source files...');
    
    const srcDir = path.join(process.cwd(), 'src');
    if (!fs.existsSync(srcDir)) return;

    this.scanDirectory(srcDir);
  }

  scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(filePath);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        this.scanFile(filePath);
      }
    }
  }

  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check for hardcoded credentials
    this.patterns.credentials.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          this.issues.push({
            type: 'critical',
            file: relativePath,
            message: `Potential hardcoded credential: ${match.substring(0, 50)}...`
          });
        });
      }
    });

    // Check for SQL injection vulnerabilities
    this.patterns.sqlInjection.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          this.issues.push({
            type: 'high',
            file: relativePath,
            message: `Potential SQL injection vulnerability: ${match.substring(0, 50)}...`
          });
        });
      }
    });

    // Check for XSS vulnerabilities
    this.patterns.xss.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          this.issues.push({
            type: 'high',
            file: relativePath,
            message: `Potential XSS vulnerability: ${match.substring(0, 50)}...`
          });
        });
      }
    });

    // Check for console.log in production code
    if (content.includes('console.log') && !filePath.includes('test')) {
      this.issues.push({
        type: 'warning',
        file: relativePath,
        message: 'Console.log found in production code'
      });
    }
  }

  async checkDependencies() {
    console.log('📦 Checking dependencies...');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) return;

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Check for known vulnerable packages
    const vulnerablePackages = [
      'lodash', 'moment', 'request', 'node-sass'
    ];

    for (const pkg of vulnerablePackages) {
      if (dependencies[pkg]) {
        this.issues.push({
          type: 'warning',
          file: 'package.json',
          message: `Potentially vulnerable package: ${pkg}`
        });
      }
    }
  }

  async validateConfiguration() {
    console.log('⚙️  Validating configuration...');
    
    // Check Next.js config
    const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
    if (fs.existsSync(nextConfigPath)) {
      const content = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (!content.includes('Content-Security-Policy')) {
        this.issues.push({
          type: 'warning',
          file: 'next.config.ts',
          message: 'CSP headers not configured'
        });
      }
    }

    // Check for HTTPS enforcement
    const middlewarePath = path.join(process.cwd(), 'src', 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf8');
      
      if (!content.includes('https') && !content.includes('secure')) {
        this.issues.push({
          type: 'warning',
          file: 'src/middleware.ts',
          message: 'HTTPS enforcement not detected'
        });
      }
    }
  }

  generateReport() {
    console.log('\n📊 Security Validation Report');
    console.log('================================\n');

    const critical = this.issues.filter(i => i.type === 'critical');
    const high = this.issues.filter(i => i.type === 'high');
    const warnings = this.issues.filter(i => i.type === 'warning');

    console.log(`🔴 Critical Issues: ${critical.length}`);
    console.log(`🟠 High Priority: ${high.length}`);
    console.log(`🟡 Warnings: ${warnings.length}\n`);

    if (critical.length > 0) {
      console.log('🔴 CRITICAL ISSUES:');
      critical.forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.message}`);
      });
      console.log('');
    }

    if (high.length > 0) {
      console.log('🟠 HIGH PRIORITY:');
      high.forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.message}`);
      });
      console.log('');
    }

    if (warnings.length > 0) {
      console.log('🟡 WARNINGS:');
      warnings.forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.message}`);
      });
      console.log('');
    }

    // Generate summary
    const totalIssues = this.issues.length;
    if (totalIssues === 0) {
      console.log('✅ No security issues found!');
      process.exit(0);
    } else {
      console.log(`❌ Found ${totalIssues} security issues that need attention.`);
      
      if (critical.length > 0) {
        console.log('\n⚠️  CRITICAL issues must be fixed before deployment!');
        process.exit(1);
      } else {
        process.exit(0);
      }
    }
  }
}

// Run validation
const validator = new SecurityValidator();
validator.validate().catch(error => {
  console.error('Security validation failed:', error);
  process.exit(1);
});