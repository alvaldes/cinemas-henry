# TDD Vitest Specification - Reference Guide

## Files in This Change

### Specification Document
- **`tdd-vitest-spec.md`** — Full SDD specification with 10 sections covering structure, tooling, scenarios, configuration, naming conventions, fixtures, scripts, and acceptance criteria.

### Example Test Files (Reference Templates)
- **`example-unit-test.txt`** — How to test pure utility functions (e.g., `cn()` classname merge). Shows arrange-act-assert pattern with describe blocks.
- **`example-component-test.txt`** — How to test Preact interactive components (e.g., `NavDropdown`). Demonstrates rendering, user interactions, accessibility, and mocks.
- **`example-e2e-test.txt`** — How to test full user flows with Playwright (e.g., cinema selection). Shows page navigation, assertions, and data verification.

## How to Use This Spec

### For Implementation (Design + Apply Phases)

1. **Read the Full Spec** (`tdd-vitest-spec.md`)
   - Section 1–4: Understand the tooling, file structure, and test scenarios
   - Section 5–6: Learn naming conventions and fixture strategy
   - Section 7–9: Reference the package.json scripts and acceptance criteria
   - Section 10 + Appendix: Use config templates to generate actual files

2. **Study the Examples**
   - Copy patterns from `example-unit-test.txt`, `example-component-test.txt`, `example-e2e-test.txt`
   - These are reference templates; adapt to actual src/lib and src/components files
   - Use as starting points for actual test files

3. **Create Real Test Files**
   - Unit tests: Place in `src/lib/__tests__/` (not .txt, actual .ts files)
   - Component tests: Place in `src/components/__tests__/` (actual .tsx files)
   - E2E tests: Place in `tests/e2e/` (actual .spec.ts files)

### For Review (Verify Phase)

- Verify that all 10 acceptance scenarios pass (section 9)
- Check that coverage reports are generated correctly
- Confirm that `bun test`, `bun test:unit`, `bun test:components`, `bun test:coverage` all work
- Review sample tests to ensure they follow naming and AAA pattern conventions

## Key Decisions Made in This Spec

| Decision | Rationale |
|----------|-----------|
| **Vitest** as main runner | Vite-native, fast, Jest-compatible, fits Astro ecosystem |
| **@testing-library/preact** for components | Industry standard, encourages testing user behavior not implementation |
| **jsdom environment** | Allows testing DOM interactions locally; no browser overhead in CI |
| **Test globals enabled** | Reduces import boilerplate; `describe`, `it`, `expect` available everywhere |
| **Coverage thresholds: 50%/40%** | Realistic starting point; can increase as team velocity grows |
| **Fixtures in `tests/fixtures/`** | Centralized, reusable mock data and test helpers |
| **No external API calls** | Mocked in unit/component; E2E tests use real frontend |
| **Three test scripts** | `test:unit`, `test:components`, `test:e2e` allow layer-specific runs; `test` runs all |

## Next Steps (After Spec Approval)

1. **Design Phase** (architecture decisions, `vitest.config.ts` final form)
2. **Tasks Phase** (granular tasks for installation, sample tests, config updates)
3. **Apply Phase** (create actual files, install dependencies, generate examples)
4. **Verify Phase** (run all tests, validate acceptance criteria, obtain team sign-off)

## Coverage Thresholds (Initial)

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Statements | 50% | Starting point; legacy code may not have tests yet |
| Branches | 40% | Branch coverage harder to achieve; lower threshold acceptable initially |
| Functions | 50% | New code should be tested; legacy can be lower |
| Lines | 50% | Same as statements; focus on new features |

**Note:** Thresholds can be increased to 70%–80% as team TDD culture matures (Phase 3+).

## Common Questions

### Q: Do I need to test every single function?
**A:** No. Start with critical business logic (date parsing, data transforms, state management). UI-only functions tested via component tests. Refactor gradually.

### Q: Should E2E tests mock the backend?
**A:** No. E2E tests use live frontend only. If you need to mock backend, do it at the Playwright middleware level (rarely needed).

### Q: What if my component uses Astro SSR?
**A:** Astro components tested via integration tests. Preact components (`.tsx`) tested with Testing Library. Astro `.astro` files with logic can be tested via E2E.

### Q: Can I use Jest instead of Vitest?
**A:** This spec is written for Vitest. Jest is possible but slower and less Astro-friendly. Recommend sticking with Vitest.

### Q: What about snapshot testing?
**A:** Avoid in this phase. Snapshots are fragile. Prefer explicit assertions (toBe, toContain, etc.). Snapshots can be introduced later if needed.

---

**Specification Version:** 1.0  
**Status:** Ready for Design Phase  
**Last Updated:** 2026-05-28
