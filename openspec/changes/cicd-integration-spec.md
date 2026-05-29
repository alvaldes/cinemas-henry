# SDD Spec: CI/CD Integration with GitHub Actions & Pre-commit Hooks

**Change ID:** `cicd-integration-phase2`  
**Phase:** Phase 2 (follows Phase 1 TDD Infrastructure)  
**Date:** 2026-05-28  
**Status:** Specification (approved from Proposal)

---

## Executive Summary

This specification defines a three-layer CI/CD automation strategy to enforce testing discipline:

1. **Pre-commit Hook (Local):** Block commits if unit tests fail (~5s)
2. **GitHub Actions Workflow (Remote):** Run full test suite on every PR/push to main
3. **Branch Protection Rules (Policy):** Prevent merge to main if CI fails

**No code changes to Phase 1 infrastructure.** Existing tests, config, and source code remain untouched.

---

## Part 1: GitHub Actions Workflow Specification

### 1.1 File Location & Naming

```
.github/workflows/test.yml
```

**Rationale:** GitHub automatically discovers workflows in `.github/workflows/` directory and runs them based on triggers defined in the YAML. Standard naming `test.yml` is discoverable and self-documenting.

### 1.2 Workflow Triggers

The workflow MUST be triggered on:

1. **Pull Request to any branch:** `on: pull_request`
   - When: Developer opens or updates a PR
   - Why: Validate that proposed changes don't break tests before merge
   - Action: Run full test suite, report results on PR

2. **Push to main branch:** `on: push` with `branches: [main]`
   - When: Code is pushed directly to main or PR merged
   - Why: Catch regressions that slip through PR checks
   - Action: Run full test suite, report status

3. **Manual trigger (optional):** `workflow_dispatch`
   - When: Developer manually triggers from GitHub Actions UI
   - Why: Re-run CI without pushing new commits
   - Action: Same as PR trigger

**YAML Configuration:**

```yaml
name: Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]
  workflow_dispatch:
```

**Behavior:**
- ✅ If triggered on PR: Workflow runs, results appear as "Checks" on PR
- ✅ If triggered on push to main: Workflow runs, fails if tests fail
- ✅ If triggered manually: Workflow runs on current branch

### 1.3 Node.js Compatibility Matrix

The workflow MUST test on multiple Node versions to ensure compatibility:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

**Rationale:**
- Node 18 LTS: Stable, widely used in production
- Node 20 LTS: Latest LTS, ensures forward compatibility
- Testing both ensures code works across supported environments
- If tests fail on one version, workflow reports which version failed

**Expected Behavior:**
- Runs 2 parallel job instances (one per Node version)
- If either job fails, entire workflow fails (can't merge)
- Developers see which Node version caused the failure

### 1.4 Job Steps

#### Step 1: Checkout Code

```yaml
- name: Checkout code
  uses: actions/checkout@v4
```

**Purpose:** Fetch the repository code from the commit being tested  
**Always:** Must be first step (no code = nothing to test)  
**Duration:** ~2 seconds

#### Step 2: Setup Node.js Runtime

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ matrix.node-version }}
```

**Purpose:** Install specified Node.js version on runner machine  
**Why:** GitHub runners don't include all Node versions by default  
**Duration:** ~30–60 seconds (includes npm registry warmup)

#### Step 3: Setup Bun Package Manager

```yaml
- name: Setup Bun
  uses: oven-sh/setup-bun@v1
  with:
    bun-version: latest
```

**Purpose:** Install Bun package manager (required by project)  
**Why:** `bun install` and `bun run test` commands need Bun available  
**Duration:** ~20–40 seconds

#### Step 4: Install Dependencies

```yaml
- name: Install dependencies
  run: bun install --frozen-lockfile
```

**Purpose:** Install project dependencies from lock file  
**Flag `--frozen-lockfile`:** Prevents modifying `bun.lockb` (ensures reproducible builds)  
**Why:** Fresh dependencies on each CI run ensures no stale or local package versions  
**Duration:** ~30–90 seconds (depends on network speed)

#### Step 5: Run Test Suite

```yaml
- name: Run tests
  run: bun run test
