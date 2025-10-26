#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import os from "os";

// Cross-platform test runner
const config = {
  testDirs: ["./src", "./tests"],
  testCommands: {
    unit: "npm run test:unit",
    integration: "npm run test:integration",
    e2e: "npm run test:e2e",
    security: "npm run test:security",
  },
  coverageDir: "./coverage",
  reportsDir: "./test-reports",
  timeout: 30000,
};

// Ensure directories exist
const ensureDirectories = () => {
  const dirs = [config.coverageDir, config.reportsDir];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Run tests with cross-platform compatibility
const runTests = (type) => {
  console.log(`Running ${type} tests...`);

  try {
    // Use cross-platform command execution
    const command = config.testCommands[type];
    execSync(command, {
      stdio: "inherit",
      env: { ...process.env, CI: "true", NODE_ENV: "test" },
      timeout: config.timeout,
    });

    console.log(`${type} tests completed successfully`);
    return true;
  } catch (error) {
    console.error(`${type} tests failed:`, error.message);
    return false;
  }
};

// Main function
const main = async () => {
  console.log(
    `Starting cross-platform test suite on ${os.type()} ${os.arch()}`
  );
  console.log(`Node.js ${process.version} on ${os.platform()}`);

  ensureDirectories();

  const results = {};

  // Run all test types
  results.unit = runTests("unit");
  results.integration = runTests("integration");
  results.e2e = runTests("e2e");
  results.security = runTests("security");

  // Calculate overall success
  const passedTests = Object.values(results).filter((r) => r === true).length;
  const totalTests = Object.keys(results).length;
  const successRate = ((passedTests / totalTests) * 10).toFixed(2);

  console.log(`\nTest Summary:`);
  console.log(`- Total Test Types: ${totalTests}`);
  console.log(`- Passed: ${passedTests}`);
  console.log(`- Failed: ${totalTests - passedTests}`);
  console.log(`- Success Rate: ${successRate}%`);

  if (successRate >= 90) {
    console.log("🎉 All test types passed! Ready for deployment.");
    process.exit(0);
  } else {
    console.log("❌ Some test types failed. Please review the test results.");
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main().catch((error) => {
    console.error("Cross-platform test runner failed:", error);
    process.exit(1);
  });
}
