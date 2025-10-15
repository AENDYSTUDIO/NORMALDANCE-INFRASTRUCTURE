# CI/CD Setup Guide for NormalDANCE v1.0.1

## Overview

This guide provides comprehensive instructions for setting up and optimizing the CI/CD pipeline for NormalDANCE v1.0.1 using GitHub Actions, Vercel, and various monitoring tools.

## Prerequisites

Before setting up the CI/CD pipeline, ensure you have the following:

1. **GitHub Repository**: A properly configured GitHub repository for NormalDANCE
2. **Vercel Account**: A Vercel account with project access
3. **Monitoring Tools**: Sentry and Datadog accounts
4. **Domain Names**: `dnb1st.ru` and `dnb1st.store` configured
5. **SSL Certificates**: Valid SSL certificates for your domains
6. **Infrastructure**: Existing Kubernetes cluster or cloud infrastructure

## Setup Steps

### 1. GitHub Actions Configuration

#### 1.1 Repository Secrets

Configure the following secrets in your GitHub repository:

```bash
# GitHub Repository Settings > Secrets and variables > Actions
GITHUB_TOKEN: (automatically provided)
VERCEL_TOKEN: your_vercel_token
VERCEL_ORG_ID: your_vercel_org_id
VERCEL_PROJECT_ID: your_vercel_project_id
SENTRY_DSN: your_sentry_dsn
DATADOG_API_KEY: your_datadog_api_key
DATADOG_APPLICATION_ID: your_datadog_application_id
DATADOG_CLIENT_TOKEN: your_datadog_client_token
DATABASE_URL_PRODUCTION: your_production_database_url
DATABASE_URL_STAGING: your_staging_database_url
SOLANA_RPC_URL_PRODUCTION: your_production_solana_rpc_url
SOLANA_RPC_URL_STAGING: your_staging_solana_rpc_url
NEXTAUTH_SECRET_PRODUCTION: your_production_nextauth_secret
NEXTAUTH_SECRET_STAGING: your_staging_nextauth_secret
SLACK_WEBHOOK: your_slack_webhook_url
```

#### 1.2 GitHub Workflows

The following workflows are already configured:

- **ci-cd-optimized.yml**: Main CI/CD pipeline
- **version-management.yml**: Version management and releases
- **mobile-app.yml**: Mobile app testing and deployment
- **docs.yml**: Documentation generation and deployment

### 2. Vercel Configuration

#### 2.1 Project Setup

1. Create a new project in Vercel
2. Import your GitHub repository
3. Configure the following environment variables:

```bash
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=your_production_database_url
SOLANA_RPC_URL=your_production_solana_rpc_url
NEXTAUTH_URL=https://dnb1st.ru
NEXTAUTH_SECRET=your_production_nextauth_secret
SENTRY_DSN=your_sentry_dsn
DATADOG_API_KEY=your_datadog_api_key
```

#### 2.2 Domain Configuration

1. Add the following domains in Vercel dashboard:
   - `dnb1st.ru`
   - `dnb1st.store`
   - `normaldance.com`
   - `www.normaldance.com`

2. Configure SSL certificates for each domain

#### 2.3 Vercel Configuration

The `vercel.json` file is already configured with:
- Build and deployment settings
- Environment variables
- Caching rules
- Security headers
- Redirect rules
- CDN optimization

### 3. Monitoring Setup

#### 3.1 Sentry Configuration

1. Create a Sentry project for NormalDANCE
2. Get your DSN from Sentry
3. Configure the following in your repository:

```bash
# Add to .env.local
SENTRY_DSN=your_sentry_dsn
```

4. The monitoring system is already configured in `src/lib/monitoring.ts`

#### 3.2 Datadog Configuration

1. Create a Datadog account and application
2. Get your API key and application ID
3. Configure the following in your repository:

```bash
# Add to .env.local
DATADOG_API_KEY=your_datadog_api_key
DATADOG_APPLICATION_ID=your_datadog_application_id
DATADOG_CLIENT_TOKEN=your_datadog_client_token
```

4. The monitoring system is already configured in `src/lib/monitoring.ts`

### 4. CDN Configuration

#### 4.1 Cloudflare Setup

1. Create a Cloudflare account
2. Add your domains `dnb1st.ru` and `dnb1st.store`
3. Configure the CDN settings using `cdn-config.js`
4. Enable SSL/TLS encryption
5. Configure caching rules and security headers

#### 4.2 AWS CloudFront Setup

1. Create an AWS CloudFront distribution
2. Configure origin settings
3. Set up caching behaviors
4. Configure SSL certificates
5. Enable compression and optimization

### 5. Environment Configuration

#### 5.1 Development Environment