```

**Purpose:** Execute all tests (unit + component)  
**Command:** Calls `test` script from package.json (which runs `test:unit` + `test:components`)  
**Expected:** 28 tests pass, coverage ~81%  
**Duration:** ~5–10 seconds

#### Step 6: Generate Coverage Report

```yaml
- name: Generate coverage report
  run: bun run test:coverage
```

**Purpose:** Create HTML coverage report in `coverage/` directory  
**Why:** Coverage artifacts available for inspection after workflow  
**Duration:** ~5–10 seconds (same tests, with coverage collection)

#### Step 7: Upload Coverage Artifact

```yaml
- name: Upload coverage report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: coverage-report-node-${{ matrix.node-version }}
    path: coverage/
    retention-days: 7
```

**Purpose:** Store coverage HTML report as CI artifact  
**Condition `if: always()`:** Upload even if tests fail (for debugging)  
**Retention:** 7 days (enough to review, doesn't clog storage)  
**Access:** Developer downloads from GitHub Actions "Artifacts" tab on workflow run

### 1.5 Complete Workflow YAML

```yaml
name: Test Suite

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    name: Tests on Node ${{ matrix.node-version }}
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
      fail-fast: false

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run tests
        run: bun run test

      - name: Generate coverage report
        run: bun run test:coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report-node-${{ matrix.node-version }}
          path: coverage/
          retention-days: 7
```

### 1.6 Workflow Timeout & Resource Limits

```yaml
timeout-minutes: 10
```

**Rationale:**
- Unit + component tests complete in ~5–10 seconds locally
- 10-minute timeout allows for slow CI runners or network delays
- If workflow exceeds 10 minutes, GitHub kills it and marks as failed
- Prevents hanging jobs from wasting CI minutes

---

## Part 2: Pre-commit Hook Specification

### 2.1 Hook Framework: Husky

The project MUST use **Husky** to manage Git hooks.

**Why Husky?**
- Simple, npm-integrated framework (no bash scripting knowledge needed)
- Installs via `npm install` / `bun install`
- Auto-installed via `prepare` script (no manual setup required)
- Widely adopted in Node ecosystem
- Easy to bypass if needed (`git commit --no-verify`)

### 2.2 Pre-commit Hook Configuration

**File Location:**
```
.husky/pre-commit
```

**Hook Command:**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

bun run test:unit
```

**Behavior:**

| Condition | Outcome |
|-----------|---------|
| `test:unit` passes (0 exit code) | ✅ Commit is allowed; hook exits successfully |
| `test:unit` fails (non-zero exit code) | ❌ Commit is blocked; hook aborts; error shown to developer |
| Developer runs `git commit --no-verify` | ✅ Hook is bypassed; commit proceeds (even if tests fail) |

**Exit Codes:**
- Exit code `0` = success (git proceeds with commit)
- Exit code `1` (or any non-zero) = failure (git aborts commit)

### 2.3 Why `test:unit` (Not Full Suite)?

**Rationale:**
- Unit tests complete in <5 seconds (fast feedback loop)
- Component tests take ~1 second, but combined with unit = ~6 seconds
- Pre-commit is LOCAL; should fail fast to not block developer workflow
- Full test suite (with coverage) would take 10+ seconds, frustrating developers
- GitHub Actions will run full suite on remote; local hook is first-line defense

**Trade-off:**
- Component tests skipped in pre-commit
- GitHub Actions will catch component bugs (on PR)
- Developers trade 5s local check for guaranteed CI catch

### 2.4 Hook Installation: `prepare` Script

The `prepare` script in `package.json` MUST auto-install the hook:

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

**When it runs:**
- After `bun install` or `npm install` completes
- Automatically (no manual command needed)
- Only if `.husky/` directory exists

**Effect:**
- Husky CLI initializes Git hooks
- `.husky/pre-commit` becomes executable Git pre-commit hook
- Stored in `.git/hooks/pre-commit` (invisible to developer)

**First-time setup:**
```bash
# Developer clones repo
git clone https://github.com/...

# Then runs:
bun install

# Prepare script auto-runs:
# → husky install
# → .husky/pre-commit now active
```

