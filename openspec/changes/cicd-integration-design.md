# SDD Design: CI/CD Integration with GitHub Actions & Pre-commit Hooks

**Change ID:** `cicd-integration-phase2`  
**Phase:** Phase 2 (follows Phase 1 TDD Infrastructure)  
**Date:** 2026-05-28  
**Status:** Design (approved from Spec)  
**Author:** AI Assistant  

---

## Executive Summary

This design translates the approved CI/CD Specification into architectural decisions, integration strategies, and verification methods.

**Three-layer architecture:**
1. **Pre-commit hook (local, fail-fast):** Blocks commits if unit tests fail
2. **GitHub Actions workflow (remote, full suite):** Validates all tests on PR/main push
3. **Branch protection (policy, enforce):** Prevents merge if CI fails

**Key design principles:**
- ✅ Zero friction for developers (pre-commit auto-installed via `prepare` script)
- ✅ No Phase 1 code changes (purely additive)
- ✅ Fast feedback loop (pre-commit <5s, GitHub Actions ~10s)
- ✅ Graceful error recovery (clear error messages, documented escape hatches)

---

## Part 1: Architecture Decisions & Rationale

### 1.1 Pre-commit Hook Manager: Why Husky Over Alternatives?

#### Comparison Matrix

| Tool | Install | Integration | Overhead | Maintenance | Ecosystem |
|------|---------|-------------|----------|-------------|-----------|
| **Husky** | npm/bun native | Via `prepare` script | ~2MB | Active (30K+ stars) | Widest adoption |
| **simple-git-hooks** | npm native | Manual setup | ~200KB | Moderate | Limited |
| **git-hooks** | Manual bash | Manual bash scripting | None | Low | Minimal |
| **Leftook** | Standalone binary | Via config file | ~5MB | New/experimental | Growing |
| **pre-commit (Python)** | pip/conda | Config-based YAML | ~30MB | Very active | Python ecosystem |

#### Decision: **Husky**

**Rationale:**

1. **Auto-installation via `prepare`:** After `bun install`, hooks are ready—no manual setup needed
   - New developers clone repo → `bun install` → hook is active
   - Zero friction onboarding
   - Contrast: Other tools require `npm run setup-hooks` or manual git config

2. **JavaScript/TypeScript native:**
   - Already in Node ecosystem (cinemas-henry uses bun/Node)
   - Integrates directly with `package.json` scripts
   - Contrast: `pre-commit` (Python) adds language dependency

3. **Widest adoption (30K+ GitHub stars):**
   - Industry standard; documentation everywhere
   - Future team members already know it
   - Less risk of tool abandonment

4. **Trivial to disable:**
   - Single command: `git commit --no-verify`
   - Hook can't break the team (escape hatch always exists)
   - Contrast: Some tools require config changes to disable

5. **Minimal shell scripting:**
   - Hook is pure bash (no complex logic)
   - Easy to debug if something breaks
   - Contrast: complex setup in other tools

**Trade-offs:**

- ✅ Requires npm/bun (but project already uses bun)
- ✅ Adds ~2MB to node_modules (negligible)
- ✅ Hook must be reinstalled if `.husky` directory deleted (documented)

**Decision locked in:** Use Husky 9.x

---

### 1.2 Node.js Versions: Why 18 & 20?

#### Version Selection Rationale

**Node 18 LTS:**
- Released April 2022 (stable for 3+ years)
- Current oldest supported LTS in production
- Many existing projects still on Node 18
- **Why test on it:** Ensure backwards compatibility for teams not yet on Node 20

**Node 20 LTS:**
- Released April 2023 (newest LTS; mainstream until April 2025)
- Latest stable version
- Significant performance improvements over 18
- **Why test on it:** Ensure forward compatibility; future-proof code

**Node 16:** (End-of-life Sept 2023)
- ❌ Too old; no security updates
- ❌ Would require Phase 1 tests to be updated

**Node 22+:** (Latest current release)
- ⚠️ Not LTS; only 6-month support window
- ⚠️ Too bleeding-edge for production guarantee
- ⚠️ Would break in 6 months when 22 reaches EOL

#### Decision: Test on **Node 18.x and 20.x only**

**Rationale:**

1. **LTS-only strategy:**
   - Only test versions with long-term support
   - Current stable bracket: 18 (until April 2025) and 20 (until April 2026)
   - Aligns with production deployment targets

2. **Team compatibility:**
   - Assume team uses Node 18 or 20 locally
   - CI tests the same versions
   - If tests pass on 18 & 20, deployments will succeed

3. **GitHub Actions resource efficiency:**
   - Matrix runs 2 parallel jobs (fast; ~10s each)
   - Running 3+ versions adds time without proportional value
   - Keep CI feedback loop fast (<10s per PR)

4. **Future-proof window:**
   - Node 18 supported until April 2025
   - Node 20 supported until April 2026
   - By April 2025, Node 22 will be LTS; rotate versions then

**Trade-offs:**

- ✅ Node 16 users won't get CI validation (acceptable; EOL anyway)
- ✅ Node 22 early adopters won't be validated (acceptable; not LTS yet)
- ✅ Matrix runs 2 jobs instead of 1; adds ~30s to CI (worth the compatibility gain)

**Decision locked in:** Matrix = [18.x, 20.x]

---

### 1.3 GitHub Actions Matrix: Why `fail-fast: false`?

#### Configuration Option

```yaml
strategy:
  fail-fast: false  # Allow all jobs to complete even if one fails
```

#### Alternative: `fail-fast: true` (Default)

| Behavior | fail-fast: true | fail-fast: false |
|----------|-----------------|-----------------|
| Job 1 (Node 18) fails | ❌ Job 2 cancelled immediately | ❌ Job 2 still runs |
| Result visibility | Only see Node 18 failure | See BOTH Node 18 & 20 results |
| Feedback | "One version failed; stop testing" | "Node 18 failed; Node 20 passed" |
| Time | ~10s (faster) | ~10s (same; parallel anyway) |

#### Decision: **`fail-fast: false`**

**Rationale:**

1. **Diagnostic visibility:**
   - If Node 18 fails but Node 20 passes, developer sees the mismatch
   - Example: "Tests pass on Node 20 but fail on Node 18" → specific version bug
   - Contrast: With `fail-fast: true`, workflow stops; developer doesn't know if Node 20 passes

