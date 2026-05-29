# CI/CD Setup Guide

## Quick Start (3 Steps)

1. **Clone repo and install dependencies:**
   ```bash
   git clone https://github.com/alvaldes/cinemas-henry
   cd cinemas-henry
   bun install  # Pre-commit hook auto-installed via prepare script
   ```

2. **Start developing:**
   ```bash
   git add .
   git commit -m "your message"
   # Pre-commit hook runs: tests must pass or commit blocked
   ```

3. **Push and create PR:**
   ```bash
   git push origin your-branch
   # GitHub Actions auto-runs full test suite on PR
   # Merge button enabled only if tests pass
   ```

---

## Pre-commit Hook

### What It Does

The pre-commit hook runs **unit tests only** before each commit:
- Trigger: Every `git commit` command
- Command: `bun run test:unit` (~5 seconds)
- Block: ❌ If tests fail → commit aborted
- Allow: ✅ If tests pass → commit proceeds

**Why unit tests only?**
- Fast feedback loop (< 5 seconds)
- Component tests run in GitHub Actions (full validation before merge)
- Fail-safe: GitHub Actions catches component bugs before PR merge

### Installation

**Automatic (recommended):**
```bash
bun install
# Prepare script runs: husky install
# Hook is now active; no manual setup needed
```

**Manual (if needed):**
```bash
npx husky install
# OR
bun exec husky install
```

### How It Works

**Pass scenario (tests pass):**
```bash
$ git commit -m "Add feature"
$ bun run test:unit
✓ 16 tests passed
[main abc1234] Add feature
1 file changed
```

**Fail scenario (tests fail):**
```bash
$ git commit -m "Add broken code"
$ bun run test:unit
✗ should return movies with correct count
  Expected: 5
  Received: 3
husky - pre-commit hook exited with code 1 (error)
Commit aborted. Fix test errors above and retry.
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| **Hook not running** | Run `husky install` manually |
| **Hook not found after clone** | Run `bun install` (triggers prepare script) |
| **Slow test timeout** | Tests should complete <5s; check for hanging code |
| **Want to skip hook** | `git commit --no-verify` (use sparingly; GitHub Actions still validates) |
| **Hook deleted accidentally** | Run `bun install` to restore |

---

## GitHub Actions Workflow

### What It Does

The "Test Suite" workflow automatically runs on every PR push and push to main:

**Triggers:**
- Pull request creation/update (all branches)
- Push to main branch
- Manual trigger (GitHub Actions UI)

**Actions taken:**
1. Checks out code
2. Sets up Node.js (18.x and 20.x in parallel)
3. Installs Bun package manager
4. Installs project dependencies
5. Runs full test suite (unit + component)
6. Generates coverage report
7. Uploads coverage artifacts (7-day retention)

**Results:**
- ✅ All 28 tests pass → Green ✓ checkmark on PR
- ❌ Any test fails → Red X on PR; merge button disabled
- 📊 Coverage report available in Actions artifacts

### View Results

**Step 1: Go to PR page**
```
https://github.com/alvaldes/cinemas-henry/pull/123
```

**Step 2: Scroll to "Checks" section**
```
Checks
├─ Test Suite (spinning... or ✅ passed or ❌ failed)
│  ├─ Node 18.x job
│  └─ Node 20.x job
```

**Step 3: Click "Details" to see full logs**
```
Workflow run page
├─ Job: Tests on Node 18.x
│  ├─ Step: Checkout code
│  ├─ Step: Setup Node.js
│  ├─ Step: Run tests
│  ├─ Step: Generate coverage
│  └─ Step: Upload coverage
└─ Job: Tests on Node 20.x
   ├─ (same steps as Node 18)
