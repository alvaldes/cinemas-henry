# SDD Specification: TDD Infrastructure with Vitest for cinemas-henry

**Change ID:** `tdd-vitest-infra`  
**Scope:** Full specification for three-layer TDD infrastructure (unit, component, E2E)  
**Status:** Spec (approved proposal pending implementation)  
**Date:** 2026-05-28

---

## 1. Testing Libraries & Tooling

### Main Test Runner: Vitest

The system MUST use **Vitest (^2.2.0)** as the primary test runner for unit and component tests.

**Why Vitest:**
- Vite-native, aligns with Astro's build system
- Jest-compatible API (low learning curve)
- Native ESM support; no transpilation overhead
- Faster than Jest in development and CI contexts
- Excellent DX with watch mode and UI dashboard

### Layer 1: Unit Tests (Pure Functions)

**Runner:** Vitest  
**Assertion Library:** Vitest native `expect` (no additional libs needed)  
**Environment:** Node (v18+)  
**Test Globals:** Enabled (`describe`, `it`, `expect` available without imports)

```typescript
// Example: src/lib/__tests__/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn() utility', () => {
  it('should merge class strings without conflicts', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });
});
```

### Layer 2: Component Tests (Preact + Astro)

**Runner:** Vitest  
**Testing Library:** `@testing-library/preact` (^3.2.0) + `@testing-library/dom` (^10.4.0)  
**Environment:** jsdom (DOM simulation)  
**User Interactions:** `@testing-library/user-event` (^14.5.0)

**Assertion Style:** Vitest `expect` + Testing Library matchers

```typescript
// Example: src/components/__tests__/NavDropdown.test.tsx
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import NavDropdown from '../NavDropdown';

describe('NavDropdown', () => {
  it('should render menu items and handle click events', async () => {
    const user = userEvent.setup();
    render(<NavDropdown items={['Home', 'About']} />);
    
    const trigger = screen.getByRole('button');
    await user.click(trigger);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
```

### Layer 3: E2E Tests (Playwright)

**Runner:** `@playwright/test` (^1.48.0)  
**Environment:** Live frontend (localhost:3000)  
**No Mocking:** E2E tests interact with real frontend only  
**Assertion Style:** Playwright native assertions

```typescript
// Example: tests/e2e/cinema-selection.spec.ts
import { test, expect } from '@playwright/test';

test('user can load homepage and see cinema list', async ({ page }) => {
  await page.goto('http://localhost:3000');
  const cinemaList = page.locator('[data-testid="cinema-list"]');
  await expect(cinemaList).toBeVisible();
});
```

### Coverage Tool: @vitest/coverage-v8

The system MUST generate coverage reports using `@vitest/coverage-v8` (^2.2.0).

- Coverage includes: statements, branches, functions, lines
- Output format: HTML + text summary
- Threshold enforcement: configured per layer in `vitest.config.ts`

---

## 2. File Structure & Organization

### Directory Layout

```
cinemas-henry/
├── src/
│   ├── lib/
│   │   ├── utils.ts               # utility functions
│   │   ├── types.ts               # type definitions
│   │   ├── constants.ts           # constants
│   │   └── __tests__/
│   │       ├── utils.test.ts      # unit tests for utils.ts
│   │       ├── types.test.ts      # type tests (if needed)
│   │       └── constants.test.ts  # constant validation tests
│   │
│   ├── components/
│   │   ├── NavDropdown.tsx        # Preact interactive component
│   │   ├── Button.astro           # Astro static/island component
│   │   ├── IconMap.tsx            # Preact icon component
│   │   └── __tests__/
│   │       ├── NavDropdown.test.tsx
│   │       ├── Button.test.tsx
│   │       └── IconMap.test.tsx
│   │
│   ├── pages/
│   │   ├── index.astro
│   │   └── [cine]/
│   │       └── index.astro
│   │
│   └── layouts/
│       └── main.astro
│
├── tests/
│   ├── fixtures/
│   │   ├── mocks/
│   │   │   ├── movies.ts          # mock movie data
│   │   │   ├── cinemas.ts         # mock cinema data
│   │   │   └── api-responses.ts   # mock API responses
│   │   ├── helpers.ts             # custom render utils, test helpers
│   │   └── setup.ts               # vitest setup, global mocks
│   │
│   └── e2e/
│       ├── cinema-selection.spec.ts
│       ├── movie-detail.spec.ts
│       └── booking-flow.spec.ts
│
├── vitest.config.ts               # Vitest configuration
├── playwright.config.ts           # Playwright configuration (skeleton)
├── package.json                   # test scripts added
├── openspec/
│   └── config.yaml                # updated with strict_tdd: true
│
└── TESTING.md                     # TDD conventions & examples
```