```bash
# .env.development
NODE_ENV=development
DATABASE_URL=file:./dev.db
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev_secret
```

#### 5.2 Staging Environment

```bash
# .env.staging
NODE_ENV=staging
DATABASE_URL=your_staging_database_url
NEXTAUTH_URL=https://staging.dnb1st.ru
NEXTAUTH_SECRET=your_staging_nextauth_secret
```

#### 5.3 Production Environment

```bash
# .env.production
NODE_ENV=production
DATABASE_URL=your_production_database_url
NEXTAUTH_URL=https://dnb1st.ru
NEXTAUTH_SECRET=your_production_nextauth_secret
```

### 6. Database Configuration

#### 6.1 Prisma Setup

1. Install Prisma:
```bash
npm install prisma --save-dev
npx prisma init
```

2. Configure the database schema in `prisma/schema.prisma`
3. Run migrations:
```bash
npx prisma migrate dev
npx prisma generate
```

#### 6.2 Database Backup

Configure automated backups using:
- PostgreSQL pg_dump
- AWS RDS snapshots
- Cloud SQL backups

### 7. Security Configuration

#### 7.1 SSL/TLS Setup

1. Configure SSL certificates for all domains
2. Enable HSTS headers
3. Configure HTTPS redirects
4. Set up security headers

#### 7.2 Security Scans

Configure security scanning using:
- GitHub CodeQL
- Trivy vulnerability scanner
- Snyk security analysis
- OWASP dependency check

### 8. Performance Optimization

#### 8.1 Build Optimization

Configure build optimization using:
- SWC for faster builds
- Docker layer caching
- Parallel builds
- Incremental builds

#### 8.2 Performance Monitoring

Configure performance monitoring using:
- Web Vitals tracking
- Lighthouse CI
- Performance budgets
- Real User Monitoring (RUM)

## Deployment Process

### 1. Development Deployment

```bash
# Local development
npm run dev

# Build for development
npm run build

# Deploy to staging
npm run deploy:vercel:staging
```

### 2. Staging Deployment

```bash
# Deploy to staging
npm run deploy:vercel:staging

# Run tests
npm run ci:test

# Monitor performance
npm run monitoring:test
```

### 3. Production Deployment

```bash
# Build for production
npm run build

# Deploy to production
npm run deploy:vercel

# Run security checks
npm run ci:security

# Monitor production
npm run monitoring:test
```

## Monitoring and Alerting

### 1. Application Monitoring

- **Sentry**: Error tracking and performance monitoring
- **Datadog**: Real User Monitoring and analytics
- **Vercel Analytics**: Application performance metrics

### 2. Infrastructure Monitoring

- **Prometheus**: Metrics collection
- **Grafana**: Dashboard visualization
- **Alertmanager**: Alert management

### 3. Alert Configuration

Configure alerts for:
- High error rates
- Slow response times
- Infrastructure failures
- Security incidents

## Maintenance and Updates

### 1. Regular Maintenance

- Update dependencies regularly
- Monitor security advisories
- Review performance metrics
- Update documentation

### 2. Backup and Recovery

- Regular database backups
- Configuration backups
- Disaster recovery procedures
- Rollback procedures

### 3. Performance Tuning

- Monitor application performance
- Optimize database queries
- Review caching strategies
- Update CDN configurations

## Troubleshooting

### 1. Common Issues

- **Build failures**: Check dependencies and Node.js version
- **Deployment failures**: Verify environment variables and secrets
- **Performance issues**: Review monitoring metrics and logs
- **SSL issues**: Check certificate configuration and DNS settings

### 2. Debug Commands

```bash
# Check build status
npm run build

# Run tests
npm run ci:test

# Check deployment status
vercel ls

# Monitor logs
vercel logs
```

## Best Practices

### 1. CI/CD Best Practices

- Automate testing and deployment
- Use environment-specific configurations
- Implement proper version control
- Monitor deployment health
- Maintain security standards

### 2. Performance Best Practices

- Optimize build times
- Use caching strategies
- Monitor performance metrics
- Implement performance budgets
- Regularly review and optimize

### 3. Security Best Practices

- Use environment variables for sensitive data
- Implement proper authentication
- Monitor for security vulnerabilities
- Regular security audits
- Incident response procedures

## Support

For support and questions:

1. **GitHub Issues**: Report bugs and feature requests
2. **Documentation**: Refer to the project documentation
3. **Monitoring**: Check monitoring dashboards for issues
4. **Community**: Join our Discord community

## Conclusion

This CI/CD setup provides a robust, automated pipeline for NormalDANCE v1.0.1 with comprehensive monitoring, security, and performance optimization. Follow the guidelines in this document to ensure smooth deployments and maintain high-quality standards.

---

*Last Updated: September 2024*
*Version: 1.0.1*