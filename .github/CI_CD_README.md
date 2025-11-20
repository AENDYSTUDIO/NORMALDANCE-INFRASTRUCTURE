# CI/CD Pipeline Documentation

## Overview

This repository uses GitHub Actions for automated testing, building, and deployment of the NORMALDANCE Web3 Music Platform. The pipeline ensures code quality, security, and reliable deployments across staging and production environments.

## Pipeline Structure

### 1. Pre-Deployment Test Execution

- **Unit Tests**: Core business logic and utilities
- **Integration Tests**: API endpoints, database interactions, Web3 integrations
- **E2E Tests**: Full user workflows and critical paths
- **Coverage Reports**: Minimum 70% coverage required

### 2. Test Results Validation & Quality Gates

- **Coverage Thresholds**: 70% minimum for unit tests
- **Security Scans**: NPM audit for high-severity vulnerabilities
- **Integration Failures**: Block merge on critical integration test failures

### 3. Security Scanning

- **CodeQL Analysis**: Static Application Security Testing (SAST)
- **Dependency Scanning**: Automated vulnerability detection

### 4. Docker Build Pipeline

- **Multi-Service Builds**: Parallel builds for all services:
  - `backend` (API server)
  - `nextjs` (Frontend application)
  - `ipfs-service` (IPFS/Filecoin integration)
  - `regru` (Domain management)
  - `smart-contracts` (Solana programs)
- **Image Publishing**: Automatic push to GitHub Container Registry (GHCR)
- **Layer Caching**: Optimized build times with GitHub Actions cache

### 5. Automated Version Management

- **Semantic Versioning**: Automatic bump to v0.3.0 on successful main branch merge
- **GitHub Releases**: Automated release creation with changelogs
- **Tag Management**: Version tags for rollback capabilities

### 6. Deployment Strategy

- **Staging Deployment**: Automatic deployment after version bump
- **Canary Deployment**: Gradual rollout with configurable traffic percentage
- **Production Deployment**: Blue-green deployment with health checks
- **Rollback Procedures**: Automated rollback on deployment failures

### 7. Post-Deployment Verification

- **Health Checks**: Automated endpoint verification
- **Smoke Tests**: Critical functionality validation
- **Monitoring Integration**: Alert setup for production issues

## Workflow Triggers

- **Push to main/develop**: Full pipeline execution
- **Pull Requests**: Test execution and validation (blocks merge if failed)
- **Manual Triggers**: Optional manual pipeline runs

## Required Secrets & Configuration

See [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) for detailed setup instructions.

### Essential Secrets:

- `SLACK_WEBHOOK_URL`: Deployment notifications
- `STAGING_HEALTHCHECK_URL`: Staging health endpoint
- `PROD_HEALTHCHECK_URL`: Production health endpoint
- `DATABASE_URL`: Test database connection

### Optional Secrets:

- `REGISTRY`/`REGISTRY_USERNAME`/`REGISTRY_PASSWORD`: External Docker registry

## Branch Protection Rules

Configured via [branch-protection-rules.json](branch-protection-rules.json):

- **Required Status Checks**: All test suites must pass
- **Code Reviews**: Minimum 1 approving review required
- **Conversation Resolution**: All PR comments must be resolved
- **Admin Enforcement**: Rules apply to repository administrators

## Quality Gates

### Test Coverage

- Unit tests: ≥70% coverage
- Integration tests: All critical paths covered
- E2E tests: Key user journeys validated

### Security Requirements

- No high-severity vulnerabilities in dependencies
- CodeQL scans must pass
- Security tests included in test suite

### Performance Benchmarks

- Build times within acceptable limits
- Test execution under 30 minutes
- Docker image sizes optimized

## Deployment Environments

### Staging

- **URL**: Configurable via environment settings
- **Purpose**: Pre-production validation
- **Triggers**: Successful main branch merge

### Production

- **URL**: Configurable via environment settings
- **Purpose**: Live application serving
- **Triggers**: Successful staging deployment + manual approval

## Monitoring & Alerting

### Health Checks

- Application endpoints monitored
- Database connectivity verified
- External service dependencies checked

### Notifications

- Slack alerts for deployment status
- Email notifications for critical failures
- GitHub status checks for PR validation

## Rollback Procedures

### Automatic Rollback

- Triggered on deployment health check failures
- Traffic redirected to previous stable version
- Alert notifications sent to team

### Manual Rollback

- Version-specific rollback via Git tags
- Database migration rollback support
- Documentation maintained for rollback steps

## Troubleshooting

### Common Issues

1. **Test Failures**

   - Check test logs for specific errors
   - Verify database connectivity
   - Ensure all dependencies are installed

2. **Build Failures**

   - Check Docker build logs
   - Verify Dockerfile syntax
   - Confirm build context paths

3. **Deployment Failures**
   - Check health check endpoints
   - Verify environment secrets
   - Review deployment logs

### Debug Commands

```bash
# Run tests locally
npm test

# Run specific test suite
npm test -- --testPathPattern="unit"

# Build Docker images locally
docker build -f docker/backend.Dockerfile -t backend:latest .

# Check test coverage
npm test -- --coverage
```

## Security Considerations

- All secrets encrypted and managed via GitHub Secrets
- No sensitive data in repository code
- Automated security scanning integrated
- Access controls via branch protection rules
- Audit logs maintained for all deployments

## Performance Optimization

- Parallel job execution for faster pipelines
- Docker layer caching for reduced build times
- Test result caching for incremental builds
- Optimized artifact storage and retention

## Future Enhancements

- Multi-region deployment support
- Advanced canary strategies
- Performance regression detection
- Automated load testing integration
- Enhanced monitoring dashboards