### File Naming Conventions

| File Type | Pattern | Example |
|-----------|---------|---------|
| Unit test | `<module>.test.ts` | `utils.test.ts` |
| Component test | `<Component>.test.tsx` | `NavDropdown.test.tsx` |
| E2E test | `<feature>.spec.ts` | `cinema-selection.spec.ts` |
| Mock data | `<entity>.ts` (in fixtures/mocks) | `movies.ts` |
| Test helper | `.ts` (in fixtures) | `helpers.ts` |

---

## 3. Test Scenarios & Acceptance Tests

### Layer 1: Unit Tests (`src/lib/__tests__/`)

#### Scenario 1.1: `cn()` Utility Function

**Requirement:** The system MUST merge CSS class strings and resolve Tailwind conflicts using the `cn()` function.

**Test File:** `src/lib/__tests__/utils.test.ts`

```typescript
describe('cn() - classname merge utility', () => {
  it('should merge multiple class strings', () => {
    expect(cn('px-2', 'py-4', 'bg-white')).toBe('px-2 py-4 bg-white');
  });

  it('should handle conditional classes', () => {
    expect(cn('px-2', false && 'py-4', true && 'bg-white')).toBe('px-2 bg-white');
  });

  it('should resolve Tailwind conflicts (later class wins)', () => {
    // Assuming cn uses clsx or classnames under the hood
    expect(cn('text-red-500', 'text-blue-500')).toContain('text-blue-500');
  });

  it('should handle null/undefined gracefully', () => {
    expect(cn('px-2', null, undefined, 'py-4')).toBe('px-2 py-4');
  });
});
```

**Pass Criteria:**
- ✅ All 4 assertions pass with Vitest native `expect`

---

#### Scenario 1.2: Date Parsing (if `parseDate` exists)

**Requirement:** The system MUST parse and normalize date strings in multiple formats.

**Test File:** `src/lib/__tests__/date-utils.test.ts` (hypothetical; adapt to actual code)

```typescript
describe('parseDate() - date parsing utility', () => {
  it('should parse ISO 8601 date strings', () => {
    const result = parseDate('2026-05-28');
    expect(result.toISOString()).toContain('2026-05-28');
  });

  it('should parse US format MM/DD/YYYY', () => {
    const result = parseDate('05/28/2026');
    expect(result.getFullYear()).toBe(2026);
  });

  it('should throw on invalid date format', () => {
    expect(() => parseDate('invalid-date')).toThrow();
  });

  it('should normalize timezone differences', () => {
    const result = parseDate('2026-05-28T14:30:00Z');
    expect(result.toISOString()).toContain('2026-05-28');
  });
});
```

**Pass Criteria:**
- ✅ All 4 assertions pass; error handling validated

---

### Layer 2: Component Tests (`src/components/__tests__/`)

#### Scenario 2.1: NavDropdown (Interactive Preact Component)

**Requirement:** The system MUST render a dropdown menu with items and handle user interactions (click to open/close).

**Test File:** `src/components/__tests__/NavDropdown.test.tsx`

```typescript
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import NavDropdown from '../NavDropdown';

describe('NavDropdown', () => {
  it('should render trigger button', () => {
    render(<NavDropdown label="Menu" items={[]} />);
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  });

  it('should show menu items when clicked', async () => {
    const user = userEvent.setup();
    const items = [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' }
    ];
    render(<NavDropdown label="Menu" items={items} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should call onClick callback when item is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const items = [{ label: 'Home', href: '/', onClick: onSelect }];

    render(<NavDropdown label="Menu" items={items} />);
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    const homeItem = screen.getByText('Home');
    await user.click(homeItem);

    expect(onSelect).toHaveBeenCalled();
  });

  it('should close menu when item is clicked', async () => {
    const user = userEvent.setup();
    const items = [{ label: 'Home', href: '/' }];
    render(<NavDropdown label="Menu" items={items} />);

    const trigger = screen.getByRole('button');
    await user.click(trigger);
    expect(screen.getByText('Home')).toBeInTheDocument();

    await user.click(screen.getByText('Home'));
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });
});
```

