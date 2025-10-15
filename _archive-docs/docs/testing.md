# 🧪 Testing Documentation

This document provides detailed information about the testing setup and procedures for the NormalDance project.

## 📁 Test Structure

```
tests/
├── unit/          # Unit tests for components, hooks, utilities
├── integration/   # Integration tests for APIs, database
├── e2e/           # End-to-end tests with Playwright
└── performance/   # Performance tests with k6
```

## 🧪 Unit Tests

Unit tests are written using Jest and React Testing Library. They test individual components, hooks, and utility functions in isolation.

### Running Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests in watch mode
npm run test:unit -- --watch

# Run unit tests with coverage
npm run test:unit -- --coverage
```

### Writing Unit Tests

Unit tests should:
1. Test one thing at a time
2. Be fast and isolated
3. Not depend on external services
4. Use mocks for dependencies

Example:
```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

## 🔗 Integration Tests

Integration tests verify that different parts of the application work together correctly, particularly database interactions and API endpoints.

### Running Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run integration tests in watch mode
npm run test:integration -- --watch
```

### Writing Integration Tests

Integration tests should:
1. Test interactions between components/modules
2. Use real database connections (in test environment)
3. Clean up data after each test
4. Test error conditions

Example:
```typescript
import { PrismaClient } from '@prisma/client';

describe('Database Integration', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toEqual([{ test: 1 }]);
  });
});
```

## 🖥️ End-to-End (E2E) Tests

E2E tests simulate real user interactions with the application using Playwright.

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests in headed mode
npm run test:e2e -- --headed

# Run E2E tests for specific browser
npm run test:e2e -- --project=chromium
```

### Writing E2E Tests

E2E tests should:
1. Test complete user flows
2. Verify UI elements and interactions
3. Test cross-browser compatibility
4. Include error handling scenarios

Example:
```typescript
import { test, expect } from '@playwright/test';

test('should display homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/NORMAL DANCE/);
  await expect(page.getByText('Добро пожаловать в NORMAL DANCE')).toBeVisible();
});
```

## 📱 Mobile App Tests

Mobile app tests verify the functionality of the React Native mobile application.

### Running Mobile Tests

```bash
# Run mobile app tests
npm run test:mobile
```

## 📊 Performance Tests

Performance tests measure the application's performance under load using k6.

### Running Performance Tests

```bash
# Run performance tests
npm run test:performance
```

## 🛡️ Security Tests

Security tests check for vulnerabilities in dependencies and code.

### Running Security Tests

```bash
# Run security audit
npm audit

# Run Snyk security scan
npm run security:snyk
```

## 🎯 Test Coverage

The project aims for the following test coverage:
- Unit tests: 80%+ coverage
- Integration tests: 70%+ coverage
- E2E tests: 60%+ coverage of critical user flows

## 🔄 CI/CD Integration

All tests are automatically run in the CI/CD pipeline:
1. On every push to `main` or `develop` branches
2. On every pull request to `main` branch
3. Before every deployment to staging or production

The pipeline includes:
- Quality checks (linting, type checking)
- Unit tests
- Integration tests
- E2E tests
- Security scans
- Performance tests

## 📈 Test Reporting

Test results are:
1. Displayed in the CI/CD pipeline
2. Uploaded to Codecov for coverage reporting
3. Stored as artifacts for debugging
4. Posted to Slack for team notifications

## 🔧 Troubleshooting

### Common Issues

1. **Tests failing due to database connection**
   - Ensure test database is running
   - Check DATABASE_URL in .env.test

2. **E2E tests failing**
   - Ensure development server is running
   - Check baseURL in playwright.config.ts

3. **Mobile tests failing**
   - Ensure mobile dependencies are installed
   - Check mobile-app directory structure

### Debugging Tips

1. Run tests with `--verbose` flag for detailed output
2. Use `--debug` flag for Playwright tests to see browser interactions
3. Check test logs in the `test-results/` directory