2. **No time penalty:**
   - GitHub Actions runs jobs in parallel (not sequential)
   - With 2 jobs, total time is ~10s regardless of `fail-fast` setting
   - (If sequential: Node 18 then Node 20 → ~20s; but GitHub runs parallel)
   - Therefore, no cost to knowing both results

3. **Debugging efficiency:**
   - Developer sees exactly which Node version broke
   - Faster to fix version-specific bugs (e.g., Node 18 polyfill issue)
   - Contrast: With `fail-fast: true`, developer guesses if other version also failed

4. **Rare case: One version regresses:**
   - Project targets Node 18 & 20; code must work on both
   - If version 18 works but version 20 fails (unexpected), we want to know
   - `fail-fast: false` surfaces this; `fail-fast: true` hides it

**Trade-offs:**

- ✅ Workflow always completes all matrix jobs (no early exit)
- ✅ Slightly more verbose output (2 job reports instead of 1)
- ✅ No time impact (parallel execution)

**Decision locked in:** `fail-fast: false`

---

### 1.4 Pre-commit Hook: Why Unit Tests Only (Not Full Suite)?

#### Comparison: Unit Tests vs Full Suite

| Aspect | Unit Tests Only | Full Test Suite |
|--------|-----------------|-----------------|
| **Runtime** | ~3–5 seconds | ~10–15 seconds |
| **Scope** | Library functions only | Unit + component + fixtures |
| **Coverage** | ~82% of utils.ts | ~81% of all testable code |
| **Developer friction** | Low ("OK, hook is done") | High ("Hook delayed my commit") |
| **Safety gap** | GitHub Actions runs full suite | None (full validation) |

#### Decision: **Unit Tests Only in Pre-commit**

**Rationale:**

1. **Fail-fast feedback loop:**
   - Developer types `git commit`
   - In <5 seconds: ✅ Pass → commit succeeds OR ❌ Fail → retry
   - Typical developer experience: 2–3 commit attempts before tests pass
   - With full suite (~15s): Developer frustration; people skip tests (`--no-verify`)
   - With unit tests (~5s): Fast enough that skipping is not tempting

2. **Component tests are slower & less critical locally:**
   - Component tests need Preact runtime simulation (slower setup)
   - Unit tests are pure logic (fast)
   - Component bugs are less common in local iteration (usually caught in code review)
   - Full component suite runs in GitHub Actions before merge anyway

3. **Safety net: GitHub Actions catches component bugs:**
   - Developer commits code (pre-commit passes unit tests)
   - Pushes to GitHub
   - GitHub Actions runs FULL suite (unit + component) on PR
   - Component bug discovered before merge
   - No code reaches main without full validation

4. **No false sense of security:**
   - Pre-commit = "basic sanity check, not full validation"
   - GitHub Actions = "authoritative, comprehensive validation"
   - Developer knows: "If GitHub Actions passes, code is safe"
   - Pre-commit is just: "No obvious unit test breakage"

5. **Bandwidth optimization:**
   - GitHub Actions is shared infrastructure
   - Running full suite × 2 Node versions = 4 test runs per PR
   - Keeping pre-commit minimal means developers commit frequently
   - More local iterations = fewer PR revisions = faster feedback overall

**Trade-offs:**

- ✅ Component bugs not caught locally (OK; GitHub Actions catches them)
- ✅ Possible to push code that fails component tests locally but passes pre-commit (rare; caught on GitHub)
- ✅ Developer might think "tests pass" after pre-commit (clarified in docs)

**Decision locked in:** Pre-commit runs `bun run test:unit` only

---

### 1.5 Coverage Reports: Why Optional Artifacts (Not Required for Merge)?

#### Coverage in GitHub Actions

```yaml
- name: Generate coverage report
  run: bun run test:coverage

- name: Upload coverage report
  uses: actions/upload-artifact@v4
  if: always()  # Upload even if tests fail
  with:
    name: coverage-report-node-${{ matrix.node-version }}
    path: coverage/
    retention-days: 7
```

#### Decision: **Coverage Reports as Optional Artifacts (Not Merge Gates)**

**Rationale:**

1. **Phase 1 established baseline (81%):**
   - Phase 2 is enforcement, not regression prevention
   - Phase 3 will add coverage threshold gates (e.g., "must maintain 70%+")
   - For now: Generate & store artifacts; don't block merges

2. **Separate concerns:**
   - **Merge gate (strict):** Tests must pass (functional correctness)
   - **Coverage tracking (informational):** Artifacts available for review
   - Don't conflate the two until policy is decided

3. **Phase 1 tests are stable (28 passing):**
   - No regression pressure yet
   - Phase 2 focus is CI automation (not coverage enforcement)
   - Phase 3 can add: "Coverage must stay ≥80%" check

4. **Developer experience:**
   - If coverage artifact isn't merge gate: No friction if coverage drops by 1%
   - If coverage artifact IS merge gate: Developer blocked; frustration
   - Better to warn in artifacts, educate in code review, enforce in Phase 3

5. **Artifact-for-inspection pattern:**
   - Upload coverage after every run
   - Developers download if curious: "Did my change drop coverage?"
   - Code review: Reviewer downloads, checks coverage, mentions in review
   - Natural enforcement via review process (better than automated gate)

**Trade-offs:**

- ✅ Coverage isn't enforced automatically (OK; manual review for now)
- ✅ Coverage can drop without blocking merge (acceptable Phase 2; change in Phase 3)
- ✅ Artifact storage (7 days retention) uses GitHub storage (negligible for 2 reports/PR)

**Decision locked in:** Coverage as optional artifacts; not a merge gate in Phase 2

**Future (Phase 3):**
```yaml
- name: Check coverage threshold
  run: |
    # Phase 3: Add this step
    # Enforce coverage ≥70%
    # If coverage < 70%, exit 1 (fail workflow)
```

---

## Part 2: Integration Points

### 2.1 GitHub Actions ↔ Local Bun Commands

#### Command Flow

```
Developer's machine (Local)
  ↓
  git commit
  ↓
  Pre-commit hook runs: bun run test:unit
  ↓
  [Same test runner, same vitest.config.ts]
  ↓
  If fail: ❌ Commit blocked
  If pass: ✅ Commit proceeds

         ↓↓↓ Push to GitHub ↓↓↓

GitHub Actions runner
  ↓
  Checkout code
  Setup Node 18
  bun install
  bun run test
  ↓
  [Same test runner, same vitest.config.ts]
  [Same bun commands as local]
  ↓
  If fail: ❌ Workflow fails (PR shows red X)
  If pass: ✅ Workflow passes (PR shows green ✓)
```