**Pass Criteria:**
- ✅ All 5 assertions pass; user interactions validated with `userEvent`
- ✅ Mock functions (`vi.fn()`) track callbacks correctly

---

#### Scenario 2.2: Button Component (Astro)

**Requirement:** The system MUST render a Button with customizable content, variant styles, and optional attributes.

**Test File:** `src/components/__tests__/Button.test.tsx` (or `.test.ts` using renderToStaticMarkup)

```typescript
import { render } from '@testing-library/preact';
import { describe, it, expect } from 'vitest';
import Button from '../Button.astro';

// Note: Astro components require renderToStaticMarkup or async rendering
describe('Button', () => {
  it('should render button with slot content', async () => {
    // Using async rendering for Astro components
    const html = await Button.render({ slots: { default: 'Click me' } });
    expect(html.html).toContain('Click me');
    expect(html.html).toContain('<button');
  });

  it('should apply variant classes correctly', async () => {
    const html = await Button.render({
      variant: 'primary',
      slots: { default: 'Save' }
    });
    expect(html.html).toContain('primary'); // or specific class from variant
  });

  it('should support disabled attribute', async () => {
    const html = await Button.render({
      disabled: true,
      slots: { default: 'Disabled' }
    });
    expect(html.html).toContain('disabled');
  });
});
```

**Pass Criteria:**
- ✅ Rendered HTML contains expected content and attributes
- ✅ Variant classes applied; disabled state honored

---

### Layer 3: E2E Tests (`tests/e2e/`)

#### Scenario 3.1: Homepage Load and Cinema List

**Requirement:** The system MUST load the homepage and display the cinema selection list to the user.

**Test File:** `tests/e2e/cinema-selection.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cinema Selection', () => {
  test('should load homepage and display cinema list', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Wait for cinema list to be visible
    const cinemaList = page.locator('[data-testid="cinema-list"]');
    await expect(cinemaList).toBeVisible();
  });

  test('should display at least one cinema in the list', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const cinemaItems = page.locator('[data-testid="cinema-item"]');
    const count = await cinemaItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should allow user to click on a cinema', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    const firstCinema = page.locator('[data-testid="cinema-item"]').first();
    await firstCinema.click();
    
    // Verify navigation to cinema detail page (URL change or data update)
    await expect(page).toHaveURL(/.*\/cine\/.*/);
  });
});
```

**Pass Criteria:**
- ✅ Homepage loads without errors (HTTP 200)
- ✅ Cinema list visible and interactive
- ✅ Navigation works correctly on cinema selection

---

#### Scenario 3.2: Movie Detail & Trailer Loading (Stub)

**Test File:** `tests/e2e/movie-detail.spec.ts` (basic stub for Phase 2)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Movie Detail Page', () => {
  test('should load movie detail page', async ({ page }) => {
    // Stub test; full implementation in Phase 2
    await page.goto('http://localhost:3000/cine/example/movie-1');
    await expect(page).toHaveTitle(/movie|cinema/i);
  });
});
```

---

## 4. Configuration Schema: `vitest.config.ts`

### Full Configuration Template

The system MUST configure Vitest with the following schema:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { getViteConfig } from 'astro/config';

export default defineConfig({
  plugins: [react()],
  test: {
    // Global test environment
    environment: 'jsdom', // or 'node' for unit tests only
    globals: true,        // enable describe, it, expect without imports
    setupFiles: ['./tests/fixtures/setup.ts'],

    // Include/exclude patterns
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'tests/**/*.spec.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.astro',
      '.next'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'tests/fixtures/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**'
      ],
      statements: 50,      // Initial threshold (50%)
      branches: 40,        // Allow lower branch coverage
      functions: 50,
      lines: 50
    },

    // Watch mode settings
    watch: false,
    reporters: 'default',

    // Test timeout
    testTimeout: 10000,

    // Mock reset between tests
    clearMocks: true,
    restoreMocks: true
  },

  resolve: {
    alias: {
      '@': '/src' // optional: path alias
    }
  }
});
```

**Key Points:**
- ✅ `environment: 'jsdom'` for DOM tests (components)
- ✅ `globals: true` allows `describe`, `it`, `expect` without imports
- ✅ `setupFiles` loads global mocks and fixtures
- ✅ Coverage thresholds set to realistic initial values (50%–40%)
- ✅ Excludes generated/build directories (dist, .astro)

---

## 5. Naming & Convention Specification

### Describe Block Naming

