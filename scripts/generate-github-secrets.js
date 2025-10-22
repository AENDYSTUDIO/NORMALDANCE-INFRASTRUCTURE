#!/usr/bin/env node

/**
 * Generate GitHub Secrets for NORMAL DANCE project
 * Run: node scripts/generate-github-secrets.js
 */

const crypto = require('crypto');

// Generate secure random values
function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateJWT() {
  return crypto.randomBytes(64).toString('base64url');
}

function generateAPIKey() {
  return 'nd_' + crypto.randomBytes(24).toString('hex');
}

// GitHub Secrets configuration
const secrets = {
  // Database
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/normaldance',
  
  // Authentication
  NEXTAUTH_SECRET: generateJWT(),
  NEXTAUTH_URL: 'https://normaldance.vercel.app',
  JWT_SECRET: generateSecret(32),
  
  // Solana
  NEXT_PUBLIC_SOLANA_RPC_URL: 'https://api.mainnet-beta.solana.com',
  SOLANA_RPC_TIMEOUT: '15000',
  NEXT_PUBLIC_NDT_PROGRAM_ID: 'NDT' + crypto.randomBytes(20).toString('hex'),
  NEXT_PUBLIC_NDT_MINT_ADDRESS: crypto.randomBytes(32).toString('hex'),
  NEXT_PUBLIC_TRACKNFT_PROGRAM_ID: 'TRK' + crypto.randomBytes(20).toString('hex'),
  NEXT_PUBLIC_STAKING_PROGRAM_ID: 'STK' + crypto.randomBytes(20).toString('hex'),
  
  // IPFS
  NEXT_PUBLIC_IPFS_GATEWAY: 'https://ipfs.io/ipfs/',
  PINATA_API_KEY: generateAPIKey(),
  PINATA_SECRET_KEY: generateSecret(32),
  PINATA_JWT: generateJWT(),
  IPFS_BACKEND: 'helia',
  
  // External APIs
  SPOTIFY_CLIENT_ID: generateSecret(16),
  SPOTIFY_CLIENT_SECRET: generateSecret(32),
  OPENAI_API_KEY: 'sk-' + generateSecret(24),
  
  // Redis
  UPSTASH_REDIS_REST_URL: 'https://redis.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: generateSecret(32),
  
  // Monitoring
  SENTRY_DSN: 'https://' + generateSecret(16) + '@sentry.io/project',
  NEXT_PUBLIC_SENTRY_DSN: 'https://' + generateSecret(16) + '@sentry.io/project',
  MIXPANEL_TOKEN: generateSecret(16),
  
  // Telegram
  TELEGRAM_BOT_TOKEN: '123456789:' + generateSecret(18),
  TELEGRAM_WEB_APP_URL: 'https://t.me/normaldance_bot/app',
  
  // Security
  AUDIO_MAX_FILE_SIZE: '10485760', // 10MB
  AI_CACHE_TTL: '3600'
};

console.log('🔐 GitHub Secrets for NORMAL DANCE\n');
console.log('Copy these to GitHub Repository Settings > Secrets and variables > Actions:\n');

Object.entries(secrets).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log('\n📋 GitHub CLI commands:');
Object.entries(secrets).forEach(([key, value]) => {
  console.log(`gh secret set ${key} --body "${value}"`);
});

console.log('\n✅ Generated secure secrets for production deployment');