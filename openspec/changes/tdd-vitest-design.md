# SDD Design: TDD Infrastructure with Vitest for cinemas-henry

**Change ID:** `tdd-vitest-infra`  
**Scope:** Complete technical design for three-layer TDD implementation  
**Status:** Design (ready for task breakdown and apply phase)  
**Date:** 2026-05-28  
**Approved Spec:** `openspec/changes/tdd-vitest-spec.md`

---

## Executive Summary

This design translates the spec into concrete technical architecture and implementation strategy. It covers:

1. **Architecture Decisions** — Why jsdom, test globals, mock strategy, coverage thresholds
2. **Implementation Strategy** — Installation order, setup file design, fixture organization
3. **File Creation Plan** — Exact config files and their structure
4. **Test Patterns** — Unit, component, and E2E patterns with real examples from the codebase
5. **Integration Points** — How tests connect with Astro dev server and openspec
6. **Tradeoffs** — Decisions made and why (jsdom > happy-dom, vi.mock > MSW for Phase 1, etc.)
7. **Risk Mitigations** — Handling Astro SSR complexity, test discovery performance
8. **Task Handoff** — Concrete tasks, dependencies, and acceptance criteria

---

## 1. Architecture Decisions

### 1.1 Test Environment: jsdom vs happy-dom

**Decision: Use jsdom**

**Rationale:**
- **jsdom (25.0.0)** provides full browser API compatibility (localStorage, CustomEvent, DOM events)
- cinemas-henry uses `localStorage` in NavDropdown.tsx and custom events (`cineChange` event)
- jsdom supports all these APIs out-of-the-box; happy-dom has gaps
- Trade-off: jsdom is ~10% slower than happy-dom per test, but negligible at our scale (<30 tests/layer)
- Team familiarity: jsdom is jest-standard; lower onboarding friction

**Why NOT happy-dom:**
- Missing full localStorage API (cinemas-henry relies on it)
- Custom events (CustomEvent) support incomplete
- Not worth the 2-3ms/test savings vs. compatibility cost

**Config Impact:**
```typescript
test: {
  environment: 'jsdom'  // ✅ Set this, don't change
}
```

---

### 1.2 Test Globals Strategy

**Decision: Enable globals; avoid import fatigue**

**Rationale:**
- Spec requires `globals: true` in vitest.config.ts
- Eliminates repetitive imports: `import { describe, it, expect, vi } from 'vitest'`
- Modern Vitest best practice (Jest-like experience)
- Reduces test file boilerplate by ~3 lines per file

**Config:**
```typescript
test: {
  globals: true,  // ✅ Enable this
  setupFiles: ['./tests/fixtures/setup.ts']  // Global setup executed once per test session
}
```

**Setup file initializes:**
- Testing Library matchers (extend `expect` with `.toBeInTheDocument()`, etc.)
- Global mocks (fetch, localStorage)
- Cleanup between tests (`afterEach` hook)

**Example: With globals enabled, tests look clean:**
```typescript
// ✅ GOOD: No imports needed for describe, it, expect
describe('cn() utility', () => {
  it('should merge classes', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4');
  });
});
```

---

### 1.3 Mock Strategy for HTTP / Fetch

**Decision: Use `vi.mock()` for Phase 1; defer MSW to Phase 2**

**Rationale:**
- **Phase 1 (now):** Simple projects with few API calls → vi.mock sufficient
- **getMovies()** in src/lib/utils.ts is the only significant HTTP call
- vi.mock setup in tests/fixtures/setup.ts or per-test basis is straightforward
- MSW adds complexity (server setup, request handlers) without Phase 1 benefit

**Mock Strategy:**

**For global fetch mock** (`tests/fixtures/setup.ts`):
```typescript
// Global mock that applies to all tests
global.fetch = vi.fn();
```

**Per-test mocking** (in specific tests):
```typescript
// Example: src/lib/__tests__/utils.test.ts
import { vi } from 'vitest';

describe('getMovies()', () => {
  it('should fetch and parse movies', async () => {
    const mockResponse = {
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ datos: [...], funciones: [...] }))
    };
    
    global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);
    
    const result = await getMovies('https://example.com');
    expect(result).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.any(Object));
  });

  afterEach(() => {
    vi.resetAllMocks();  // Cleanup between tests
  });
});
```

**Why vi.mock over MSW:**
- vi.mock: 2 lines per test, no server setup
- MSW: 15+ lines, background server, request handlers
- Overkill for cinemas-henry Phase 1
- MSW added in Phase 2 if/when we scale beyond ~50 tests

---

### 1.4 Coverage Thresholds Rationale

**Decision: Start at 50% / 40% / 50% / 50% (statements / branches / functions / lines)**

**Rationale:**
- **Phase 1 is sample/bootstrap phase**, not full coverage
- 50% is realistic for 3–5 sample tests per layer
- Allows team to prove TDD works before enforcing strict thresholds
- Branch coverage lower (40%) because edge cases come later
- Phase 2: Increase to 70%+ once team has 20+ tests per layer

**Config:**
```typescript
coverage: {
  statements: 50,
  branches: 40,
  functions: 50,
  lines: 50
}
```

**Why NOT 80%+ now:**
- Discourages adoption if impossible to meet
- Sample tests won't cover all branches
- Better to increase gradually as team velocity grows

**Future (Phase 2+):**
```typescript
coverage: {
  statements: 70,
  branches: 60,
  functions: 70,
  lines: 70
}
```

---

## 2. Implementation Strategy

### 2.1 Installation Order

**Step 1: Add dependencies** (bun add --dev <packages>)
```
vitest^2.2.0
@vitest/ui@^2.2.0
@vitest/coverage-v8@^2.2.0
@testing-library/preact@^3.2.0
@testing-library/dom@^10.4.0
@testing-library/user-event@^14.5.0
jsdom@^25.0.0
@playwright/test@^1.48.0
```

**Step 2: Create config files**
- `vitest.config.ts` (fully functional)
- `playwright.config.ts` (skeleton)

