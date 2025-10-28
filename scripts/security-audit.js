#!/usr/bin/env node

/**
 * Security Audit Script for NORMAL DANCE
 * Performs comprehensive security checks on the codebase
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

class SecurityAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.passed = [];
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const coloredMessage = this.colorize(message, type);
    console.log(`[${timestamp}] ${coloredMessage}`);
  }

  colorize(message, type) {
    const colors = {
      error: "\x1b[31m", // Red
      warning: "\x1b[33m", // Yellow
      success: "\x1b[32m", // Green
      info: "\x1b[36m", // Cyan
      reset: "\x1b[0m", // Reset
    };

    return `${colors[type]}${message}${colors.reset}`;
  }

  addIssue(severity, category, message, file = null, line = null) {
    const issue = {
      severity,
      category,
      message,
      file,
      line,
      timestamp: new Date().toISOString(),
    };

    if (severity === "high" || severity === "critical") {
      this.issues.push(issue);
      this.log(`🚨 ${category}: ${message}`, "error");
    } else if (severity === "medium" || severity === "low") {
      this.warnings.push(issue);
      this.log(`⚠️  ${category}: ${message}`, "warning");
    }

    if (file) {
      this.log(`   📁 File: ${file}${line ? `:${line}` : ""}`, "info");
    }
  }

  addPassed(category, message) {
    this.passed.push({
      category,
      message,
      timestamp: new Date().toISOString(),
    });
    this.log(`✅ ${category}: ${message}`, "success");
  }

  // Check for hardcoded secrets
  checkHardcodedSecrets() {
    this.log("🔍 Checking for hardcoded secrets...", "info");

    const secretPatterns = [
      /password\s*[:=]\s*['"]([^'"]+)['"]/gi,
      /secret\s*[:=]\s*['"]([^'"]+)['"]/gi,
      /token\s*[:=]\s*['"]([^'"]+)['"]/gi,
      /key\s*[:=]\s*['"]([^'"]+)['"]/gi,
      /api[_-]?key\s*[:=]\s*['"]([^'"]+)['"]/gi,
      /[a-f0-9]{32,}/g, // Potential API keys
      /sk_[a-z0-9]+/gi, // Stripe secret keys
      /xoxb-[0-9]+-[0-9]+-[a-z0-9]+/gi, // Slack bot tokens
    ];

    const excludeDirs = ["node_modules", ".git", "build", "dist", ".next"];
    const excludeFiles = ["package-lock.json", "yarn.lock", ".env.example"];

    this.walkDirectory(".", (filePath) => {
      if (excludeDirs.some((dir) => filePath.includes(dir))) return;
      if (excludeFiles.some((file) => filePath.endsWith(file))) return;
      if (!filePath.match(/\.(js|ts|jsx|tsx|json|env|md)$/)) return;

      try {
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          secretPatterns.forEach((pattern) => {
            let match;
            while ((match = pattern.exec(line)) !== null) {
              // Skip obvious test data and examples
              if (
                line.includes("example") ||
                line.includes("test") ||
                line.includes("mock") ||
                line.includes("fake")
              ) {
                continue;
              }

              this.addIssue(
                "high",
                "Hardcoded Secret",
                `Potential hardcoded secret found: ${match[0]}`,
                filePath,
                index + 1
              );
            }
          });
        });
      } catch (error) {
        this.addIssue(
          "low",
          "File Access Error",
          `Could not read file: ${error.message}`,
          filePath
        );
      }
    });

    this.addPassed("Secret Check", "Hardcoded secrets scan completed");
  }

  // Check for insecure dependencies
  checkDependencies() {
    this.log("🔍 Checking dependencies for vulnerabilities...", "info");

    try {
      // Run npm audit
      const auditOutput = execSync("npm audit --audit-level moderate --json", {
        encoding: "utf8",
        timeout: 30000,
      });

      const auditResult = JSON.parse(auditOutput);

      if (auditResult.vulnerabilities) {
        const vulnCount = Object.keys(auditResult.vulnerabilities).length;

        if (vulnCount > 0) {
          Object.entries(auditResult.vulnerabilities).forEach(([pkg, vuln]) => {
            const severity = vuln.severity;
            this.addIssue(
              severity,
              "Vulnerable Dependency",
              `${pkg} has ${severity} severity vulnerability: ${vuln.title}`
            );
          });
        } else {
          this.addPassed("Dependency Audit", "No vulnerabilities found");
        }
      }
    } catch (error) {
      this.addIssue(
        "medium",
        "Audit Error",
        `Could not run dependency audit: ${error.message}`
      );
    }
  }

  // Check for insecure file permissions
  checkFilePermissions() {
    this.log("🔍 Checking file permissions...", "info");

    const sensitiveFiles = [
      ".env",
      ".env.local",
      ".env.production",
      "config/secrets.json",
      "keys/",
      "private/",
      "*.key",
      "*.pem",
      "*.p12",
    ];

    sensitiveFiles.forEach((pattern) => {
      const files = this.globSync(pattern);
      files.forEach((file) => {
        try {
          const stats = fs.statSync(file);
          const mode = stats.mode.toString(8);

          // Check if file is world-readable or world-writable
          if (mode.endsWith("6") || mode.endsWith("7")) {
            this.addIssue(
              "high",
              "Insecure File Permissions",
              `File ${file} has insecure permissions: ${mode}`,
              file
            );
          }
        } catch (error) {
          // File might not exist, skip
        }
      });
    });

    this.addPassed("File Permissions", "File permission check completed");
  }

  // Check for outdated dependencies
  checkOutdatedDependencies() {
    this.log("🔍 Checking for outdated dependencies...", "info");

    try {
      const outdatedOutput = execSync("npm outdated --json", {
        encoding: "utf8",
        timeout: 30000,
      });

      const outdated = JSON.parse(outdatedOutput);

      const criticalPackages = [
        "express",
        "next",
        "react",
        "prisma",
        "solana/web3.js",
      ];
      let outdatedCritical = 0;

      Object.entries(outdated).forEach(([pkg, info]) => {
        const current = info.current;
        const latest = info.latest;

        if (criticalPackages.includes(pkg)) {
          const daysSinceUpdate = this.daysSince(info.time);
          if (daysSinceUpdate > 90) {
            // 3 months
            this.addIssue(
              "medium",
              "Outdated Critical Dependency",
              `${pkg} is outdated (${current} -> ${latest}, ${daysSinceUpdate} days old)`
            );
            outdatedCritical++;
          }
        }
      });

      if (outdatedCritical === 0) {
        this.addPassed(
          "Dependency Updates",
          "Critical dependencies are up to date"
        );
      }
    } catch (error) {
      // npm outdated exits with code 1 when there are outdated packages
      if (error.status === 1) {
        this.log("Some dependencies are outdated (this is normal)", "info");
      } else {
        this.addIssue(
          "low",
          "Outdated Check Error",
          `Could not check outdated dependencies: ${error.message}`
        );
      }
    }
  }

  // Check CSP configuration
  checkCSPConfiguration() {
    this.log("🔍 Checking CSP configuration...", "info");

    const cspPath = "config/csp.ts";
    if (!fs.existsSync(cspPath)) {
      this.addIssue("high", "Missing CSP", "CSP configuration file not found");
      return;
    }

    try {
      const content = fs.readFileSync(cspPath, "utf8");

      // Check for dangerous CSP directives
      if (content.includes("'unsafe-inline'") && !content.includes("nonce")) {
        this.addIssue(
          "high",
          "Insecure CSP",
          "CSP allows unsafe-inline without nonce protection"
        );
      }

      if (content.includes("'unsafe-eval'")) {
        this.addIssue(
          "medium",
          "CSP Risk",
          "CSP allows unsafe-eval which can be dangerous"
        );
      }

      // Check for missing security headers
      const requiredDirectives = [
        "default-src",
        "script-src",
        "style-src",
        "img-src",
        "connect-src",
        "font-src",
        "object-src",
        "base-uri",
        "form-action",
        "frame-ancestors",
      ];

      requiredDirectives.forEach((directive) => {
        if (!content.includes(directive)) {
          this.addIssue(
            "medium",
            "Incomplete CSP",
            `Missing CSP directive: ${directive}`
          );
        }
      });

      this.addPassed("CSP Configuration", "CSP configuration validated");
    } catch (error) {
      this.addIssue(
        "medium",
        "CSP Check Error",
        `Could not read CSP configuration: ${error.message}`
      );
    }
  }

  // Check for SQL injection vulnerabilities
  checkSQLInjection() {
    this.log("🔍 Checking for SQL injection vulnerabilities...", "info");

    const sqlPatterns = [
      /SELECT.*\+.*FROM/gi,
      /INSERT.*\+.*INTO/gi,
      /UPDATE.*\+.*SET/gi,
      /DELETE.*\+.*FROM/gi,
      /WHERE.*\+/gi,
      /\$\{.*\}/g, // Template literals in SQL
    ];

    this.walkDirectory("src", (filePath) => {
      if (!filePath.match(/\.(js|ts|jsx|tsx)$/)) return;

      try {
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
          sqlPatterns.forEach((pattern) => {
            if (pattern.test(line) && !line.includes("prisma.")) {
              this.addIssue(
                "high",
                "Potential SQL Injection",
                "String concatenation in SQL query detected",
                filePath,
                index + 1
              );
            }
          });
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    this.addPassed("SQL Injection Check", "SQL injection scan completed");
  }

  // Utility methods
  walkDirectory(dir, callback) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.startsWith(".")) {
        this.walkDirectory(filePath, callback);
      } else if (stat.isFile()) {
        callback(filePath);
      }
    });
  }

  globSync(pattern) {
    // Simple glob implementation for basic patterns
    const results = [];

    const walk = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          if (file === pattern || file.endsWith(pattern.replace("*", ""))) {
            results.push(filePath);
          }
          try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              walk(filePath);
            }
          } catch (e) {
            // Skip inaccessible directories
          }
        });
      } catch (e) {
        // Skip inaccessible directories
      }
    };

    walk(".");
    return results;
  }

  daysSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    return Math.floor((now - date) / (1000 * 60 * 60 * 24));
  }

  // Run all security checks
  async runAudit() {
    this.log("🚀 Starting NORMAL DANCE Security Audit", "info");
    this.log("=".repeat(50), "info");

    // Run all checks
    this.checkHardcodedSecrets();
    this.checkDependencies();
    this.checkFilePermissions();
    this.checkOutdatedDependencies();
    this.checkCSPConfiguration();
    this.checkSQLInjection();

    // Generate report
    this.generateReport();
  }

  generateReport() {
    this.log("\n" + "=".repeat(50), "info");
    this.log("📊 SECURITY AUDIT REPORT", "info");
    this.log("=".repeat(50), "info");

    this.log(`\n🚨 Critical/High Issues: ${this.issues.length}`, "error");
    this.issues.forEach((issue) => {
      this.log(`  • ${issue.category}: ${issue.message}`, "error");
      if (issue.file) {
        this.log(
          `    📁 ${issue.file}${issue.line ? `:${issue.line}` : ""}`,
          "info"
        );
      }
    });

    this.log(`\n⚠️  Medium/Low Issues: ${this.warnings.length}`, "warning");
    this.warnings.forEach((warning) => {
      this.log(`  • ${warning.category}: ${warning.message}`, "warning");
    });

    this.log(`\n✅ Passed Checks: ${this.passed.length}`, "success");
    this.passed.forEach((passed) => {
      this.log(`  • ${passed.category}: ${passed.message}`, "success");
    });

    // Overall assessment
    const totalIssues = this.issues.length + this.warnings.length;
    if (totalIssues === 0) {
      this.log("\n🎉 SECURITY AUDIT PASSED - No issues found!", "success");
    } else if (this.issues.length === 0) {
      this.log(
        "\n⚠️  SECURITY AUDIT COMPLETED - Only warnings found",
        "warning"
      );
    } else {
      this.log(
        `\n🚨 SECURITY AUDIT FAILED - ${this.issues.length} critical issues found`,
        "error"
      );
      process.exit(1);
    }

    // Save detailed report
    this.saveReport();
  }

  saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        criticalIssues: this.issues.length,
        warnings: this.warnings.length,
        passed: this.passed.length,
      },
      issues: this.issues,
      warnings: this.warnings,
      passed: this.passed,
    };

    const reportPath = "reports/security-audit-report.json";
    const reportDir = path.dirname(reportPath);

    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, "info");
  }
}

// Run the audit if this script is executed directly
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  const auditor = new SecurityAuditor();
  auditor.runAudit().catch((error) => {
    console.error("Audit failed:", error);
    process.exit(1);
  });
}

export default SecurityAuditor;
