# Telegram Mini App Documentation

## Overview

This document provides comprehensive documentation for the NormalDance Telegram Mini App implementation. It covers the architecture, features, security considerations, and integration details.

## Table of Contents

1. [Architecture](#architecture)
2. [Features](#features)
3. [Security](#security)
4. [Integration](#integration)
5. [Deployment](#deployment)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

## Architecture

### Component Structure

The Telegram Mini App follows a modular architecture with the following key components:

```
telegram-mini-app/
├── src/
│   ├── app/
│   │   └── telegram-app/
│   │       ├── page.tsx          # Main Telegram Mini App page
│   │       └── layout.tsx        # Layout component with Telegram WebApp script
│   ├── components/
│   │   ├── payment/
│   │   │   ├── solana-pay-button.tsx     # Solana Pay payment component
│   │   │   ├── telegram-stars-button.tsx # Telegram Stars payment component
│   │   │   └── ton-connect-button.tsx   # TON Connect payment component
│   │   └── wallet/
│   │       ├── wallet-adapter.tsx        # Wallet adapter component
│   │       └── wallet-connect.tsx        # WalletConnect integration
│   ├── lib/
│   │   ├── telegram-auth.ts              # Telegram authentication utilities
│   │   ├── telegram-metrics.ts           # Telegram metrics and analytics
│   │   └── ton-connect-service.ts        # TON Connect service
│   └── middleware/
│       └── rate-limiter.ts               # Rate limiting middleware
├── public/
│   ├── manifest.json                     # Web App manifest
│   └── tonconnect-manifest.json         # TON Connect manifest
└── src/middleware.ts                     # Application middleware
```

### Key Technologies

- **Frontend Framework**: Next.js 14 with App Router
- **Telegram Integration**: `@twa-dev/sdk` for Telegram WebApp functionality
- **Web3 Integration**:
  - Solana Pay for Solana transactions
  - WalletConnect for wallet connections
  - TON Connect for TON blockchain integration
- **Payment Systems**:
  - Telegram Stars for native Telegram payments
  - Solana Pay for alternative cryptocurrency payments
  - TON Connect for TON cryptocurrency payments
- **Styling**: CSS Modules with global styles for Telegram themes

## Features

### Authentication

The Telegram Mini App implements secure authentication using Telegram's WebApp initData:

1. **Initialization**: The app initializes using `window.Telegram.WebApp`
2. **User Data**: Retrieves user information from `initDataUnsafe.user`
3. **Validation**: Validates authentication data on the server side using HMAC verification
4. **Session Management**: Maintains user session throughout the app lifecycle

### Payment Methods

#### Telegram Stars

Telegram Stars is the primary payment method for the app:

- Integrated using Telegram's native payment system
- Provides seamless user experience within Telegram
- Lower friction compared to external cryptocurrency payments
- No additional fees for users (Telegram takes 5% commission)

#### Solana Pay

Solana Pay provides an alternative payment method:

- Works in regions where Telegram Stars isn't available
- Direct cryptocurrency payments without intermediaries
- Fast transaction processing on the Solana blockchain
- Lower fees compared to traditional payment processors

#### TON Connect

TON Connect enables payments using TON cryptocurrency:

- Native integration with Telegram's blockchain ecosystem
- Extremely low transaction fees
- High throughput and fast confirmation times
- Seamless user experience for TON wallet holders

### Wallet Integration

The app supports multiple wallet integration methods:

1. **WalletConnect**: Universal wallet connection protocol
2. **Phantom Wallet**: Popular Solana wallet
3. **TON Wallets**: Native TON blockchain wallets

### Analytics and Metrics

The app implements a custom analytics system using Telegram's Bot API:

- Tracks user interactions and page views
- Monitors payment conversions and success rates
- Collects performance metrics for optimization
- Respects user privacy and Telegram's policies

## Security

### Authentication Security

- **HMAC Verification**: All authentication data is verified using HMAC with the bot token
- **Time-based Validation**: Authentication data is only valid for 30 minutes
- **Server-side Validation**: All validation occurs on the server to prevent tampering

### Payment Security

- **Secure Transactions**: All payments are processed through official channels
- **Transaction Verification**: Payments are verified on-chain before granting access
- **Rate Limiting**: Prevents abuse of payment endpoints
- **Input Sanitization**: All user inputs are sanitized to prevent injection attacks

### Data Protection

- **Encryption**: Sensitive data is encrypted at rest and in transit
- **Access Control**: Role-based access control limits data access
- **Audit Logging**: All critical operations are logged for security review
- **Privacy Compliance**: Adheres to GDPR and other privacy regulations

## Integration

### Telegram WebApp Integration

The app integrates with Telegram's WebApp API using `@twa-dev/sdk`:

1. **Initialization**:

   ```typescript
   import {
     useInitData,
     useMainButton,
     useBackButton,
   } from "@twa-dev/sdk/react";

   const initData = useInitData();
   const mainButton = useMainButton();
   const backButton = useBackButton();
   ```

2. **Theme Support**:

   - Automatically detects light/dark theme from Telegram
   - Applies appropriate styling based on theme
   - Responds to theme changes in real-time

3. **Navigation**:
   - Uses Telegram's `MainButton` for primary actions
   - Implements `BackButton` for navigation
   - Handles hardware back button on mobile devices

### Web3 Integration

#### Solana Integration

The app integrates with Solana using Solana Pay:

1. **Payment Requests**:

   ```typescript
   const paymentUrl = solanaPayService.createPaymentRequest({
     recipient: platformWallet,
     amount: 0.1,
     label: "Premium Access",
     message: "Demo payment via Solana Pay",
   });
   ```

2. **Transaction Verification**:
   - Verifies transactions on-chain
   - Updates user account upon successful payment
   - Handles transaction errors gracefully

#### TON Integration

The app integrates with TON using TON Connect:

1. **Wallet Connection**:

   ```typescript
   const tonConnect = new TonConnectService();
   await tonConnect.connectWallet();
   ```

2. **Transaction Processing**:
   - Creates TON payment requests
   - Handles wallet interactions
   - Verifies transaction completion

### Payment Integration

#### Telegram Stars Integration

The app integrates with Telegram Stars using the Bot API:

1. **Invoice Creation**:

   ```typescript
   const invoiceLink = await bot.api.createInvoiceLink({
     title: "Premium Access",
     description: "Access to premium features",
     payload: "premium_access",
     provider_token: "",
     currency: "XTR",
     prices: [{ label: "Premium Access", amount: 100 }],
   });
   ```

2. **Payment Handling**:
   - Listens for payment confirmation via webhook
   - Updates user account upon successful payment
   - Handles payment cancellations and errors

## Deployment

### Prerequisites

- Node.js 18+
- npm or yarn
- Telegram Bot Token
- Solana RPC endpoint
- TON RPC endpoint

### Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_APP_URL=https://your-app.com
NEXT_PUBLIC_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_TON_RPC_URL=https://toncenter.com/api/v2/jsonRPC
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Building the App

```bash
npm run build
```

### Deploying the App

The app can be deployed to any platform that supports Next.js, such as:

- Vercel (recommended)
- Netlify
- AWS Amplify
- Google Cloud Run

### Setting up Telegram Bot

1. Create a bot using BotFather
2. Set the WebApp URL in BotFather
3. Enable payments if using Telegram Stars
4. Configure webhook for payment notifications

## Troubleshooting

### Common Issues

#### Telegram WebApp Not Loading

- **Cause**: Incorrect manifest.json configuration
- **Solution**: Verify `short_name` matches BotFather settings and `start_url` is set to "./"

#### Payment Not Working

- **Cause**: Missing or incorrect payment configuration
- **Solution**: Check environment variables and payment provider settings

#### Wallet Connection Issues

- **Cause**: Outdated wallet adapter or network issues
- **Solution**: Update dependencies and check network connectivity

### Debugging Tips

1. **Check Console Logs**: Look for error messages in the browser console
2. **Verify Environment Variables**: Ensure all required variables are set correctly
3. **Test in Telegram**: Use Telegram's WebApp development mode for testing
4. **Monitor Network Requests**: Use browser dev tools to monitor API calls

## FAQ

### How do I test the Telegram Mini App?

You can test the Telegram Mini App using Telegram's development mode:

1. Set up a local development server with HTTPS
2. Use ngrok or similar service to expose your local server
3. Set the WebApp URL in BotFather to your ngrok URL
4. Open the bot in Telegram and launch the Mini App

### Can users pay with cryptocurrencies other than SOL and TON?

Currently, the app supports Solana (SOL) and TON. Additional cryptocurrencies can be added by integrating with their respective payment protocols.

### How are payments secured?

All payments are processed through official channels:

- Telegram Stars through Telegram's payment system
- Solana Pay through the Solana blockchain
- TON Connect through the TON blockchain

Transactions are verified on-chain before granting access to premium features.

### What happens if a payment fails?

If a payment fails:

1. The user receives an error message
2. The transaction is not processed
3. The user can retry the payment or choose an alternative method
4. Error details are logged for debugging

### How do I customize the app for my brand?

You can customize the app by:

1. Updating the color scheme in the CSS files
2. Replacing logos and images in the public directory
3. Modifying the text content in the components
4. Adjusting the payment options and pricing

### Is the app compliant with Telegram's policies?

Yes, the app follows Telegram's Mini App policies:

- No external analytics scripts
- Proper Content Security Policy
- Correct use of Telegram's UI components
- Secure authentication and payment processing

## Conclusion

This documentation provides a comprehensive overview of the NormalDance Telegram Mini App implementation. By following the guidelines and best practices outlined here, you can successfully deploy and maintain a secure, user-friendly Telegram Mini App that leverages the power of Web3 technologies and Telegram's native features.