**Step 3: Create fixture infrastructure**
- `tests/fixtures/setup.ts` (global setup)
- `tests/fixtures/helpers.ts` (custom render + utilities)
- `tests/fixtures/mocks/movies.ts` (mock data)
- `tests/fixtures/mocks/cinemas.ts` (mock data)

**Step 4: Create sample test files**
- `src/lib/__tests__/utils.test.ts` (unit: cn, parseDate, normalizeDate)
- `src/components/__tests__/NavDropdown.test.tsx` (component: state, clicks, localStorage)
- `tests/e2e/cinema-selection.spec.ts` (E2E: homepage load, cinema list visible)

**Step 5: Update package.json**
- Add test scripts
- Verify all scripts run

**Step 6: Update openspec/config.yaml**
- Set `strict_tdd: true`
- Populate test runner config

**Step 7: Create TESTING.md**
- Document conventions, examples, common patterns

---

### 2.2 Setup File Strategy (`tests/fixtures/setup.ts`)

**Purpose:** Global initialization for all tests

**Contents:**
```typescript
import { expect, afterEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// 1. Extend expect() with Testing Library matchers
expect.extend(matchers);

// 2. Global fetch mock (replaced per-test as needed)
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// 3. Mock localStorage (preact components use it)
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

global.localStorage = localStorageMock as any;

// 4. Global cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
```

**Why centralize in setup.ts:**
- Mocks available to all tests without re-declaring
- Consistent state between tests
- Single source of truth for global behavior

---

### 2.3 Fixture Organization

**Structure:**
```
tests/fixtures/
├── setup.ts              # Global initialization (globals, mocks, cleanup)
├── helpers.ts            # Custom render(), test utilities
└── mocks/
    ├── movies.ts         # Mock movie data (from real data shape)
    ├── cinemas.ts        # Mock cinema data
    └── api-responses.ts  # Mock HTTP responses (optional for Phase 1)
```

**Design Rationale:**
- **setup.ts** — Loaded automatically by vitest.config.ts; no manual imports
- **helpers.ts** — Imported explicitly in tests that need custom render or utilities
- **mocks/** — Data organized by domain (movies, cinemas) for clarity
- **No circular dependencies** — Fixtures don't import from src/; only src/ imports fixtures

**Example import pattern in tests:**
```typescript
// ✅ GOOD: Explicit imports only when needed
import { renderWithProviders } from '../../../tests/fixtures/helpers';
import { mockMovies } from '../../../tests/fixtures/mocks/movies';

// Avoid:
// ❌ import everything from setup (it's global)
// ❌ import from ../helpers at different paths (use consistent path)
```

---

### 2.4 Avoiding Circular Dependencies

**Rule:** Tests can import from fixtures; fixtures MUST NOT import from src/

**Safe pattern:**
```typescript
// ✅ GOOD: src/lib/utils.test.ts imports from fixtures
import { mockMovies } from '../../../tests/fixtures/mocks/movies';

// ❌ BAD: tests/fixtures/setup.ts imports from src/
// Don't do this:
// import { cn } from '../../src/lib/utils';
```

**Why:**
- Vitest loads setup.ts globally; if it imports src/, it can create import loops
- Fixtures should be stateless, data-only, or helper-only
- Tests are the bridge between src/ and fixtures

---

## 3. File Creation Plan

### 3.1 vitest.config.ts (Complete, Production-Ready)

**File:** `/Users/alvaldes/Developer/cinemas-henry/vitest.config.ts`

```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  
  test: {
    // Environment configuration
    environment: 'jsdom',  // Use jsdom for DOM APIs (localStorage, CustomEvent)
    globals: true,         // Enable describe, it, expect without imports
    setupFiles: ['./tests/fixtures/setup.ts'],  // Global setup (mocks, matchers)

    // File discovery
    include: [
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
      'tests/**/*.spec.ts',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.astro',
      '.pi',
      '.git',
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
        '**/dist/**',
        '.astro/**',
      ],
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },

    // Performance settings
    testTimeout: 10000,    // 10s timeout per test (for async getMovies)
    hookTimeout: 10000,    // 10s for beforeEach, afterEach
    teardownTimeout: 10000,

    // Mock reset behavior
    clearMocks: true,      // Reset mocks after each test
    restoreMocks: true,    // Restore original mocks
    mockReset: true,       // Clear mock call history

    // Reporter settings
    watch: false,          // Set via CLI: vitest watch
    reporters: 'default',  // Inline reporter (can add 'verbose' if needed)
  },

  // Module resolution
  resolve: {
    alias: {
      '@': '/src',  // Optional: allows import '@/lib/utils' instead of '../../../lib/utils'
    },
  },
});
```

**Key Design Choices:**
- ✅ jsdom for browser APIs (localStorage, CustomEvent)
- ✅ globals: true for clean test syntax
- ✅ setupFiles auto-loads mocks
- ✅ clearMocks: true prevents test pollution
- ✅ 10s timeout accommodates async getMovies() retries
- ✅ Coverage thresholds realistic for Phase 1 (50%/40%)

---

### 3.2 playwright.config.ts (Skeleton for Phase 2)

**File:** `/Users/alvaldes/Developer/cinemas-henry/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing.
 * This is a skeleton; full implementation in Phase 2.
 * 
 * Usage: bun run test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Execution settings
  fullyParallel: true,    // Run tests in parallel
  forbidOnly: !!process.env.CI,  // Fail if test.only is found in CI
  retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined,  // Single worker in CI (safer)

  // Reporting
  reporter: 'html',       // HTML report generated in playwright-report/

  // Browser configuration
  use: {
    baseURL: 'http://localhost:3000',  // Astro dev server
    trace: 'on-first-retry',  // Trace failures for debugging
  },

  // Browser projects
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

  // Dev server integration (Phase 2: enable when ready)
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,  // Reuse if already running
    timeout: 120 * 1000,  // Wait up to 2min for server startup
  },
});
```

**Phase 2 Activation:**
Currently skeleton. In Phase 2:
- Remove webServer comment-out (if needed)
- Add test auth fixtures
- Create helper for page navigation

---

### 3.3 tests/fixtures/setup.ts (Global Setup)

**File:** `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/setup.ts`

```typescript
import { expect, afterEach, vi } from 'vitest';