#### Integration Design: Commands Are Identical

**Key principle:** If code passes locally, it passes in CI.

**Proof of concept:**

| Step | Local Command | CI Command | Same? |
|------|---------------|-----------|-------|
| Install dependencies | `bun install` | `bun install --frozen-lockfile` | ✅ Yes (flag ensures reproducibility) |
| Run unit tests | `bun run test:unit` | (Pre-commit only) | N/A |
| Run all tests | `bun run test` | `bun run test` | ✅ Yes |
| Generate coverage | `bun run test:coverage` | `bun run test:coverage` | ✅ Yes |
| Vitest config | `vitest.config.ts` | Same file | ✅ Yes |

**Integration benefit:** Developer workflow is unchanged; CI just runs the same commands.

#### --frozen-lockfile in GitHub Actions

```yaml
- name: Install dependencies
  run: bun install --frozen-lockfile
```

**Why this flag in CI but not locally?**

- **Locally:** `bun install` (no flag) — OK if dev accidentally modifies lockfile
- **CI:** `bun install --frozen-lockfile` — Strict; fails if lockfile doesn't match package.json
- **Benefit:** If package.json and lockfile mismatch, CI catches it immediately

**Example scenario:**
```bash
# Developer commits package.json update but forgets to commit lockfile update
git add package.json
git commit -m "Update dependency"
# ERROR: Didn't run bun install locally to update lockfile

# GitHub Actions:
# bun install --frozen-lockfile
# → FAILS: lockfile doesn't match package.json
# → PR shows red X
# → Developer runs bun install locally, commits lockfile, pushes again
```

---

### 2.2 Pre-commit Hook ↔ Git Workflow

#### When Hook Runs

```
git commit -m "message"
  ↓
  Git triggers pre-commit hook
  ↓
  Hook runs: bun run test:unit
  ↓
  Exit code 0? → Commit proceeds ✅
  Exit code 1? → Commit blocked ❌
```

#### Hook Doesn't Interfere with Forced Pushes

**Forced push flow:**
```
git push --force
  ↓
  Git skips pre-commit hook (hook runs at COMMIT time, not push time)
  ↓
  Forced push succeeds (no hook validation)
```

**Clarification:** Forced push is a GitHub Actions concern (branch protection prevents force push to main).

**Pre-commit hook only blocks:**
- `git commit` → blocked if tests fail
- `git commit --amend` → blocked if tests fail
- `git rebase` (when committing) → blocked if tests fail

**Pre-commit hook does NOT block:**
- `git push --force` (push-time, not commit-time)
- `git branch -D` (branch deletion)
- Force push to non-main branches

---

### 2.3 Branch Protection ↔ Hotfixes

#### Scenario: Emergency hotfix needed on main

```
Developer needs to push critical fix
  ↓
  Option A: Normal workflow (recommended)
    - Create branch: git checkout -b hotfix/security-patch
    - Make change, commit (pre-commit runs, blocks if tests fail)
    - Push: git push origin hotfix/security-patch
    - Create PR, GitHub Actions runs
    - If tests pass: Merge button enabled → merge
    - If tests fail: Fix locally, push again
    ✅ Tests are enforced; hotfix still safe

  ↓
  Option B: Emergency bypass (if Option A not possible)
    - Commit with --no-verify: git commit --no-verify
    - Push: git push (code reaches GitHub)
    - GitHub Actions still runs (CI will fail if tests fail)
    - Branch protection still applies: Can't merge if CI fails
    - ⚠️ WARNING: This is dangerous; used only if system broken
```

**Design principle:** Branch protection is fail-safe; even bypass commits still face GitHub validation.

#### Why Branch Protection Doesn't Break Hotfixes

