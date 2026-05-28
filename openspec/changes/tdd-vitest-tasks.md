# SDD Tasks: Implement TDD Infrastructure with Vitest for cinemas-henry

**Change ID:** `tdd-vitest-infra`  
**Scope:** Complete task breakdown for three-layer TDD implementation  
**Status:** Tasks (ready for Apply phase)  
**Date:** 2026-05-28  
**Phase:** Task Breakdown  

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1,010 (configs + fixtures + tests + docs) |
| 400-line budget risk | High (exceeds budget; recommend chained PRs) |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Infrastructure) → PR 2 (Tests) → PR 3 (Integration) |
| Delivery strategy | stacked-to-main |
| Chain strategy | stacked-to-main |

**Decision needed before apply: Yes**

**Chained PRs recommended: Yes**

**Chain strategy: stacked-to-main**

**400-line budget risk: High**

---

## Line Count Breakdown & PR Strategy

**Total estimated changed lines:** ~1,010

- **vitest.config.ts:** ~80 lines
- **playwright.config.ts:** ~50 lines
- **tests/fixtures/setup.ts:** ~70 lines
- **tests/fixtures/helpers.ts:** ~100 lines
- **tests/fixtures/mocks/movies.ts:** ~80 lines
- **tests/fixtures/mocks/cinemas.ts:** ~50 lines
- **src/lib/__tests__/utils.test.ts:** ~80 lines
- **src/components/__tests__/NavDropdown.test.tsx:** ~150 lines
- **tests/e2e/cinema-selection.spec.ts:** ~100 lines
- **package.json changes:** ~10 lines
- **openspec/config.yaml updates:** ~40 lines
- **TESTING.md:** ~250 lines

**Estimated Total: ~1,010 lines**

### Recommended PR Chain: 3 Autonomous PRs

#### PR 1: Vitest Infrastructure & Fixtures (~360 lines)
- Task 1: Install Dependencies
- Task 2: Create vitest.config.ts
- Task 4: Create tests/fixtures/setup.ts
- Task 5: Create tests/fixtures/helpers.ts
- Task 6: Create tests/fixtures/mocks (movies.ts, cinemas.ts)
- Task 3: Create playwright.config.ts (skeleton; ~50 lines)

**Line count:** ~80 + 70 + 100 + 130 + 50 = **~430 lines** (exceeds 400 by 30; acceptable for infrastructure)

---

#### PR 2: Sample Tests (~330 lines)
- Task 7: Create src/lib/__tests__/utils.test.ts
- Task 8: Create src/components/__tests__/NavDropdown.test.tsx
- Task 9: Create tests/e2e/cinema-selection.spec.ts
- Task 10: Update package.json (scripts)

**Line count:** ~80 + 150 + 100 + 10 = **~340 lines** ✓

---

#### PR 3: Integration & Documentation (~250 lines)
- Task 11: Update openspec/config.yaml
- Task 12: Create TESTING.md
- Task 13: Verify No Regressions
- Task 14: Document Phase 2 Roadmap

**Line count:** ~40 + 250 + 0 (verify) + 50 (roadmap) = **~340 lines** ✓

---

### Chain Strategy: stacked-to-main

```
PR 1: base → feature/tdd-vitest-pr1 (infrastructure)
       ↓
PR 2: PR 1 → feature/tdd-vitest-pr2 (tests) [depends on PR 1]
       ↓
PR 3: PR 2 → feature/tdd-vitest-pr3 (integration) [depends on PR 2]
       ↓
Merge PR 1, PR 2, PR 3 to main in sequence
```

---

## Task Dependency Graph

```
INSTALL DEPS (Task 1)
├─→ VITEST CONFIG (Task 2)
├─→ PLAYWRIGHT CONFIG (Task 3)
├─→ FIXTURE SETUP (Task 4)
│    ├─→ FIXTURE HELPERS (Task 5)
│    └─→ FIXTURE MOCKS (Task 6)
├─→ UNIT TESTS (Task 7) [depends on Task 2]
├─→ COMPONENT TESTS (Task 8) [depends on Task 2, 5]
├─→ E2E TESTS (Task 9) [depends on Task 3]
└─→ PACKAGE.JSON SCRIPTS (Task 10) [depends on all above]
     ├─→ OPENSPEC UPDATE (Task 11) [depends on Task 10]
     ├─→ TESTING.MD (Task 12) [depends on all above]
     ├─→ VERIFY (Task 13) [depends on all above]
     └─→ PHASE 2 ROADMAP (Task 14) [final]
```

---

## Parallel Execution Strategy

**Phase 1 (Sequential - Install & Configs):**
- Task 1 → Task 2 (vitest), Task 3 (playwright), Task 4 (setup) — then proceed to fixtures

**Phase 2 (Parallel - Fixtures after setup):**
- After Task 4: Tasks 5 & 6 can run in parallel (both depend on setup only)

**Phase 3 (Parallel - Tests after fixtures):**
- After Task 1-6: Tasks 7, 8, 9 can run in parallel (each depends on different configs)

**Phase 4 (Sequential - Integration):**
- After Task 7-10: Tasks 11-14 must sequence (each depends on previous layer)

**Estimated Total Time:** 2.5–3 hours (if executed sequentially) or ~1.5–2 hours (with parallel execution)

---

---

# Task Breakdown

---

## Task 1: Install Vitest & Dependencies

**ID:** tdd-vitest-task-1  
**Depends On:** None (bootstrap task)  
**Estimated Time:** 10 min  
**Complexity:** Low  

### Description
Install all required npm/bun packages for Vitest, Testing Library, Playwright, and coverage tools. This is the foundational task; all other tasks depend on successful installation.

**Reference:** Design § 2.1 Implementation Strategy, Spec § 10 Dependencies

