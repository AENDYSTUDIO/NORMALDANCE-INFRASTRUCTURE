#!/usr/bin/env node

/**
 * Deployment Rules Configuration for NORMALDANCE
 * 
 * This script defines the deployment rules and validation conditions
 * that can cause deployments to be rejected.
 * 
 * Usage:
 *   node scripts/deployment-rules.js <command> [options]
 * 
 * Commands:
 *   validate        - Validate current deployment rules
 *   check <env>     - Check deployment rules for specific environment
 *   list            - List all deployment rules
 *   test            - Test deployment rules with sample data
 */

import fs from 'fs';.promises;
import path from 'path';;

class DeploymentRules {
  constructor() {
    this.rules = {
      // Global rules that apply to all environments
      global: {
        // Code quality rules
        codeQuality: {
          enabled: true,
          checks: {
            linting: {
              enabled: true,
              command: 'npm run lint',
              allowedExitCodes: [0],
              errorMessage: 'Linting failed - code quality issues detected'
            },
            typeChecking: {
              enabled: true,
              command: 'npm run type-check',
              allowedExitCodes: [0],
              errorMessage: 'TypeScript type checking failed'
            },
            securityAudit: {
              enabled: true,
              command: 'npm audit --audit-level moderate',
              allowedExitCodes: [0],
              errorMessage: 'Security audit failed - vulnerabilities detected'
            }
          }
        },
        
        // Test rules
        tests: {
          enabled: true,
          checks: {
            unitTests: {
              enabled: true,
              command: 'npm run test:unit',
              allowedExitCodes: [0],
              errorMessage: 'Unit tests failed',
              required: true
            },
            integrationTests: {
              enabled: true,
              command: 'npm run test:integration',
              allowedExitCodes: [0],
              errorMessage: 'Integration tests failed',
              required: true
            },
            e2eTests: {
              enabled: true,
              command: 'npm run test:e2e',
              allowedExitCodes: [0],
              errorMessage: 'E2E tests failed',
              required: false // Can be disabled for quick deployments
            },
            mobileTests: {
              enabled: true,
              command: 'npm run test:mobile',
              allowedExitCodes: [0],
              errorMessage: 'Mobile tests failed',
              required: false
            }
          }
        },
        
        // Security rules
        security: {
          enabled: true,
          checks: {
            vulnerabilityScan: {
              enabled: true,
              command: 'npm run security:audit',
              allowedExitCodes: [0],
              errorMessage: 'Vulnerability scan failed'
            },
            dependencyCheck: {
              enabled: true,
              command: 'npm audit --audit-level moderate',
              allowedExitCodes: [0],
              errorMessage: 'Dependency check failed'
            }
          }
        },
        
        // Build rules
        build: {
          enabled: true,
          checks: {
            buildValidation: {
              enabled: true,
              command: 'npm run build',
              allowedExitCodes: [0],
              errorMessage: 'Build failed'
            },
            dockerBuild: {
              enabled: true,
              command: 'npm run build:docker',
              allowedExitCodes: [0],
              errorMessage: 'Docker build failed'
            }
          }
        }
      },
      
      // Environment-specific rules
      environments: {
        development: {
          // Less strict rules for development
          codeQuality: {
            enabled: true,
            checks: {
              linting: {
                enabled: true,
                allowedExitCodes: [0, 1], // Allow warnings
                errorMessage: 'Linting failed - code quality issues detected'
              },
              typeChecking: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'TypeScript type checking failed'
              },
              securityAudit: {
                enabled: false, // Disabled for development
                allowedExitCodes: [0],
                errorMessage: 'Security audit failed'
              }
            }
          },
          
          tests: {
            enabled: true,
            checks: {
              unitTests: {
                enabled: true,
                required: true
              },
              integrationTests: {
                enabled: true,
                required: false // Can be disabled for quick deployments
              },
              e2eTests: {
                enabled: false, // Disabled for development speed
                required: false
              },
              mobileTests: {
                enabled: false,
                required: false
              }
            }
          },
          
          security: {
            enabled: false, // Less strict security for development
            checks: {
              vulnerabilityScan: {
                enabled: false
              },
              dependencyCheck: {
                enabled: false
              }
            }
          },
          
          build: {
            enabled: true,
            checks: {
              buildValidation: {
                enabled: true,
                command: 'npm run build -- --no-lint', // Skip linting for speed
                allowedExitCodes: [0],
                errorMessage: 'Build failed'
              },
              dockerBuild: {
                enabled: false, // Skip Docker build for development
                allowedExitCodes: [0],
                errorMessage: 'Docker build failed'
              }
            }
          }
        },
        
        staging: {
          // Medium strict rules for staging
          codeQuality: {
            enabled: true,
            checks: {
              linting: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Linting failed - code quality issues detected'
              },
              typeChecking: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'TypeScript type checking failed'
              },
              securityAudit: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Security audit failed'
              }
            }
          },
          
