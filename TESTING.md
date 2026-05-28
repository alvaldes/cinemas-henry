# Testing Guide for cinemas-henry

Welcome to the TDD testing infrastructure for cinemas-henry! This guide covers running tests, writing new tests, and understanding our testing strategy.

## Quick Start

```bash
# Run all tests (unit + component)
bun test

# Run only unit tests
bun test:unit

# Run only component tests
bun test:components

# Run E2E tests (requires dev server running)
bun run dev  # In one terminal
bun test:e2e # In another terminal

# Generate coverage report
bun test:coverage

# Watch mode (auto-rerun on changes)
bun test:watch

# Interactive Vitest UI dashboard
bun test:ui
```

## File Structure

```
cinemas-henry/
├── src/
│   ├── lib/
│   │   ├── utils.ts               # Utility functions
│   │   ├── __tests__/
│   │   │   └── utils.test.ts      # Unit tests for utils
│   │   ├── types.ts               # Type definitions
│   │   └── constants.ts           # Constants
│   │
│   └── components/
│       ├── NavDropdown.tsx        # Preact component
│       ├── __tests__/
│       │   └── NavDropdown.test.tsx
│       └── Button.astro           # Astro component
│
├── tests/
│   ├── fixtures/
│   │   ├── setup.ts               # Global setup (mocks, matchers)
│   │   ├── helpers.ts             # Custom render, utilities
│   │   └── mocks/
│   │       ├── movies.ts          # Mock movie data
│   │       └── cinemas.ts         # Mock cinema data
│   │
│   └── e2e/
│       └── cinema-selection.spec.ts  # E2E tests (Playwright)
│
├── vitest.config.ts               # Vitest configuration
├── playwright.config.ts           # Playwright configuration
└── package.json                   # Test scripts
```

## Naming Conventions

### Test Files
- **Unit tests:** `<module>.test.ts` → `utils.test.ts`
- **Component tests:** `<Component>.test.tsx` → `NavDropdown.test.tsx`
- **E2E tests:** `<feature>.spec.ts` → `cinema-selection.spec.ts`

### Describe Blocks
Use the function/component name with optional description:
```typescript
describe('cn() - classname merge utility', () => { ... });
describe('NavDropdown', () => { ... });
describe('Cinema Selection Flow', () => { ... });
```

### Test Names (it/test)
Use the "should X when Y" pattern:
```typescript
it('should merge multiple class strings', () => { ... });
it('should open menu when button is clicked', async () => { ... });
it('should persist selected cinema in localStorage', () => { ... });
```

## Test Patterns

### Unit Test Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { cn, parseDate } from '../utils';

describe('cn() - classname merge utility', () => {
  it('should merge multiple class strings', () => {
    // Arrange
    const input = ['px-2', 'py-4', 'bg-white'];
    
    // Act
    const result = cn(...input);
    
    // Assert
    expect(result).toContain('px-2');
    expect(result).toContain('py-4');
    expect(result).toContain('bg-white');
  });

  it('should handle conditional classes', () => {
    const result = cn('px-2', false && 'py-4', true && 'bg-white');
    expect(result).toContain('px-2');
    expect(result).toContain('bg-white');
    expect(result).not.toContain('py-4');
  });
});
```

**Key Points:**
- ✅ No external dependencies; pure function tests
- ✅ Use Arrange-Act-Assert pattern
- ✅ Test both happy path and edge cases
- ✅ No mocks needed (test isolation via imports)

### Component Test Pattern

```typescript
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from 'vitest';
import NavDropdown from '../NavDropdown';

describe('NavDropdown', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should render dropdown trigger button', () => {
    render(<NavDropdown />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
  });

  it('should open menu when button is clicked', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    await user.click(button);

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeDefined();
  });

  it('should save selected cinema to localStorage', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);

    const button = screen.getByRole('button');
    await user.click(button);

    const options = screen.getAllByRole('option');
    await user.click(options[0]);

    const saved = localStorage.getItem('selectedCine');
    expect(saved).toBeTruthy();
  });
});
```

**Key Points:**
- ✅ Always use `userEvent` (not `fireEvent`) for realistic interactions
- ✅ Clear localStorage/mocks in `beforeEach` to prevent test pollution
- ✅ Query by accessible roles (`getByRole`, `getByText`) not classes/IDs
- ✅ Test behavior visible to users, not internal implementation

### E2E Test Pattern (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cinema Selection Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display cinema dropdown on homepage', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');
    await expect(button).toBeVisible();
  });

  test('should select a cinema and close dropdown', async ({ page }) => {
    // Arrange
    const button = page.locator('button[aria-haspopup="listbox"]');
    
    // Act
    await button.click();
    const firstOption = page.locator('role=option').first();
    await firstOption.click();

    // Assert
    await expect(page.locator('role=listbox')).not.toBeVisible();
  });
});
```

**Key Points:**
- ✅ No mocking; tests run against live frontend
- ✅ Use `data-testid` or role-based selectors for robustness
- ✅ Use `await expect(...).toBeVisible()` for async waits
- ✅ Test from user perspective (UI flows, not implementation)