- ✅ Main branch is protected (can't push directly)
- ✅ Must create PR (goes through CI workflow)
- ✅ PR must pass tests (enforced by workflow)
- ✅ Can be merged quickly if tests pass (no review delay)

**Result:** Hotfixes are actually SAFER with branch protection (guaranteed tests pass before merge).

---

### 2.4 Auto-Installation: Prepare Script Integration

#### First-time developer setup

```bash
# Step 1: Clone repo
git clone https://github.com/alvaldes/cinemas-henry

# Step 2: Install dependencies
bun install
  ↓
  # npm/bun automatically runs scripts listed in "scripts.prepare"
  # Husky's prepare script executes:
  husky install
  ↓
  # Husky initializes .husky/ directory
  # Makes .husky/pre-commit executable
  # Registers it with git as the pre-commit hook

# Step 3: Done! Hook is ready
git add . && git commit -m "test"  # Pre-commit hook runs automatically
```

#### Key integration: `prepare` script is automatic

```json
{
  "scripts": {
    "prepare": "husky install"
  }
}
```

**NPM/Bun behavior:** After `npm install` or `bun install`, npm automatically runs the `prepare` script.

**Result:** Zero manual setup needed. Developers don't need to know about hooks; they just `bun install` and it's ready.

#### Verification

Developer can verify hook is installed:
```bash
ls -la .git/hooks/pre-commit
# Output: -rwxr-xr-x@  1 alvaldes  staff  137 May 28 14:00 pre-commit
# ✅ Exists and is executable
```

---

## Part 3: Error Handling & Recovery

### 3.1 Pre-commit Hook Fails

#### Scenario A: Unit Tests Fail Locally

```
$ git commit -m "Add feature"
✗ Pre-commit hook failed

$ bun run test:unit
✗ should return movies with correct count
  Expected: Array(5)
  Received: Array(3)

# Developer sees the exact failure

$ vim src/lib/__tests__/utils.test.ts
# Fix the test

$ git add .
$ git commit -m "Add feature"
✅ Pre-commit hook passed
✅ Commit succeeded
```

**Recovery path:** Fix tests locally, retry commit. Standard TDD workflow.

---

#### Scenario B: Pre-commit Hook Not Found

```
$ git commit -m "test"
husky - .git/hooks/pre-commit doesn't exist

# Reason: Husky install failed or .husky/ directory corrupted
```

**Recovery:**
```bash
bun install  # Runs prepare script again
# OR
husky install  # Manually reinstall
git commit -m "test"  # Retry
```

---

#### Scenario C: Pre-commit Hook Timeout (Rare)

```
$ git commit -m "test"
# Pre-commit hook runs bun run test:unit
# 30 seconds pass... still running
# Developer's machine has slow disk/network
```

**Recovery:**
```bash
# Press Ctrl+C to interrupt
# Then:
git commit --no-verify -m "test"  # Bypass for this commit (dangerous)
# OR run tests manually first to ensure they pass
bun run test:unit  # See if there's a slow test
```

**Prevention (documented):** If tests regularly timeout, investigate slow tests (Phase 3 optimization task).

---

### 3.2 GitHub Actions Workflow Fails

#### Scenario A: Tests Fail in GitHub Actions (But Pass Locally)

```
Developer's local environment:
$ bun run test
✅ All 28 tests pass

Push to GitHub:
GitHub Actions:
✗ Node 18: 2 tests fail
✗ Node 20: 1 test fails

PR shows: ❌ Checks failed
```

**Recovery:**
1. Developer opens GitHub Actions logs
2. Sees: "Tests pass on Node 18 but fail on Node 20"
3. Diagnoses: "Code uses Node 20 feature (e.g., global fetch)"
4. Fixes code to work on Node 18
5. `git push` → GitHub Actions re-runs → passes
6. Merge button now enabled

---

#### Scenario B: GitHub Actions Timeout

```yaml
timeout-minutes: 10
```

```
GitHub Actions runs for 10 minutes
  ↓
  Timeout exceeded
  ↓
  Workflow killed: ❌ Timeout
```

**Recovery:**
1. Re-run workflow manually (GitHub UI: "Re-run" button)
2. Check if network/runner was slow (transient issue)
3. If consistent: Investigate slow tests
   - Run locally: `bun run test:coverage` (shows timing per test)
   - Identify >1 second tests
   - Optimize (mocking, parallelization, etc.)

---

#### Scenario C: Dependency Installation Fails

```yaml
- name: Install dependencies
  run: bun install --frozen-lockfile
```

```
Workflow fails at install step:
  error: some-package@1.2.3 - npm registry unreachable
```

**Recovery (automatic):**
GitHub Actions has built-in retry logic; automatically re-runs failed steps.

**If persistent:**
1. Check npm registry status (npm.js.org)
2. If registry is down, retry later
3. If registry is up, check lockfile integrity:
   ```bash
   bun install  # Locally
   git add bun.lockb
   git commit -m "Fix lockfile"
   git push
   ```

---

#### Scenario D: Node Version Not Available

```yaml
node-version: [18.x, 20.x]
```

```
Workflow tries to setup Node 18.x
  error: Node 18.19.99 not found in GitHub Actions cache
```

**Recovery (automatic):** GitHub Actions falls back to latest 18.x available (handled by setup-node action).

---

### 3.3 Branch Protection Blocks Merge

#### Scenario A: Developer Tries to Merge with Failing Tests

```
PR page shows:
❌ "Checks failed"
🔴 Merge button: DISABLED (red)
Message: "The 'test' check is required and must succeed before merging"
```

**Developer's action:**
```
1. Sees PR has failures
2. Opens GitHub Actions logs
3. Reads error: "should return movies with correct count"
4. Checks out branch locally
5. git pull origin branch-name
6. bun run test  # See failure locally
7. bun run test:unit  # Reproduce
8. Fix code in IDE
9. git commit -m "Fix failing test"
10. git push
11. GitHub Actions re-runs automatically
12. Tests now pass ✅
13. Merge button now ENABLED (green)
14. Developer clicks merge
```

---

#### Scenario B: Hot-key Developers Try to Force Merge

```
GitHub Settings → Branch protection:
  ✅ "Allow force pushes" = DISABLED

Developer tries: git push --force
Error: "You do not have permission to force push to main"
```

**Design advantage:** Technical prevention; developer can't bypass protection.

---

### 3.4 Hook Corrupted or Missing

#### Scenario A: Developer Manually Deletes `.husky/` Directory

```bash
rm -rf .husky/
git add .
git commit -m "Remove hooks"
```

**Result:** Pre-commit hook is gone; next commit bypasses tests.

**Recovery:**
```bash
bun install  # Runs prepare script
# husky install
# .husky/ recreated
# .husky/pre-commit restored
```

---

#### Scenario B: Git Hooks Directory Corrupted

```bash
ls .git/hooks/pre-commit
# Output: file not found (corrupted git repo)
```

**Recovery:**
```bash
rm -rf .git/hooks/
bun install  # Reinstalls hooks
# OR
husky install  # Directly
```

---

### 3.5 Test Timeout (Specific Test Hangs)

#### Scenario: One Test Hangs; Others Pass

```bash
$ bun run test:unit
✓ should handle fetch errors gracefully
✓ should return movies with correct count
...
[Test hangs for 10+ seconds]
✓ Timed out after 10000ms

Vitest config has: testTimeout: 10000
```

**Root cause:** Test has infinite loop or hangs on I/O

**Recovery:**
1. Run test in isolation: `bun run test:unit -- --reporter=verbose utils.test.ts`
2. Add console.log to debug
3. Fix hanging code (e.g., missing await, infinite loop)
4. Retry

**Prevention:** Document in TESTING.md; Phase 3 add test timeout monitoring.

---

## Part 4: Performance Considerations

### 4.1 Pre-commit Hook Speed Target: <5 Seconds

#### Benchmark: Bun Run Test:unit

```
$ time bun run test:unit

 ✓ src/lib/__tests__/utils.test.ts (16 tests)
   ...
 Test Files  1 passed (1)
      Tests  16 passed (16)
   Duration  1.66s

real    0m3.421s
user    0m2.100s
sys     0m0.950s
```

**Breakdown:**
- Bun startup: ~0.5s
- Vitest setup: ~0.3s
- Test execution: ~1.0s
- Vitest teardown: ~0.3s
- **Total:** ~3.4s

**Design target:** <5 seconds (allows for slower machines; 3.4s on modern machine)

**What if pre-commit exceeds 5s?**
- Developers get frustrated
- People start using `--no-verify` to skip hook
- Pre-commit loses value as safety mechanism
- Solution: Optimize slow tests (Phase 3)

---

#### Why Not Include Component Tests?

```
$ time bun run test

 ✓ src/lib/__tests__/utils.test.ts (16 tests)
 ✓ src/components/__tests__/NavDropdown.test.tsx (12 tests)
   ...
   Duration  1.75s

real    0m6.250s
```

**With components:** ~6.25s (exceeds <5s target)

**Design decision:** Unit tests only; components validated in GitHub Actions.

---

### 4.2 GitHub Actions Parallel Execution

#### Matrix Strategy

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
```

**Execution model:**

```
Start: 00:00
  ├─ Job 1 (Node 18): 00:00 → 00:10 (runs in parallel)
  └─ Job 2 (Node 20): 00:00 → 00:10 (runs simultaneously)
End: 00:10 (both jobs complete)
```

**Performance:** 2 jobs run simultaneously; total time = single job time.

**If sequential:** Would take ~20s; GitHub Actions parallelizes for free.

**Design benefit:** Multi-version testing adds compatibility without time cost.

---

#### Typical GitHub Actions Workflow Timeline

```
Step 1: Checkout code ...................... 2s
Step 2: Setup Node ......................... 30s
Step 3: Setup Bun .......................... 20s
Step 4: Install dependencies .............. 45s
Step 5: Run tests .......................... 10s
Step 6: Generate coverage ................. 10s
Step 7: Upload artifacts .................. 5s
─────────────────────────────────────────────
Total per job ............................ ~120s (2 minutes)
```

**Parallel (2 jobs):** ~2 minutes (both run simultaneously)

**Total workflow:** ~2 minutes from PR push to green ✓

---

### 4.3 Frozen Lockfile: Reproducibility

#### Without `--frozen-lockfile`

```bash
# Developer A: bun install
# Installs latest minor versions

# Developer B: bun install (same lockfile)
# GitHub Actions: bun install (may get different versions)
# Different installations = potential version mismatch bugs
```

#### With `--frozen-lockfile`

```bash
# lockfile locked to exact versions
bun install --frozen-lockfile
# MUST match lockfile exactly; fails if package.json and lockfile diverge
```

**Design principle:** Ensure everyone (local + CI) uses identical dependencies.

---

### 4.4 Coverage Generation: Piggybacks on Test Run

```yaml
- name: Run tests
  run: bun run test

- name: Generate coverage report
  run: bun run test:coverage
```

#### Optimization: Could Combine These

**Current:** Run tests, then run with coverage flag (2 separate commands)

**Trade-off analysis:**

| Approach | Time | Benefit |
|----------|------|---------|
| Separate: `test` + `test:coverage` | 20s | Two runs guarantee clean state |
| Combined: `test:coverage` (coverage on all) | 10s | Single run; faster |

**Current design:** Separate (conservative; ensures coverage is clean)

**Future optimization (Phase 3):** Combine into single run if speed critical.

---

### 4.5 Artifact Retention: 7 Days

```yaml
retention-days: 7
```

**Trade-off:**

| Retention | Storage | Debugging Window | Developer Access |
|-----------|---------|------------------|------------------|
| 1 day | Minimal | Current day only | Missing if away |
| 7 days | Small | ~1 week | Good window; can review later |
| 30 days | Medium | Full sprint | More than needed |
| Indefinite | Large | Forever | Expensive storage |

**Design choice: 7 days**

- Covers most developer scenarios (vacation, async review)
- Minimal GitHub storage cost
- Sufficient for Phase 2 (Phase 3 can extend if needed)

---

## Part 5: Security & Safety

### 5.1 `--no-verify` Escape Hatch

#### Design Principle: Fail-Safe, Not Fail-Secure

```
Fail-safe: Hook can be bypassed if needed (flexibility)
  git commit --no-verify
```

```
Fail-secure: Hook cannot be bypassed (strict)
  No --no-verify option (would require malware-level system access)
```

**Choice: Fail-safe**

**Rationale:**

1. **Developer trust:** Team needs flexibility to work around bugs
   - If hook breaks: `--no-verify` lets developer proceed
   - Alternative: Uninstall Husky entirely (more disruptive)

2. **Safety net remains:** Even with `--no-verify`, GitHub Actions runs
   - Bypass pre-commit: Commit reaches GitHub
   - GitHub Actions CI runs tests
   - Branch protection prevents merge
   - **Result:** Code still can't reach main if tests fail

3. **Documented escape:** Make it clear in docs
   - Not secret; openly acknowledged
   - Developers know they can use it in emergencies
   - Reduces frustration (they have options)

#### Warning in Documentation

```markdown
### Emergency: Bypass Pre-commit Hook

**USE ONLY IF HOOK IS BROKEN. Otherwise, keep hook enforced.**

git commit --no-verify -m "Emergency fix"

⚠️ WARNING: GitHub Actions CI will STILL RUN. 
Code can't reach main unless tests pass.
This is your last resort, not your regular workflow.
```

---

### 5.2 Branch Protection: Prevents Accidental Main Breakage

#### Configuration: What We Protect

```
Branch: main
Requirement: GitHub Actions workflow 'test' must pass
Consequence: Impossible to merge without passing tests
```

#### Scenario: Developer Accidentally Pushes Broken Code

```
$ git push origin broken-branch
$ # Create PR to main
PR shows: ❌ Checks failed
Merge button: DISABLED (red)
Developer can't merge
Developer sees test error
Developer fixes code
$ git push
GitHub Actions re-runs
Merge button: ENABLED (green)
Developer merges safely
```

**Design benefit:** Technical barrier prevents accidents.

---

### 5.3 Lock Files: Ensure Dependency Integrity

#### Vulnerability: Typosquatting Attack

```
Attacker publishes malicious package: `lodash-fake` (similar to lodash)
Developer typos: npm install lodash-fake  (intended: lodash)
CI runs with malicious package
```

**How lock file prevents this:**

1. **Package.json:** Lists `lodash@^4.17.0`
2. **Lockfile:** Lists exact `lodash@4.17.21` (hash verified)
3. **CI:** `--frozen-lockfile` requires exact match
4. **If lockfile modified:** CI fails immediately (hash mismatch)

**Design:** Always commit `bun.lockb` to git; CI uses `--frozen-lockfile`.

---

### 5.4 No Secrets Needed for Phase 2

**Phase 2 CI doesn't need:**
- GitHub PAT (Personal Access Token)
- SSH keys
- Slack webhooks
- npm registry credentials
- Environment variables

**Why:**
- Runs public test suite (no private APIs)
- Tests on public code (no credentials needed)
- Artifacts are internal only (no external uploads)

**Future phases (Phase 3+) might need:**
- Slack notifications (Phase 3)
- Deployment tokens (Phase 3+)
- Coverage thresholds as secrets (Phase 3)

---

### 5.5 Force Push Disabled on Main

```
GitHub Settings → Branch protection:
  ❌ Allow force pushes = DISABLED
```

**Protection:** Prevents history rewrite of main branch.

**Scenario prevented:**

```
Developer accidentally (with force push enabled):
$ git push --force  # Rewrites main history
# Causes chaos: other developers' branches are now based on deleted history
```

**Design:** Disabled; developers must use normal push or create new PR.

---

## Part 6: Configuration Trade-offs

### 6.1 Pre-commit Only Unit Tests: Speed vs Coverage

| Metric | Unit Tests Only | Full Test Suite |
|--------|-----------------|-----------------|
| **Hook speed** | <5s ✅ | ~15s ❌ |
| **Coverage locally** | ~82% 🟡 | ~81% 🟡 |
| **Component bugs caught** | In GitHub Actions ✅ | Locally ❌ |
| **Developer experience** | Low friction ✅ | High friction ❌ |
| **Safety guarantee** | GitHub Actions still validates ✅ | False sense of full validation ❌ |

**Trade-off:** Accept local coverage gap for speed; GitHub Actions validates comprehensively.

**Decision:** Unit tests only in pre-commit.

---

### 6.2 Matrix: Node 18 & 20 vs Broader Range

| Approach | Versions Tested | Time | Compatibility |
|----------|-----------------|------|----------------|
| **18 & 20 only** | 2 versions | ~2 min ✅ | LTS only ✅ |
| 16, 18, 20, 22 | 4 versions | ~4 min | Broader; includes EOL & bleeding-edge ❌ |
| Latest only | 1 version | ~1 min | Misses backward compat ❌ |

**Trade-off:** 2-minute CI time for 4x broader version coverage.

**Decision:** Node 18 & 20 only (LTS-only strategy).

---

### 6.3 Artifact Retention: 7 Days vs Indefinite

| Retention | Storage Cost | Debugging Access | Usefulness |
|-----------|--------------|------------------|-----------|
| **7 days** | Minimal 🟢 | ~1 week window ✅ | Good for Phase 2 ✅ |
| 30 days | Small 🟡 | ~1 month | Overkill |
| Indefinite | Large 🔴 | Forever | Expensive |

**Trade-off:** 7 days coverage for minimal storage cost.

**Decision:** 7 days retention.

---

### 6.4 Allow Force Push: Safety vs Flexibility

| Setting | Force Push Allowed? | Risk | Developer Flexibility |
|---------|-------------------|------|----------------------|
| **force push disabled** | ❌ No | History protected ✅ | Reduced ❌ |
| force push allowed | ✅ Yes | History vulnerable 🔴 | Increased ✅ |

**Trade-off:** Safety over flexibility; force push is rare need anyway.

**Decision:** Force push disabled on main.

---

### 6.5 Require Up-to-Date Branches: Stale Checks vs Merge Speed

```yaml
# GitHub branch protection option:
"Require branches to be up to date before merging"
```

**With this enabled:**
```
PR opens
Tests pass ✅
New commit pushed to main (by someone else)
PR is now stale (based on old main)
Must update PR: git pull origin main
Then merge button enabled again
```

**Trade-off:**

| Metric | Enabled | Disabled |
|--------|---------|----------|
| **Merge speed** | Slower (must update) ❌ | Faster ✅ |
| **Safety** | Higher (test on latest main) ✅ | Lower (test on old main) ❌ |
| **Friction** | Higher ❌ | Lower ✅ |

**Design recommendation:** Enable for phase 2 (conservative; safer).

**Can adjust:** Future phases can disable if merge speed becomes critical.

---

## Part 7: Testing Strategy for Design Validation

### 7.1 Verify GitHub Actions Workflow YAML

#### Test 1: YAML Syntax Validation

```bash
# Before committing, validate YAML syntax
# Using GitHub CLI:
gh workflow view .github/workflows/test.yml

# Or online: yamllint.com
```

**Success:** YAML is valid; no syntax errors.

---

#### Test 2: Workflow Runs on PR

```
1. Create test PR with dummy change
2. Watch GitHub Actions tab
3. Verify workflow 'Test Suite' appears
4. Verify it runs on both Node 18 and 20
5. Verify both jobs complete (not cancelled)
6. Verify tests pass (green ✓)
```

**Success:** Workflow triggered and passed.

---

#### Test 3: Workflow Fails if Tests Fail

```
1. Introduce breaking change (modify test to fail)
2. Push to PR
3. GitHub Actions runs
4. Verify workflow fails (red X)
5. PR shows: ❌ Checks failed
6. Verify merge button is disabled
```

**Success:** Workflow correctly fails when tests fail.

---

### 7.2 Test Pre-commit Hook Locally

#### Test 1: Hook Blocks Commit When Tests Fail

```bash
# Step 1: Install hook
bun install  # Runs prepare script

# Step 2: Modify test to fail
vim src/lib/__tests__/utils.test.ts
# Change: expect(result).toBe(true) → expect(result).toBe(false)

# Step 3: Try to commit
git add src/lib/__tests__/utils.test.ts
git commit -m "Broken test"

# Expected output:
# ✗ Pre-commit hook failed
# $ bun run test:unit
#  ✗ ... test name ...
# husky - pre-commit hook exited with code 1 (error)
# Commit aborted.
```

**Success:** Commit blocked; hook prevented bad code.

---

#### Test 2: Hook Allows Commit When Tests Pass

```bash
# Step 1: Fix the test
vim src/lib/__tests__/utils.test.ts
# Revert to correct: expect(result).toBe(true)

# Step 2: Try to commit again
git add src/lib/__tests__/utils.test.ts
git commit -m "Fix test"

# Expected output:
# $ bun run test:unit
#  ✓ src/lib/__tests__/utils.test.ts (16 tests)
# [main abc1234] Fix test
#  1 file changed
```

**Success:** Commit allowed; hook validated code.

---

#### Test 3: Hook Can Be Bypassed

```bash
# Create a commit that bypasses hook
git commit --no-verify -m "Emergency commit"

# Expected: Commit succeeds (hook skipped)
git log --oneline | head -1
# Output: abc1234 Emergency commit
```

**Success:** Bypass works; escape hatch verified.

---

### 7.3 Test Branch Protection

#### Test 1: Merge Button Disabled When CI Fails

```
1. Create PR with intentionally broken test
2. Push to GitHub
3. GitHub Actions runs; workflow fails
4. Go to PR page
5. Verify: Merge button is DISABLED (gray/red)
6. Verify message: "The 'test' check is required and must succeed before merging"
```

**Success:** Protection prevents merge of failing code.

---

#### Test 2: Merge Button Enabled When CI Passes

```
1. Fix the broken test
2. Push fix to same PR
3. GitHub Actions re-runs; workflow passes
4. Go to PR page
5. Verify: Merge button is ENABLED (green)
```

**Success:** Protection allows merge of passing code.

---

#### Test 3: Force Push is Blocked

```bash
# Attempt force push to main
git push origin main --force

# Expected error:
# remote: error: protected branch hook declined to update refs/heads/main
# remote: You do not have permission to force push to main
```

**Success:** Force push protection works.

---

### 7.4 Coverage Artifacts Upload Verification

#### Test 1: Artifacts Generated Locally

```bash
bun run test:coverage

# Check if coverage/ directory created
ls coverage/
# Output: coverage/index.html coverage/... (HTML files)
```

**Success:** Coverage HTML generated.

---

#### Test 2: Artifacts Uploaded to GitHub Actions

```
1. Workflow completes
2. Go to GitHub Actions run
3. Scroll to "Artifacts" section
4. Verify: "coverage-report-node-18.x" is listed
5. Verify: "coverage-report-node-20.x" is listed
6. Download one: coverage-report-node-18.x.zip
7. Extract and open coverage/index.html in browser
```

**Success:** Artifacts uploaded and accessible.

---

### 7.5 Multi-Node Compatibility Test

#### Test 1: Tests Pass on Both Node Versions

```
GitHub Actions matrix runs:
  - Job 1 (Node 18.x): ✅ 28 tests pass
  - Job 2 (Node 20.x): ✅ 28 tests pass

Workflow result: ✅ All checks passed
```

**Success:** Code works on both LTS versions.

---

#### Test 2: Detect Version-Specific Failures

```
Hypothetical scenario (for validation purposes):
Introduce Node 20-specific code: global.structuredClone(...);
// (doesn't exist in Node 18)

GitHub Actions runs:
  - Job 1 (Node 18): ❌ structuredClone is not defined
  - Job 2 (Node 20): ✅ Pass

Result: Matrix fails; developer sees "Node 18 failed; Node 20 passed"
Developer adds polyfill for Node 18
GitHub Actions re-runs
Both pass ✅
```

**Success:** Multi-version testing catches compatibility issues.

---

## Part 8: Documentation Scope

### 8.1 docs/CI-CD-SETUP.md Structure

```markdown
# CI/CD Setup Guide

## Quick Start (3 steps)
1. Clone repo
2. bun install (hooks auto-installed)
3. Start developing (pre-commit validates)

## Pre-commit Hook

### What It Does
- Runs unit tests before each commit
- Blocks commit if tests fail
- Takes ~5 seconds

### How to Install
- Automatic via `bun install` (runs `prepare` script)
- Manual: `husky install`

### How to Use
$ git add .
$ git commit -m "message"
# If tests pass: ✅ Commit succeeds
# If tests fail: ❌ Commit blocked

### Troubleshooting
- Hook not running? → `husky install`
- Want to skip hook? → `git commit --no-verify`
- Hook deleted? → `bun install` to restore

## GitHub Actions Workflow

### What It Does
- Runs full test suite (unit + component) on every PR
- Tests on Node 18 & 20
- Uploads coverage artifacts
- Prevents merge if tests fail

### View Results
1. Go to GitHub PR page
2. Scroll to "Checks" section
3. Click "Test Suite" to see logs
4. Expand "Run tests" step to see which test failed

### Troubleshooting
- Workflow timeout? → Check for slow tests: `bun run test:unit -- --reporter=verbose`
- Node version mismatch? → Test both locally: `node --version`
- Coverage missing? → Download artifact from GitHub Actions

## Branch Protection

### What It Does
- Prevents merge to main if CI fails
- Enforces code review + tests

### Why It Exists
- Main branch must be safe
- Tests are required before merge
- Impossible to accidentally ship broken code

### How to Work With It
1. Create PR (goes to develop or feature branch)
2. GitHub Actions runs automatically
3. If tests fail: Fix locally, push again
4. If tests pass: Merge button enabled

## Common Questions

### Q: Can I skip tests?
A: Pre-commit enforces locally. GitHub Actions enforces on GitHub.
   To bypass both: --no-verify (dangerous; don't use)

### Q: Tests are slow. What do I do?
A: Pre-commit runs only unit tests (~5s).
   If still slow, report to team (Phase 3: optimize tests)

### Q: Can I merge without waiting for CI?
A: No. Branch protection requires CI to pass.
   CI is fast (~2 minutes for 2 nodes in parallel)

### Q: What if pre-commit hook breaks?
A: Run `bun install` to reinstall. Then retry commit.

### Q: Can I force push to main?
A: No. Force push is disabled on main branch.
   Create PR instead (better anyway; gets code review)

## Emergency Bypass

⚠️ **Only use if absolutely necessary.**

git commit --no-verify  # Bypass pre-commit hook
git push               # Push to GitHub

Note: GitHub Actions still runs. Code can't merge if tests fail.
This is your last resort.
```

---

### 8.2 Coverage Report Guide

```markdown
## Reviewing Coverage Artifacts

After GitHub Actions workflow completes:

1. Go to GitHub Actions run
2. Scroll to bottom → "Artifacts" section
3. Download "coverage-report-node-18.x.zip" (or Node 20)
4. Unzip: `unzip coverage-report-node-18.x.zip`
5. Open in browser: `open coverage/index.html`

### Reading the Coverage Report

- **Statements**: % of code lines executed
- **Branches**: % of if/else paths executed
- **Functions**: % of functions called
- **Lines**: % of logical lines executed

Hover over files to see uncovered lines:
- 🟢 Green: Covered
- 🔴 Red: Not covered

### Coverage Thresholds (Phase 2 Informational)

Current Phase 1 baseline:
- Statements: 81.25%
- Branches: 75.6%
- Functions: 100%
- Lines: 82.66%

Phase 3 will enforce thresholds.
```

---

## Part 9: Rollback & Cleanup Scenarios

### 9.1 Remove GitHub Actions Workflow

**Scenario:** Workflow needs to be disabled (if something breaks).

```bash
# Option 1: Delete workflow file
rm .github/workflows/test.yml
git add .
git commit -m "Remove GitHub Actions workflow"
git push

# Option 2: Disable workflow (don't delete)
# Edit .github/workflows/test.yml
# Add at top:
# env:
#   SKIP_WORKFLOW: true

# Option 3: Revert commit (if just added)
git revert <commit-hash>  # Reverts the commit that added workflow
git push
```

**Verify rollback:**
- Go to GitHub repository
- Click "Actions" tab
- Verify workflow no longer appears
- PR no longer shows "test" check

---

### 9.2 Remove Pre-commit Hook

**Scenario:** Pre-commit hook is broken or not wanted.

```bash
# Option 1: Uninstall globally
rm -rf .husky
git add .
git commit -m "Remove Husky pre-commit hooks"
git push

# Option 2: Uninstall from package.json (keep file structure)
# Remove "prepare" script from package.json
# Then: bun install (won't reinstall hooks)

# Option 3: Reinstall (if accidentally deleted)
bun install  # Runs prepare script
husky install
```

**Verify rollback:**
```bash
ls .husky/pre-commit
# Output: file not found (if successfully removed)

# Try to commit
git commit -m "test"
# Should succeed immediately (no hook)
```

---

### 9.3 Disable Branch Protection

**Scenario:** Need to bypass merge gates temporarily (rare).

**Steps:**
1. Go to GitHub repository Settings
2. Click "Branches" (left sidebar)
3. Find "main" protection rule
4. Click "Edit" (pencil icon)
5. Uncheck "Require status checks to pass before merging"
6. Scroll down, click "Save changes"

**Verify:**
- Go to any PR
- Merge button should now be ENABLED (even if CI failing)

**To re-enable:**
- Repeat steps above
- Re-check "Require status checks to pass before merging"
- Select "test" workflow
- Save

---

### 9.4 Full Rollback: Phase 2 → Phase 1 State

**Scenario:** Need to completely remove all Phase 2 components.

```bash
# Step 1: Remove Phase 2 files
rm -rf .github/workflows/
rm -rf .husky/
rm docs/CI-CD-SETUP.md  (optional; can keep for reference)

# Step 2: Update package.json
# Remove:
# - "prepare" script
# - "husky" from devDependencies
nano package.json

# Step 3: Reinstall (without hooks)
bun install

# Step 4: Commit
git add .
git commit -m "Rollback: Remove Phase 2 CI/CD integration"
git push

# Step 5: Disable branch protection (GitHub Settings)
# Remove protection rule for main branch
```

**Verify Phase 1 Still Works:**
```bash
bun run test
# Expected: 28 tests pass ✅

bun run build
# Expected: .astro/ directory created ✅

bun run dev
# Expected: Dev server starts ✅
```

---

## Part 10: Phase 1 Compatibility Verification

### 10.1 Ensure No Phase 1 Changes

**Phase 2 adds:**
```
.github/workflows/test.yml          (NEW)
.husky/pre-commit                   (NEW)
.husky/_/ (directory)               (NEW)
docs/CI-CD-SETUP.md                 (NEW)
package.json (prepare script added) (MODIFIED)
package.json (husky added)          (MODIFIED)
```

**Phase 2 does NOT modify:**
```
src/lib/__tests__/utils.test.ts     (UNCHANGED)
src/components/__tests__/NavDropdown.test.tsx (UNCHANGED)
vitest.config.ts                    (UNCHANGED)
tests/fixtures/setup.ts             (UNCHANGED)
TESTING.md                          (UNCHANGED)
```

### 10.2 Verification Checklist

```bash
# ✅ Tests still pass
bun run test
# Expected output: 28 tests pass

# ✅ Unit tests pass
bun run test:unit
# Expected output: 16 tests pass

# ✅ Component tests pass
bun run test:components
# Expected output: 12 tests pass

# ✅ Coverage still generated
bun run test:coverage
# Expected output: 81%+ coverage

# ✅ Dev server still starts
bun run dev
# Expected: Server running on http://localhost:3000

# ✅ Build still works
bun run build
# Expected: .astro/ directory created (or error if pre-existing)

# ✅ Test watch still works
bun run test:watch
# Expected: Vitest in watch mode (Ctrl+C to exit)

# ✅ Test UI still works
bun run test:ui
# Expected: Vitest UI opens in browser
```

**If any fail:** Phase 2 broke something. Debug and fix.

---

### 10.3 Git History Verification

```bash
# View Phase 2 commits (should be isolated)
git log --oneline | grep -i "ci\|cicd\|github\|action\|husky\|hook"

# Example output:
# abc1234 ci: add branch protection rules
# def5678 ci: add pre-commit hook via husky
# ghi9012 ci: add github actions workflow
# ...

# Verify Phase 1 commits are still in history
git log --oneline | grep -i "test\|vitest\|tdd"

# Example output:
# jkl3456 test: implement tdd infrastructure with vitest
# ...

# Both should be present (Phase 1 + Phase 2)
```

---

## Summary: Design Decisions Reference

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Hook manager | Husky | Auto-install, wide adoption, minimal overhead |
| Node versions | 18 & 20 LTS | Production compatibility, parallel testing |
| Matrix strategy | fail-fast: false | Diagnostic visibility, no time cost |
| Pre-commit scope | Unit tests only | Speed <5s, full suite in GitHub Actions |
| Coverage enforcement | Optional artifacts | Phase 2 informational, Phase 3 gates |
| Force push | Disabled | History protection on main |
| Artifact retention | 7 days | Balance storage vs debugging access |
| Escape hatch | --no-verify available | Flexibility for emergencies |
| Rollback strategy | File-based, reversible | Clean removal possible |

---

## Next Steps

This Design document specifies:
- ✅ Architectural decisions and rationale
- ✅ Integration points with Phase 1
- ✅ Error handling & recovery paths
- ✅ Performance considerations
- ✅ Security & safety mechanisms
- ✅ Testing strategies for validation
- ✅ Documentation scope
- ✅ Rollback scenarios
- ✅ Phase 1 compatibility checks

**Ready for:** Tasks Phase (granular task breakdown) and Apply Phase (implementation).

---

**Design Version:** 1.0  
**Status:** ✅ **READY FOR TASKS PHASE**  
**Complexity:** Medium (3 files to create, 2 to modify)  
**Estimated implementation time:** 4–6 hours (including testing & documentation)

