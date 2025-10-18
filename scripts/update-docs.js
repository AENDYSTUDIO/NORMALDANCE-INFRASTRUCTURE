
#!/usr/bin/env node

import { execSync  } from 'child_process';;
import fs from 'fs';;
import path from 'path';;

// Configuration
const config = {
  docsDir: './docs',
  apiDir: './docs/api',
  userGuideDir: './docs/user-guide',
  developerGuideDir: './docs/developer-guide',
  changelogDir: './docs/changelog',
  swaggerDir: './docs/swagger',
  outputFormats: ['md', 'html'],
  gitUser: 'normaldance-bot',
  gitEmail: 'bot@normaldance.app'
};

// Ensure directories exist
const ensureDirectories = () => {
  const dirs = [
    config.docsDir,
    config.apiDir,
    config.userGuideDir,
    config.developerGuideDir,
    config.changelogDir,
    config.swaggerDir
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Generate API documentation
const generateApiDocumentation = () => {
  console.log('Generating API documentation...');
  
  try {
    // Generate OpenAPI/Swagger documentation
    execSync('npm run generate:swagger', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Generate JSDoc comments
    execSync('npm run generate:jsdoc', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Convert Swagger to Markdown
    const swaggerContent = fs.readFileSync('./swagger.json', 'utf8');
    const swaggerData = JSON.parse(swaggerContent);
    
    const apiMd = generateApiMarkdown(swaggerData);
    fs.writeFileSync(path.join(config.apiDir, 'api.md'), apiMd);
    
    console.log('API documentation generated successfully');
    return true;
  } catch (error) {
    console.error('Failed to generate API documentation:', error.message);
    return false;
  }
};

// Generate API Markdown from Swagger
const generateApiMarkdown = (swaggerData) => {
  let markdown = '# API Documentation\n\n';
  
  // Introduction
  markdown += '## Introduction\n\n';
  markdown += 'This document describes the RESTful API for NormalDance platform.\n\n';
  
  // Base URL
  markdown += '## Base URL\n\n';
  markdown += `Base URL: ${swaggerData.host || 'api.normaldance.com'}\n\n`;
  
  // Authentication
  markdown += '## Authentication\n\n';
  markdown += 'All API requests require authentication using JWT tokens.\n\n';
  markdown += '```bash\n';
  markdown += 'curl -H "Authorization: Bearer YOUR_TOKEN" \\\n';
  markdown += '     -H "Content-Type: application/json" \\\n';
  markdown += '     https://api.normaldance.com/endpoint\n';
  markdown += '```\n\n';
  
  // Endpoints
  if (swaggerData.paths) {
    Object.entries(swaggerData.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, details]) => {
        const methodUpper = method.toUpperCase();
        const section = `## ${methodUpper} ${path}\n\n`;
        
        let description = details.description || '';
        if (details.summary) {
          description += `\n\n**Summary:** ${details.summary}\n`;
        }
        
        markdown += section;
        markdown += description;
        
        // Parameters
        if (details.parameters) {
          markdown += '### Parameters\n\n';
          markdown += '| Name | Type | Required | Description |\n';
          markdown += '|------|------|----------|-------------|\n';
          
          details.parameters.forEach(param => {
            const required = param.required ? 'Yes' : 'No';
            markdown += `| ${param.name} | ${param.type || param.schema?.type} | ${required} | ${param.description || ''} |\n`;
          });
          
          markdown += '\n';
        }
        
        // Request body
        if (details.requestBody) {
          markdown += '### Request Body\n\n';
          markdown += '```json\n';
          markdown += JSON.stringify(details.requestBody.content?.['application/json']?.schema || {}, null, 2);
          markdown += '\n```\n\n';
        }
        
        // Responses
        if (details.responses) {
          markdown += '### Responses\n\n';
          
          Object.entries(details.responses).forEach(([statusCode, response]) => {
            markdown += `#### ${statusCode}\n\n`;
            markdown += `${response.description}\n\n`;
            
            if (response.content?.['application/json']) {
              markdown += '```json\n';
              markdown += JSON.stringify(response.content['application/json'].schema || {}, null, 2);
              markdown += '\n```\n\n';
            }
          });
        }
        
        markdown += '---\n\n';
      });
    });
  }
  
  return markdown;
};

