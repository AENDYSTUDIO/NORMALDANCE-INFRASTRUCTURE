# Vercel Deployment Guide for Telegram Mini App

## Overview

This guide will help you deploy the NormalDance Telegram Mini App to Vercel.

## Prerequisites

1. A GitHub, GitLab, or Bitbucket account
2. A Vercel account (free at [vercel.com](https://vercel.com))
3. The Telegram Mini App code

## Deployment Steps

### Step 1: Prepare Your Repository

1. Create a new repository on GitHub, GitLab, or Bitbucket
2. Upload the contents of the `telegram-mini-app` directory to your repository
3. Make sure the repository includes:
   - `package.json`
   - `next.config.js`
   - `vercel.json`
   - All source code in the `app`, `components`, `lib`, and `types` directories
   - The `public` directory with static assets

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in or create an account
2. Click "New Project"
3. Import your repository:
   - Click "Import Git Repository"
   - Select your Git provider (GitHub, GitLab, or Bitbucket)
   - Choose the repository containing your Telegram Mini App code
4. Configure project settings:
   - Project Name: `normaldance-telegram-mini-app` (or your preferred name)
   - Framework Preset: Next.js
   - Root Directory: Leave as is (should be the root of your repository)
5. Click "Deploy"

### Step 3: Configure Environment Variables (if needed)

If your app requires environment variables:

1. In the Vercel dashboard, go to your project
2. Click "Settings"
3. Click "Environment Variables"
4. Add any required environment variables

### Step 4: Set Up Custom Domain (optional)

To use a custom domain:

1. In your Vercel dashboard, go to your project
2. Click "Settings"
3. Click "Domains"
4. Add your domain
5. Follow the DNS configuration instructions

## Vercel Configuration Details

### vercel.json

The project includes a `vercel.json` file that:

- Configures the build process for Next.js
- Sets security headers for Telegram integration
- Defines environment variables
- Optimizes the deployment

### Build Process

Vercel will automatically:

1. Install dependencies using `npm install`
2. Build the project using `npm run build`
3. Deploy the built files to a global CDN

### Optimization

The deployment is optimized for:

- Fast loading times
- Global distribution
- Automatic HTTPS
- Serverless functions

## Troubleshooting

### Common Issues

#### Build Failures

If your build fails:

1. Check the build logs in the Vercel dashboard
2. Ensure all dependencies are correctly listed in `package.json`
3. Verify there are no TypeScript or syntax errors

#### Deployment Issues

If deployment fails:

1. Check that all required files are included in the repository
2. Verify the `vercel.json` configuration
3. Ensure the `next.config.js` file is correct

#### Runtime Errors

If the app doesn't work after deployment:

1. Check the browser console for errors
2. Verify the Telegram Web App SDK is loading correctly
3. Ensure all API endpoints are working

## Post-Deployment

### Testing

1. Visit your deployed URL to verify the app works
2. Test in Telegram by configuring your bot with the new URL
3. Check that all functionality works as expected

### Monitoring

Vercel provides:

- Automatic performance monitoring
- Error tracking
- Analytics
- Logs for serverless functions

## Updating Your Deployment

To update your deployed app:

1. Push changes to your Git repository
2. Vercel will automatically detect changes and start a new deployment
3. Preview deployments are created for pull requests
4. Production deployments happen when merging to the main branch

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Telegram Web App Documentation](https://core.telegram.org/bots/webapps)