### 2.5 Hook Bypass Mechanism

**Normal commit (with hook):**
```bash
git commit -m "Add new test"
# → pre-commit hook runs
# → tests fail? Commit blocked
# → tests pass? Commit proceeds
```

**Bypass hook (if absolutely needed):**
```bash
git commit --no-verify -m "Emergency fix"
# → pre-commit hook is SKIPPED
# → commit proceeds immediately
# → WARNING: This is dangerous; use only if pre-commit is broken
```

**When to bypass:**
- Pre-commit hook has a bug (edge case, rare)
- Network is down, can't fetch dependencies
- Emergency hotfix that can't wait (but will still face GitHub Actions CI)

**Documentation must warn:** Using `--no-verify` bypasses the safety net; code still must pass GitHub Actions CI before merge.

### 2.6 Hook Output & User Experience

**When test passes:**
```
✓ pre-commit hook passed
$ bun run test:unit
 ✓ src/lib/__tests__/utils.test.ts (16 tests)
 Test Files  1 passed (1)
      Tests  16 passed (16)

[main 3a9b8c2] Add new test
```

**When test fails:**
```
✗ pre-commit hook failed
$ bun run test:unit
 ✗ src/lib/__tests__/utils.test.ts (1 test)
 ✗ should return movies with correct count

husky - pre-commit hook exited with code 1 (error)

Commit aborted. Fix test errors above and try again.
```

**Developer workflow:**
1. Makes code changes
2. Runs `git commit -m "..."`
3. Pre-commit hook runs tests
4. If fail: Developer sees error, fixes code, retries commit
5. If pass: Commit succeeds

---

## Part 3: Branch Protection Rules

### 3.1 Where to Configure

**Location:** GitHub repository settings  
**Path:** Settings → Branches → Branch protection rules

### 3.2 Rule Configuration

#### Scope: Main Branch Only

```
Branch name pattern: main
```

**Rationale:**
- Only main is production-critical
- `develop` can have temporary failures (feature branches)
- Prevents accidental main breakage

#### Requirement: GitHub Actions Must Pass

```
Require status checks to pass before merging:
  ✅ Enabled
  
Status check: test (Test Suite)
```

**Behavior:**
- Merge button DISABLED if `test` workflow is not passing
- When workflow passes on PR, merge button becomes ENABLED
- If new commits are pushed after workflow passed (stale check), merge button becomes DISABLED again (must re-run)

#### Other Protection Settings

```
Allow force pushes: ❌ Disabled
Require code review approvals: ❌ Not required (optional; team choice)
Dismiss stale pull request approvals: ❌ Disabled
Allow deletions: ❌ Disabled
```

**Rationale:**
- No force push: Prevents accidental branch history rewrite
- No auto-code-review-dismiss: Code review stays valid even if new commits added
- No allow deletions: Prevents accidental main deletion

### 3.3 Configuration Steps

1. Go to repository Settings → Branches
2. Click "Add rule"
3. Enter branch name pattern: `main`
4. Check "Require status checks to pass before merging"
5. Search for and select: `test` (from workflow name)
6. Check "Require branches to be up to date before merging" (optional but recommended)
7. Click "Create"

**Result:**
- Merge to main now requires passing GitHub Actions workflow
- Impossible to merge broken code

---

## Part 4: Package.json Integration

### 4.1 Test Scripts

Existing scripts from Phase 1 remain unchanged:

```json
{
  "scripts": {
    "test": "bun run test:unit && bun run test:components",
    "test:unit": "vitest run src/lib/__tests__",
    "test:components": "vitest run src/components/__tests__",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run src/lib/__tests__ src/components/__tests__ --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui",
    "prepare": "husky install"
  }
}
```

**New:** `prepare` script (added for Phase 2)

### 4.2 DevDependencies Addition

Add to `devDependencies`:

```json
{
  "devDependencies": {
    "husky": "^9.1.7"
  }
}
```

**Version:** Latest stable `husky` v9  
**Why devDependency:** Husky is only needed for local development and CI setup; not needed in production