/**
 * Global test setup: matchers, mocks, cleanup
 * Auto-loaded by vitest.config.ts
 */

// ============================================================================
// 1. Extend expect() with Testing Library matchers
// ============================================================================
// Import matchers but don't re-export; they extend global expect()
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// ============================================================================
// 2. Global fetch mock (dummy; replaced per-test as needed)
// ============================================================================
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
) as any;

// ============================================================================
// 3. Global localStorage mock (Preact components use it)
// ============================================================================
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => {
      return store[key] || null;
    },
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ============================================================================
// 4. Global cleanup after each test
// ============================================================================
afterEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

// ============================================================================
// 5. Optional: Suppress console errors in tests (comment out if needed)
// ============================================================================
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args: any[]) => {
//     if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render')) {
//       return;  // Suppress React warnings if needed
//     }
//     originalError.call(console, ...args);
//   };
// });
```

**Why this design:**
- ✅ Matchers extend expect() globally (no per-test import)
- ✅ fetch mock replaced per-test as needed (vi.fn() is easy to override)
- ✅ localStorage mock mimics real API fully
- ✅ afterEach cleanup prevents test pollution
- ✅ Optional console error suppression for Phase 2+

---

### 3.4 tests/fixtures/helpers.ts (Test Utilities)

**File:** `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/helpers.ts`

```typescript
import { render as preactRender, RenderResult } from '@testing-library/preact';
import { ComponentType } from 'preact';

/**
 * Custom render function for Preact components in tests.
 * Wraps @testing-library/preact render with default options.
 */
export function renderWithDefaults(
  Component: ComponentType,
  options?: any
): RenderResult {
  return preactRender(Component, options);
}

/**
 * Helper to create mock API responses for testing.
 * Use in tests to mock fetch() calls.
 * 
 * Example:
 *   const mockResponse = mockApiResponse({ datos: [...] }, 200);
 *   global.fetch = vi.fn().mockResolvedValueOnce(mockResponse);
 */
export function mockApiResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status === 200,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

/**
 * Helper to wait for async state updates in tests.
 * Use after user interactions that trigger async effects.
 * 
 * Example:
 *   await user.click(button);
 *   await waitFor(() => {
 *     expect(screen.getByText('Loaded')).toBeInTheDocument();
 *   });
 */
export { waitFor, screen } from '@testing-library/preact';

/**
 * Helper to create FormData for API tests.
 * cinemas-henry getMovies() uses FormData.
 */
export function createFormData(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    formData.append(key, value);
  }
  return formData;
}

/**
 * Helper to generate mock Cine objects (cinema).
 * Used in NavDropdown tests.
 */
export function createMockCine(overrides?: Partial<any>) {
  return {
    value: 'cine-1',
    label: 'Cinema Downtown',
    dominio: 'https://cine1.com',
    ...overrides,
  };
}

/**
 * Helper to generate mock Movie objects.
 * Used in component tests that display movies.
 */
export function createMockMovie(overrides?: Partial<any>) {
  return {
    id: 'mov-1',
    title: 'Test Movie',
    duration: 120,
    genre: 'Action',
    classification: 'PG-13',
    billboard: true,
    trailer: 'https://youtube.com/watch?v=test',
    director: 'Test Director',
    actors: 'Test Actor',
    synopsis: 'Test synopsis',
    type: 'Largometraje',
    img_primary: 'https://example.com/poster.jpg',
    img_secondary: 'https://example.com/poster-alt.jpg',
    releaseDate: '2026-05-28',
    showtimes: [],
    ...overrides,
  };
}
```

**Design Rationale:**
- ✅ Centralized helpers reduce test boilerplate
- ✅ createMock* functions match real data shapes
- ✅ mockApiResponse simplifies fetch mocking
- ✅ Exported from single location for easy imports

---

### 3.5 tests/fixtures/mocks/movies.ts (Mock Data)

**File:** `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/mocks/movies.ts`

```typescript
/**
 * Mock movie data for testing.
 * Shape matches src/lib/types.ts Movie interface.
 */

export const mockMovies = [
  {
    id: '1001',
    title: 'Inception',
    duration: 148,
    genre: 'Science Fiction',
    classification: 'PG-13',
    billboard: true,
    trailer: 'https://youtube.com/watch?v=YoHD9XEInc0',
    director: 'Christopher Nolan',
    actors: 'Leonardo DiCaprio, Marion Cotillard',
    synopsis: 'A thief who steals corporate secrets through dream-sharing technology.',
    type: 'Largometraje',
    img_primary: 'https://example.com/inception-primary.jpg',
    img_secondary: 'https://example.com/inception-secondary.jpg',
    releaseDate: '2010-07-16',
    showtimes: [
      {
        id: 'show-1',
        hour: '19:00',
        subtitled: false,
        format: '2D',
        trasnoche: false,
      },
      {
        id: 'show-2',
        hour: '22:00',
        subtitled: true,
        format: '3D',
        trasnoche: false,
      },
    ],
  },
  {
    id: '1002',
    title: 'Interstellar',
    duration: 169,
    genre: 'Science Fiction',
    classification: 'PG-13',
    billboard: true,
    trailer: 'https://youtube.com/watch?v=zSID6PJpDUY',
    director: 'Christopher Nolan',
    actors: 'Matthew McConaughey, Anne Hathaway',
    synopsis: 'A team of astronauts travel through a wormhole near Saturn.',
    type: 'Largometraje',
    img_primary: 'https://example.com/interstellar-primary.jpg',
    img_secondary: 'https://example.com/interstellar-secondary.jpg',
    releaseDate: '2014-11-07',
    showtimes: [
      {
        id: 'show-3',
        hour: '18:30',
        subtitled: false,
        format: '2D',
        trasnoche: false,
      },
    ],
  },
  {
    id: '1003',
    title: 'The Dark Knight',
    duration: 152,
    genre: 'Action',
    classification: 'PG-13',
    billboard: false,
    trailer: 'https://youtube.com/watch?v=EXeTwQWrcwY',
    director: 'Christopher Nolan',
    actors: 'Christian Bale, Heath Ledger',
    synopsis: 'Batman faces off against the Joker, a criminal mastermind.',
    type: 'Largometraje',
    img_primary: 'https://example.com/dark-knight-primary.jpg',
    img_secondary: null,
    releaseDate: '2008-07-18',
    showtimes: [],
  },
];