          tests: {
            enabled: true,
            checks: {
              unitTests: {
                enabled: true,
                required: true
              },
              integrationTests: {
                enabled: true,
                required: true
              },
              e2eTests: {
                enabled: true,
                required: true
              },
              mobileTests: {
                enabled: true,
                required: false
              }
            }
          },
          
          security: {
            enabled: true,
            checks: {
              vulnerabilityScan: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Vulnerability scan failed'
              },
              dependencyCheck: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Dependency check failed'
              }
            }
          },
          
          build: {
            enabled: true,
            checks: {
              buildValidation: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Build failed'
              },
              dockerBuild: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Docker build failed'
              }
            }
          }
        },
        
        production: {
          // Very strict rules for production
          codeQuality: {
            enabled: true,
            checks: {
              linting: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Linting failed - code quality issues detected'
              },
              typeChecking: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'TypeScript type checking failed'
              },
              securityAudit: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Security audit failed'
              }
            }
          },
          
          tests: {
            enabled: true,
            checks: {
              unitTests: {
                enabled: true,
                required: true
              },
              integrationTests: {
                enabled: true,
                required: true
              },
              e2eTests: {
                enabled: true,
                required: true
              },
              mobileTests: {
                enabled: true,
                required: true
              }
            }
          },
          
          security: {
            enabled: true,
            checks: {
              vulnerabilityScan: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Vulnerability scan failed'
              },
              dependencyCheck: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Dependency check failed'
              },
              // Additional production-specific security checks
              secretsCheck: {
                enabled: true,
                command: 'npm run secrets:check',
                allowedExitCodes: [0],
                errorMessage: 'Secrets check failed - potential secrets found in code'
              },
              codeSigning: {
                enabled: true,
                command: 'npm run code-sign:verify',
                allowedExitCodes: [0],
                errorMessage: 'Code signing verification failed'
              }
            }
          },
          
          build: {
            enabled: true,
            checks: {
              buildValidation: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Build failed'
              },
              dockerBuild: {
                enabled: true,
                allowedExitCodes: [0],
                errorMessage: 'Docker build failed'
              },
              // Additional production-specific build checks
              performanceOptimization: {
                enabled: true,
                command: 'npm run build:analyze',
                allowedExitCodes: [0],
                errorMessage: 'Performance optimization check failed'
              },
              bundleSize: {
                enabled: true,
                command: 'npm run build:size-check',
                allowedExitCodes: [0],
                errorMessage: 'Bundle size check failed'
              }
            }
          }
        }
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
        case 'validate':
          await this.validate();
          break;
        case 'check':
          await this.checkEnvironment(options[0]);
          break;
        case 'list':
          await this.listRules();
          break;
        case 'test':
          await this.testRules();
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
Deployment Rules Configuration for NORMALDANCE

Usage: node scripts/deployment-rules.js <command> [options]

Commands:
  validate        - Validate current deployment rules
  check <env>     - Check deployment rules for specific environment
  list            - List all deployment rules
  test            - Test deployment rules with sample data

