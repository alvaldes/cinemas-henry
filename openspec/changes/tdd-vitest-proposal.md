# SDD Proposal: Implement TDD Infrastructure with Vitest

**Change ID:** `tdd-vitest-proposal`  
**Date:** 2026-05-28  
**Status:** Proposal (awaiting approval)

---

## 1. Problem Statement

### Current State
The `cinemas-henry` project (Astro + Preact + Tailwind) has **zero testing infrastructure**:
- No test runner configured
- No test files or conventions
- `openspec/config.yaml` has empty test commands and `strict_tdd: false`
- Critical business logic (e.g., `getMovies()`, date parsing) is untested
- Refactoring and refactoring risky; no safety net

### Business Impact
1. **Defects in production:** Untested logic (date formatting, API parsing, component state) risks cinema booking failures
2. **Slow iteration:** Fear of breaking changes discourages refactoring and optimization
3. **Onboarding friction:** New developers lack clarity on what code does; no executable spec
4. **CI/CD gap:** Cannot enforce test coverage in merge gates
5. **Technical debt accumulation:** No foundation for sustainable development practices

### Why TDD + Vitest Now?
- **Vitest** is Vite-native, aligns with Astro's build system, provides Jest-compatible API (familiar to team)
- **Three-layer testing** (unit + component + E2E) covers the full codebase:
  - **Unit:** Pure functions (`parseDate`, `cn`, type conversions)
  - **Component:** Preact `.tsx` interactions and Astro SSR rendering
  - **E2E:** End-user flows (cinema selection, movie booking paths)
- **Strict TDD mode** enforces red-green-refactor for all new code, establishing a culture of confidence
- **openspec integration** makes tests discoverable by the change management system

---

## 2. Solution Summary

### Approach: Three-Layer TDD Infrastructure

#### Layer 1: Unit Tests (`src/lib/**/*.test.ts`)
- **Target:** Pure functions, utilities, type guards, data transformations
- **Examples:**
  - `parseDate()`, `normalizeDate()` 
  - `cn()` (classname merge)
  - Data validators
  - API response parsers
- **Runner:** Vitest native
- **Coverage goal:** >90% for critical paths

#### Layer 2: Component Tests (`src/components/**/*.test.tsx`)
- **Target:** Preact `.tsx` components and Astro components with interactive logic
- **Examples:**
  - `NavDropdown.tsx` state management and click handlers
  - `IconMap.tsx` icon rendering and props
  - `Button.astro` visual regressions and accessibility
- **Testing library:** `@testing-library/preact` + Vitest
- **Coverage goal:** >70% for interactive components

#### Layer 3: E2E Tests (`tests/e2e/**/*.spec.ts`)
- **Target:** Full user journeys through the app
- **Examples:**
  - Cinema selection → movie list rendering
  - Movie detail page → trailer loading
  - Multi-step booking flows
- **Runner:** Playwright (separate from Vitest)
- **Coverage goal:** Happy paths + critical error scenarios

### Implementation Tasks (Summary)

1. **Install & configure Vitest**
   - Add `vitest` dev dependency
   - Create `vitest.config.ts` with Astro/Preact support
   - Add test scripts to `package.json`

2. **Bootstrap test infrastructure**
   - Create sample tests per layer to establish conventions (assertion style, naming, structure)
   - Configure coverage thresholds in `vitest.config.ts`
   - Add `.test.ts` and `.test.tsx` to `.gitignore` if needed

3. **Update openspec/config.yaml**
   - Set `strict_tdd: true`
   - Populate test runner config (Vitest + Playwright paths and commands)
   - Document layer-specific test commands

4. **Create CI/CD integration** *(out of scope for this SDD phase; flagged for follow-up)*
   - Pre-commit hook to run tests
   - GitHub Actions / pipeline configuration

5. **Establish TDD culture**
   - Document conventions (test naming, file structure, fixtures)
   - README with examples for each layer

---

## 3. Scope: What's IN, What's OUT

### IN Scope ✅
- Install Vitest and configure `vitest.config.ts`
- Install `@testing-library/preact` and supporting utilities
- Create **sample tests** for each layer (minimum 3–5 passing tests per layer)
- Update `package.json` scripts:
  - `test:unit` – unit tests only
  - `test:components` – component tests only
  - `test:e2e` – E2E tests (Playwright setup deferred)
  - `test` – run all; fail if any layer fails
  - `test:coverage` – coverage report
- Update `openspec/config.yaml` with test runner config and `strict_tdd: true`
- Create `tests/` directory structure and sample fixtures
- Document TDD conventions in `TESTING.md`

