#!/usr/bin/env node

/**
 * Git Workflow Helper for NORMALDANCE-INFRASTRUCTURE
 * Handles creation of feature and hotfix branches
 */

const { execSync } = require("child_process");

// Colors for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(colors.red, `❌ Error: ${message}`);
}

function success(message) {
  log(colors.green, `✅ ${message}`);
}

function info(message) {
  log(colors.blue, `ℹ️  ${message}`);
}

function warning(message) {
  log(colors.yellow, `⚠️  ${message}`);
}

// Get current branch
function getCurrentBranch() {
  try {
    return execSync("git branch --show-current", { encoding: "utf8" }).trim();
  } catch (err) {
    error("Failed to get current branch");
    process.exit(1);
  }
}

// Check if branch exists
function branchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`);
    return true;
  } catch {
    return false;
  }
}

// Create and switch to branch
function createBranch(branchName, fromBranch = null) {
  try {
    const from = fromBranch ? ` ${fromBranch}` : "";
    execSync(`git checkout -b ${branchName}${from}`, { stdio: "inherit" });
    success(`Created and switched to branch: ${branchName}`);
  } catch (err) {
    error(`Failed to create branch ${branchName}: ${err.message}`);
    process.exit(1);
  }
}

// Push branch to remote
function pushBranch(branchName) {
  try {
    execSync(`git push -u origin ${branchName}`, { stdio: "inherit" });
    success(`Pushed branch ${branchName} to remote`);
  } catch (err) {
    warning(`Failed to push branch to remote: ${err.message}`);
    info("You can push manually later with: git push -u origin " + branchName);
  }
}

// Main function
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    error("Usage: node scripts/git-workflow.js <feature|hotfix> [branch-name]");
    error("Examples:");
    error("  node scripts/git-workflow.js feature add-monitoring");
    error("  node scripts/git-workflow.js hotfix security-patch");
    process.exit(1);
  }

  const type = args[0].toLowerCase();
  const name = args[1];

  if (!name) {
    error("Branch name is required");
    error(`Usage: node scripts/git-workflow.js ${type} <branch-name>`);
    process.exit(1);
  }

  const currentBranch = getCurrentBranch();
  info(`Current branch: ${currentBranch}`);

  let branchName;
  let fromBranch;

  switch (type) {
    case "feature":
      branchName = `feature/${name}`;
      fromBranch = "development";

      if (!branchExists("development")) {
        error("Development branch does not exist. Please create it first.");
        info("Run: git checkout -b development");
        process.exit(1);
      }

      info("Creating feature branch from development...");
      break;

    case "hotfix":
      branchName = `hotfix/${name}`;
      fromBranch = "main";

      if (!branchExists("main")) {
        error(
          "Main branch does not exist. Please ensure you have a main branch."
        );
        process.exit(1);
      }

      info("Creating hotfix branch from main...");
      break;

    default:
      error('Invalid branch type. Use "feature" or "hotfix"');
      process.exit(1);
  }

  // Check if branch already exists
  if (branchExists(branchName)) {
    error(`Branch ${branchName} already exists`);
    info(`Switch to it with: git checkout ${branchName}`);
    process.exit(1);
  }

  // Create the branch
  createBranch(branchName, fromBranch);

  // Push to remote
  pushBranch(branchName);

  // Show next steps
  console.log("");
  log(colors.cyan, "🚀 Next steps:");

  if (type === "feature") {
    info("1. Make your changes and commits");
    info("2. Create PR: npm run pr:create");
    info("3. After merge: npm run git:promote:dev-to-staging");
  } else if (type === "hotfix") {
    info("1. Make your critical fixes and commits");
    info("2. Create PR to main: npm run pr:create --base main");
    info("3. After merge: npm run git:promote:staging-to-main");
  }

  info("4. Clean up: npm run git:cleanup:merged");

  console.log("");
  success(`Branch ${branchName} is ready for development!`);
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