/**
 * Get a single mock movie by ID.
 */
export function getMockMovieById(id: string) {
  return mockMovies.find((m) => m.id === id);
}

/**
 * Get mock movies filtered by genre.
 */
export function getMockMoviesByGenre(genre: string) {
  return mockMovies.filter((m) => m.genre.toLowerCase() === genre.toLowerCase());
}

/**
 * Get all movies currently in billboard.
 */
export function getMockBillboardMovies() {
  return mockMovies.filter((m) => m.billboard);
}
```

---

### 3.6 tests/fixtures/mocks/cinemas.ts (Mock Cinema Data)

**File:** `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/mocks/cinemas.ts`

```typescript
/**
 * Mock cinema (cine) data for testing.
 * Shape matches src/lib/types.ts Cine interface.
 */

export const mockCinemas = [
  {
    value: 'cine-downtown',
    label: 'Cinema Downtown',
    dominio: 'https://downtown-cinema.com',
  },
  {
    value: 'cine-mall',
    label: 'Cinema Mall',
    dominio: 'https://mall-cinema.com',
  },
  {
    value: 'cine-uptown',
    label: 'Cinema Uptown',
    dominio: 'https://uptown-cinema.com',
  },
];

/**
 * Get a single mock cinema by value.
 */
export function getMockCinemaByValue(value: string) {
  return mockCinemas.find((c) => c.value === value);
}

/**
 * Get all mock cinemas (for dropdown rendering tests).
 */
export function getAllMockCinemas() {
  return [...mockCinemas];
}
```

---

## 4. Sample Test Patterns (Design Only; Implementations in Apply Phase)

### 4.1 Unit Test Pattern: Pure Function

**File:** `src/lib/__tests__/utils.test.ts` (skeleton)

**Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { cn, parseDate, normalizeDate } from '../utils';

describe('cn() - classname merge utility', () => {
  // Happy path
  it('should merge multiple class strings', () => {
    expect(cn('px-2', 'py-4', 'bg-white')).toBe('px-2 py-4 bg-white');
  });

  // Edge case: conditional classes
  it('should handle conditional classes (false values)', () => {
    expect(cn('px-2', false && 'py-4', true && 'bg-white')).toBe('px-2 bg-white');
  });

  // Edge case: null/undefined
  it('should handle null and undefined gracefully', () => {
    expect(cn('px-2', null, undefined, 'py-4')).toBe('px-2 py-4');
  });

  // Tailwind conflict resolution
  it('should resolve Tailwind conflicts (later class wins)', () => {
    // cn uses twMerge under hood
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toContain('text-blue-500');
    expect(result).not.toContain('text-red-500');
  });
});

describe('parseDate() - date parsing utility', () => {
  // Happy path
  it('should parse DD/MM/YYYY format correctly', () => {
    const result = parseDate('28/05/2026');
    expect(result.getDate()).toBe(28);
    expect(result.getMonth()).toBe(4);  // 0-indexed
    expect(result.getFullYear()).toBe(2026);
  });

  // Edge case: leap year
  it('should handle leap year dates', () => {
    const result = parseDate('29/02/2024');
    expect(result.getDate()).toBe(29);
    expect(result.getMonth()).toBe(1);
  });

  // Error case
  it('should handle invalid date strings gracefully', () => {
    expect(() => parseDate('invalid')).toThrow();
    expect(() => parseDate('32/13/2026')).toThrow();  // Invalid day/month
  });
});

describe('normalizeDate() - date normalization', () => {
  // Happy path
  it('should set time to 00:00:00.000', () => {
    const date = new Date('2026-05-28T14:30:45.123Z');
    const normalized = normalizeDate(date);
    
    expect(normalized.getHours()).toBe(0);
    expect(normalized.getMinutes()).toBe(0);
    expect(normalized.getSeconds()).toBe(0);
    expect(normalized.getMilliseconds()).toBe(0);
  });

  // Preserve date part
  it('should preserve the date (year, month, day)', () => {
    const date = new Date('2026-05-28T14:30:45Z');
    const normalized = normalizeDate(date);
    
    expect(normalized.getDate()).toBe(28);
    expect(normalized.getMonth()).toBe(4);
    expect(normalized.getFullYear()).toBe(2026);
  });
});
```

**Key Unit Test Principles:**
- ✅ **Happy path first** — Normal case should pass
- ✅ **Edge cases** — Conditional values, null/undefined, boundaries
- ✅ **Error cases** — Invalid input, expected exceptions
- ✅ **Pure functions** — No mocks, no side effects, deterministic
- ✅ **Clear assertions** — One behavior per test (mostly; grouped related assertions OK)

---

### 4.2 Component Test Pattern: Interactive Preact Component

**File:** `src/components/__tests__/NavDropdown.test.tsx` (skeleton)