Examples:
  node scripts/deployment-rules.js validate
  node scripts/deployment-rules.js check production
  node scripts/deployment-rules.js list
  node scripts/deployment-rules.js test
    `);
  }

  async validate() {
    console.log('🔍 Validating deployment rules...');
    
    try {
      // Check if all required commands exist
      const requiredCommands = [
        'npm run lint',
        'npm run type-check',
        'npm run test:unit',
        'npm run test:integration',
        'npm run test:e2e',
        'npm run build'
      ];
      
      for (const command of requiredCommands) {
        try {
          execSync(`npm run ${command.split(' ')[2]} -- --version`, { stdio: 'ignore' });
        } catch (error) {
          console.warn(`⚠️ Command not found: ${command}`);
        }
      }
      
      // Validate rule structure
      this.validateRuleStructure();
      
      console.log('✅ Deployment rules validation passed');
    } catch (error) {
      console.error('❌ Deployment rules validation failed:', error.message);
      throw error;
    }
  }

  validateRuleStructure() {
    // Check if all required sections exist
    const requiredSections = ['global', 'environments'];
    for (const section of requiredSections) {
      if (!this.rules[section]) {
        throw new Error(`Missing required section: ${section}`);
      }
    }
    
    // Check if all required environments exist
    const requiredEnvironments = ['development', 'staging', 'production'];
    for (const env of requiredEnvironments) {
      if (!this.rules.environments[env]) {
        throw new Error(`Missing required environment: ${env}`);
      }
    }
    
    // Check if all required checks exist in global rules
    const requiredGlobalChecks = ['codeQuality', 'tests', 'security', 'build'];
    for (const check of requiredGlobalChecks) {
      if (!this.rules.global[check]) {
        throw new Error(`Missing required global check: ${check}`);
      }
    }
  }

  async checkEnvironment(environment) {
    if (!this.rules.environments[environment]) {
      throw new Error(`Unknown environment: ${environment}`);
    }
    
    console.log(`🔍 Checking deployment rules for ${environment} environment...`);
    
    const envRules = this.rules.environments[environment];
    const globalRules = this.rules.global;
    
    // Combine global and environment-specific rules
    const combinedRules = this.combineRules(globalRules, envRules);
    
    // Check each rule category
    for (const [category, categoryRules] of Object.entries(combinedRules)) {
      if (categoryRules.enabled) {
        console.log(`\n📋 Checking ${category} rules...`);
        
        for (const [checkName, checkRules] of Object.entries(categoryRules.checks)) {
          if (checkRules.enabled) {
            console.log(`  - ${checkName}: ${checkRules.required ? 'Required' : 'Optional'}`);
            
            if (checkRules.command) {
              console.log(`    Command: ${checkRules.command}`);
              console.log(`    Allowed exit codes: ${checkRules.allowedExitCodes.join(', ')}`);
            }
            
            if (checkRules.errorMessage) {
              console.log(`    Error message: ${checkRules.errorMessage}`);
            }
          }
        }
      }
    }
    
    console.log(`\n✅ ${environment} environment rules checked successfully`);
  }

  combineRules(globalRules, envRules) {
    const combined = JSON.parse(JSON.stringify(globalRules));
    
    // Override with environment-specific rules
    for (const [category, categoryRules] of Object.entries(envRules)) {
      if (combined[category]) {
        combined[category].enabled = categoryRules.enabled !== undefined ? categoryRules.enabled : combined[category].enabled;
        
        for (const [checkName, checkRules] of Object.entries(categoryRules.checks)) {
          if (combined[category].checks[checkName]) {
            combined[category].checks[checkName] = { ...combined[category].checks[checkName], ...checkRules };
          }
        }
      }
    }
    
    return combined;
  }

  async listRules() {
    console.log('📋 Listing all deployment rules...\n');
    
    // List global rules
    console.log('🌍 Global Rules:');
    for (const [category, categoryRules] of Object.entries(this.rules.global)) {
      console.log(`  ${category}: ${categoryRules.enabled ? 'Enabled' : 'Disabled'}`);
      
      for (const [checkName, checkRules] of Object.entries(categoryRules.checks)) {
        console.log(`    - ${checkName}: ${checkRules.enabled ? 'Enabled' : 'Disabled'}`);
      }
    }
    
    // List environment-specific rules
    console.log('\n🌍 Environment-Specific Rules:');
    for (const [env, envRules] of Object.entries(this.rules.environments)) {
      console.log(`\n  ${env.toUpperCase()}:`);
      
      for (const [category, categoryRules] of Object.entries(envRules)) {
        console.log(`    ${category}: ${categoryRules.enabled ? 'Enabled' : 'Disabled'}`);
        
        for (const [checkName, checkRules] of Object.entries(categoryRules.checks)) {
          console.log(`      - ${checkName}: ${checkRules.enabled ? 'Enabled' : 'Disabled'}`);
        }
      }
    }
  }

  async testRules() {
    console.log('🧪 Testing deployment rules with sample data...\n');
    
    // Test with sample environment data
    const testEnvironments = ['development', 'staging', 'production'];
    
    for (const env of testEnvironments) {
      console.log(`🔍 Testing ${env} environment...`);
      
      try {
        await this.checkEnvironment(env);
        console.log(`✅ ${env} environment test passed\n`);
      } catch (error) {
        console.log(`❌ ${env} environment test failed: ${error.message}\n`);
      }
    }
    
    console.log('🎉 Deployment rules testing completed');
  }
}

// Helper function to execute commands
function execSync(command, options = {}) {
  import { spawnSync  } from 'child_process';;
  const result = spawnSync(command, [], { ...options, shell: true });
  
  if (result.status !== 0 && !options.ignoreErrors) {
    throw new Error(`Command failed: ${command}`);
  }
  
  return result;
}

// Run the script
if (require.main === module) {
  const rules = new DeploymentRules();
  rules.run();
}

module.exports = DeploymentRules;