### Acceptance Criteria
- ✅ Command `bun add --dev vitest@^2.2.0` completes without errors
- ✅ All Vitest ecosystem packages installed (see package list below)
- ✅ `bun install` runs without peer dependency warnings (or only harmless warnings)
- ✅ `bun run vitest --version` outputs version 2.2.x
- ✅ `bun run playwright --version` outputs version 1.48.x
- ✅ No conflicts with existing Astro/Preact dependencies

### Implementation Steps
1. Open terminal in project root (`/Users/alvaldes/Developer/cinemas-henry`)
2. Run: `bun add --dev vitest@^2.2.0 @vitest/ui@^2.2.0 @vitest/coverage-v8@^2.2.0`
3. Run: `bun add --dev @testing-library/preact@^3.2.0 @testing-library/dom@^10.4.0 @testing-library/user-event@^14.5.0`
4. Run: `bun add --dev jsdom@^25.0.0`
5. Run: `bun add --dev @playwright/test@^1.48.0`
6. Run: `bun install` to finalize
7. Verify: `bun run vitest --version` (should output 2.2.x)
8. Verify: `bun run playwright --version` (should output 1.48.x)
9. Check `package.json` devDependencies section includes all packages

### Files Created/Modified
- `package.json` (modified: devDependencies section)
- `bun.lockb` (modified: lock file updated)