Feature/Module Name Format

```typescript
describe('cn() - classname merge utility', () => { ... });
describe('NavDropdown', () => { ... });
describe('Cinema Selection', () => { ... });
```

**Convention:** Use the function/component name, optionally with a dash and brief description.

---

### Test/It Block Naming

**Format:** `should <action> when <condition>`

```typescript
// Good
it('should merge multiple class strings', () => { ... });
it('should show menu items when clicked', () => { ... });
it('should throw on invalid date format', () => { ... });

// Avoid
it('test cn', () => { ... });         // Too vague
it('works', () => { ... });           // Not descriptive
```

---

### Assertion Style

**The system MUST use Vitest native `expect()` for all assertions:**

```typescript
// Preferred: Vitest native
expect(value).toBe(expected);
expect(value).toEqual(expected);
expect(array).toContain(item);
expect(fn).toHaveBeenCalled();
expect(element).toBeInTheDocument();  // from Testing Library matchers

// Not preferred
assert(value === expected);           // Use expect instead
chai.expect(value).to.equal(expected); // Unnecessary third party
```

---

### File Organization

**Within a test file:**

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { myFunction } from '../myFunction';

describe('myFunction', () => {
  // Setup/teardown
  beforeEach(() => { /* ... */ });
  afterEach(() => { /* ... */ });

  // Happy path tests first
  describe('happy path', () => {
    it('should return expected value', () => { ... });
  });

  // Edge cases
  describe('edge cases', () => {
    it('should handle null input', () => { ... });
    it('should handle empty array', () => { ... });
  });

  // Error scenarios
  describe('error scenarios', () => {
    it('should throw on invalid input', () => { ... });
  });
});
```

---

## 6. Fixture & Mock Strategy

### Mock Data Location

**Directory:** `tests/fixtures/mocks/`

**Files:**

```
tests/fixtures/mocks/
├── movies.ts           # array of mock movie objects
├── cinemas.ts          # array of mock cinema objects
└── api-responses.ts    # mock HTTP responses (status, headers, body)
```

**Example: `tests/fixtures/mocks/movies.ts`**

```typescript
export const mockMovies = [
  {
    id: '1',
    title: 'Inception',
    year: 2010,
    director: 'Christopher Nolan',
    runtime: 148,
    plot: 'A skilled thief...',
    poster: 'https://example.com/inception.jpg'
  },
  {
    id: '2',
    title: 'Interstellar',
    year: 2014,
    director: 'Christopher Nolan',
    runtime: 169,
    plot: 'A team of astronauts...',
    poster: 'https://example.com/interstellar.jpg'
  }
];

export const mockCinemas = [
  {
    id: 'cine-1',
    name: 'Cinema Downtown',
    location: 'Downtown, City',
    screens: 10
  },
  {
    id: 'cine-2',
    name: 'Cinema Mall',
    location: 'Shopping Mall, City',
    screens: 8
  }
];
```

---

### Test Helpers

**File:** `tests/fixtures/helpers.ts`

```typescript
import { render as preactRender } from '@testing-library/preact';
import { ComponentType } from 'preact';

// Custom render function with providers
export function renderWithProviders(
  Component: ComponentType,
  options?: any
) {
  return preactRender(<Component {...options} />);
}

// Mock API responses
export function mockApiResponse(data: any, status = 200) {
  return Promise.resolve({
    json: () => Promise.resolve(data),
    status,
    ok: status === 200
  });
}

// Fixture loaders
export function getRandomMovie() {
  const { mockMovies } = require('./mocks/movies');
  return mockMovies[Math.floor(Math.random() * mockMovies.length)];
}
```

---

### HTTP Mocking Strategy

**The system MUST NOT make external API calls in unit/component tests.**

**All HTTP requests MUST be mocked using Vitest's `vi.mock()` or MSW (Mock Service Worker) if needed.**

```typescript
// Example: mocking fetch
vi.mock('global', () => ({
  fetch: vi.fn((url: string) => {
    if (url.includes('/api/movies')) {
      return mockApiResponse([mockMovies[0]]);
    }
    return mockApiResponse({ error: 'Not found' }, 404);
  })
}));
```

---

### E2E: No Mocking

**The system MUST NOT mock in E2E tests.**

- E2E tests use **live frontend only** (e.g., `http://localhost:3000`)
- Backend calls are real (or stubbed via Playwright context interception if needed)
- No mock data in `tests/e2e/` tests; use real or seeded test data

