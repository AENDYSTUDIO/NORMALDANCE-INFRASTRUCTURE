#!/usr/bin/env node

/**
 * GitHub Secrets Management for NORMALDANCE-INFRASTRUCTURE
 * Manages GitHub repository and environment secrets
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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

// Check if GitHub CLI is available
function checkGhCli() {
  try {
    execSync("gh --version", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

// Get current repository info
function getRepoInfo() {
  try {
    const remoteUrl = execSync("git config --get remote.origin.url", {
      encoding: "utf8",
    }).trim();

    // Extract owner/repo from URL
    const match = remoteUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        fullName: `${match[1]}/${match[2]}`,
      };
    }
  } catch (err) {
    error("Failed to get repository information");
    process.exit(1);
  }

  error("Could not determine repository information");
  process.exit(1);
}

// Set a secret
function setSecret(name, value, environment = null) {
  const repo = getRepoInfo();

  try {
    let cmd;
    if (environment) {
      cmd = `gh secret set ${name} --body "${value}" --env ${environment} --repo ${repo.fullName}`;
    } else {
      cmd = `gh secret set ${name} --body "${value}" --repo ${repo.fullName}`;
    }

    execSync(cmd, { stdio: "inherit" });
    success(
      `Secret ${name} set successfully${
        environment ? ` for environment ${environment}` : ""
      }`
    );
  } catch (err) {
    error(`Failed to set secret ${name}: ${err.message}`);
    process.exit(1);
  }
}

// Get a secret value (limited by GitHub CLI)
function getSecret(name, environment = null) {
  warning(
    "GitHub CLI does not support retrieving secret values for security reasons"
  );
  info("Use GitHub web interface or API to view secret values");
  info(`Secret: ${name}${environment ? ` (Environment: ${environment})` : ""}`);
}

// List secrets
function listSecrets(environment = null) {
  const repo = getRepoInfo();

  try {
    let cmd;
    if (environment) {
      cmd = `gh secret list --env ${environment} --repo ${repo.fullName}`;
    } else {
      cmd = `gh secret list --repo ${repo.fullName}`;
    }

    const result = execSync(cmd, { encoding: "utf8" });
    console.log(result);
  } catch (err) {
    error(`Failed to list secrets: ${err.message}`);
    process.exit(1);
  }
}

// Delete a secret
function deleteSecret(name, environment = null) {
  const repo = getRepoInfo();

  try {
    let cmd;
    if (environment) {
      cmd = `gh secret delete ${name} --env ${environment} --repo ${repo.fullName}`;
    } else {
      cmd = `gh secret delete ${name} --repo ${repo.fullName}`;
    }

    execSync(cmd, { stdio: "inherit" });
    success(
      `Secret ${name} deleted successfully${
        environment ? ` from environment ${environment}` : ""
      }`
    );
  } catch (err) {
    error(`Failed to delete secret ${name}: ${err.message}`);
    process.exit(1);
  }
}

// Import secrets from .env file
function importFromEnv(envFile = ".env", environment = null) {
  const envPath = path.resolve(envFile);

  if (!fs.existsSync(envPath)) {
    error(`Environment file not found: ${envPath}`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf8");
  const lines = envContent.split("\n");
  let imported = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const name = match[1].trim();
      const value = match[2].trim();

      // Remove quotes if present
      const cleanValue = value.replace(/^["']|["']$/g, "");

      try {
        setSecret(name, cleanValue, environment);
        imported++;
      } catch (err) {
        warning(`Failed to import ${name}: ${err.message}`);
      }
    }
  }

  success(
    `Imported ${imported} secrets from ${envFile}${
      environment ? ` to environment ${environment}` : ""
    }`
  );
}

// Create backup of secrets (names only, not values)
function backupSecrets(outputFile = "secrets-backup.json") {
  const repo = getRepoInfo();

  try {
    const result = execSync(
      `gh secret list --repo ${repo.fullName} --json name,updatedAt`,
      {
        encoding: "utf8",
      }
    );

    const secrets = JSON.parse(result);
    const backup = {
      repository: repo.fullName,
      backupDate: new Date().toISOString(),
      secrets: secrets.map((secret) => ({
        name: secret.name,
        updatedAt: secret.updatedAt,
      })),
    };

    fs.writeFileSync(outputFile, JSON.stringify(backup, null, 2));
    success(`Secrets backup saved to ${outputFile}`);
    info(`Backed up ${secrets.length} secrets (names only)`);
  } catch (err) {
    error(`Failed to create backup: ${err.message}`);
    process.exit(1);
  }
}

// Sync secrets between repositories
function syncSecrets(sourceRepo, targetRepo, secretsList = null) {
  try {
    info(`Syncing secrets from ${sourceRepo} to ${targetRepo}`);

    let secretsToSync = secretsList;
    if (!secretsToSync) {
      // Get all secrets from source repo
      const result = execSync(
        `gh secret list --repo ${sourceRepo} --json name`,
        {
          encoding: "utf8",
        }
      );
      const secrets = JSON.parse(result);
      secretsToSync = secrets.map((s) => s.name);
    }

    warning("Note: GitHub CLI cannot retrieve secret values");
    info("This function shows which secrets would be synced");
    info("Use GitHub web interface or API for actual value transfer");

    console.log("\nSecrets to sync:");
    secretsToSync.forEach((secret) => {
      console.log(`  - ${secret}`);
    });

    console.log(
      `\nTo complete sync, manually copy values from ${sourceRepo} to ${targetRepo}`
    );
  } catch (err) {
    error(`Failed to sync secrets: ${err.message}`);
    process.exit(1);
  }
}

// Rotate secrets (generate new values)
function rotateSecrets(secretsList) {
  info("Rotating secrets...");

  for (const secretName of secretsList) {
    // Generate a new random value
    const newValue = generateSecureRandom(32);

    try {
      setSecret(secretName, newValue);
      success(`Rotated secret: ${secretName}`);
    } catch (err) {
      error(`Failed to rotate ${secretName}: ${err.message}`);
    }
  }
}

// Generate secure random string
function generateSecureRandom(length = 32) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Validate secrets configuration
function validateSecrets() {
  const repo = getRepoInfo();
  info(`Validating secrets for ${repo.fullName}`);

  const requiredSecrets = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "DOCKERHUB_USERNAME",
    "DOCKERHUB_TOKEN",
  ];

  try {
    const result = execSync(
      `gh secret list --repo ${repo.fullName} --json name`,
      {
        encoding: "utf8",
      }
    );

    const existingSecrets = JSON.parse(result).map((s) => s.name);
    const missingSecrets = requiredSecrets.filter(
      (s) => !existingSecrets.includes(s)
    );

    if (missingSecrets.length === 0) {
      success("All required secrets are configured");
    } else {
      warning("Missing required secrets:");
      missingSecrets.forEach((secret) => {
        console.log(`  - ${secret}`);
      });
    }
  } catch (err) {
    error(`Failed to validate secrets: ${err.message}`);
    process.exit(1);
  }
}

// Main function
function main() {
  if (!checkGhCli()) {
    error("GitHub CLI (gh) is not installed or not authenticated");
    info("Install: https://cli.github.com/");
    info("Authenticate: gh auth login");
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    error("Usage: node scripts/github-secrets.js <command> [options]");
    error("Commands:");
    error("  set <name> <value> [--env environment]  - Set a secret");
    error("  get <name> [--env environment]          - Get a secret");
    error("  list [--env environment]                - List secrets");
    error("  delete <name> [--env environment]       - Delete a secret");
    error("  env-import [file] [--env environment]   - Import from .env file");
    error("  backup [file]                           - Create secrets backup");
    error(
      "  sync <source-repo> <target-repo>        - Sync secrets between repos"
    );
    error("  rotate <secret1,secret2,...>            - Rotate secret values");
    error(
      "  validate                                 - Validate secrets configuration"
    );
    process.exit(1);
  }

  // Parse environment flag
  let environment = null;
  const envIndex = args.indexOf("--env");
  if (envIndex !== -1 && envIndex + 1 < args.length) {
    environment = args[envIndex + 1];
    args.splice(envIndex, 2); // Remove --env and its value
  }

  switch (command) {
    case "set":
      if (args.length < 3) {
        error("Usage: set <name> <value> [--env environment]");
        process.exit(1);
      }
      setSecret(args[1], args[2], environment);
      break;

    case "get":
      if (args.length < 2) {
        error("Usage: get <name> [--env environment]");
        process.exit(1);
      }
      getSecret(args[1], environment);
      break;

    case "list":
      listSecrets(environment);
      break;

    case "delete":
      if (args.length < 2) {
        error("Usage: delete <name> [--env environment]");
        process.exit(1);
      }
      deleteSecret(args[1], environment);
      break;

    case "env-import":
      const envFile = args[1] || ".env";
      importFromEnv(envFile, environment);
      break;

    case "backup":
      const backupFile = args[1] || "secrets-backup.json";
      backupSecrets(backupFile);
      break;

    case "sync":
      if (args.length < 3) {
        error("Usage: sync <source-repo> <target-repo>");
        process.exit(1);
      }
      syncSecrets(args[1], args[2]);
      break;

    case "rotate":
      if (args.length < 2) {
        error("Usage: rotate <secret1,secret2,...>");
        process.exit(1);
      }
      const secretsToRotate = args[1].split(",");
      rotateSecrets(secretsToRotate);
      break;

    case "validate":
      validateSecrets();
      break;

    default:
      error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main };