## Common Patterns

### Mocking fetch() Calls

```typescript
import { vi } from 'vitest';

// In test:
const mockResponse = {
  ok: true,
  json: () => Promise.resolve({ datos: [...], funciones: [...] }),
};

global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);

const result = await getMovies('https://example.com');
expect(result).toBeDefined();
```

### Using Mock Data

```typescript
import { mockMovies, getMockMovieById } from '../../../tests/fixtures/mocks/movies';
import { mockCinemas } from '../../../tests/fixtures/mocks/cinemas';

it('should filter movies by ID', () => {
  const movie = getMockMovieById('1001');
  expect(movie?.title).toBe('Inception');
});
```

### Custom Render with Helpers

```typescript
import { renderWithDefaults, createMockMovie } from '../../../tests/fixtures/helpers';

it('should render movie card', () => {
  const movie = createMockMovie({ title: 'Test Movie' });
  render(<MovieCard movie={movie} />);
  
  expect(screen.getByText('Test Movie')).toBeDefined();
});
```

### Testing Async Effects with waitFor

```typescript
import { waitFor } from '@testing-library/preact';

it('should load data on mount', async () => {
  render(<MovieList cinemaId="cine-1" />);
  
  await waitFor(() => {
    expect(screen.getByText('Inception')).toBeDefined();
  });
});
```

### Testing Custom Events

```typescript
it('should dispatch custom event', async () => {
  const user = userEvent.setup();
  const { container } = render(<NavDropdown />);

  let eventFired = false;
  const dropdown = container.querySelector('.relative');
  dropdown?.addEventListener('cineChange', () => {
    eventFired = true;
  });

  const button = screen.getByRole('button');
  await user.click(button);
  const options = screen.getAllByRole('option');
  await user.click(options[0]);

  expect(eventFired).toBe(true);
});
```

## Troubleshooting

### Tests Running Slow
```bash
# Run only specific test file
bun run test:unit -- src/lib/__tests__/utils.test.ts

# Run tests matching a pattern
bun test -- --grep="should merge"

# Use watch mode for faster feedback
bun test:watch
```

### Flaky Tests
- **Problem:** Tests fail intermittently due to timing
- **Solution:** Use `waitFor()` for async operations
  ```typescript
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeDefined();
  }, { timeout: 5000 });
  ```

### localStorage Not Persisting Between Tests
- **Problem:** localStorage state leaks between tests
- **Solution:** Clear in `beforeEach()`
  ```typescript
  beforeEach(() => {
    localStorage.clear();
  });
  ```

### Mock Not Working
- **Problem:** fetch mock not being used
- **Solution:** Ensure mock is set before component renders
  ```typescript
  global.fetch = vi.fn().mockResolvedValueOnce({...});
  render(<Component />);  // Now it uses the mock
  ```

### Import Paths Too Long
- **Solution:** Use path alias in vitest.config.ts
  ```typescript
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  ```
  Then: `import { cn } from '@/lib/utils'` instead of `import { cn } from '../../../lib/utils'`

## Coverage

Generate coverage report:
```bash
bun test:coverage
```

Open `coverage/index.html` to see detailed breakdown by file.

**Current Thresholds (Phase 1):**
- Statements: 50%
- Branches: 40%
- Functions: 50%
- Lines: 50%

**Phase 2 Target:** Increase to 70%+ as team velocity grows.

## Resources

- **Vitest Docs:** https://vitest.dev
- **Testing Library Docs:** https://testing-library.com/docs/preact-testing-library/intro
- **Playwright Docs:** https://playwright.dev
- **Best Practices:** https://testing-library.com/docs/queries/about

## Phase 2 Roadmap

### 1. MSW (Mock Service Worker)
**When:** If HTTP mocks exceed 200 lines  
**Why:** Centralize request interception  
**Effort:** Medium (1–2 hours)

### 2. Astro Component Tests
**When:** After Preact test suite stabilizes  
**Why:** Test .astro components with SSR  
**Effort:** Medium (2–3 hours)

### 3. CI/CD Integration
**When:** Next sprint  
**Why:** Enforce tests in PR gates  
**Effort:** Medium (1–2 hours)
- Pre-commit hook: `bun test:unit`
- GitHub Actions: Full test suite on PR

### 4. Coverage Threshold Increase
**When:** After 20+ tests per layer  
**Why:** Maintain quality as codebase grows  
**Effort:** Low (configuration change)
- Increase to 70% statements / 60% branches / 70% functions / lines

### 5. E2E Expansion
**When:** After CI/CD integration  
**Why:** Cover multi-step flows, edge cases  
**Effort:** Large (4–6 hours)
- Booking flow E2E tests
- Error scenario tests
- Auth flow tests (if applicable)

## Questions?

For help with testing, check:
1. **This guide** (quick reference)
2. **Sample test files** (src/lib/__tests__/, src/components/__tests__/)
3. **Vitest/Testing Library docs** (linked above)
4. **Team chat** (ask teammates for patterns)

---

**Last Updated:** 2026-05-28  
**Maintained By:** Development Team  
**Status:** Active (Phase 1)