```

### Coverage Artifacts

After workflow completes, coverage reports are available:

**Download coverage:**
1. Open workflow run page
2. Scroll to bottom → "Artifacts" section
3. Download `coverage-report-node-18.x.zip` or `coverage-report-node-20.x.zip`
4. Extract: `unzip coverage-report-node-18.x.zip`
5. Open in browser: `open coverage/index.html`

**Coverage metrics:**
- **Statements:** % of code lines executed
- **Branches:** % of if/else paths executed
- **Functions:** % of functions called
- **Lines:** % of logical lines executed

**Current baseline (Phase 1):**
- Statements: 81.25%
- Branches: 75.6%
- Functions: 100%
- Lines: 82.66%

### Troubleshooting

| Issue | Solution |
|-------|----------|
| **Workflow doesn't appear on PR** | Wait 1-2 minutes; refresh page. Check Actions tab if missing |
| **Workflow timeout** | Check logs; tests should complete <10 minutes |
| **Tests pass locally but fail on CI** | Version-specific issue; check Node version mismatch |
| **Coverage artifacts missing** | Workflow may have timed out; check upload step in logs |
| **Merge button still disabled after tests pass** | GitHub caches status; wait 1-2 min and refresh |

---

## Branch Protection Rules

### What It Does

Branch protection rules on `main` branch enforce:
- ✅ Tests must pass before merge (GitHub Actions workflow)
- ✅ Code must be up-to-date with main before merge
- ❌ Force push is not allowed
- ❌ Branch cannot be deleted

### Why It Exists

**Safety:** Prevents broken code from reaching main branch
- Without protection: Anyone can merge, even with failing tests → production risk
- With protection: Only passing code can merge → guaranteed safe main

**Enforcement:** Technical barrier ensures compliance
- Merge button is DISABLED (red) if tests fail
- Merge button is ENABLED (green) only if tests pass
- No workarounds (except admin override, rarely used)

### How It Works

**When tests PASS:**
```
PR page:
  ✅ Checks passed
  🟢 Merge button: ENABLED (green, clickable)
  Developer clicks merge
  Code reaches main
```

**When tests FAIL:**
```
PR page:
  ❌ Checks failed (test failure details)
  🔴 Merge button: DISABLED (red, grayed out)
  Message: "Required status check 'test' is failing"
  Developer must fix tests locally, push fix
  GitHub Actions re-runs automatically
  Once all pass: Merge button becomes ENABLED
```

### Working With Branch Protection

**Normal workflow (recommended):**
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes, commit (pre-commit hook validates)
3. Push to GitHub: `git push origin feature/my-feature`
4. Create PR to main
5. Wait for GitHub Actions to run (~2 minutes)
6. If tests fail: Fix locally, push fix, tests re-run
7. Once tests pass and code reviewed: Merge PR

**Hotfix workflow:**
1. Create hotfix branch: `git checkout -b hotfix/critical-bug`
2. Make emergency fix
3. Push to GitHub
4. Create PR with high priority label
5. Tests still must pass (GitHub Actions runs)
6. Once tests pass: Merge immediately (no review delay)
7. **Note:** Even hotfixes must pass tests; this is the safety mechanism

### Force Push Prevention

```bash
# Attempt force push to main
git push origin main --force

# Expected error:
# remote: error: protected branch hook declined to update refs/heads/main
# remote: You do not have permission to force push to main

# Workaround: Create PR instead (better anyway; gets validation)
```

---

## Common Questions

### Q: Do I have to use the pre-commit hook?

**A:** Yes, it's auto-installed when you run `bun install`. But you can bypass it temporarily:

```bash
git commit --no-verify -m "message"
```

**Warning:** This bypasses local validation. GitHub Actions still runs; code can't merge if tests fail. Use only if pre-commit hook is broken.

### Q: Why does the pre-commit hook only run unit tests?

**A:** 
- Unit tests are fast (~5 seconds)
- Component tests take longer (~1 second more, but setup is slow)
- GitHub Actions runs the full suite before merge (comprehensive validation)
- Local hook is first line of defense; CI is definitive validator

### Q: Can I merge to main without tests passing?

**A:** No. Branch protection rules prevent it:
- Merge button is disabled if tests fail
- Only way to merge: Tests must pass
- Only exception: Admin override (not recommended)

### Q: What if I break main by accident?

**A:** Branch protection prevents accidental pushes to main. But if something breaks:

```bash
# Revert the breaking commit
git revert <commit-hash>
git push origin main
# GitHub Actions re-runs on push
# If revert passes tests: Main is restored
```

### Q: How do I know if my code is safe?

**A:** Three layers of validation:

1. **Pre-commit hook** (local): Unit tests pass ✅
2. **GitHub Actions** (remote PR): Full test suite passes (unit + component) ✅
3. **Branch protection** (policy): Can't merge unless (1) and (2) pass ✅

If all three pass: Your code is safe. Merge with confidence.

### Q: What if tests are slow?

**A:** Report to team. Phase 2 runs fast (~5s locally, ~2 min CI). If slower:

```bash
# Identify slow tests
bun run test:unit -- --reporter=verbose