---

## Part 5: File Structure

### 5.1 Complete Phase 2 Structure

```
cinemas-henry/
├── .github/
│   └── workflows/
│       └── test.yml                    # NEW: GitHub Actions workflow
├── .husky/
│   ├── _/
│   │   ├── .gitignore
│   │   └── husky.sh                    # Auto-generated by husky install
│   └── pre-commit                      # NEW: Pre-commit hook script
├── docs/
│   └── CI-CD-SETUP.md                  # NEW: Setup & troubleshooting guide
├── src/
│   ├── lib/
│   │   ├── __tests__/
│   │   │   └── utils.test.ts           # (unchanged from Phase 1)
│   │   └── utils.ts                    # (unchanged from Phase 1)
│   └── components/
│       ├── __tests__/
│       │   └── NavDropdown.test.tsx    # (unchanged from Phase 1)
│       └── NavDropdown.tsx             # (unchanged from Phase 1)
├── tests/
│   └── fixtures/
│       ├── setup.ts                    # (unchanged from Phase 1)
│       ├── helpers.ts                  # (unchanged from Phase 1)
│       └── mocks/                      # (unchanged from Phase 1)
├── vitest.config.ts                    # (unchanged from Phase 1)
├── playwright.config.ts                # (unchanged from Phase 1)
├── package.json                        # MODIFIED: Add prepare script + husky
└── .gitignore                          # (already includes .husky/)
```

### 5.2 New Files to Create

| File | Purpose | Size |
|------|---------|------|
| `.github/workflows/test.yml` | GitHub Actions workflow definition | ~50 lines |
| `.husky/pre-commit` | Pre-commit hook script | ~4 lines |
| `docs/CI-CD-SETUP.md` | Setup guide + troubleshooting | ~300 lines |

---

## Part 6: Integration with Phase 1

### 6.1 No Changes to Phase 1 Code

**Phase 1 files remain untouched:**
- ✅ `src/lib/__tests__/utils.test.ts` — No modifications
- ✅ `src/components/__tests__/NavDropdown.test.tsx` — No modifications
- ✅ `vitest.config.ts` — No modifications
- ✅ `tests/fixtures/setup.ts` — No modifications
- ✅ All test utilities and helpers — No modifications

**Why?** Phase 1 tests are stable (28 passing); CI just runs them automatically. No code changes needed.

### 6.2 Reuse of Test Scripts

GitHub Actions workflow calls the SAME commands used locally:

**Locally:**
```bash
bun run test        # Runs: test:unit + test:components
bun run test:unit   # Runs unit tests only
```

**In GitHub Actions:**
```bash
bun run test        # Identical command
```

**Benefit:** If tests pass locally, they pass in CI (consistent environment)

### 6.3 Coverage Reports from Phase 1

Phase 1 established baseline coverage:
- Statements: 81.25%
- Branches: 75.6%
- Functions: 100%
- Lines: 82.66%

**Phase 2 CI artifacts:**
- GitHub Actions uploads coverage reports
- Developers can download and inspect
- Phase 3 can enforce coverage thresholds

---

## Part 7: Edge Cases & Error Handling

### 7.1 What If Pre-commit Hook Fails?

**Scenario:** Developer pushes code that breaks tests

**Local (pre-commit prevents commit):**
```bash
$ git commit -m "Add feature"
✗ Pre-commit hook failed
  Tests failed. Fix errors and retry.
$ # Developer fixes code
$ git commit -m "Add feature"  # Retry
✓ Commit succeeded
```

**Bypass (emergency):**
```bash
$ git commit --no-verify -m "Emergency fix"
✓ Commit succeeded (hook skipped)
$ # BUT: GitHub Actions CI will still fail on push
$ # Code won't merge to main
```

### 7.2 What If GitHub Actions Workflow Fails?

**Scenario:** Tests pass locally but fail in CI (e.g., Node 20 specific bug)

**PR Status:**
```
❌ Checks failed
  test (Test Suite) — FAILED
  Merge button: DISABLED
```

