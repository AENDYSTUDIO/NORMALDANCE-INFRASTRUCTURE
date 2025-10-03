# NormalDance Platform v1.0.1

## Security

This project takes security seriously. We have implemented several security measures to protect sensitive information:

### Secret Management

- Use `.env.example` for environment variable templates
- Real secrets are stored securely and never committed to the repository
- Regular security audits using `npm run security:secrets` script

### Security Scripts

### Pre-commit Hooks

### CI/CD Pipeline

The project uses a unified CI pipeline with standardized checks:

- **Code Quality**: ESLint, TypeScript type checking
- **Security Scans**: Internal secrets scanner, Trivy, Snyk, CodeQL
- **Testing**: Unit and integration tests
- **Build Verification**: Application build checks

The unified CI configuration is available in `.github/workflows/ci-unified.yml` and includes:

- Code quality checks (linting, type checking)
- Security scanning (unified approach with multiple tools)
- Unit and integration tests
- Build verification
- Final security verification

For more details, see `docs/ci-unification-guide.md`.

### Pre-commit Hooks

The project uses Husky to enforce pre-commit checks:

- Code linting
- Type checking
- Unit tests
- Secret scanning (unified approach)

The unified secret scanning combines:

- Internal scanner (`scripts/check-hardcoded-secrets.js`)
- TruffleHog (if installed)
- Git-secrets (if installed)

### Security Scripts

The project includes several security-related scripts:

- `npm run security:audit` - Check for high-level vulnerabilities
- `npm run security:check` - Check for moderate-level vulnerabilities
- `npm run security:secrets` - Scan for potential secret leaks

### Security Checks

We have implemented a comprehensive secrets scanning script that checks for:

- API keys
- JWT tokens
- Private keys
- Other sensitive data

The script excludes common false positives and focuses on real potential leaks.

### Environment Configuration

- Use `.env.example` as a template for required environment variables
- Never commit real secrets to the repository
- Follow the security guidelines in `docs/environment-security-guide.md`

### Audit Trail

Security findings are documented in `docs/security-findings-report.md` and addressed promptly.
