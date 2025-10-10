#!/usr/bin/env node

/**
 * Deployment Script for NormalDance to Vercel
 *
 * This script automates the deployment process for the NormalDance application
 * to Vercel, including environment variable setup and deployment.
 */

// @ts-check
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */

const { execSync } = require("child_process");
const fs = require("fs");

// Function to execute shell commands
function execCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    const output = execSync(command, { encoding: "utf8", stdio: "inherit" });
    return output;
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Function to check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync("vercel --version", { stdio: "ignore" });
    console.log("✅ Vercel CLI is installed");
    return true;
  } catch (error) {
    console.error("❌ Vercel CLI is not installed. Please install it first:");
    console.error("npm install -g vercel");
    process.exit(1);
  }
}

// Function to check if logged in to Vercel
function checkVercelLogin() {
  try {
    execSync("vercel whoami", { stdio: "ignore" });
    console.log("✅ Logged in to Vercel");
    return true;
  } catch (error) {
    console.error("❌ Not logged in to Vercel. Please log in first:");
    console.error("vercel login");
    process.exit(1);
  }
}

// Function to set up environment variables
function setupEnvironmentVariables() {
  console.log("🔧 Setting up environment variables...");

  // Check if .env.production file exists
  if (!fs.existsSync(".env.production")) {
    console.error("❌ .env.production file not found");
    process.exit(1);
  }

  // Read environment variables from .env.production
  const envContent = fs.readFileSync(".env.production", "utf8");
  const envLines = envContent.split("\n");

  // Process each environment variable
  for (const line of envLines) {
    if (line.trim() === "" || line.startsWith("#")) {
      continue; // Skip empty lines and comments
    }

    const [key, value] = line.split("=");
    if (key && value) {
      try {
        // Add environment variable to Vercel
        execSync(`vercel env add ${key}`, {
          input: `${value}\n`,
          stdio: "pipe",
        });
        console.log(`✅ Added ${key} to Vercel environment`);
      } catch (error) {
        console.log(`ℹ️  ${key} might already exist, skipping...`);
      }
    }
  }

  console.log("✅ Environment variables setup completed");
}

// Function to build the application
function buildApplication() {
  console.log("🔨 Building the application...");

  try {
    execCommand("npm run build");
    console.log("✅ Application built successfully");
  } catch (error) {
    console.error("❌ Failed to build the application");
    process.exit(1);
  }
}

// Function to deploy to Vercel
function deployToVercel() {
  console.log("🚀 Deploying to Vercel...");

  try {
    execCommand("vercel --prod");
    console.log("✅ Deployment completed successfully");
  } catch (error) {
    console.error("❌ Deployment failed");
    process.exit(1);
  }
}

// Main deployment function
async function deploy() {
  console.log("🚀 Starting NormalDance deployment to Vercel...\n");

  // Check prerequisites
  checkVercelCLI();
  checkVercelLogin();

  // Setup environment variables
  setupEnvironmentVariables();

  // Build the application
  buildApplication();

  // Deploy to Vercel
  deployToVercel();

  console.log("\n🎉 Deployment completed successfully!");
  console.log(
    "You can now access your application at the Vercel URL provided above."
  );
}

// Run the deployment
deploy();
