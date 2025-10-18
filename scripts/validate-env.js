#!/usr/bin/env node

/**
 * Environment validation script for NORMALDANCE
 * Supports different validation levels based on command line arguments
 */

import fs from 'fs';
import path from 'path';

// Required environment variables for different environments
const REQUIRED_VARS = {
  basic: [
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ],
  staging: [
    'DATABASE_URL',
    'SOLANA_RPC_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ],
  production: [
    'DATABASE_URL',
    'SOLANA_RPC_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'SENTRY_DSN',
    'STRIPE_SECRET_KEY',
    'PINATA_JWT'
  ]
};

// Optional but recommended variables
const OPTIONAL_VARS = {
  basic: [
    'VERCEL_URL',
    'PORT'
  ],
  staging: [
    'VERCEL_URL',
    'PORT',
    'REDIS_URL',
    'QDRANT_URL'
  ],
  production: [
    'VERCEL_URL',
    'PORT',
    'REDIS_URL',
    'QDRANT_URL',
    'MIXPANEL_TOKEN',
    'DATADOG_API_KEY'
  ]
};

function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};

  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      flags[key] = value !== undefined ? value : true;
    }
  });

  return flags;
}

function getValidationLevel(flags) {
  if (flags.production) return 'production';
  if (flags.staging) return 'staging';
  if (flags.basic) return 'basic';
  return 'basic'; // default
}

function loadEnvFile(envPath) {
  try {
    if (!fs.existsSync(envPath)) {
      console.warn(`Warning: ${envPath} not found`);
      return {};
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...values] = trimmedLine.split('=');
        if (key && values.length > 0) {
          env[key] = values.join('=');
        }
      }
    });

    return env;
  } catch (error) {
    console.error(`Error loading ${envPath}:`, error.message);
    return {};
  }
}

function validateEnvironment(env, level) {
  const required = REQUIRED_VARS[level] || [];
  const optional = OPTIONAL_VARS[level] || [];
  const allVars = [...required, ...optional];

  console.log(`🔍 Validating ${level} environment...`);
  console.log(`📋 Required variables: ${required.length}`);
  console.log(`📋 Optional variables: ${optional.length}`);

  const missing = [];
  const present = [];

  required.forEach(varName => {
    if (env[varName] && env[varName].trim()) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });

  // Check optional variables
  const missingOptional = optional.filter(varName =>
    !env[varName] || !env[varName].trim()
  );

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables:`);
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    return false;
  }

  console.log(`✅ All required variables are present`);

  if (missingOptional.length > 0) {
    console.warn(`⚠️ Missing optional environment variables:`);
    missingOptional.forEach(varName => {
      console.warn(`   - ${varName}`);
    });
  } else {
    console.log(`✅ All optional variables are present`);
  }

  return true;
}

function main() {
  const flags = parseArgs();
  const level = getValidationLevel(flags);

  console.log(`🚀 Starting environment validation for level: ${level}`);

  // Load environment files in order of precedence
  const envFiles = [
    '.env.local',
    '.env',
    '.env.production',
    '.env.example'
  ];

  let combinedEnv = {};

  envFiles.forEach(envFile => {
    const envPath = path.join(process.cwd(), envFile);
    const env = loadEnvFile(envPath);
    combinedEnv = { ...env, ...combinedEnv }; // Later files override earlier ones
  });

  // Also check process.env for runtime variables
  combinedEnv = { ...process.env, ...combinedEnv };

  const isValid = validateEnvironment(combinedEnv, level);

  if (isValid) {
    console.log(`✅ Environment validation passed for ${level}`);
    process.exit(0);
  } else {
    console.error(`❌ Environment validation failed for ${level}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