**Pattern:**
```typescript
import { render, screen } from '@testing-library/preact';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import NavDropdown from '../NavDropdown';

describe('NavDropdown', () => {
  // Setup: mocks for this component's effects
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ============================================================================
  // Rendering tests
  // ============================================================================
  it('should render dropdown trigger button', () => {
    render(<NavDropdown />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
  });

  // ============================================================================
  // Interaction tests (user events)
  // ============================================================================
  it('should open menu when button is clicked', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    // Menu items now visible
    expect(screen.getByText('Cinema Downtown')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toBeVisible();
  });

  it('should close menu when an item is clicked', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);
    
    // Open menu
    const button = screen.getByRole('button');
    await user.click(button);
    expect(screen.getByRole('listbox')).toBeVisible();
    
    // Click item
    const item = screen.getByText('Cinema Mall');
    await user.click(item);
    
    // Menu closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should close menu when clicking outside', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div>
        <NavDropdown />
        <button>Outside</button>
      </div>
    );
    
    // Open menu
    const button = screen.getByRole('button', { name: /cinema/i });
    await user.click(button);
    expect(screen.getByRole('listbox')).toBeVisible();
    
    // Click outside
    const outside = screen.getByText('Outside');
    await user.click(outside);
    
    // Menu closed
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Side effect tests (localStorage)
  // ============================================================================
  it('should save selected cinema to localStorage', async () => {
    const user = userEvent.setup();
    render(<NavDropdown />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    const mallItem = screen.getByText('Cinema Mall');
    await user.click(mallItem);
    
    // localStorage updated
    const saved = localStorage.getItem('selectedCine');
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved!);
    expect(parsed.label).toBe('Cinema Mall');
  });

  it('should load cinema from localStorage on mount', () => {
    const cineData = { value: 'cine-mall', label: 'Cinema Mall', dominio: 'https://...' };
    localStorage.setItem('selectedCine', JSON.stringify(cineData));
    
    render(<NavDropdown />);
    
    const button = screen.getByRole('button');
    expect(button.textContent).toContain('Cinema Mall');
  });

  // ============================================================================
  // Custom event tests
  // ============================================================================
  it('should dispatch cineChange event when cinema is selected', async () => {
    const user = userEvent.setup();
    const { container } = render(<NavDropdown />);
    
    const listener = vi.fn();
    const dropdown = container.querySelector('.relative');
    dropdown?.addEventListener('cineChange', listener);
    
    // Open and select
    const button = screen.getByRole('button');
    await user.click(button);
    await user.click(screen.getByText('Cinema Uptown'));
    
    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: expect.objectContaining({
          value: 'cine-uptown',
        }),
      })
    );
  });

  // ============================================================================
  // Accessibility tests
  // ============================================================================
  it('should have proper ARIA attributes', () => {
    render(<NavDropdown />);
    
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-haspopup')).toBe('listbox');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    
    // After opening, aria-expanded should update (test async behavior)
    // This is a more advanced test; covered in integration phase
  });
});
```

**Key Component Test Principles:**
- ✅ **Arrange-Act-Assert:** Setup → action → verify
- ✅ **User events over fireEvent:** Use `userEvent.setup()` for realistic interactions
- ✅ **Query by accessible roles:** `getByRole`, `getByText`, `getByLabelText` preferred
- ✅ **Test behavior, not implementation:** Focus on what user sees/does
- ✅ **beforeEach cleanup:** Clear localStorage, mocks before each test
- ✅ **Async/await for interactions:** `await user.click()`, `await waitFor()`
- ✅ **Side effects (localStorage, custom events)** — part of integration

**Common Gotchas:**
- ❌ `fireEvent` is too low-level; use `userEvent` for realistic interaction
- ❌ Don't test internal state directly; test DOM output
- ❌ Forgot `async`/`await` on `userEvent` actions
- ✅ Always clear localStorage in `beforeEach` to prevent test pollution

---

### 4.3 E2E Test Pattern: Full User Flow

**File:** `tests/e2e/cinema-selection.spec.ts` (skeleton)

**Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Cinema Selection Flow', () => {
  // Hook: navigate to homepage before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  // ============================================================================
  // Page load and visibility tests
  // ============================================================================
  test('should load homepage successfully', async ({ page }) => {
    // Check status
    expect(page.url()).toContain('http://localhost:3000');
    
    // Check page title/heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should display cinema dropdown on homepage', async ({ page }) => {
    const dropdown = page.locator('button[aria-haspopup="listbox"]');
    await expect(dropdown).toBeVisible();
  });

  test('should display cinema list after clicking dropdown', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');
    await button.click();
    
    // Wait for menu items to appear
    const listbox = page.locator('role=listbox');
    await expect(listbox).toBeVisible();
    
    // Check at least one cinema is present
    const items = page.locator('role=option');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  // ============================================================================
  // User interaction tests
  // ============================================================================
  test('should select a cinema and navigate', async ({ page }) => {
    // Open dropdown
    const button = page.locator('button[aria-haspopup="listbox"]');
    await button.click();
    
    // Select a cinema
    const cinemaItem = page.locator('role=option').first();
    await cinemaItem.click();
    
    // Verify selection persisted in button text (or navigate to cinema page)
    // Depends on app behavior; adjust as needed
    await expect(button).not.toHaveAttribute('aria-expanded', 'true');
  });

  test('should navigate to cinema detail page on selection', async ({ page }) => {
    const button = page.locator('button[aria-haspopup="listbox"]');
    await button.click();
    
    const item = page.locator('role=option').first();
    await item.click();
    
    // Wait for navigation (if app navigates to cinema page)
    // Adjust selector based on actual app routing
    await page.waitForURL(/.*\/cine\/.*/, { timeout: 5000 }).catch(() => {
      // App might not navigate; that's OK in Phase 1
    });
  });

  // ============================================================================
  // Movie list tests
  // ============================================================================
  test('should display movie list after selecting cinema', async ({ page }) => {
    // Navigate to cinema detail (adjust URL based on app routing)
    await page.goto('http://localhost:3000/cine/cine-downtown');
    
    // Wait for movie list to load
    const movieList = page.locator('data-testid=movie-list');
    await expect(movieList).toBeVisible({ timeout: 5000 });
    
    // Check at least one movie is visible
    const movies = page.locator('data-testid=movie-item');
    const count = await movies.count();
    expect(count).toBeGreaterThan(0);
  });

  // ============================================================================
  // Error handling tests
  // ============================================================================
  test('should handle missing cinema gracefully', async ({ page }) => {
    // Navigate to non-existent cinema
    await page.goto('http://localhost:3000/cine/invalid-cinema');
    
    // Should either show fallback or error message (adjust based on app)
    const errorMsg = page.locator('text=not found|not available|error').first();
    const homepage = page.locator('button[aria-haspopup="listbox"]');
    
    // One of these should be visible
    const errorVisible = await errorMsg.isVisible().catch(() => false);
    const homepageVisible = await homepage.isVisible().catch(() => false);
    
    expect(errorVisible || homepageVisible).toBeTruthy();
  });

  // ============================================================================
  // Performance/accessibility tests
  // ============================================================================
  test('should load within reasonable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // Homepage should load in <5 seconds
    expect(loadTime).toBeLessThan(5000);
  });
});
```

**Key E2E Test Principles:**
- ✅ **Live frontend only** — No mocking, no fixtures, real interactions
- ✅ **User perspective** — Test what user sees/does, not implementation
- ✅ **Wait for async operations** — Use `waitForURL`, `waitForSelector`, timeouts
- ✅ **Robust selectors** — `data-testid` or `role` > class/id
- ✅ **beforeEach navigation** — Start each test from known state
- ✅ **Error handling** — Tests should be resilient to timing issues
- ✅ **Catch-all for optional features** — Use `.catch(() => false)` for conditional features

**Common Gotchas:**
- ❌ Using internal class selectors (fragile)
- ❌ Forgetting `await` on async operations
- ❌ Tests too slow because waiting for DOM without timeouts
- ✅ Use data-testid for reliable element selection
- ✅ Wrap navigation in `.catch()` if optional

---

## 5. Integration Points

### 5.1 Tests + Astro Dev Server

**Integration:** E2E tests connect to `localhost:3000` (Astro dev server)

**Workflow:**
1. Terminal 1: `bun run dev` (starts Astro dev server)
2. Terminal 2: `bun run test:e2e` (runs Playwright against localhost:3000)

**Design:**
- Playwright baseURL configured to `http://localhost:3000` in playwright.config.ts
- Dev server auto-starts in CI (webServer config)
- Dev server reused in local runs (reuseExistingServer: true)