// Generate user guide
const generateUserGuide = () => {
  console.log('Generating user guide...');
  
  try {
    const userGuideMd = `# NormalDance User Guide

## Getting Started

Welcome to NormalDance! This guide will help you get started with our decentralized music platform.

### Account Creation

1. Visit [normaldance.com](https://normaldance.com)
2. Click "Sign Up"
3. Choose between email or Web3 wallet registration
4. Complete the verification process
5. Set up your profile

### Navigation

- **Home**: Discover new music and trending tracks
- **Library**: Your personal music collection
- **Profile**: Manage your profile and settings
- **Wallet**: Manage your NDT tokens and NFTs
- **Upload**: Upload your own music

## Music Discovery

### Search

Use the search bar to find:
- Tracks by title or artist
- Albums and playlists
- Users and artists

### Browse Categories

Explore music by:
- Genre
- Mood
- Era
- Activity (workout, study, etc.)

### Recommendations

Our AI-powered recommendation system suggests music based on:
- Your listening history
- Your liked tracks
- Similar users' preferences
- Current trends

## Music Playback

### Web Player

1. Click on any track to start playing
2. Use the player controls:
   - Play/Pause
   - Skip forward/backward
   - Volume control
   - Repeat and shuffle options
3. Create playlists by clicking the "+" button

### Mobile App

Download our mobile app for:
- Offline listening
- Background playback
- Push notifications
- Enhanced audio quality

## Creating Music

### Uploading Tracks

1. Go to the Upload section
2. Click "Upload New Track"
3. Fill in the track details:
   - Title
   - Artist name
   - Genre
   - Album art
   - Audio file
4. Set pricing (optional)
5. Publish your track

### Artist Profile

Enhance your artist profile with:
- Biography
- Social media links
- Website
- Contact information
- Release schedule

## NFTs and Blockchain

### Minting Music NFTs

1. Upload your track
2. Click "Mint as NFT"
3. Set the NFT properties:
   - Edition size
   - Price
   - Royalties
4. Confirm the transaction

### Buying NFTs

1. Browse the NFT marketplace
2. Filter by price, genre, or artist
3. Click "Buy Now" or place a bid
4. Complete the purchase with your wallet

### Staking NDT Tokens

1. Go to the Staking section
2. Choose your staking period
3. Select the amount to stake
4. Earn rewards based on the staking APY

## Social Features

### Following

- Follow your favorite artists
- Follow other users with similar taste
- Get notified about new releases

### Playlists

Create and share playlists:
- Make public or private playlists
- Collaborate with other users
- Share playlists on social media

### Comments

Engage with the community:
- Comment on tracks
- Reply to other users
- Like and share comments

## Wallet Management

### NDT Tokens

- Earn NDT by listening and creating content
- Use NDT to purchase music and NFTs
- Stake NDT to earn rewards
- Transfer NDT to other users

### Wallet Integration

Connect your Web3 wallet:
- Phantom wallet
- MetaMask
- Trust Wallet
- Other Solana-compatible wallets

### Transaction History

View all your:
- Music purchases
- NFT transactions
- Staking rewards
- Token transfers

## Privacy and Security

### Privacy Settings

Control your:
- Profile visibility
- Activity visibility
- Data sharing preferences
- Notification settings

### Security Best Practices

- Use a strong password
- Enable two-factor authentication
- Keep your wallet software updated
- Be cautious of phishing attempts

## Troubleshooting

### Common Issues

**Audio not playing**
- Check your internet connection
- Try refreshing the page
- Clear your browser cache
- Update your browser

**Upload failed**
- Check file format (MP3, WAV, FLAC)
- Ensure file size is under 100MB
- Verify your internet connection
- Try again later

**Wallet connection issues**
- Ensure your wallet is unlocked
- Check the correct network is selected
- Try reconnecting your wallet
- Contact support if issues persist

### Getting Help

- Visit our [FAQ page](faq.md)
- Check our [community forum](https://forum.normaldance.com)
- Contact support at support@normaldance.com
- Join our Discord server

## Mobile App Features

### Download

Available on:
- iOS App Store
- Google Play Store
- Web (PWA)

### Features

- Offline listening
- Background playback
- Push notifications
- Enhanced audio quality
- Dark mode
- Biometric authentication

### Sync

Your library and playlists sync across:
- Web player
- Mobile app
- Desktop app (coming soon)

## Advanced Features

### Audio Quality

Choose from multiple quality settings:
- Low (128 kbps)
- Medium (320 kbps)
- High (FLAC)
- Lossless

### Crossfade

Enable crossfade between tracks:
- Set crossfade duration (0-10 seconds)
- Create seamless listening experiences

### Equalizer

Customize your listening experience:
- Preset equalizer settings
- Custom EQ adjustments
- Bass boost and treble controls

## Community Guidelines

### Code of Conduct

- Be respectful to all users
- No hate speech or harassment
- No spam or self-promotion
- Respect copyright and intellectual property

### Reporting Issues

Report:
- Copyright violations
- Inappropriate content
- Technical issues
- Suspicious activity

## What's New

### Recent Updates

- [v2.0.0] New NFT marketplace
- [v1.9.0] Enhanced mobile app
- [v1.8.0] Social features
- [v1.7.0] Audio quality improvements

### Coming Soon

- Desktop app
- Collaborative playlists
- Live streaming
- Artist analytics
- Advanced recommendation engine

---

For more information, visit our [website](https://normaldance.com) or follow us on [Twitter](https://twitter.com/normaldance).
`;
    
    fs.writeFileSync(path.join(config.userGuideDir, 'user-guide.md'), userGuideMd);
    
    console.log('User guide generated successfully');
    return true;
  } catch (error) {
    console.error('Failed to generate user guide:', error.message);
    return false;
  }
};

