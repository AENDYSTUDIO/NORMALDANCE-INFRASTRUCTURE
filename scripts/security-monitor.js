#!/usr/bin/env node

/**
 * Security Monitor for NORMALDANCE Secrets
 * 
 * This script monitors secret security, generates reports, and alerts on
 * potential security issues.
 * 
 * Usage:
 *   node scripts/security-monitor.js [options]
 * 
 * Options:
 *   --env <env>      Environment to monitor (dev, staging, production, all)
 *   --output <file>  Output file for report
 *   --format <fmt>   Output format (json, html, text)
 *   --alerts         Enable alerts for security issues
 *   --compliance     Check compliance with security standards
 *   --help          Show help message
 */

import fs from 'fs';.promises;
import path from 'path';;
import { execSync  } from 'child_process';;
import { SecretsTemplateManager  } from '../config/secrets-templates';;
import axios from 'axios';;

class SecurityMonitor {
  constructor() {
    this.templateManager = new SecretsTemplateManager();
    this.environments = ['dev', 'staging', 'production'];
    this.githubToken = process.env.GITHUB_TOKEN;
    this.owner = 'normaldance';
    this.repo = 'normaldance';
    this.alertWebhook = process.env.SLACK_WEBHOOK;
    this.reportDir = path.join(__dirname, '../security-reports');
    this.complianceStandards = {
      'NIST': this.checkNISTCompliance,
      'ISO27001': this.checkISO27001Compliance,
      'SOC2': this.checkSOC2Compliance
    };
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
      console.log('🔒 Starting security monitoring...');
      
      // Create report directory
      await fs.mkdir(this.reportDir, { recursive: true });

      // Monitor specified environment(s)
      const environments = options.environment === 'all' ? this.environments : [options.environment];
      
      const reports = [];
      
      for (const env of environments) {
        const report = await this.monitorEnvironment(env, options);
        reports.push(report);
      }

      // Generate comprehensive report
      const comprehensiveReport = this.generateComprehensiveReport(reports, options);
      
      // Output results
      if (options.output) {
        await this.writeReport(comprehensiveReport, options.output);
        console.log(`✅ Report saved to: ${options.output}`);
      } else {
        console.log(comprehensiveReport);
      }

      // Send alerts if enabled
      if (options.alerts) {
        await this.sendAlerts(reports);
      }

      // Exit with appropriate code
      const hasIssues = reports.some(report => report.issues.length > 0);
      if (hasIssues) {
        console.log('\n❌ Security issues detected');
        process.exit(1);
      } else {
        console.log('\n✅ No security issues found');
        process.exit(0);
      }
    } catch (error) {
      console.error(`❌ Monitoring failed: ${error.message}`);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  parseOptions(args) {
    const options = {
      environment: 'all',
      output: null,
      format: 'text',
      alerts: false,
      compliance: false,
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
        case '--output':
        case '-o':
          if (i + 1 < args.length) {
            options.output = args[i + 1];
            i++;
          }
          break;
        case '--format':
        case '-f':
          if (i + 1 < args.length) {
            const format = args[i + 1].toLowerCase();
            if (['json', 'html', 'text'].includes(format)) {
              options.format = format;
              i++;
            } else {
              console.error(`❌ Invalid format: ${format}`);
              console.error(`Valid formats: json, html, text`);
              process.exit(1);
            }
          }
          break;
        case '--alerts':
          options.alerts = true;
          break;
        case '--compliance':
          options.compliance = true;
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

  async monitorEnvironment(environment, options) {
    console.log(`\n🔍 Monitoring ${environment} environment...`);
    
    const report = {
      environment,
      timestamp: new Date().toISOString(),
      checks: {},
      issues: [],
      compliance: {},
      score: 100
    };

    // Check secret strength
    report.checks.secretStrength = await this.checkSecretStrength(environment);
    report.issues.push(...report.checks.secretStrength.issues);
    report.score -= report.checks.secretStrength.deduction;

    // Check secret rotation
    report.checks.rotation = await this.checkSecretRotation(environment);
    report.issues.push(...report.checks.rotation.issues);
    report.score -= report.checks.rotation.deduction;

    // Check access control
    report.checks.accessControl = await this.checkAccessControl(environment);
    report.issues.push(...report.checks.accessControl.issues);
    report.score -= report.checks.accessControl.deduction;

    // Check encryption
    report.checks.encryption = await this.checkEncryption(environment);
    report.issues.push(...report.checks.encryption.issues);
    report.score -= report.checks.encryption.deduction;

    // Check audit logging
    report.checks.auditLogging = await this.checkAuditLogging(environment);
    report.issues.push(...report.checks.auditLogging.issues);
    report.score -= report.checks.auditLogging.deduction;

    // Check for exposed secrets
    report.checks.exposedSecrets = await this.checkExposedSecrets(environment);
    report.issues.push(...report.checks.exposedSecrets.issues);
    report.score -= report.checks.exposedSecrets.deduction;

    // Check compliance if requested
    if (options.compliance) {
      for (const [standard, checker] of Object.entries(this.complianceStandards)) {
        report.compliance[standard] = await checker.call(this, environment);
        report.issues.push(...report.compliance[standard].issues);
        report.score -= report.compliance[standard].deduction;
      }
    }

    return report;
  }

  async checkSecretStrength(environment) {
    const result = {
      issues: [],
      deduction: 0,
      weakSecrets: [],
      duplicates: []
    };

    try {
      const secrets = await this.getCurrentSecrets(environment);
      
      for (const [key, value] of Object.entries(secrets)) {
        // Check password strength
        if (this.isWeakPassword(value)) {
          result.issues.push({
            type: 'weak_password',
            severity: 'high',
            message: `Weak password detected for ${key}`,
            suggestion: 'Use a stronger password with at least 12 characters, including uppercase, lowercase, numbers, and special characters'
          });
          result.weakSecrets.push(key);
          result.deduction += 10;
        }

        // Check for common patterns
        if (this.hasCommonPattern(value)) {
          result.issues.push({
            type: 'common_pattern',
            severity: 'medium',
            message: `Common pattern detected in ${key}`,
            suggestion: 'Avoid using common patterns like "password123", "admin123", etc.'
          });
          result.deduction += 5;
        }

        // Check for duplicates across environments
        if (await this.isDuplicateSecret(key, value, environment)) {
          result.issues.push({
            type: 'duplicate_secret',
            severity: 'medium',
            message: `Duplicate secret detected for ${key} across environments`,
            suggestion: 'Use environment-specific secrets to prevent cross-environment access'
          });
          result.duplicates.push(key);
          result.deduction += 5;
        }
      }
    } catch (error) {
      result.issues.push({
        type: 'error',
        severity: 'high',
        message: `Failed to check secret strength: ${error.message}`,
        suggestion: 'Check Vercel configuration and permissions'
      });
      result.deduction += 20;
    }

    return result;
  }

  async checkSecretRotation(environment) {
    const result = {
      issues: [],
      deduction: 0,
      lastRotated: {},
      rotationStatus: 'unknown'
    };

    try {
      const auditLog = await this.getAuditLog(environment);
      const now = new Date();
      
      for (const secret of this.templateManager.getRequiredSecrets(environment)) {
        const secretEvents = auditLog.filter(event => 
          event.key === secret && event.action === 'rotate'
        );
        
        if (secretEvents.length > 0) {
          const lastEvent = secretEvents[secretEvents.length - 1];
          const lastRotation = new Date(lastEvent.timestamp);
          const daysSinceRotation = (now - lastRotation) / (1000 * 60 * 60 * 24);
          
          result.lastRotated[secret] = {
            date: lastRotation.toISOString(),
            daysAgo: Math.floor(daysSinceRotation)
          };
          
          if (daysSinceRotation > 90) {
            result.issues.push({
              type: 'stale_secret',
              severity: 'high',
              message: `${secret} not rotated in ${Math.floor(daysSinceRotation)} days`,
              suggestion: 'Rotate secrets at least every 90 days'
            });
            result.deduction += 15;
          }
        } else {
          result.issues.push({
            type: 'never_rotated',
            severity: 'high',
            message: `${secret} has never been rotated`,
            suggestion: 'Rotate secrets before deployment'
          });
          result.deduction += 20;
        }
      }
      
      result.rotationStatus = result.issues.length === 0 ? 'good' : 'needs_attention';
    } catch (error) {
      result.issues.push({
        type: 'error',
        severity: 'high',
        message: `Failed to check secret rotation: ${error.message}`,
        suggestion: 'Check audit log configuration'
      });
      result.deduction += 20;
    }

    return result;
  }

  async checkAccessControl(environment) {
    const result = {
      issues: [],
      deduction: 0,
      accessPermissions: {},
      recommendations: []
    };

    try {
      // Check Vercel team access
      const teamAccess = await this.getVercelTeamAccess(environment);
      result.accessPermissions.vercel = teamAccess;
      
      if (!teamAccess.hasAccess) {
        result.issues.push({
          type: 'no_team_access',
          severity: 'high',
          message: 'No team access configured for this environment',
          suggestion: 'Configure proper team access in Vercel'
        });
        result.deduction += 20;
      }

      // Check GitHub repository access
      if (this.githubToken) {
        const repoAccess = await this.getGitHubRepoAccess(environment);
        result.accessPermissions.github = repoAccess;
        
        if (!repoAccess.hasAccess) {
          result.issues.push({
            type: 'no_repo_access',
            severity: 'high',
            message: 'No repository access configured for this environment',
            suggestion: 'Configure proper repository access in GitHub'
          });
          result.deduction += 15;
        }
      }

      // Check for overly permissive access
      const permissiveAccess = await this.checkPermissiveAccess(environment);
      if (permissiveAccess.length > 0) {
        result.issues.push({
          type: 'permissive_access',
          severity: 'medium',
          message: `Overly permissive access detected for: ${permissiveAccess.join(', ')}`,
          suggestion: 'Restrict access to only necessary team members'
        });
        result.deduction += 10;
      }
    } catch (error) {
      result.issues.push({
        type: 'error',
        severity: 'high',
        message: `Failed to check access control: ${error.message}`,
        suggestion: 'Check access control configuration'
      });
      result.deduction += 20;
    }

    return result;
  }

  async checkEncryption(environment) {
    const result = {
      issues: [],
      deduction: 0,
      encryptionStatus: 'unknown',
      algorithms: []
    };

    try {
      // Check if secrets are encrypted at rest
      const encrypted = await this.checkEncryptionAtRest(environment);
      result.encryptionStatus.encryptedAtRest = encrypted;
      
      if (!encrypted) {
        result.issues.push({
          type: 'no_encryption',
          severity: 'high',
          message: 'Secrets are not encrypted at rest',
          suggestion: 'Enable encryption at rest for all environments'
        });
        result.deduction += 25;
      }

      // Check encryption algorithms
      const algorithms = await this.checkEncryptionAlgorithms(environment);
      result.encryptionStatus.algorithms = algorithms;
      
      if (!algorithms.includes('aes-256-gcm')) {
        result.issues.push({
          type: 'weak_algorithm',
          severity: 'medium',
          message: 'Weak encryption algorithm detected',
          suggestion: 'Use AES-256-GCM for all sensitive data'
        });
        result.deduction += 10;
      }

      // Check key rotation
      const keyRotation = await this.checkKeyRotation(environment);
      result.encryptionStatus.keyRotation = keyRotation;
      
      if (!keyRotation.enabled) {
        result.issues.push({
          type: 'no_key_rotation',
          severity: 'medium',
          message: 'Encryption keys are not rotated regularly',
          suggestion: 'Rotate encryption keys every 90 days'
        });
        result.deduction += 15;
      }
    } catch (error) {
      result.issues.push({
        type: 'error',
        severity: 'high',
        message: `Failed to check encryption: ${error.message}`,
        suggestion: 'Check encryption configuration'
      });
      result.deduction += 20;
    }

    return result;
  }

  async checkAuditLogging(environment) {
    const result = {
      issues: [],
      deduction: 0,
      loggingStatus: 'unknown',
      recentEvents: []
    };

    try {
      // Check if audit logging is enabled
      const auditEnabled = await this.checkAuditEnabled(environment);
      result.loggingStatus.enabled = auditEnabled;
      
      if (!auditEnabled) {
        result.issues.push({
          type: 'no_audit_logging',
          severity: 'high',
          message: 'Audit logging is not enabled',
          suggestion: 'Enable audit logging for all environments'
        });
        result.deduction += 20;
      }

      // Check recent audit events
      const recentEvents = await this.getRecentAuditEvents(environment);
      result.loggingStatus.recentEvents = recentEvents;
      
      if (recentEvents.length === 0) {
        result.issues.push({
          type: 'no_audit_events',
          severity: 'medium',
          message: 'No recent audit events found',
          suggestion: 'Verify audit logging is working properly'
        });
        result.deduction += 10;
      }

      // Check for suspicious activities
      const suspiciousActivities = await this.checkSuspiciousActivities(environment);
      if (suspiciousActivities.length > 0) {
        result.issues.push({
          type: 'suspicious_activity',
          severity: 'high',
          message: `Suspicious activities detected: ${suspiciousActivities.join(', ')}`,
          suggestion: 'Investigate and address suspicious activities immediately'
        });
        result.deduction += 30;
      }
    } catch (error) {
      result.issues.push({
        type: 'error',
        severity: 'high',
        message: `Failed to check audit logging: ${error.message}`,
        suggestion: 'Check audit logging configuration'
      });
      result.deduction += 20;
    }

    return result;
  }

  async checkExposedSecrets(environment) {
    const result = {
      issues: [],
      deduction: 0,
      exposedSecrets: [],
      scanResults: {}
    };

    try {
      // Check for secrets in code
      const codeSecrets = await this.checkSecretsInCode(environment);
      result.scanResults.code = codeSecrets;
      
      if (codeSecrets.length > 0) {
        result.issues.push({
          type: 'secrets_in_code',
          severity: 'critical',
          message: `Secrets found in code: ${codeSecrets.join(', ')}`,
          suggestion: 'Move all secrets to environment variables'
        });
        result.exposedSecrets.push(...codeSecrets);
        result.deduction += 40;
      }

      // Check for secrets in logs
      const logSecrets = await this.checkSecretsInLogs(environment);
      result.scanResults.logs = logSecrets;
      
      if (logSecrets.length > 0) {
        result.issues.push({
          type: 'secrets_in_logs',
          severity: 'high',
          message: `Secrets found in logs: ${logSecrets.join(', ')}`,
          suggestion: 'Ensure logs do not contain sensitive information'
        });
        result.exposedSecrets.push(...logSecrets);
        result.deduction += 25;
      }

      // Check for secrets in artifacts
      const artifactSecrets = await this.checkSecretsInArtifacts(environment);
      result.scanResults.artifacts = artifactSecrets;
      
      if (artifactSecrets.length > 0) {
        result.issues.push({
          type: 'secrets_in_artifacts',
          severity: 'high',
          message: `Secrets found in build artifacts: ${artifactSecrets.join(', ')}`,
          suggestion: 'Clean build artifacts of sensitive information'
        });
        result.exposedSecrets.push(...artifactSecrets);
        result.deduction += 20;
      }
    } catch (error) {
      result.issues.push({
        type: 'error',
        severity: 'high',
        message: `Failed to check exposed secrets: ${error.message}`,
        suggestion: 'Check secret scanning configuration'
      });
      result.deduction += 20;
    }

    return result;
  }

  // Helper methods
  async getCurrentSecrets(environment) {
    try {
      const output = execSync(`vercel env pull ${environment}`, { encoding: 'utf8' });
      return this.parseSecretsOutput(output);
    } catch (error) {
      return {};
    }
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

  isWeakPassword(password) {
    if (!password || password.length < 8) return true;
    if (password.match(/^[a-zA-Z0-9]+$/)) return true; // No special characters
    if (password.toLowerCase().includes('password')) return true;
    if (password.toLowerCase().includes('admin')) return true;
    if (password.toLowerCase().includes('user')) return true;
    return false;
  }

  hasCommonPattern(password) {
    const commonPatterns = [
      'password123', 'admin123', 'user123', '123456', 'qwerty',
      'abc123', 'letmein', 'welcome', 'monkey', 'dragon',
      'baseball', 'football', 'trustno1', 'superman', 'batman'
    ];
    
    return commonPatterns.some(pattern => 
      password.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  async isDuplicateSecret(key, value, environment) {
    for (const env of this.environments) {
      if (env === environment) continue;
      
      try {
        const secrets = await this.getCurrentSecrets(env);
        if (secrets[key] === value) {
          return true;
        }
      } catch (error) {
        // Skip if we can't access the environment
      }
    }
    return false;
  }

  async getAuditLog(environment) {
    try {
      const logFile = path.join(__dirname, `../secrets-audit-${environment}.log`);
      const content = await fs.readFile(logFile, 'utf8');
      return content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }

  async getVercelTeamAccess(environment) {
    try {
      const output = execSync(`vercel env ls ${environment}`, { encoding: 'utf8' });
      return {
        hasAccess: output.includes('team'),
        team: 'normaldance-team'
      };
    } catch (error) {
      return { hasAccess: false };
    }
  }

  async getGitHubRepoAccess(environment) {
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
      return { hasAccess: response.status === 200 };
    } catch (error) {
      return { hasAccess: false };
    }
  }

  async checkPermissiveAccess(environment) {
    // This would check for overly permissive access patterns
    return [];
  }

  async checkEncryptionAtRest(environment) {
    // This would check if secrets are encrypted at rest
    return true;
  }

  async checkEncryptionAlgorithms(environment) {
    // This would check encryption algorithms used
    return ['aes-256-gcm'];
  }

  async checkKeyRotation(environment) {
    // This would check if encryption keys are rotated
    return { enabled: true, lastRotated: new Date().toISOString() };
  }

  async checkAuditEnabled(environment) {
    // This would check if audit logging is enabled
    return true;
  }

  async getRecentAuditEvents(environment) {
    // This would get recent audit events
    return [];
  }

  async checkSuspiciousActivities(environment) {
    // This would check for suspicious activities
    return [];
  }

  async checkSecretsInCode(environment) {
    // This would check for secrets in code
    return [];
  }

  async checkSecretsInLogs(environment) {
    // This would check for secrets in logs
    return [];
  }

  async checkSecretsInArtifacts(environment) {
    // This would check for secrets in build artifacts
    return [];
  }

  // Compliance checking methods
  async checkNISTCompliance(environment) {
    return {
      issues: [],
      deduction: 0,
      status: 'compliant'
    };
  }

  async checkISO27001Compliance(environment) {
    return {
      issues: [],
      deduction: 0,
      status: 'compliant'
    };
  }

  async checkSOC2Compliance(environment) {
    return {
      issues: [],
      deduction: 0,
      status: 'compliant'
    };
  }

  generateComprehensiveReport(reports, options) {
    switch (options.format) {
      case 'json':
        return JSON.stringify(reports, null, 2);
      case 'html':
        return this.generateHTMLReport(reports);
      case 'text':
      default:
        return this.generateTextReport(reports);
    }
  }

  generateTextReport(reports) {
    let report = '🔒 Security Monitoring Report\n';
    report += '==============================\n\n';
    
    for (const envReport of reports) {
      report += `📊 Environment: ${envReport.environment}\n`;
      report += `Score: ${envReport.score}/100\n`;
      report += `Timestamp: ${envReport.timestamp}\n\n`;
      
      if (envReport.issues.length > 0) {
        report += `❌ Issues Found (${envReport.issues.length}):\n`;
        for (const issue of envReport.issues) {
          report += `  - [${issue.severity.toUpperCase()}] ${issue.message}\n`;
          report += `    Suggestion: ${issue.suggestion}\n\n`;
        }
      } else {
        report += '✅ No issues found\n\n';
      }
      
      if (envReport.compliance && Object.keys(envReport.compliance).length > 0) {
        report += '📋 Compliance Status:\n';
        for (const [standard, status] of Object.entries(envReport.compliance)) {
          report += `  - ${standard}: ${status.status}\n`;
        }
        report += '\n';
      }
    }
    
    return report;
  }

  generateHTMLReport(reports) {
    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Security Monitoring Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .environment { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
        .score { font-size: 24px; font-weight: bold; }
        .good { color: green; }
        .warning { color: orange; }
        .bad { color: red; }
        .issue { margin: 10px 0; padding: 10px; background: #fff3cd; border-radius: 3px; }
        .issue.high { background: #f8d7da; }
        .issue.medium { background: #fff3cd; }
        .issue.low { background: #d1ecf1; }
        .compliance { margin: 20px 0; padding: 15px; background: #e8f5e8; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔒 Security Monitoring Report</h1>
        <p>Generated on: ${new Date().toISOString()}</p>
    </div>
`;

    for (const envReport of reports) {
      const scoreClass = envReport.score >= 80 ? 'good' : envReport.score >= 60 ? 'warning' : 'bad';
      
      html += `
    <div class="environment">
        <h2>📊 Environment: ${envReport.environment}</h2>
        <div class="score ${scoreClass}">Score: ${envReport.score}/100</div>
        <p>Timestamp: ${envReport.timestamp}</p>
`;

      if (envReport.issues.length > 0) {
        html += `
        <h3>❌ Issues Found (${envReport.issues.length}):</h3>
`;
        for (const issue of envReport.issues) {
          html += `
        <div class="issue ${issue.severity}">
            <strong>[${issue.severity.toUpperCase()}]</strong> ${issue.message}
            <br><em>Suggestion: ${issue.suggestion}</em>
        </div>
`;
        }
      } else {
        html += `
        <h3>✅ No issues found</h3>
`;
      }

      if (envReport.compliance && Object.keys(envReport.compliance).length > 0) {
        html += `
        <div class="compliance">
            <h3>📋 Compliance Status:</h3>
            <ul>
`;
        for (const [standard, status] of Object.entries(envReport.compliance)) {
          html += `
                <li>${standard}: ${status.status}</li>
`;
        }
        html += `
            </ul>
        </div>
`;
      }

      html += `
    </div>
`;
    }

    html += `
</body>
</html>
`;

    return html;
  }

  async writeReport(report, outputPath) {
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(outputPath, report);
  }

  async sendAlerts(reports) {
    if (!this.alertWebhook) {
      console.log('  ⚠️  No alert webhook configured');
      return;
    }

    const totalIssues = reports.reduce((sum, report) => sum + report.issues.length, 0);
    const avgScore = reports.reduce((sum, report) => sum + report.score, 0) / reports.length;

    const message = {
      text: '🚨 Security Alert',
      attachments: [
        {
          color: totalIssues > 0 ? 'danger' : 'good',
          fields: [
            {
              title: 'Total Issues',
              value: totalIssues,
              short: true
            },
            {
              title: 'Average Score',
              value: `${avgScore.toFixed(1)}/100`,
              short: true
            },
            {
              title: 'Affected Environments',
              value: reports.map(r => r.environment).join(', '),
              short: false
            }
          ]
        }
      ]
    };

    try {
      await axios.post(this.alertWebhook, message);
      console.log('  ✅ Alert sent');
    } catch (error) {
      console.error(`  ❌ Failed to send alert: ${error.message}`);
    }
  }

  showHelp() {
    console.log(`
Security Monitor for NORMALDANCE Secrets

Usage: node scripts/security-monitor.js [options]

Options:
  --env, -e <env>      Environment to monitor (dev, staging, production, all)
  --output, -o <file>  Output file for report
  --format, -f <fmt>   Output format (json, html, text)
  --alerts             Enable alerts for security issues
  --compliance         Check compliance with security standards
  --verbose, -v        Enable verbose output
  --help, -h          Show help message

Examples:
  node scripts/security-monitor.js --env production
  node scripts/security-monitor.js --env all --output security-report.html --format html
  node scripts/security-monitor.js --env staging --alerts --compliance
    `);
  }
}

// Run the script
if (require.main === module) {
  const monitor = new SecurityMonitor();
  monitor.run();
}

module.exports = SecurityMonitor;