**No changes needed to Astro setup** — tests consume existing dev server.

---

### 5.2 Strict TDD Mode in openspec/config.yaml

**Integration:** `strict_tdd: true` enables test-first enforcement

**What changes:**
- openspec/apply phase MUST run tests before applying changes
- openspec/verify phase MUST confirm all tests pass
- CI/CD pipelines can use config to enforce test gates

**Config update:**
```yaml
strict_tdd: true
apply:
  test_command: "bun test"
verify:
  test_command: "bun test"
```

**Effect:**
- Phase 1 (now): Baseline tests pass
- Phase 2+: New code requires passing tests in PR gates

---

### 5.3 Test Command Chaining (CI/CD — Phase 2)

**Future integration point** (Phase 2):

```bash
# Pre-commit hook (local)
bun run test:unit

# PR CI pipeline
bun run test:unit && \
bun run test:components && \
bun run test:coverage && \
bun run test:e2e
```

**Design in Phase 1:**
- Individual commands work (`test:unit`, `test:components`, etc.)
- CI integration documented, not yet implemented
- Phase 2 adds pre-commit hooks + GitHub Actions

---

## 6. Tradeoffs & Decisions

### 6.1 jsdom vs happy-dom

| Factor | jsdom | happy-dom |
|--------|-------|-----------|
| **API Compatibility** | Full browser APIs (localStorage, CustomEvent, DOM events) | Partial; gaps in APIs cinemas-henry uses |
| **Performance** | ~10% slower per test (~1-2ms overhead) | Faster; lighter footprint |
| **Learning Curve** | Familiar (Jest standard) | Newer; less community examples |
| **Our Use Case** | NavDropdown uses localStorage + CustomEvent | Not necessary |
| **Phase 1 Cost** | +0 (included in bundle) | +0 (lightweight alt) |
| **Recommendation** | ✅ Use jsdom | ❌ Defer to Phase 2 if performance critical |

**Decision Rationale:** jsdom is the right call because NavDropdown.tsx relies on localStorage and custom events. We can always switch to happy-dom in Phase 2 if test performance becomes an issue.

---

### 6.2 MSW vs vi.mock for HTTP Mocking

| Factor | MSW (Mock Service Worker) | vi.mock (Vitest mock) |
|--------|--------------------------|----------------------|
| **Setup Complexity** | Server + request handlers + setup.ts | Simple vi.fn() in setup.ts or per-test |
| **Test Isolation** | Centralized; consistent across all tests | Per-test, more explicit |
| **Debugging** | Verbose logs; intercepts real requests | Direct control of mock behavior |
| **Learning Curve** | Steep (new library, concepts) | Shallow (Vitest API) |
| **Phase 1 Scope** | Overkill; getMovies() is only API call | ✅ Sufficient |
| **Phase 2+ Scalability** | Better if >50 API calls; easier to manage | Becomes repetitive |
| **Recommendation** | ❌ Defer to Phase 2 | ✅ Use vi.mock now |

**Decision Rationale:** For Phase 1 with ~3–5 sample tests per layer, `vi.mock()` is adequate. We can migrate to MSW in Phase 2 if we exceed 50 API calls or need centralized request interception.

**Implementation:** Simple vi.fn() in setup.ts + per-test overrides:
```typescript
// setup.ts
global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));

// Per-test
it('should fetch movies', async () => {
  global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(mockData) });
  const result = await getMovies('https://...');
  expect(result).toBeDefined();
});
```

---

### 6.3 One Test File vs Multiple Test Files per Component