**Developer action:**
```bash
$ # See error in GitHub Actions logs
$ # Investigate why Node 20 fails
$ # Fix code locally
$ git push
$ # GitHub Actions re-runs automatically
$ # If pass now: Merge button enabled
```

### 7.3 What If Pre-commit Hook Breaks?

**Scenario:** Husky installation corrupted or git hooks directory missing

**Error:**
```bash
$ git commit -m "test"
husky - .git/hooks/pre-commit doesn't exist
```

**Recovery:**
```bash
bun install  # Runs prepare script again
husky install  # Manually re-install hooks
```

### 7.4 What If Node Version Differs Between Local & CI?

**Scenario:** Developer uses Node 18 locally; CI tests on Node 18 & 20

**Safeguard:** Workflow has `fail-fast: false`
- If Node 18 job passes but Node 20 fails, workflow still fails
- Developers see: "Tests pass on Node 18 but fail on Node 20"
- Ensures code works on all supported versions

### 7.5 Stale Status Checks

**Scenario:** PR passes CI, then developer pushes new commits

**Behavior (with "Require branches to be up to date"):**
- CI status becomes stale
- Merge button disabled
- Must re-run workflow on new commit
- Ensures CI always checks latest code

---

## Part 8: Testing Strategy for CI/CD Components

### 8.1 Testing Pre-commit Hook Locally

**Step 1:** Install hook
```bash
bun install  # Runs prepare script
```

**Step 2:** Make code change that breaks test
```bash
# Modify a test to intentionally fail
vim src/lib/__tests__/utils.test.ts
# Change expect(result).toBe(true) to expect(result).toBe(false)
```

**Step 3:** Try to commit
```bash
git add .
git commit -m "Broken test"
# Expected: ✗ Hook blocks commit
# Output: "Tests failed..."
```

**Step 4:** Fix the test, retry
```bash
vim src/lib/__tests__/utils.test.ts  # Revert change
git add .
git commit -m "Broken test"
# Expected: ✓ Commit succeeds
```

### 8.2 Testing GitHub Actions Workflow Locally (Dry-run)

Use **act** tool to simulate GitHub Actions locally (optional):

```bash
# Install act (if desired)
brew install act

# Run workflow simulation
act push --job test
# Simulates: push to main → test workflow runs
```

**Alternative:** Push to PR branch (not main) to test workflow without risk.

### 8.3 Testing Branch Protection Rules

**Step 1:** Make sure tests fail
```bash
git checkout -b test-branch
# Introduce failing test
git push origin test-branch
# Create PR to main
```

**Step 2:** Verify merge is blocked
```
GitHub PR page:
❌ "Checks failed"
❌ Merge button: DISABLED (red)
Message: "Required status check 'test' is failing"
```

**Step 3:** Make PR pass
```bash
git commit --allow-empty -m "Fix tests"  # Assume tests now pass locally
git push
# GitHub Actions re-runs
# If pass: Merge button: ENABLED (green)
```

### 8.4 Coverage Artifact Inspection

**After workflow completes:**
1. Go to GitHub Actions run page
2. Scroll to "Artifacts" section
3. Download `coverage-report-node-18.x.zip`
4. Extract and open `coverage/index.html` in browser
5. View detailed coverage breakdown

---

## Part 9: Success Acceptance Criteria

### 9.1 Workflow Acceptance

- ✅ `.github/workflows/test.yml` is valid YAML (no syntax errors)
- ✅ Workflow triggers on PR creation/update (green checkmark appears on PR)
- ✅ Workflow triggers on push to main (visible in Actions tab)
- ✅ Workflow passes with all 28 tests passing
- ✅ Workflow fails if any test fails (red X on PR)
- ✅ Workflow tests both Node 18 and Node 20
- ✅ Coverage reports uploaded as artifacts
- ✅ Workflow completes in <5 minutes

### 9.2 Pre-commit Hook Acceptance

- ✅ `bun install` auto-installs hook (runs `prepare` script)
- ✅ Hook blocks commit if `bun run test:unit` fails
- ✅ Hook allows commit if `bun run test:unit` passes
- ✅ Hook can be bypassed with `git commit --no-verify`
- ✅ Hook shows clear error messages when failing
- ✅ Hook runs silently on success (no output clutter)
- ✅ New developers clone repo and `bun install` → hook is ready

