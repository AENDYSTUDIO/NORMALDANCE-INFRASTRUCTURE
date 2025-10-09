# Deployment Guide: The Golden Path

This document outlines the "golden path" for deploying the `NORMALDANCE-Enterprise` application. To simplify the process and ensure consistency, all deployments should be performed using the unified deployment script.

## Target Platform: Vercel

The primary deployment target is **Vercel**. The script is specifically configured for deploying to this platform.

## The Unified Deployment Script

The `scripts/unified-deploy.sh` script is the single source of truth for deployments. It automates all necessary steps, including:

1.  **Prerequisite Checks**: Verifies that the Vercel CLI is installed and all required environment variables are set.
2.  **Dependency Installation**: Installs the exact dependencies listed in `package-lock.json` using `npm ci`.
3.  **Application Build**: Compiles the application for production using `npm run build`.
4.  **Vercel Deployment**: Deploys the built application to Vercel in a production environment.

### Prerequisites

Before running the script, ensure you have the following:

1.  **Vercel CLI**: The Vercel command-line interface must be installed globally.
    ```bash
    npm install -g vercel
    ```

2.  **Environment Variables**: The following environment variables must be set in your shell or CI/CD environment. These are required to authenticate with and target the correct Vercel project.
    *   `VERCEL_TOKEN`: Your Vercel account token.
    *   `VERCEL_ORG_ID`: The ID of your organization on Vercel.
    *   `VERCEL_PROJECT_ID`: The ID of the project on Vercel.

### How to Deploy

Once the prerequisites are met, deploying is as simple as running the script from the root of the repository:

```bash
./scripts/unified-deploy.sh
```

The script will provide real-time feedback on its progress. If any step fails, the script will exit immediately and report the error.

Upon successful execution, the script will confirm that the deployment has been initiated. You can monitor the final status in your Vercel dashboard.

---

*This guide serves as the primary documentation for deployments. Please avoid manual deployment steps to prevent configuration drift and ensure reliability.*