### Review Notes
- Bun may take 1–2 minutes to resolve and install dependencies
- If warnings appear about peer dependencies, that's normal; check for actual conflicts in the version output
- If jsdom installation fails, ensure you have a compatible Node.js version (18+)
- After installation, do NOT run tests yet (fixtures and configs don't exist)

---

## Task 2: Create vitest.config.ts

**ID:** tdd-vitest-task-2  
**Depends On:** Task 1 (install dependencies)  
**Estimated Time:** 15 min  
**Complexity:** Low  

### Description
Create the main Vitest configuration file. This configures the test environment (jsdom), globals, file discovery, coverage thresholds, and integration with Astro.

**Reference:** Design § 3.1 vitest.config.ts (Complete, Production-Ready), Spec § 4 Configuration Schema

### Acceptance Criteria
- ✅ File created at `/Users/alvaldes/Developer/cinemas-henry/vitest.config.ts`
- ✅ Configuration includes: environment='jsdom', globals=true, setupFiles=[...], coverage thresholds (50/40/50/50)
- ✅ File discovery patterns include `src/**/*.test.ts(x)` and `tests/**/*.spec.ts`
- ✅ No syntax errors (can check with `bun run vitest --version` or `bun run vitest --listTests`)
- ✅ TypeScript reference in header: `/// <reference types="vitest" />`
- ✅ Preact plugin imported and configured

### Implementation Steps
1. Create new file: `/Users/alvaldes/Developer/cinemas-henry/vitest.config.ts`
2. Copy template from Design § 3.1 (or inline below)
3. Update setupFiles path to point to `./tests/fixtures/setup.ts` (will be created in Task 4)
4. Verify syntax by running: `bun run vitest --listTests` (should output: no tests found yet, which is correct)
5. Check file exists: `ls -la vitest.config.ts`

### Files Created/Modified
- `vitest.config.ts` (new; ~80 lines)

### Review Notes
- The config uses `preact()` plugin; ensure this matches the @preact/preset-vite package (should be installed from package.json dependencies)
- If `preact()` plugin not found, fallback to `define.preactShim()` or remove plugin temporarily
- The setupFiles path is relative to project root; will be validated in Task 4
- Coverage thresholds are set to 50%/40%/50%/50% (realistic for Phase 1; can increase in Phase 2)

---

## Task 3: Create playwright.config.ts (Skeleton)

**ID:** tdd-vitest-task-3  
**Depends On:** Task 1 (install dependencies)  
**Estimated Time:** 10 min  
**Complexity:** Low  

### Description
Create the Playwright configuration file as a skeleton for E2E testing. Full implementation deferred to Phase 2; Task 3 establishes the structure and prepares for E2E test execution.

**Reference:** Design § 3.2 playwright.config.ts (Skeleton for Phase 2), Spec § 1 Layer 3: E2E Tests

### Acceptance Criteria
- ✅ File created at `/Users/alvaldes/Developer/cinemas-henry/playwright.config.ts`
- ✅ Configuration includes: testDir='./tests/e2e', baseURL='http://localhost:3000', reporter='html'
- ✅ Browser projects defined (chromium, firefox, webkit)
- ✅ No syntax errors (can run `npx playwright --version`)
- ✅ Comments indicate Phase 2 activation steps for webServer integration
- ✅ Skeleton structure does not block E2E test creation (Task 9)

### Implementation Steps
1. Create new file: `/Users/alvaldes/Developer/cinemas-henry/playwright.config.ts`
2. Copy template from Design § 3.2 (or inline in spec)
3. Ensure testDir points to `./tests/e2e` (will be created in Task 9)
4. Set baseURL to `http://localhost:3000` (Astro dev server)
5. Keep webServer section commented; will be activated in Phase 2
6. Verify syntax: `bun run playwright --version` (should output version, indicating install OK)

### Files Created/Modified
- `playwright.config.ts` (new; ~50 lines)

### Review Notes
- Playwright config is a skeleton; full E2E setup (webServer auto-start, auth fixtures) in Phase 2
- testDir points to tests/e2e which will be created in Task 9
- baseURL matches Astro dev server default (http://localhost:3000)
- Comment in config explains Phase 2 activation; leave as-is

---

## Task 4: Create tests/fixtures/setup.ts (Global Setup)

**ID:** tdd-vitest-task-4  
**Depends On:** Task 1 (install dependencies)  
**Estimated Time:** 15 min  
**Complexity:** Low  

### Description
Create the global test setup file. This file initializes Testing Library matchers, global mocks (fetch, localStorage), and cleanup hooks. Auto-loaded by vitest.config.ts (Task 2).

**Reference:** Design § 2.2 Setup File Strategy, Design § 3.3 tests/fixtures/setup.ts

### Acceptance Criteria
- ✅ File created at `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/setup.ts`
- ✅ File extends expect() with Testing Library matchers (toBeInTheDocument, etc.)
- ✅ Global fetch mock initialized (can be overridden per-test)
- ✅ Global localStorage mock implemented (with getItem, setItem, removeItem, clear, length, key methods)
- ✅ afterEach cleanup hook clears mocks and localStorage
- ✅ No errors when imported by vitest.config.ts

### Implementation Steps
1. Create directory: `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/` (if not exists)
2. Create file: `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/setup.ts`
3. Add imports: `import { expect, afterEach, vi } from 'vitest'` and Testing Library matchers
4. Implement localStorage mock (see Design § 3.3 for full code)
5. Implement global fetch mock with vi.fn()
6. Add afterEach cleanup hook
7. Verify: Run `bun run vitest --listTests` (should not error on setup.ts import)

### Files Created/Modified
- `tests/fixtures/setup.ts` (new; ~70 lines)
- `tests/fixtures/` directory (new; created if needed)

### Review Notes
- The setup file is loaded globally by vitest.config.ts; changes here affect ALL tests
- localStorage mock must implement full Storage API (getItem, setItem, removeItem, clear, length, key)
- fetch mock should return a minimal valid response structure; individual tests override as needed
- Optional: console.error suppression (commented out in template; uncomment if React warnings too noisy)
- If setup.ts fails to load, Vitest will error on test discovery; check import paths

---

## Task 5: Create tests/fixtures/helpers.ts (Test Utilities)

**ID:** tdd-vitest-task-5  
**Depends On:** Task 4 (setup.ts exists for context)  
**Estimated Time:** 15 min  
**Complexity:** Low  

### Description
Create test helper utilities: renderWithDefaults, mockApiResponse, createMockMovie, createMockCine, and other functions used in component and E2E tests.

**Reference:** Design § 2.3 Fixture Organization, Design § 3.4 tests/fixtures/helpers.ts

### Acceptance Criteria
- ✅ File created at `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/helpers.ts`
- ✅ Exports: renderWithDefaults, mockApiResponse, createMockMovie, createMockCine, createFormData
- ✅ Exports Testing Library utilities (waitFor, screen) for convenience
- ✅ Mock creation functions return objects matching src/lib/types.ts interfaces
- ✅ No circular dependencies (helpers.ts does NOT import from src/)
- ✅ JSDoc comments explain each function

### Implementation Steps
1. Create file: `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/helpers.ts`
2. Import from @testing-library/preact: `render`, `RenderResult`, `waitFor`, `screen`
3. Implement renderWithDefaults function (wraps preact render)
4. Implement mockApiResponse function (returns Promise with ok, status, json, text)
5. Implement createMockMovie function (returns object matching Movie interface)
6. Implement createMockCine function (returns object matching Cine interface)
7. Implement createFormData helper (for getMovies tests)
8. Add JSDoc comments above each function
9. Verify imports: `bun run vitest --listTests` (should not error)

### Files Created/Modified
- `tests/fixtures/helpers.ts` (new; ~100 lines)

### Review Notes
- Helpers.ts is imported explicitly in tests (not global); keep imports explicit
- Mock creation functions should use defaults that match actual data shapes in src/lib/types.ts
- Do NOT import from src/ in this file; prevents circular dependency issues
- Exported functions should be utility-level (helpers), not business logic
- JSDoc comments help IDEs provide autocomplete in test files

---

## Task 6: Create tests/fixtures/mocks (Mock Data)

**ID:** tdd-vitest-task-6  
**Depends On:** Task 5 (fixture setup complete)  
**Estimated Time:** 15 min  
**Complexity:** Low  

### Description
Create mock data files for movies and cinemas. These provide consistent test data for unit, component, and E2E tests.

**Reference:** Design § 2.3 Fixture Organization, Design § 3.5–3.6 Mock Data Files

### Acceptance Criteria
- ✅ Directory created: `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/mocks/`
- ✅ File created: `tests/fixtures/mocks/movies.ts` with mockMovies array and getMockMovieById, getMockMoviesByGenre, getMockBillboardMovies functions
- ✅ File created: `tests/fixtures/mocks/cinemas.ts` with mockCinemas array and getMockCinemaByValue, getAllMockCinemas functions
- ✅ Mock data objects match src/lib/types.ts Movie and Cine interfaces
- ✅ Mock movies include diverse examples (3+ movies) with showtimes, genres, images
- ✅ Mock cinemas include diverse examples (3+ cinemas) with domain/dominio URLs

### Implementation Steps
1. Create directory: `/Users/alvaldes/Developer/cinemas-henry/tests/fixtures/mocks/`
2. Create file: `tests/fixtures/mocks/movies.ts`
   - Define mockMovies array with 3 movies (Inception, Interstellar, The Dark Knight)
   - Each movie includes: id, title, duration, genre, classification, billboard, trailer, director, actors, synopsis, type, img_primary, img_secondary, releaseDate, showtimes
   - Implement getMockMovieById(id), getMockMoviesByGenre(genre), getMockBillboardMovies()
3. Create file: `tests/fixtures/mocks/cinemas.ts`
   - Define mockCinemas array with 3 cinemas (Cinema Downtown, Cinema Mall, Cinema Uptown)
   - Each cinema includes: value, label, dominio
   - Implement getMockCinemaByValue(value), getAllMockCinemas()
4. Verify imports: `bun run vitest --listTests` (should not error)

### Files Created/Modified
- `tests/fixtures/mocks/movies.ts` (new; ~80 lines)
- `tests/fixtures/mocks/cinemas.ts` (new; ~50 lines)
- `tests/fixtures/mocks/` directory (new)

### Review Notes
- Mock data should closely match actual API response shapes from getMovies() and cinema selection
- Include realistic examples: 2D/3D formats, showtimes, subtitled options, etc.
- Use descriptive IDs (cine-downtown) not just numbers
- Helper functions (getMockMovieById, etc.) provide easy filtering in tests
- Movies can have empty showtimes ([] for some); this tests edge cases

---

## Task 7: Create src/lib/__tests__/utils.test.ts (Unit Tests)

**ID:** tdd-vitest-task-7  
**Depends On:** Task 2 (vitest.config.ts), Task 4 (setup.ts)  
**Estimated Time:** 20 min  
**Complexity:** Medium  

### Description
Create unit tests for pure utility functions in src/lib/utils.ts. Tests cover: cn() (classname merge), parseDate(), normalizeDate(). These are the first sample tests establishing patterns.

**Reference:** Design § 4.1 Unit Test Pattern, Spec § 3 Layer 1: Unit Tests

### Acceptance Criteria
- ✅ File created: `/Users/alvaldes/Developer/cinemas-henry/src/lib/__tests__/utils.test.ts`
- ✅ Tests for cn() utility: merge classes, conditional classes, null/undefined, Tailwind conflict resolution
- ✅ Tests for parseDate() (if exists in src/lib/utils.ts): ISO format, DD/MM/YYYY format, invalid input error handling
- ✅ Tests for normalizeDate() (if exists): preserve date, zero-out time, etc.
- ✅ All tests pass: `bun run test:unit` → exit code 0
- ✅ At least 4 tests per function (happy path + edge cases + errors)
- ✅ Tests use Vitest globals (describe, it, expect without imports)

### Implementation Steps
1. Create directory: `/Users/alvaldes/Developer/cinemas-henry/src/lib/__tests__/`
2. Create file: `src/lib/__tests__/utils.test.ts`
3. Write describe block for cn(): happy path (merge), edge cases (conditional, null), Tailwind conflict
4. Write describe block for parseDate() (or adapt to actual function names): happy path, edge cases, errors
5. Add describe block for normalizeDate() (or similar date utility)
6. Use describe/it/expect (globals; no imports needed)
7. Run: `bun run test:unit` to verify all pass
8. Verify test output shows 4+ tests passing

### Files Created/Modified
- `src/lib/__tests__/utils.test.ts` (new; ~80 lines)
- `src/lib/__tests__/` directory (new)

### Review Notes
- If cn() doesn't exist in src/lib/utils.ts, adapt to actual utilities (classnames merge if present, or substitute with another utility)
- Date utilities might have different names (parseDate, formatDate, etc.); adjust test names accordingly
- Use Vitest globals (describe, it, expect, beforeEach, afterEach) enabled by vitest.config.ts
- Tests should follow AAA pattern: Arrange (setup), Act (call function), Assert (expect result)
- If utilities import other modules, setup.ts mocks (fetch, localStorage) will handle side effects
- All tests should pass in <2 seconds total

---

## Task 8: Create src/components/__tests__/NavDropdown.test.tsx (Component Tests)

**ID:** tdd-vitest-task-8  
**Depends On:** Task 2 (vitest.config.ts), Task 4 (setup.ts), Task 5 (helpers.ts)  
**Estimated Time:** 25 min  
**Complexity:** Medium  

### Description
Create component tests for NavDropdown.tsx (Preact interactive component). Tests cover: rendering, user interactions (click, hover), localStorage state persistence, custom events.

**Reference:** Design § 4.2 Component Test Pattern, Spec § 3 Layer 2: Component Tests

### Acceptance Criteria
- ✅ File created: `/Users/alvaldes/Developer/cinemas-henry/src/components/__tests__/NavDropdown.test.tsx`
- ✅ Tests for rendering: button visible, ARIA attributes correct
- ✅ Tests for interactions: click opens menu, items visible, click closes menu, click outside closes menu
- ✅ Tests for localStorage: selected cinema saved, cinema loaded from localStorage on mount
- ✅ Tests for custom events: cineChange event dispatched with correct data
- ✅ All tests pass: `bun run test:components` → exit code 0
- ✅ Tests use userEvent (not fireEvent) for realistic interactions
- ✅ At least 5–7 tests total

### Implementation Steps
1. Create directory: `/Users/alvaldes/Developer/cinemas-henry/src/components/__tests__/` (if not exists)
2. Create file: `src/components/__tests__/NavDropdown.test.tsx`
3. Import: render, screen from @testing-library/preact; userEvent; describe, it, expect, vi from vitest; NavDropdown component
4. Write tests following pattern from Design § 4.2:
   - beforeEach: localStorage.clear(), vi.clearAllMocks()
   - Test: render trigger button → expect button in document, has aria-haspopup
   - Test: click button → expect menu items visible
   - Test: click item → expect menu closed
   - Test: click outside → expect menu closed
   - Test: save cinema to localStorage on selection
   - Test: load cinema from localStorage on mount
   - Test: dispatch cineChange event on selection
5. Use userEvent.setup() for realistic user interactions (not fireEvent)
6. Use vi.fn() for custom event listeners
7. Run: `bun run test:components` to verify all pass
8. Verify test output shows 5+ tests passing

### Files Created/Modified
- `src/components/__tests__/NavDropdown.test.tsx` (new; ~150 lines)

### Review Notes
- NavDropdown.tsx must exist in src/components/; if not, adapt to actual interactive Preact component
- Use userEvent (not fireEvent) for realistic browser simulation
- beforeEach cleanup prevents test pollution (localStorage, mocks)
- Custom event tests use vi.fn() listeners; attach listener to component container
- Tests should verify both UI behavior (what user sees) and side effects (localStorage, events)
- Accessibility tests (ARIA attributes) improve test coverage and catch a11y bugs
- If NavDropdown uses Preact hooks (useState, useEffect), tests will validate those work correctly
- All tests should pass in <3 seconds total

---

## Task 9: Create tests/e2e/cinema-selection.spec.ts (E2E Tests)

**ID:** tdd-vitest-task-9  
**Depends On:** Task 3 (playwright.config.ts), Task 6 (mock data for context)  
**Estimated Time:** 20 min  
**Complexity:** Medium  

### Description
Create E2E tests using Playwright. Tests cover full user flows: homepage load, cinema selection, movie list display, navigation.

**Reference:** Design § 4.3 E2E Test Pattern, Spec § 3 Layer 3: E2E Tests

### Acceptance Criteria
- ✅ File created: `/Users/alvaldes/Developer/cinemas-henry/tests/e2e/cinema-selection.spec.ts`
- ✅ Tests for page load: homepage loads successfully, title/heading visible
- ✅ Tests for UI visibility: cinema dropdown visible, movie list visible after selection
- ✅ Tests for user interaction: click dropdown, select cinema, navigate to detail page
- ✅ Tests for error handling: gracefully handle invalid cinema
- ✅ At least 3–4 tests total
- ✅ Tests runnable via: `bun run dev` (in parallel terminal) + `bun run test:e2e`
- ✅ Tests use Playwright test API (test, expect, page.goto, page.locator, etc.)

### Implementation Steps
1. Create directory: `/Users/alvaldes/Developer/cinemas-henry/tests/e2e/` (if not exists)
2. Create file: `tests/e2e/cinema-selection.spec.ts`
3. Import: test, expect from @playwright/test
4. Write tests following pattern from Design § 4.3:
   - test.beforeEach: navigate to http://localhost:3000
   - Test: page loads successfully (check URL, page title)
   - Test: cinema dropdown visible on load
   - Test: cinema list displays after clicking dropdown (wait for listbox)
   - Test: select cinema, verify navigation (or URL change)
   - Test: navigate to cinema detail page, verify movie list visible
   - Test: handle missing cinema gracefully (navigate to invalid URL)
5. Use page.locator() with data-testid selectors where possible; fallback to role selectors
6. Use await page.waitForURL() for navigation verification
7. Use await expect(element).toBeVisible() for async DOM waits
8. Add .catch(() => false) for optional features (graceful handling)
9. Run tests: `bun run dev` in one terminal, `bun run test:e2e` in another
10. Verify test output shows 3+ tests passing (or gracefully skipping if frontend not running)

### Files Created/Modified
- `tests/e2e/cinema-selection.spec.ts` (new; ~100 lines)
- `tests/e2e/` directory (new)

### Review Notes
- E2E tests require `bun run dev` running (Astro dev server on localhost:3000)
- Tests use live frontend; no mocking (except optional Playwright interceptors)
- Selectors should be data-testid where possible; role-based selectors (getByRole) for accessibility
- Timeouts should be generous (5–10 seconds) for network/rendering delays
- E2E tests are slower than unit tests; only test critical user paths
- If frontend not running, test will hang; add timeout/skip logic
- Future E2E tests (Phase 2) will add auth flows, multi-step booking, etc.
- All tests should pass in <15 seconds total (with dev server already running)

---

## Task 10: Update package.json Scripts

**ID:** tdd-vitest-task-10  
**Depends On:** Task 2 (vitest.config.ts), Task 3 (playwright.config.ts), Tasks 7–9 (tests exist)  
**Estimated Time:** 5 min  
**Complexity:** Low  

### Description
Add test scripts to package.json: test, test:unit, test:components, test:e2e, test:coverage, test:watch, test:ui.

**Reference:** Design § 2.1 Implementation Strategy, Spec § 7 Package.json Scripts Specification

### Acceptance Criteria
- ✅ File updated: `/Users/alvaldes/Developer/cinemas-henry/package.json`
- ✅ Scripts section includes: test, test:unit, test:components, test:e2e, test:coverage, test:watch, test:ui
- ✅ `bun test` runs all layers and exits with code 0 (all pass)
- ✅ `bun test:unit` runs only unit tests
- ✅ `bun test:components` runs only component tests
- ✅ `bun test:e2e` runs only E2E tests (Playwright)
- ✅ `bun test:coverage` generates HTML coverage report in coverage/ directory
- ✅ `bun test:watch` starts watch mode (interactive; stays running)
- ✅ `bun test:ui` launches Vitest UI dashboard

### Implementation Steps
1. Open `/Users/alvaldes/Developer/cinemas-henry/package.json` in editor
2. Locate "scripts" section
3. Add these test scripts:
   ```json
   "test": "vitest run",
   "test:unit": "vitest run src/lib/__tests__",
   "test:components": "vitest run src/components/__tests__",
   "test:e2e": "playwright test",
   "test:coverage": "vitest run --coverage",
   "test:watch": "vitest watch",
   "test:ui": "vitest --ui"
   ```
4. Save file
5. Verify JSON syntax: `bun install` (should complete without errors)
6. Verify scripts work: `bun test --list` (should show all test files)

### Files Created/Modified
- `package.json` (modified: scripts section, ~10 lines added)

### Review Notes
- `bun test` is shorthand for `bun run test` (runs vitest run)
- test:unit filters to src/lib/__tests__ only
- test:components filters to src/components/__tests__ only
- test:e2e uses playwright test (different runner from vitest)
- test:coverage generates both HTML and text reports
- test:watch requires manually stopping (Ctrl+C)
- test:ui opens browser dashboard on http://localhost:51204
- All scripts should be executable from project root after Task 10 completes

---

## Task 11: Update openspec/config.yaml

**ID:** tdd-vitest-task-11  
**Depends On:** Task 10 (package.json scripts defined)  
**Estimated Time:** 10 min  
**Complexity:** Low  

### Description
Update openspec/config.yaml to enable strict TDD mode and populate test runner configuration.

**Reference:** Design § 8 openspec/config.yaml Updates, Spec § 8 openspec/config.yaml Updates

### Acceptance Criteria
- ✅ File updated: `/Users/alvaldes/Developer/cinemas-henry/openspec/config.yaml`
- ✅ Set `strict_tdd: true`
- ✅ Update testing.runner: command='vitest', framework='vitest'
- ✅ Update testing.layers: unit='src/lib/__tests__', component='src/components/__tests__', e2e='tests/e2e'
- ✅ Update testing.commands with unit, component, e2e test commands
- ✅ Update testing.coverage with coverage command
- ✅ Set apply.test_command='bun test'
- ✅ Set verify.test_command='bun test'
- ✅ No YAML syntax errors (can verify with any YAML linter)

### Implementation Steps
1. Open `/Users/alvaldes/Developer/cinemas-henry/openspec/config.yaml` in editor
2. Change `strict_tdd: false` → `strict_tdd: true`
3. Update context section to describe three-layer TDD setup
4. Update testing.runner section:
   - command: vitest
   - framework: vitest
5. Update testing.layers:
   - unit: src/lib/__tests__
   - component: src/components/__tests__
   - e2e: tests/e2e
6. Update testing.commands with three commands:
   - unit: [vitest run src/lib/__tests__]
   - component: [vitest run src/components/__tests__]
   - e2e: [playwright test]
7. Update testing.coverage.command: vitest run --coverage
8. Update apply.test_command: bun test
9. Update verify.test_command: bun test
10. Save file and verify YAML syntax (no errors)

### Files Created/Modified
- `openspec/config.yaml` (modified: ~40 lines updated)

### Review Notes
- YAML indentation must be consistent (2 spaces, not tabs)
- Arrays in YAML use dash notation: [- command1, - command2]
- Update context section to reflect TDD strategy (three-layer approach)
- strict_tdd: true enables test-first enforcement in future SDD phases
- Test commands reference package.json scripts (bun test, bun test:unit, etc.)
- Verify file loads correctly: grep strict_tdd /Users/alvaldes/Developer/cinemas-henry/openspec/config.yaml (should show true)

---

## Task 12: Create TESTING.md Documentation

**ID:** tdd-vitest-task-12  
**Depends On:** All previous tasks (tests and configs created)  
**Estimated Time:** 20 min  
**Complexity:** Medium  

### Description
Create TESTING.md documentation covering TDD conventions, file structure, naming, patterns, fixtures, and troubleshooting.

**Reference:** Design § 5 Naming & Convention Specification, Spec § 1–3 Test Layers

### Acceptance Criteria
- ✅ File created: `/Users/alvaldes/Developer/cinemas-henry/TESTING.md`
- ✅ Sections include: Overview, Quick Start, File Structure, Naming Conventions, Test Patterns (unit, component, E2E), Fixtures & Mocks, Common Patterns, Troubleshooting, Phase 2 Roadmap
- ✅ Example test per layer (copy from actual sample tests created in Tasks 7–9)
- ✅ Command reference: bun test, bun test:unit, bun test:components, bun test:e2e, bun test:coverage, bun test:watch
- ✅ Common patterns: beforeEach cleanup, using userEvent, custom events, localStorage mocking
- ✅ Troubleshooting: slow tests, flaky tests, mock issues
- ✅ Phase 2 roadmap: MSW migration, Astro component tests, coverage thresholds increase

### Implementation Steps
1. Create file: `/Users/alvaldes/Developer/cinemas-henry/TESTING.md`
2. Write sections in order:
   - # Testing with Vitest & Playwright
   - ## Quick Start (command reference)
   - ## File Structure (tree diagram or text)
   - ## Naming Conventions (describe/it naming rules)
   - ## Test Patterns (unit, component, E2E examples)
   - ## Fixtures & Mocks (how to use helpers, mock data)
   - ## Common Patterns (beforeEach, userEvent, custom events, localStorage)
   - ## Troubleshooting (slow tests, flaky tests, import errors)
   - ## Phase 2 Roadmap (MSW, Astro tests, CI/CD integration)
   - ## Resources (links to Vitest, Testing Library, Playwright docs)
3. Include actual example code from Tasks 7–9 (copy test patterns)
4. Add command reference table with all bun run test:* commands
5. Include file structure diagram showing where tests go
6. Save file and verify markdown syntax (no errors)

### Files Created/Modified
- `TESTING.md` (new; ~250 lines)

### Review Notes
- TESTING.md is the reference guide for the team; make it comprehensive but concise
- Include command examples with expected output (e.g., "bun test → Running 12 tests")
- Code examples should be copy-pasteable from actual test files
- Troubleshooting section should address: slow tests (use --grep), flaky E2E (timeouts), import errors (circular deps), mock issues
- Phase 2 roadmap signals future work (MSW, Astro components, CI/CD)
- Keep tone friendly and encouraging ("You've got this!" etc.)
- Add link to official docs (Vitest.dev, Testing Library, Playwright) for deeper dives

---

## Task 13: Verify No Regressions

**ID:** tdd-vitest-task-13  
**Depends On:** All previous tasks (Tasks 1–12 complete)  
**Estimated Time:** 15 min  
**Complexity:** Low  

### Description
Verify that the test infrastructure doesn't break existing Astro build/dev workflow. Run build, dev, and all test commands to ensure no regressions.

**Reference:** Design § 5 Risk Mitigations, Spec § 6 Acceptance Scenarios

### Acceptance Criteria
- ✅ `bun run build` completes successfully (no errors; exit code 0)
- ✅ Build artifacts generated in `dist/` directory
- ✅ `bun run dev` starts Astro dev server without blocking on tests (runs in parallel)
- ✅ `bun test` runs all test layers and passes (exit code 0)
- ✅ `bun test:unit` passes (exit code 0)
- ✅ `bun test:components` passes (exit code 0)
- ✅ `bun test:e2e` runs or gracefully skips (exit code 0 if server available)
- ✅ `bun test:coverage` generates coverage report in coverage/ directory
- ✅ No changes to existing src/ code (tests only add new files)
- ✅ No errors in console output

### Implementation Steps
1. Terminal 1: Run `bun run build`
   - Verify command completes
   - Check exit code: 0
   - Check dist/ directory exists and contains HTML/CSS/JS
2. Terminal 1: Run `bun run dev`
   - Verify dev server starts on http://localhost:3000
   - Keep running (leave terminal open)
3. Terminal 2: Run `bun test`
   - Verify all tests pass
   - Check exit code: 0
4. Terminal 2: Run `bun test:unit`
   - Verify unit tests pass
5. Terminal 2: Run `bun test:components`
   - Verify component tests pass
6. Terminal 2: Run `bun test:e2e`
   - Verify E2E tests run or gracefully skip
7. Terminal 2: Run `bun test:coverage`
   - Verify coverage report generated in coverage/index.html
   - Check text summary in terminal output
8. Terminal 1: Stop dev server (Ctrl+C)
9. Verify: `git status` shows only new test files (no src/ modifications)

### Files Created/Modified
- None (verification only; no new files)

### Review Notes
- This task is verification; no code changes
- If `bun run build` fails, check for TypeScript errors in Astro config or src/
- If dev server fails to start, check Astro version compatibility (should be 5.7.x+)
- If tests fail, review Tasks 7–9 (sample tests might have syntax errors)
- Coverage report should generate HTML; open coverage/index.html in browser to verify
- E2E tests might skip if dev server not running; that's OK (verify in separate terminal)
- If all commands pass, infrastructure is solid and ready for Phase 2

---

## Task 14: Document Phase 2 Roadmap

**ID:** tdd-vitest-task-14  
**Depends On:** Task 13 (verification complete)  
**Estimated Time:** 10 min  
**Complexity:** Low  

### Description
Document the Phase 2 roadmap as a signpost for the team. Outline planned improvements: MSW migration, Astro component tests, CI/CD integration, coverage threshold increases.

**Reference:** Design § 7 Tradeoffs & Decisions

### Acceptance Criteria
- ✅ Roadmap documented in TESTING.md (added section) or README.md (added section) or new PHASE2.md
- ✅ Roadmap includes: MSW HTTP mocking, Astro component test utilities, CI/CD pipeline integration, coverage threshold increases (to 70%+), pre-commit hooks
- ✅ Each item has: description, motivation (why), estimated effort, acceptance criteria
- ✅ Timeline: all Phase 2 work planned for 2–4 weeks after Phase 1 launch
- ✅ Clear ownership (e.g., "Team Lead to decide on MSW adoption")

### Implementation Steps
1. Choose location: Add to TESTING.md § Phase 2 Roadmap section (preferred) OR create README.md section
2. Write Phase 2 items:
   - **MSW Migration:** Centralize HTTP mocks if >50 API calls; setup MSW server in tests/fixtures/msw-server.ts
   - **Astro Component Tests:** Add Astro-specific test utilities (renderToStaticMarkup, etc.); test .astro components
   - **CI/CD Integration:** Add GitHub Actions workflow, pre-commit hook (bun test:unit), merge gate (all tests pass)
   - **Coverage Thresholds:** Increase to 70% statements / 60% branches / 70% functions / 70% lines
   - **E2E Expansion:** Add multi-step booking flow tests, error scenario tests
   - **Documentation:** Add contributing guide, test troubleshooting FAQ
3. For each item, include: motivation, effort estimate (small/medium/large), and acceptance criteria
4. Set timeline: "Phase 2 (Weeks 2–4 after Phase 1 launch)"
5. Assign ownership: "TBD; discuss in team retro"
6. Save and verify markdown syntax

### Files Created/Modified
- `TESTING.md` (modified: add Phase 2 Roadmap section) OR
- `README.md` (modified: add Testing section with Phase 2 roadmap) OR
- `PHASE2.md` (new; if creating separate file)

### Review Notes
- Phase 2 roadmap is informational; not a hard commitment
- Use this as a tool to gather team feedback (in retro)
- MSW migration should only happen if HTTP mocks become unwieldy (>200 lines)
- Astro component tests require specialized setup; defer to Phase 2
- CI/CD integration is critical for team adoption; prioritize in Phase 2
- Coverage thresholds can increase gradually (70%, then 80%+)
- Phase 2 roadmap signals that Phase 1 is a foundation, not the end state
- Share roadmap with team; let them propose Phase 2 priorities

---

---

## Task Execution Order (Recommended)

```
SEQUENTIAL:
1. Task 1: Install Dependencies (10 min) ⏳
   ↓
2. Tasks 2, 3, 4 (in parallel): 
   - Task 2: vitest.config.ts (15 min)
   - Task 3: playwright.config.ts (10 min)
   - Task 4: setup.ts (15 min)
   ⏳ (max 15 min; wait for all three)
   ↓
3. Tasks 5, 6 (in parallel after Task 4):
   - Task 5: helpers.ts (15 min)
   - Task 6: mocks (15 min)
   ⏳ (max 15 min; wait for both)
   ↓
4. Tasks 7, 8, 9 (in parallel after Tasks 2-6):
   - Task 7: utils.test.ts (20 min)
   - Task 8: NavDropdown.test.tsx (25 min)
   - Task 9: cinema-selection.spec.ts (20 min)
   ⏳ (max 25 min; wait for all three)
   ↓
5. Task 10: Update package.json (5 min) ⏳
   ↓
6. Task 11: Update openspec/config.yaml (10 min) ⏳
   ↓
7. Task 12: Create TESTING.md (20 min) ⏳
   ↓
8. Task 13: Verify No Regressions (15 min) ⏳
   ↓
9. Task 14: Document Phase 2 (10 min) ⏳

TOTAL TIME (sequential): ~2.5 hours
TOTAL TIME (with parallelization): ~1.5–2 hours
```

---

## PR Chain Mapping

### PR 1: Vitest Infrastructure & Fixtures
**Commit:** feat(testing): add Vitest infrastructure and fixtures

**Tasks Included:**
- Task 1: Install Dependencies
- Task 2: Create vitest.config.ts
- Task 3: Create playwright.config.ts
- Task 4: Create tests/fixtures/setup.ts
- Task 5: Create tests/fixtures/helpers.ts
- Task 6: Create tests/fixtures/mocks

**Files Changed:** ~7 files (configs + fixtures)  
**Lines Added:** ~430  
**Acceptance:**
- ✅ All dependencies installed
- ✅ Vitest and Playwright configs in place
- ✅ Setup.ts loads without errors
- ✅ Fixtures export helpers and mock data
- ✅ No tests run yet (fixtures only)

**Merge Criteria:**
- Code review: configs reviewed for correctness, no hardcoded values
- All files have no syntax errors (linter passes)
- READY FOR: Task 7–9 (tests can be built on PR 1 as base)

---

### PR 2: Sample Tests
**Commit:** feat(testing): add sample unit, component, and E2E tests

**Tasks Included:**
- Task 7: Create src/lib/__tests__/utils.test.ts
- Task 8: Create src/components/__tests__/NavDropdown.test.tsx
- Task 9: Create tests/e2e/cinema-selection.spec.ts
- Task 10: Update package.json (test scripts)

**Files Changed:** ~5 files  
**Lines Added:** ~340  
**Acceptance:**
- ✅ `bun test:unit` passes (4+ unit tests)
- ✅ `bun test:components` passes (5+ component tests)
- ✅ `bun test:e2e` runs or gracefully skips
- ✅ All test scripts work: `bun test`, `bun test:unit`, `bun test:components`, `bun test:e2e`
- ✅ `bun run build` still works (no regressions)

**Merge Criteria:**
- All sample tests pass
- Test scripts executable and working
- No regressions in build/dev
- Code review: test patterns follow conventions (describe/it naming, AAA structure, userEvent usage)
- READY FOR: Task 11–14 (integration and docs)

---

### PR 3: Integration & Documentation
**Commit:** feat(testing): update openspec, create TESTING.md, verify TDD infrastructure

**Tasks Included:**
- Task 11: Update openspec/config.yaml
- Task 12: Create TESTING.md
- Task 13: Verify No Regressions
- Task 14: Document Phase 2

**Files Changed:** ~2 files  
**Lines Added:** ~290  
**Acceptance:**
- ✅ `strict_tdd: true` set in config.yaml
- ✅ Test runner commands populated in config.yaml
- ✅ TESTING.md documents conventions, patterns, and Phase 2 roadmap
- ✅ All tests pass: `bun test` → exit code 0
- ✅ `bun run build` completes; `bun run dev` works
- ✅ Coverage report generates: `bun test:coverage` → coverage/index.html

**Merge Criteria:**
- All documentation clear and actionable
- YAML syntax valid (no linting errors)
- Phase 2 roadmap is informational (not binding)
- Code review: documentation is team-friendly, examples are correct
- READY FOR: Phase 2 work (MSW, Astro tests, CI/CD)

---

## Chained PR Merge Strategy

```
Main Branch Timeline:

Day 1: PR 1 (Vitest Infrastructure) reviewed & merged
   └─ All configs, fixtures ready
      
Day 1–2: PR 2 (Sample Tests) reviewed & merged (stacked on PR 1)
   └─ All tests passing; team can run `bun test`

Day 2–3: PR 3 (Integration & Documentation) reviewed & merged (stacked on PR 2)
   └─ strict_tdd enabled; TESTING.md in place; Phase 2 roadmap visible

✅ ALL DONE: Phase 1 complete. Team has TDD infrastructure, sample tests, documentation.
```

---

## Sign-Off & Next Steps

**Tasks Breakdown:** Complete  
**Estimated Total Effort:** 2.5 hours (sequential) or 1.5–2 hours (with parallelization)  
**Review Workload:** High (1,010 lines total; split into 3 PRs to manage review burden)  
**Chained PR Strategy:** stacked-to-main (PR 1 → PR 2 → PR 3)  
**Risk Level:** Low (infrastructure-only in Phase 1; no existing code changes)  

### Recommended Next Actions (Parent/Orchestrator)

1. ✅ **Approve this tasks breakdown** (you are here)
2. → **Launch Apply phase:** Execute tasks 1–14 in order (or parallelized as indicated)
3. → **Review each PR:** Verify acceptance criteria met before merge
4. → **After PR 3 merges:** Phase 1 COMPLETE; signal Phase 2 planning
5. → **Phase 2 planning:** Schedule follow-up SDD for MSW, Astro tests, CI/CD integration

---

**Tasks Document Version:** 1.0  
**Last Updated:** 2026-05-28  
**Status:** ✅ **Ready for Apply Phase**  
**Approver:** [Awaiting sign-off]