### 9.3 Branch Protection Acceptance

- ✅ Branch protection rule created for main branch
- ✅ Requires "test" workflow to pass before merge
- ✅ Merge button is disabled when CI fails (red)
- ✅ Merge button is enabled when CI passes (green)
- ✅ Force push is disabled (can't rewrite main history)
- ✅ Attempted merge with failing tests shows error

### 9.4 Documentation Acceptance

- ✅ `docs/CI-CD-SETUP.md` created and comprehensive
- ✅ Setup guide has step-by-step instructions
- ✅ Troubleshooting section covers common issues
- ✅ Examples show what success looks like
- ✅ Bypass instructions documented (with warnings)
- ✅ CI failure debugging guide included
- ✅ New developer can follow guide and understand system

---

## Part 10: Configuration Snippets & Examples

### 10.1 Complete `.husky/pre-commit` Snippet

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

bun run test:unit
```

**Installation:**
```bash
# After `bun install`, this file exists at .husky/pre-commit
# Git automatically executes it before commit
```

### 10.2 Complete `.github/workflows/test.yml` Snippet

(See Section 1.5 above for full YAML)

### 10.3 `package.json` Prepare Script Snippet

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "devDependencies": {
    "husky": "^9.1.7"
  }
}
```

---

## Part 11: Deployment Instructions

### 11.1 Pre-implementation Checklist

- [ ] All Phase 1 tests passing locally: `bun run test`
- [ ] No uncommitted changes in repo
- [ ] GitHub repository settings accessible
- [ ] Node 18 & 20 installed locally (for testing)

### 11.2 Implementation Order (for Apply phase)

1. **Create `.github/workflows/test.yml`** — Copy YAML from spec
2. **Create `.husky/pre-commit`** — Copy hook script from spec
3. **Update `package.json`** — Add `prepare` script + husky dependency
4. **Commit Phase 2 files** — `git add .` and commit
5. **Install hook locally** — `bun install` (runs prepare script)
6. **Test pre-commit hook locally** — Make change, commit (should pass)
7. **Push to GitHub** — GitHub Actions workflow runs automatically
8. **Configure branch protection** — Go to GitHub Settings → Branches
9. **Test protection rule** — Try merge without passing CI (should fail)
10. **Create `docs/CI-CD-SETUP.md`** — Documentation for team

### 11.3 Rollback Plan (if needed)

**If GitHub Actions workflow breaks:**
```bash
git revert <commit-hash>  # Revert workflow YAML addition
git push
```

**If pre-commit hook breaks:**
```bash
rm .husky/pre-commit
git commit -m "Remove broken hook"
# Or: bun install (reinstalls hooks)
```

**If branch protection causes problems:**
- Go to GitHub Settings → Branches → Remove/edit rule

---

## Part 12: Phase 1 Regression Testing

### 12.1 Ensure Phase 1 Still Works

After Phase 2 implementation, verify:

```bash
# Local test still passes
bun run test
# Expected: 28 tests passing

# Local coverage still generated
bun run test:coverage
# Expected: 81%+ coverage

# Dev server still starts
bun run dev
# Expected: Astro dev server on http://localhost:3000

# Build still works
bun run build
# Expected: .astro/ directory created (or errors if pre-existing)
```

**If any fail:** Phase 2 broke something. Review changes and fix.

---

## Summary

| Component | Location | Status |
|-----------|----------|--------|
| GitHub Actions Workflow | `.github/workflows/test.yml` | Specified |
| Pre-commit Hook | `.husky/pre-commit` | Specified |
| Package.json Integration | `package.json` | Specified |
| Branch Protection Rules | GitHub Settings UI | Specified |
| Documentation | `docs/CI-CD-SETUP.md` | To be written in Spec phase |

---

**Spec Version:** 1.0  
**Status:** ✅ **READY FOR DESIGN PHASE**  
**Next:** Design phase will detail edge cases and create `docs/CI-CD-SETUP.md`