// Generate developer guide
const generateDeveloperGuide = () => {
  console.log('Generating developer guide...');
  
  try {
    const developerGuideMd = `# NormalDance Developer Guide

## Overview

NormalDance provides a comprehensive API for developers to build applications on top of our decentralized music platform.

## API Documentation

### Authentication

All API requests require authentication using JWT tokens.

\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" \\
     -H "Content-Type: application/json" \\
     https://api.normaldance.com/endpoint
\`\`\`

### Base URL

\`\`\`
https://api.normaldance.com
\`\`\`

### Rate Limiting

- 100 requests per minute
- 1000 requests per hour
- 10000 requests per day

## SDKs

### JavaScript/TypeScript

\`\`\`bash
npm install @normaldance/sdk
\`\`\`

\`\`\`javascript
import { NormalDanceSDK } from '@normaldance/sdk';

const sdk = new NormalDanceSDK({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.normaldance.com'
});

// Get tracks
const tracks = await sdk.tracks.getMany({ genre: 'electronic' });

// Upload track
const result = await sdk.tracks.upload({
  title: 'My Track',
  artist: 'My Name',
  file: audioFile
});
\`\`\`

### Python

\`\`\`bash
pip install normaldance-sdk
\`\`\`

\`\`\`python
from normaldance_sdk import NormalDanceSDK

sdk = NormalDanceSDK(
    api_key='your-api-key',
    base_url='https://api.normaldance.com'
)

# Get tracks
tracks = sdk.tracks.get_many(genre='electronic')

# Upload track
result = sdk.tracks.upload(
    title='My Track',
    artist='My Name',
    file=audio_file
)
\`\`\`

## Webhooks

### Available Events

- \`track_uploaded\`: New track uploaded
- \`track_purchased\`: Track purchased
- \`nft_minted\`: NFT minted
- \`user_registered\`: New user registered
- \`payment_completed\`: Payment completed

### Setting Up Webhooks

\`\`\`bash
curl -X POST https://api.normaldance.com/webhooks \\
     -H "Authorization: Bearer YOUR_TOKEN" \\
     -H "Content-Type: application/json" \\
     -d '{
       "url": "https://your-app.com/webhooks",
       "events": ["track_uploaded", "track_purchased"],
       "secret": "your-webhook-secret"
     }'
\`\`\`

### Verifying Webhooks

NormalDance signs all webhook requests with a HMAC-SHA256 signature using your webhook secret.

\`\`\`javascript
import crypto from 'crypto';;

function verifyWebhook(request, secret) {
  const signature = request.headers['x-normaldance-signature'];
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(request.body).digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
\`\`\`

## Web3 Integration

### Connecting Wallet

\`\`\`javascript
import { useWallet } from '@solana/wallet-adapter-react';

function WalletComponent() {
  const wallet = useWallet();
  
  const connectWallet = async () => {
    await wallet.connect();
  };
  
  return (
    <button onClick={connectWallet}>
      Connect Wallet
    </button>
  );
}
\`\`\`

### Sending Transactions

\`\`\`javascript
import { Connection, Transaction, SystemProgram } from '@solana/web3.js';

async function sendTransaction(transaction) {
  const connection = new Connection('https://api.devnet.solana.com');
  const signature = await connection.sendTransaction(transaction);
  
  return signature;
}
\`\`\`

## Mobile App Development

### React Native

\`\`\`bash
npx react-native init NormalDanceApp
\`\`\`

### Expo

\`\`\`bash
npx create-expo-app NormalDanceApp
\`\`\`

### Audio Playback

\`\`\`javascript
import TrackPlayer from 'react-native-track-player';

async function setupPlayer() {
  await TrackPlayer.setupPlayer();
  
  await TrackPlayer.add({
    id: 'track1',
    url: 'https://example.com/track.mp3',
    title: 'Track Title',
    artist: 'Artist Name',
    artwork: 'https://example.com/artwork.jpg'
  });
  
  await TrackPlayer.play();
}
\`\`\`

## Testing

### Unit Tests

\`\`\`bash
npm test
\`\`\`

### Integration Tests

\`\`\`bash
npm run test:integration
\`\`\`

### E2E Tests

\`\`\`bash
npm run test:e2e
\`\`\`

## Deployment

### Environment Variables

\`\`\`bash
NODE_ENV=production
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
JWT_SECRET=your-jwt-secret
WEB3_RPC_URL=your-web3-rpc-url
\`\`\`

### Docker

\`\`\`bash
docker build -t normaldance/app .
docker run -p 3000:3000 normaldance/app
\`\`\`

### Kubernetes

\`\`\`bash
kubectl apply -f k8s/
\`\`\`

## Monitoring

### Application Metrics

- Request rate and latency
- Error rates
- Resource usage
- User activity

### Logging

\`\`\`javascript
import { logger } from '@normaldance/logger';

logger.info('User logged in', { userId: '123' });
logger.error('Database error', { error: err });
\`\`\`

### Error Tracking

\`\`\`javascript
import { captureException } from '@sentry/node';

try {
  // Your code
} catch (error) {
  captureException(error);
}
\`\`\`

## Contributing

### Development Setup

1. Fork the repository
2. Clone your fork
3. Install dependencies: \`npm install\`
4. Set up environment variables
5. Run tests: \`npm test\`
6. Make your changes
7. Submit a pull request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed

### Git Workflow

1. Create a feature branch from \`develop\`
2. Make your changes
3. Run tests and linting
4. Submit a pull request to \`develop\`
5. Address review comments
6. Merge after approval

## Support

- Documentation: [docs.normaldance.com](https://docs.normaldance.com)
- API Reference: [api-docs.normaldance.com](https://api-docs.normaldance.com)
- Community Forum: [forum.normaldance.com](https://forum.normaldance.com)
- Discord: [discord.normaldance.com](https://discord.normaldance.com)
- Email: developers@normaldance.com

## Changelog

### v2.0.0 (2024-01-15)
- Added NFT marketplace API
- Enhanced Web3 integration
- Improved mobile SDK
- Added webhook support

### v1.9.0 (2023-12-01)
- New authentication system
- Rate limiting improvements
- Enhanced error handling
- Better documentation

### v1.8.0 (2023-11-01)
- Social features API
- Playlist management
- User profiles API
- Analytics endpoints

---

For the latest updates and changes, please refer to our [changelog](changelog.md).
`;
    
    fs.writeFileSync(path.join(config.developerGuideDir, 'developer-guide.md'), developerGuideMd);
    
    console.log('Developer guide generated successfully');
    return true;
  } catch (error) {
    console.error('Failed to generate developer guide:', error.message);
    return false;
  }
};

// Generate FAQ
const generateFAQ = () => {
  console.log('Generating FAQ...');
  
  try {
    const faqMd = `# NormalDance FAQ

## General Questions

### What is NormalDance?

NormalDance is a decentralized music platform that allows artists to share their music directly with fans while maintaining full control over their content and earnings. Built on blockchain technology, it ensures transparency, fairness, and direct artist-to-fan connections.

### How does NormalDance work?

NormalDance combines traditional music streaming with Web3 technology:
- Artists upload their music
- Fans can stream, purchase, and collect music as NFTs
- Artists earn directly from their work through smart contracts
- Fans can support artists by purchasing NFTs and staking tokens

### Is NormalDance free to use?

Yes, NormalDance is free to use for both listeners and artists. However, there may be fees for certain premium features and NFT transactions.

## Account and Registration

### How do I create an account?

You can create an account using:
- Email and password
- Web3 wallet (Phantom, MetaMask, etc.)
- Social media accounts (Google, Apple, etc.)

### Can I have multiple accounts?

No, each user is limited to one account. Multiple accounts may result in suspension.

### How do I verify my account?

Account verification is automatic for email registrations. For Web3 wallets, verification is done through