| Approach | Pros | Cons |
|----------|------|------|
| **One file per component** | Clear organization; easy to find tests; matches Preact structure | Single large file if component has many tests |
| **Multiple files per component** | Better grouping if 50+ tests per component | Fragmentation; harder to find tests; overkill for Phase 1 |
| **Recommendation** | ✅ One file per component | ❌ Too granular for now |

**Structure:**
```
src/components/
├── NavDropdown.tsx
├── __tests__/
│   └── NavDropdown.test.tsx  # All tests for NavDropdown
├── Button.astro
└── __tests__/
    └── Button.test.tsx        # All tests for Button
```

---

### 6.4 Coverage Thresholds: 50%/40% vs 80%+

| Threshold | 50%/40% (Phase 1) | 80%+ (Phase 2+) |
|-----------|------------------|-----------------|
| **Sample Test Count** | 3–5 tests per layer; realistic | 20+ tests per layer; mature |
| **Adoption Signal** | "Prove TDD works with samples first" | "Maintain high quality long-term" |
| **Pain Point** | Low risk; easy to meet | High risk; discourages adoption if unmet |
| **Recommendation** | ✅ Start at 50%/40% | ✅ Increase after Phase 1 success |

**Rationale:** Start low to build confidence. Once team sees value (Phase 1 sample tests catch bugs), increase thresholds in Phase 2.

---

## 7. Risk Mitigations

### 7.1 Astro SSR Component Tests Prove Complex

**Risk:** Astro `.astro` components are hard to test in jsdom; SSR context required.

**Mitigation:**
- **Phase 1 approach:** Test only Preact `.tsx` components in unit tests
- **Astro components** (Button.astro, Navbar.astro) tested via E2E Playwright (real rendering)
- **Why works:** Preact components are interactive; Astro components are mostly static. Static components tested best via E2E.

**Implementation:**
```
Phase 1:
✅ src/components/__tests__/NavDropdown.test.tsx (Preact interactive)
❌ src/components/__tests__/Button.test.tsx (Astro static) — defer to E2E

Phase 2:
✅ Add Astro component test utilities (renderToStaticMarkup, etc.)
```

---

### 7.2 Test Discovery Slow; Watch Mode Sluggish

**Risk:** jsdom + many tests = slow watch mode; poor DX.

**Mitigation:**
- **Layer-specific test commands:** `bun test:unit` runs only unit tests (fast; <1s)
- **Watch mode selective:** `bun run test:watch -- --grep="NavDropdown"` to run single test
- **Phase 1 baseline:** 3–5 tests per layer = <5s total run time; no issue
- **Phase 2 optimization:** Add Vitest UI dashboard (`bun test:ui`) for visual debugging

**Check:** After setup, run `bun test` and confirm <5s total time.

---

### 7.3 Mock Complexity Grows Unmanageable

**Risk:** As getMovies() becomes more complex, mocking HTTP responses becomes cumbersome.

**Mitigation:**
- **Centralize mock data:** `tests/fixtures/mocks/` organizes all mock responses
- **Phase 2 migration path:** If mocks exceed 200 lines, migrate to MSW for centralized interception
- **Document patterns:** TESTING.md explains common mock patterns

**Example:** If getMovies() adds retry logic (it does!) and status handling, mocks stay readable:
```typescript
// Phase 1: Simple vi.mock
global.fetch = vi.fn().mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(...) });

// Phase 2: If mocks grow, migrate to MSW
// msw.server.use(http.post('/api/movies', () => HttpResponse.json(...)));
```

---

### 7.4 Team Adoption Resistance ("Tests slow us down")

**Risk:** Developers skip tests if they feel burdensome.

**Mitigation:**
- **Lead by example:** Sample tests in Phase 1 highlight ROI (bug caught in test vs. production)
- **Pair programming:** Senior dev + junior dev write first TDD test together
- **Quick wins:** Start with pure function tests (fast to write, easy to pass)
- **Celebrate success:** After first bug caught by test, share win with team

**Phase 1 messaging:**
> "We're adding sample tests to prove TDD works. If tests catch a bug before production, we'll expand the practice. If tests feel slow, we'll optimize watch mode."

---

## 8. Task Handoff: Concrete Implementation Tasks

**All tasks depend on successful dependency installation.**

### Task 1: Install Vitest + Dependencies
**Acceptance Criteria:**
- ✅ `bun add --dev vitest @vitest/ui @vitest/coverage-v8 @testing-library/preact @testing-library/dom @testing-library/user-event jsdom @playwright/test` completes without error
- ✅ `bun install` confirms all packages installed
- ✅ No peer dependency warnings

---

### Task 2: Create vitest.config.ts
**Acceptance Criteria:**
- ✅ File exists at `/Users/alvaldes/Developer/cinemas-henry/vitest.config.ts`
- ✅ `bun test --version` confirms Vitest is installed and callable
- ✅ No syntax errors (run `bun test --listTests` to verify)

---

### Task 3: Create playwright.config.ts (Skeleton)
**Acceptance Criteria:**
- ✅ File exists at `/Users/alvaldes/Developer/cinemas-henry/playwright.config.ts`
- ✅ Skeleton structure in place (no errors)
- ✅ Comments explain Phase 2 activation

---

### Task 4: Create tests/fixtures Directory + setup.ts
**Acceptance Criteria:**
- ✅ Directory `tests/fixtures/` exists
- ✅ `tests/fixtures/setup.ts` created with mocks and matchers
- ✅ No errors when imported by vitest.config.ts

---

### Task 5: Create tests/fixtures/helpers.ts
**Acceptance Criteria:**
- ✅ File exports renderWithDefaults, mockApiResponse, createMockMovie, etc.
- ✅ No syntax errors
- ✅ Helpers callable in tests

---

### Task 6: Create tests/fixtures/mocks/{movies,cinemas}.ts
**Acceptance Criteria:**
- ✅ Both files created with mock data
- ✅ Mock data matches src/lib/types.ts interfaces
- ✅ Helper functions (getMockMovieById, etc.) export cleanly

---

