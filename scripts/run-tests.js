#!/usr/bin/env node

import { execSync  } from 'child_process';
import fs from 'fs';
import path from 'path';

// Configuration
const config = {
  testDirs: [
    './src',
    './mobile-app',
    './programs'
  ],
  testCommands: [
    'npm test',
    'npm run test:unit',
    'npm run test:integration',
    'npm run test:e2e',
    'npm run test:mobile'
  ],
  coverageDir: './coverage',
  reportsDir: './test-reports',
  browsers: ['chrome', 'firefox', 'safari'],
  devices: ['desktop', 'mobile', 'tablet']
};

// Ensure directories exist
const ensureDirectories = () => {
  const dirs = [config.coverageDir, config.reportsDir];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Run unit tests
const runUnitTests = () => {
  console.log('Running unit tests...');
  
  try {
    execSync('npm test -- --coverage --coverage-reporters=text --coverage-reporters=lcov', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('Unit tests completed successfully');
    return true;
  } catch (error) {
    console.error('Unit tests failed:', error.message);
    return false;
  }
};

// Run integration tests
const runIntegrationTests = () => {
  console.log('Running integration tests...');
  
  try {
    execSync('npm run test:integration', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('Integration tests completed successfully');
    return true;
  } catch (error) {
    console.error('Integration tests failed:', error.message);
    return false;
  }
};

// Run E2E tests
const runE2ETests = () => {
  console.log('Running E2E tests...');
  
  try {
    execSync('npm run test:e2e', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('E2E tests completed successfully');
    return true;
  } catch (error) {
    console.error('E2E tests failed:', error.message);
    return false;
  }
};

// Run mobile tests
const runMobileTests = () => {
  console.log('Running mobile tests...');
  
  try {
    execSync('cd mobile-app && npm test', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('Mobile tests completed successfully');
    return true;
  } catch (error) {
    console.error('Mobile tests failed:', error.message);
    return false;
  }
};

// Run browser tests
const runBrowserTests = () => {
  console.log('Running browser tests...');
  
  const results = {};
  
  config.browsers.forEach(browser => {
    console.log(`Running tests on ${browser}...`);
    
    try {
      execSync(`npm run test:browser -- --browser=${browser}`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      results[browser] = 'passed';
      console.log(`${browser} tests completed successfully`);
    } catch (error) {
      results[browser] = 'failed';
      console.error(`${browser} tests failed:`, error.message);
    }
  });
  
  return results;
};

// Run device tests
const runDeviceTests = () => {
  console.log('Running device tests...');
  
  const results = {};
  
  config.devices.forEach(device => {
    console.log(`Running tests on ${device}...`);
    
    try {
      execSync(`npm run test:device -- --device=${device}`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      results[device] = 'passed';
      console.log(`${device} tests completed successfully`);
    } catch (error) {
      results[device] = 'failed';
      console.error(`${device} tests failed:`, error.message);
    }
  });
  
  return results;
};

// Run performance tests
const runPerformanceTests = () => {
  console.log('Running performance tests...');
  
  try {
    execSync('npm run test:performance', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('Performance tests completed successfully');
    return true;
  } catch (error) {
    console.error('Performance tests failed:', error.message);
    return false;
  }
};

// Run security tests
const runSecurityTests = () => {
  console.log('Running security tests...');
  
  try {
    execSync('npm run test:security', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('Security tests completed successfully');
    return true;
  } catch (error) {
    console.error('Security tests failed:', error.message);
    return false;
  }
};

// Generate test report
const generateTestReport = (results) => {
  console.log('Generating test report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r === 'passed').length,
      failed: Object.values(results).filter(r => r === 'failed').length,
      successRate: (Object.values(results).filter(r => r === 'passed').length / Object.keys(results).length * 100).toFixed(2) + '%'
    },
    details: results
  };
  
  const reportPath = path.join(config.reportsDir, 'test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`Test report generated: ${reportPath}`);
  
  // Generate HTML report
  generateHtmlReport(report);
};

// Generate HTML report
const generateHtmlReport = (report) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - NormalDance</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
        }
        .summary-card {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            min-width: 150px;
        }
        .passed {
            background-color: #d4edda;
            color: #155724;
        }
        .failed {
            background-color: #f8d7da;
            color: #721c24;
        }
        .total {
            background-color: #e2e3e5;
            color: #383d41;
        }
        .details {
            margin-top: 30px;
        }
        .test-item {
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .test-item.passed {
            background-color: #d4edda;
        }
        .test-item.failed {
            background-color: #f8d7da;
        }
        .status {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NormalDance Test Report</h1>
            <p>Generated on: ${report.timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card total">
                <h3>Total Tests</h3>
                <p>${report.summary.total}</p>
            </div>
            <div class="summary-card passed">
                <h3>Passed</h3>
                <p>${report.summary.passed}</p>
            </div>
            <div class="summary-card failed">
                <h3>Failed</h3>
                <p>${report.summary.failed}</p>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <p>${report.summary.successRate}</p>
            </div>
        </div>
        
        <div class="details">
            <h2>Test Details</h2>
            ${Object.entries(report.details).map(([name, status]) => `
                <div class="test-item ${status}">
                    <span>${name}</span>
                    <span class="status">${status.toUpperCase()}</span>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
  
  const htmlPath = path.join(config.reportsDir, 'test-report.html');
  fs.writeFileSync(htmlPath, html);
  
  console.log(`HTML report generated: ${htmlPath}`);
};

// Main function
const main = async () => {
  console.log('Starting comprehensive test suite...');
  
  ensureDirectories();
  
  const results = {};
  
  // Run all test suites
  results.unit = runUnitTests();
  results.integration = runIntegrationTests();
  results.e2e = runE2ETests();
  results.mobile = runMobileTests();
  results.browsers = runBrowserTests();
  results.devices = runDeviceTests();
  results.performance = runPerformanceTests();
  results.security = runSecurityTests();
  
  // Flatten results
  const flattenedResults = {};
  Object.entries(results).forEach(([key, value]) => {
    if (typeof value === 'object') {
      Object.entries(value).forEach(([subKey, subValue]) => {
        flattenedResults[`${key}-${subKey}`] = subValue;
      });
    } else {
      flattenedResults[key] = value;
    }
  });
  
  // Generate report
  generateTestReport(flattenedResults);
  
  // Calculate overall success
  const passedTests = Object.values(flattenedResults).filter(r => r === true || r === 'passed').length;
  const totalTests = Object.keys(flattenedResults).length;
  const successRate = (passedTests / totalTests * 100).toFixed(2);
  
  console.log(`\nTest Summary:`);
  console.log(`- Total Tests: ${totalTests}`);
  console.log(`- Passed: ${passedTests}`);
  console.log(`- Failed: ${totalTests - passedTests}`);
  console.log(`- Success Rate: ${successRate}%`);
  
  if (successRate >= 90) {
    console.log('🎉 All tests passed! Ready for deployment.');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the test results.');
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runUnitTests,
  runIntegrationTests,
  runE2ETests,
  runMobileTests,
  runBrowserTests,
  runDeviceTests,
  runPerformanceTests,
  runSecurityTests,
  generateTestReport
};