---

## 7. Package.json Scripts Specification

The system MUST configure these test scripts in `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:unit": "vitest run src/lib/__tests__",
    "test:components": "vitest run src/components/__tests__",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui"
  }
}
```

### Script Behavior Specification

| Command | Behavior | Exit Code |
|---------|----------|-----------|
| `bun test` | Run all layers (unit + component + E2E); fail if any layer fails | 0 = all pass; 1 = any fails |
| `bun test:unit` | Run only unit tests (src/lib/__tests__) | 0 = pass; 1 = fail |
| `bun test:components` | Run only component tests (src/components/__tests__) | 0 = pass; 1 = fail |
| `bun test:e2e` | Run E2E tests via Playwright | 0 = pass; 1 = fail |
| `bun test:coverage` | Generate HTML + text coverage report; show summary | 0 = success; 1 = below threshold |
| `bun test:watch` | Watch mode; re-run on file change; stay running | (interactive) |
| `bun test:ui` | Launch Vitest UI dashboard on http://localhost:51204 | (interactive) |

---

## 8. openspec/config.yaml Updates

The system MUST update `openspec/config.yaml` with strict TDD configuration:

```yaml
strict_tdd: true

context: |
  cinemas-henry is an Astro + Preact project with three-layer TDD infrastructure.
  Unit tests (Vitest) cover src/lib utilities; component tests (Vitest + Testing Library)
  cover src/components Preact/Astro components; E2E tests (Playwright) cover full flows.
  All tests use TypeScript and test globals are enabled in vitest.config.ts.
  No external API calls in unit/component tests; all mocked.

testing:
  detected: "2026-05-28"
  runner:
    command: "vitest"
    framework: "vitest"
  layers:
    unit: "src/lib/__tests__"
    component: "src/components/__tests__"
    e2e: "tests/e2e"
  commands:
    unit:
      - "vitest run src/lib/__tests__"
    component:
      - "vitest run src/components/__tests__"
    e2e:
      - "playwright test"
  coverage:
    command: "vitest run --coverage"
    commands:
      - "vitest run --coverage --reporter=json"
      - "vitest run --coverage --reporter=html"

quality:
  lint: ""
  lint_commands: []
  typecheck: ""
  typecheck_commands: []
  format: ""
  format_commands: []

rules:
  proposal:
    require_problem_statement: true
  spec:
    require_acceptance_criteria: true
  design:
    require_tradeoffs: true
  tasks:
    protect_review_workload: true
  apply:
    test_command: "bun test"
  verify:
    test_command: "bun test"
```

---

## 9. Acceptance Scenarios (Verification Criteria)

The system MUST satisfy ALL of the following acceptance scenarios:

### Scenario 9.1: All Test Layers Run Successfully

**Given:** A freshly installed Vitest + Playwright setup  
**When:** The developer runs `bun test`  
**Then:**
- ✅ Unit tests in `src/lib/__tests__/` execute and pass
- ✅ Component tests in `src/components/__tests__/` execute and pass
- ✅ E2E tests in `tests/e2e/` execute (or skip gracefully if frontend not running)
- ✅ Exit code is 0 (success)
- ✅ All tests complete within 30 seconds

---

### Scenario 9.2: Layer-Specific Test Commands Work

**Given:** Test infrastructure is installed  
**When:** The developer runs `bun test:unit` **only**  
**Then:**
- ✅ Only files in `src/lib/__tests__/**/*.test.ts` are executed
- ✅ Component and E2E tests are NOT run
- ✅ Exit code is 0 if all unit tests pass

**When:** The developer runs `bun test:components`  
**Then:**
- ✅ Only files in `src/components/__tests__/**/*.test.tsx` are executed
- ✅ Unit and E2E tests are NOT run
- ✅ Exit code is 0 if all component tests pass

---

### Scenario 9.3: Coverage Reports Generated and Readable

**Given:** A set of tested code modules  
**When:** The developer runs `bun test:coverage`  
**Then:**
- ✅ Coverage report generated in `coverage/` directory
- ✅ HTML report viewable in browser (opens index.html)
- ✅ Text summary printed to stdout showing: statements, branches, functions, lines
- ✅ Coverage below thresholds (50%/40%) flagged in output
- ✅ Exit code is 0 even if coverage below threshold (threshold enforcement deferred to Phase 2)

---

### Scenario 9.4: Watch Mode Allows Rapid Development

