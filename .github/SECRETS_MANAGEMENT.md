# Secrets Management Guide

## Required Secrets for CI/CD Pipeline

### GitHub Repository Secrets (Settings > Secrets and variables > Actions)

#### Docker Registry (Optional)

- `REGISTRY`: External Docker registry URL (e.g., `docker.io`, `registry.example.com`)
- `REGISTRY_USERNAME`: Username for external registry
- `REGISTRY_PASSWORD`: Password/token for external registry

#### Deployment Secrets

- `STAGING_HEALTHCHECK_URL`: Health check endpoint for staging environment
- `PROD_HEALTHCHECK_URL`: Health check endpoint for production environment

#### Notifications

- `SLACK_WEBHOOK_URL`: Slack webhook URL for deployment notifications

#### Database (for tests)

- `DATABASE_URL`: Test database connection string (file-based for local tests)

### Environment Variables (Settings > Environments)

#### Staging Environment

- Name: `staging`
- URL: Your staging application URL

#### Production Environment

- Name: `production`
- URL: Your production application URL

### Repository Variables (Settings > Secrets and variables > Variables)

#### Deployment Configuration

- `CANARY_PERCENT`: Percentage of traffic for canary deployment (default: 10)

## Security Best Practices

1. **Never commit secrets to code**
2. **Use GitHub's encrypted secrets** for sensitive data
3. **Rotate secrets regularly**
4. **Limit secret access** to necessary workflows/jobs
5. **Use environment-specific secrets** for different deployment stages

## Setup Instructions

1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Add the required secrets listed above
4. Create staging and production environments under Settings > Environments
5. Configure branch protection rules using the provided JSON file

## Testing Secrets

To test if secrets are properly configured, trigger a workflow run and check the logs for:

- Successful Docker login (if external registry configured)
- Successful Slack notifications (if webhook configured)
- Successful health checks (if URLs configured)