### OUT of Scope ❌
- **Migrate existing code to tests** – only sample tests to establish patterns
- **Full E2E with Playwright** – fixture, but detailed E2E suite deferred to Phase 2
- **Performance profiling** – out of scope
- **Coverage enforcement in CI/CD** – documented, but implementation in Phase 2
- **Test maintenance for all existing code** – only demonstrate how to test each layer

### Non-Goals
- Replace existing Astro SSR rendering or component architecture
- Introduce new dependencies beyond Vitest, Testing Library, Playwright
- Document all possible test scenarios (focus on teaching patterns)

---

## 4. Expected Benefits

### Immediate (after this proposal is implemented)
1. **Confidence in refactoring:** Developers can refactor business logic with a safety net
2. **Self-documenting code:** Tests act as executable specifications; new contributors see examples instantly
3. **Faster bug fixes:** Regressions caught before merge; lower production incident rate
4. **Onboarding speed:** TDD examples in `TESTING.md` reduce learning curve

### Medium-term (within 2–4 weeks)
1. **Cultural shift:** Team habit of writing tests first becomes normalized
2. **Lower defect rate:** Tests catch edge cases (date parsing in different zones, API failures)
3. **CI/CD foundation:** Pre-merge test gates enforced; confidence in automated deploys

### Long-term (>1 month)
1. **Sustainable velocity:** Less time on debugging; more time on features
2. **Knowledge preservation:** Codebase remains maintainable as the team grows
3. **System resilience:** Multi-layer tests catch issues at each abstraction level

---

## 5. Success Criteria

### Testing Infrastructure
- ✅ Vitest installed and `vitest.config.ts` configured for Astro + Preact
- ✅ `bun test` (or `bun run test`) runs all test layers (unit, component, E2E stubs)
- ✅ Coverage reports generated via `bun run test:coverage`
- ✅ At least 5 sample tests pass in each layer (unit, component, E2E stubs)

### Configuration
- ✅ `openspec/config.yaml` updated:
  - `strict_tdd: true`
  - Test runner commands populated (unit, component, e2e)
  - Test command references in `apply` and `verify` sections

### Documentation
- ✅ `TESTING.md` created with:
  - Overview of three-layer strategy
  - File structure and naming conventions
  - Example test per layer
  - Common patterns (mocks, fixtures, assertions)
- ✅ Existing `README.md` updated with "Running Tests" section

### Acceptance by Team
- ✅ TDD approach approved by team lead
- ✅ Sample tests reviewed and approved as reference architecture
- ✅ Team can write their first test in isolation without pairing

### No Regressions
- ✅ `bun run build` still produces valid build artifacts
- ✅ `bun run dev` works; no blocking issues for local development
- ✅ Existing `package.json` and CI/CD scripts unaffected (additive only)

---

## 6. Assumptions

1. **Team is comfortable with TypeScript** – Tests will use TS; syntax must feel natural
2. **Vitest learning curve is acceptable** – Similar to Jest; existing Jest knowledge transfers
3. **Sample tests will guide future tests** – Team learns by example, not extensive documentation
4. **E2E can start minimal** – Playwright setup deferred; basic stubs only
5. **No CI/CD pipeline changes required yet** – Tests run locally; pipeline integration in Phase 2

---

## 7. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Slow test runs** block dev velocity | High | Configure Vitest for isolated test runs; use `--watch` mode; optimize imports in config |
| **Complex Astro SSR tests** | Medium | Start with Preact `.tsx` only; Astro `.astro` files tested via integration tests (later phase) |
| **E2E setup delay** | Low | Playwright stubs provided; full E2E suite in Phase 2; unit + component tests unblocked |
| **Team TDD adoption resistance** | Medium | Lead by example; sample tests highlight ROI; pair-program first TDD tests with team |
| **Coverage thresholds too strict** | Medium | Set realistic initial thresholds (>50% for legacy, >80% for new); revisit monthly |

---

## 8. Next Steps (Phase Handoff)

If approved, this proposal moves to:

1. **Spec Phase:** Define exact test structure, assertion libraries, and fixture strategies
2. **Design Phase:** Architect `vitest.config.ts`, layer-specific conventions, and CI/CD hooks
3. **Tasks Phase:** Create granular tasks for installation, sample tests, and config updates
4. **Apply Phase:** Execute tasks; generate sample test files
5. **Verify Phase:** Validate all criteria; obtain team sign-off

---

## Approval Sign-Off

**Proposed by:** AI Assistant  
**Date:** 2026-05-28  
**Status:** 🟡 **Awaiting Review**

---

## Related Documents

- `openspec/config.yaml` – Current (will be updated in Apply phase)
- `package.json` – Current dependencies (Vitest will be added)
- `TESTING.md` – Will be created in Apply phase
- Design Phase Output: `openspec/changes/tdd-vitest-design.md` (future)
- Tasks Phase Output: `openspec/changes/tdd-vitest-tasks.md` (future)