**Given:** A developer is writing/editing test files  
**When:** The developer runs `bun test:watch`  
**Then:**
- ✅ Process starts and watches `src/` and `tests/` for file changes
- ✅ On file save, relevant tests re-run automatically
- ✅ Results printed to terminal in <2 seconds
- ✅ Process stays alive; developer can edit and re-run without restarting

---

### Scenario 9.5: Sample Tests Are Self-Documenting

**Given:** A new team member cloning the repository  
**When:** They read `src/lib/__tests__/utils.test.ts`, `src/components/__tests__/NavDropdown.test.tsx`, and `tests/e2e/cinema-selection.spec.ts`  
**Then:**
- ✅ Test names clearly describe what the code should do
- ✅ Arrange-Act-Assert (AAA) pattern is obvious in test structure
- ✅ Test helpers (fixtures, mocks) are easy to find and reuse
- ✅ They can write a new test in isolation without pairing or documentation review

---

### Scenario 9.6: No Regressions in Build/Dev Pipeline

**Given:** The test infrastructure is added  
**When:** The developer runs `bun run build` and `bun run dev`  
**Then:**
- ✅ `bun run build` produces valid `.astro` and static artifacts (no errors)
- ✅ `bun run dev` starts the dev server without blocking on tests
- ✅ Test commands are optional in dev workflow (not auto-triggered)
- ✅ No changes to existing source code; tests only add new files

---

## 10. Dependencies to Add

The system MUST add these packages to `devDependencies`:

### Vitest Ecosystem (Unit + Component Testing)

```json
{
  "devDependencies": {
    "vitest": "^2.2.0",
    "@vitest/ui": "^2.2.0",
    "@vitest/coverage-v8": "^2.2.0",
    "@testing-library/preact": "^3.2.0",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jsdom": "^25.0.0"
  }
}
```

### Playwright (E2E)

```json
{
  "devDependencies": {
    "@playwright/test": "^1.48.0"
  }
}
```

### Optional but Recommended

```json
{
  "devDependencies": {
    "happy-dom": "^16.4.0",
    "c8": "^8.0.0",
    "chai": "^4.4.0"
  }
}
```

**Notes:**
- `happy-dom` is a lighter alternative to jsdom if performance is critical
- `c8` provides alternative coverage reporting (already included via @vitest/coverage-v8)
- `chai` optional; Vitest native `expect()` is preferred

---

## Rules & Constraints

1. **No external API calls in unit/component tests** – All HTTP must be mocked
2. **E2E tests must use live frontend** – No mocking; interact with real rendered pages
3. **Test globals enabled** – `describe`, `it`, `expect` available without imports
4. **TypeScript for all tests** – Even simple utilities use .test.ts, not .test.js
5. **One test file per component/module** – Avoid combining tests from different areas
6. **Clear test naming** – "should <action> when <condition>" format
7. **Fixtures in `tests/fixtures/`** – Centralized mock data, test helpers
8. **Coverage thresholds realistic** – Start at 50%/40%; increase as team velocity grows

---

## Success Criteria Summary

- ✅ `vitest.config.ts` created and working
- ✅ `playwright.config.ts` skeleton in place
- ✅ All 10 test scenarios pass (unit, component, E2E basics)
- ✅ Coverage reports generated via `bun test:coverage`
- ✅ `package.json` scripts updated (test, test:unit, test:components, test:e2e, test:coverage, test:watch)
- ✅ `openspec/config.yaml` updated with `strict_tdd: true` and test runner config
- ✅ `TESTING.md` created with examples and conventions
- ✅ No regressions: `bun run build` and `bun run dev` work unchanged
- ✅ Team can write new tests following sample patterns
- ✅ All dependencies installed; `bun install` succeeds

---

## Appendix: Configuration Templates

### Template: vitest.config.ts

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/fixtures/setup.ts',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'tests/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '.astro'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50
    },
    testTimeout: 10000,
    clearMocks: true
  }
});
```

### Template: playwright.config.ts (Skeleton)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Template: tests/fixtures/setup.ts

```typescript
import { expect, afterEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest matchers with Testing Library matchers
expect.extend(matchers);

// Global test cleanup
afterEach(() => {
  vi.clearAllMocks();
});

// Optional: Global fetch mock
global.fetch = vi.fn();
```

---

**Spec Version:** 1.0  
**Last Updated:** 2026-05-28  
**Status:** Ready for Design Phase