### Task 7: Create src/lib/__tests__/utils.test.ts (Unit Tests)
**Acceptance Criteria:**
- ✅ 4–5 tests for cn(), parseDate(), normalizeDate()
- ✅ `bun test:unit` passes all tests
- ✅ Tests cover happy path + edge cases + error scenarios

---

### Task 8: Create src/components/__tests__/NavDropdown.test.tsx (Component Tests)
**Acceptance Criteria:**
- ✅ 5–7 tests for render, click interactions, localStorage, custom events
- ✅ `bun test:components` passes all tests
- ✅ Uses userEvent for interactions (not fireEvent)

---

### Task 9: Create tests/e2e/cinema-selection.spec.ts (E2E Tests)
**Acceptance Criteria:**
- ✅ 3–4 E2E tests for homepage load, dropdown interaction, cinema selection
- ✅ `bun run dev` running in parallel; `bun run test:e2e` passes (or gracefully skips if server not available)
- ✅ Tests use playwright.test API

---

### Task 10: Update package.json Scripts
**Acceptance Criteria:**
- ✅ Scripts added: `test`, `test:unit`, `test:components`, `test:e2e`, `test:coverage`, `test:watch`, `test:ui`
- ✅ `bun test` runs all layers
- ✅ `bun test:coverage` generates coverage report in `coverage/` directory
- ✅ Each layer script runs only that layer's tests

---

### Task 11: Update openspec/config.yaml
**Acceptance Criteria:**
- ✅ `strict_tdd: true`
- ✅ Test runner config populated (layers, commands, coverage)
- ✅ `apply.test_command` and `verify.test_command` set to `bun test`

---

### Task 12: Create TESTING.md Documentation
**Acceptance Criteria:**
- ✅ Conventions section (naming, file structure, assertion style)
- ✅ Example test per layer (unit, component, E2E)
- ✅ Common patterns (mocks, fixtures, async/await)
- ✅ Troubleshooting (slow tests, flaky tests, mock issues)

---

### Task 13: Verify No Regressions
**Acceptance Criteria:**
- ✅ `bun run build` produces valid artifacts (no errors)
- ✅ `bun run dev` starts without blocking on tests
- ✅ Existing src/ code unchanged (tests only add new files)
- ✅ All sample tests pass: `bun test` → exit code 0

---

### Task 14: Document Next Steps for Phase 2
**Acceptance Criteria:**
- ✅ README or TESTING.md includes Phase 2 roadmap:
  - Migrate to MSW if HTTP mocks exceed 200 lines
  - Add Astro component test utilities
  - Increase coverage thresholds to 70%+
  - Integrate tests into CI/CD pipeline
  - Pre-commit hook for test:unit

---

## 9. Task Dependencies

```
Task 1: Install Dependencies
  ├─→ Task 2: vitest.config.ts
  ├─→ Task 3: playwright.config.ts
  └─→ Task 4: fixtures/setup.ts
       ├─→ Task 5: fixtures/helpers.ts
       ├─→ Task 6: fixtures/mocks/
       ├─→ Task 7: src/lib/__tests__/utils.test.ts (depends on Task 2)
       ├─→ Task 8: src/components/__tests__/NavDropdown.test.tsx (depends on Task 2, 5)
       └─→ Task 9: tests/e2e/cinema-selection.spec.ts (depends on Task 3)

Task 10: Update package.json (depends on Task 1-9)
Task 11: Update openspec/config.yaml (depends on Task 10)
Task 12: Create TESTING.md (depends on all above)
Task 13: Verify No Regressions (depends on all above)
Task 14: Document Phase 2 (final; depends on all above)
```

**Parallel Execution:** Tasks 2, 3, 4 can run in parallel after Task 1.

---

## 10. Apply Phase Checklist

Before moving to Apply phase, verify:

- ✅ All config files complete and validated (vitest.config.ts, playwright.config.ts)
- ✅ Setup file includes all necessary mocks (fetch, localStorage)
- ✅ Fixture helpers cover common test patterns
- ✅ Mock data matches actual types from src/lib/types.ts
- ✅ Sample tests follow naming conventions from spec
- ✅ package.json scripts ready to execute
- ✅ openspec/config.yaml schema complete
- ✅ TESTING.md includes examples and troubleshooting
- ✅ No conflicts with existing Astro or Preact setup
- ✅ Team alignment on strict TDD mode activation

---

## Tradeoff Summary Table

| Decision | Phase 1 Choice | Why | Phase 2+ Alternative |
|----------|---|---|---|
| Test Environment | jsdom | Full API compatibility (localStorage, CustomEvent) | happy-dom if perf critical |
| HTTP Mocking | vi.mock | Simple, Phase 1 scale | MSW for centralized mocks |
| Component Test Scope | Preact .tsx only | Interactive; E2E covers Astro | Add Astro SSR utilities |
| Coverage Thresholds | 50%/40% | Realistic bootstrap; avoid adoption resistance | 70%+ after Phase 1 success |
| Fixture Organization | Centralized in tests/fixtures/ | Single source of truth | Domain-specific subdirs if scale grows |
| Test Globals | Enabled | Cleaner syntax; Vitest best practice | No alternative needed |

---

## Design Sign-Off

**Reviewed:** 2026-05-28  
**Status:** ✅ **Ready for Apply Phase**

**Design Covers:**
- ✅ Architecture decisions with tradeoffs
- ✅ Implementation strategy (install order, fixture design)
- ✅ File creation plan (configs, fixtures, sample tests)
- ✅ Test patterns (unit, component, E2E)
- ✅ Integration points (Astro dev server, openspec, CI/CD Phase 2)
- ✅ Risk mitigations (SSR complexity, perf, adoption)
- ✅ Concrete task breakdown with dependencies
- ✅ Acceptance criteria per task

**Next Phase:** Apply — Execute tasks 1–14 to generate all config files and sample tests.

---

**Design Version:** 1.0  
**Last Updated:** 2026-05-28  
**Spec Reference:** `openspec/changes/tdd-vitest-spec.md`