# Look for tests taking >1 second
# Report to team for optimization (Phase 3)
```

### Q: Can I skip GitHub Actions?

**A:** No. Push to GitHub automatically triggers workflow. You can:
- Skip pre-commit locally: `--no-verify` (but CI still runs)
- Disable branch protection: Admin-only, not recommended
- Delete workflow file: Not recommended; loses safety

### Q: Who has admin access to disable branch protection?

**A:** Repository admins. Usually:
- Team lead
- DevOps engineer
- Original project creator

Ask if you need override (should be rare).

### Q: What about private branches (not main)?

**A:** Branch protection rules only apply to `main`. Other branches:
- No protection rules
- Can merge without tests passing
- But best practice: Always test before merge

---

## Emergency Bypass

⚠️ **USE ONLY IF ABSOLUTELY NECESSARY**

### Skip Pre-commit Hook (Local)

```bash
git commit --no-verify -m "Emergency fix"
```

**What it does:** Skips local unit tests; commit proceeds immediately

**Risk:** Code might fail on GitHub Actions CI (tests still run there)

**When to use:**
- Pre-commit hook is broken (rare)
- Network is down (can't fetch dependencies)
- Emergency hotfix that can't wait (but still must pass GitHub Actions)

### Disable Branch Protection (GitHub Admin Only)

1. Go to repository Settings
2. Click "Branches" (left sidebar)
3. Find "main" protection rule
4. Click "Delete rule"
5. Confirm deletion

**What it does:** Allows merge without tests passing

**Risk:** Broken code can reach main; defeats entire CI/CD purpose

**When to use:**
- Critical infrastructure repair
- GitHub is down (can't run CI)
- Team consensus that safety mechanism is blocking (very rare)

**After bypass, re-enable immediately:**
1. Go to Settings → Branches
2. Click "Add rule"
3. Configure same as before (see docs or ask team)

---

## Coverage Report Review

### Quick Review

After workflow completes:

1. Download artifact from GitHub Actions run
2. Extract ZIP file
3. Open `coverage/index.html` in browser
4. Look at summary table at top:
   - Green ✅ = meets threshold
   - Red ❌ = below threshold (Phase 3: will enforce)

### Detailed Review

**Per-file breakdown:**
1. Expand files in coverage report
2. Hover over red lines → uncovered code
3. Click file name → see full source with coverage markers

**What to look for:**
- Functions not tested (red highlighting)
- Edge cases not covered (branching issues)
- Utilities missing tests (utility functions should be 100%)

### Phase 1 Baseline

Current coverage (established in Phase 1):
- `src/lib/utils.ts`: 82.6% (good coverage of retry logic)
- `src/components/NavDropdown.tsx`: 77.41% (good coverage of dropdown behavior)

**Phase 3 will enforce minimum thresholds** (70%+ statements, etc.)

---

## Getting Help

**Issue:** Something's not working?

1. **Check documentation:** Troubleshooting section above
2. **Check GitHub Actions logs:** Click workflow → see error details
3. **Run tests locally:** `bun run test` to reproduce
4. **Ask team:** Slack, Discord, or in-person

**Reporting a bug:**
1. Describe error
2. Include test output or log
3. Include OS/Node version: `node --version`, `bun --version`
4. Include reproduction steps

---

## References

- **Phase 1 Documentation:** `TESTING.md`
- **Vitest Config:** `vitest.config.ts`
- **GitHub Actions Docs:** https://docs.github.com/en/actions
- **Husky Docs:** https://typicode.github.io/husky/
- **Branch Protection:** https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches

---

**Version:** 2.0  
**Last Updated:** 2026-05-28  
**Status:** Phase 2 Complete
