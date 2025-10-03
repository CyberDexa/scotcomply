# E2E Testing with Playwright

This directory contains end-to-end tests for ScotComply using Playwright.

## Setup

1. Install dependencies (already done if you ran `npm install`):
```bash
npm install -D @playwright/test @axe-core/playwright
```

2. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in UI mode (recommended for development)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run tests in debug mode
```bash
npm run test:debug
```

### View test report
```bash
npm run test:report
```

## Test Structure

```
e2e/
├── helpers/
│   └── page-objects.ts      # Reusable page object models
├── auth.spec.ts             # Authentication flow tests
├── properties.spec.ts       # Property management tests
├── certificates.spec.ts     # Certificate management tests
├── accessibility.spec.ts    # WCAG 2.1 AA compliance tests
└── visual-regression.spec.ts # Screenshot comparison tests
```

## Page Objects

We use the Page Object Model (POM) pattern to keep tests maintainable:

- `AuthPage` - Sign in/sign up flows
- `DashboardPage` - Dashboard navigation
- `PropertiesPage` - Property CRUD operations
- `CertificatesPage` - Certificate management
- `TenantsPage` - Tenant management

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)
- Sign in/sign up flows
- Validation errors
- Session management
- Protected route redirects

### 2. Property Tests (`properties.spec.ts`)
- Create, read, update, delete properties
- Search and filter
- Property details
- Keyboard navigation

### 3. Certificate Tests (`certificates.spec.ts`)
- Add certificates
- Filter by type and status
- Upload documents
- Expiry notifications
- Renewal process

### 4. Accessibility Tests (`accessibility.spec.ts`)
- WCAG 2.1 AA compliance
- Color contrast
- Keyboard navigation
- Screen reader support
- Mobile accessibility

### 5. Visual Regression Tests (`visual-regression.spec.ts`)
- Screenshot comparison
- Responsive design
- Dark mode (if supported)
- Component snapshots

## Skipped Tests

Some tests are marked with `test.skip()` because they require:
- Authenticated test user
- Specific database state
- External services

To run these tests:
1. Create a test user in your development database
2. Update credentials in `page-objects.ts`
3. Remove the `.skip` modifier

## Best Practices

1. **Use Page Objects** - Don't repeat selectors
2. **Wait for Elements** - Use `waitForSelector` instead of `setTimeout`
3. **Descriptive Names** - Test names should explain what they test
4. **Independent Tests** - Each test should work standalone
5. **Clean Up** - Reset state between tests if needed

## Debugging Tips

1. **View browser during test**:
```bash
npm run test:headed
```

2. **Pause at breakpoint**:
```typescript
await page.pause()
```

3. **Take screenshot**:
```typescript
await page.screenshot({ path: 'debug.png' })
```

4. **Console logs**:
```typescript
page.on('console', msg => console.log(msg.text()))
```

5. **Network requests**:
```typescript
page.on('request', request => console.log('>>', request.url()))
page.on('response', response => console.log('<<', response.url()))
```

## CI/CD Integration

Add to your `.github/workflows/test.yml`:

```yaml
name: Playwright Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright Browsers
        run: npx playwright install --with-deps
      - name: Run Playwright tests
        run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Accessibility Testing

We use `@axe-core/playwright` for automated accessibility testing:

```typescript
import AxeBuilder from '@axe-core/playwright'

const accessibilityScanResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa'])
  .analyze()

expect(accessibilityScanResults.violations).toEqual([])
```

## Visual Regression

First run generates baseline screenshots:
```bash
npm test -- --update-snapshots
```

Subsequent runs compare against baselines:
```bash
npm test
```

## Test Data

For consistent test data:
1. Use the database seeder: `npm run db:seed`
2. Create a `test-data.ts` file with factory functions
3. Reset database between test runs in CI

## Performance

Tests run in parallel by default. Configure in `playwright.config.ts`:

```typescript
workers: process.env.CI ? 1 : undefined
```

## Troubleshooting

### Tests fail locally but pass in CI
- Check Node version matches
- Ensure database is seeded
- Check environment variables

### Screenshots don't match
- Different OS font rendering
- Update snapshots: `npm test -- --update-snapshots`
- Use Docker for consistent environment

### Timeouts
- Increase timeout in test: `test.setTimeout(60000)`
- Or globally in config: `timeout: 60000`

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
