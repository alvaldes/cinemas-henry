# SDD Tasks: CI/CD Integration with GitHub Actions & Pre-commit Hooks

**Change ID:** `cicd-integration-phase2`  
**Phase:** Phase 2 (follows Phase 1 TDD Infrastructure)  
**Date:** 2026-05-28  
**Status:** Tasks (approved from Design)  
**Author:** AI Assistant

---

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~470 lines (workflow YAML + docs + config) |
| 400-line budget risk | Medium (466 > 400; infrastructure justified) |
| Chained PRs recommended | Yes |
| Suggested split | PR1: Workflow + Hook + Package.json (~120 lines) → PR2: Docs + GitHub setup (~350 lines) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

---

## Guard Lines (Required for SDD Apply Phase)

```text
Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

---

## Executive Summary

Phase 2 CI/CD Integration requires 12 granular tasks organized in 4 work phases:

1. **Part A: Implementation (Tasks 1–4)** — Create all infrastructure files
2. **Part B: Local Validation (Tasks 5–6)** — Test pre-commit hook locally
3. **Part C: Integration & Commit (Tasks 7–8)** — Commit files and configure GitHub
4. **Part D: Verification (Tasks 9–12)** — End-to-end validation and Phase 1 compatibility check

**Total Effort:** 8–10 hours (including testing, docs, and verification)

**Critical Path:**
```
Task 1 → Task 7 (commit files)
Task 2 → Task 5 → Task 6 → Task 7
Task 3 → Task 5 → Task 7
Task 4 → Task 7
Task 7 → Task 8 (GitHub config)
Task 7 → Task 9 (PR validation)
Task 9 → Task 10 (branch protection test)
Task 7 → Task 11 (regression check)
```

---

## Part A: Implementation Tasks (Create Infrastructure Files)

### Task 1: Create GitHub Actions Workflow File

**ID:** `phase2-task-01`  
**Name:** Create `.github/workflows/test.yml` (GitHub Actions Workflow)  
**Phase:** Implementation  
**Time Estimate:** 45 minutes (including validation)

#### Description

Create the GitHub Actions workflow file that automatically runs tests on every PR push and main branch push. This file defines:
- Workflow name, triggers (pull_request, push, workflow_dispatch)
- Node.js matrix (18.x, 20.x)
- Job steps: checkout, setup Node, setup Bun, install deps, run tests, generate coverage, upload artifacts
- Timeout configuration (10 minutes)

**What to create:**
- File: `.github/workflows/test.yml` (new directory and file)
- Lines: ~60 lines of YAML

**Why this first:**
- No dependencies on other Phase 2 files
- Foundation for later CI validation tasks

#### Acceptance Criteria

- ✅ `.github/workflows/test.yml` created with exact YAML from Design spec
- ✅ File is valid YAML (no syntax errors)
- ✅ Triggers section includes: `pull_request`, `push` (main branch), `workflow_dispatch`
- ✅ Matrix includes both Node 18.x and 20.x
- ✅ All 7 job steps present: checkout, setup-node, setup-bun, install, test, coverage, upload-artifact
- ✅ `fail-fast: false` configured in matrix
- ✅ Timeout set to 10 minutes
- ✅ Coverage artifact retention set to 7 days
- ✅ File is committed to git (not just created locally)

#### Testing & Verification

**Step 1: Validate YAML syntax**
```bash
cd /Users/alvaldes/Developer/cinemas-henry
# Validate YAML (using online tool or yamllint if installed)
cat .github/workflows/test.yml | grep -E "^(name|on|jobs|runs-on|strategy)" 
# Manually check: no obvious syntax errors (proper indentation, keys)
```

**Step 2: Verify file content**
```bash
# Check file exists and is readable
test -f .github/workflows/test.yml && echo "✅ File exists"

# Verify key sections present
grep "name: Test Suite" .github/workflows/test.yml
grep "on:" .github/workflows/test.yml
grep "pull_request:" .github/workflows/test.yml
grep "push:" .github/workflows/test.yml
grep "matrix:" .github/workflows/test.yml
grep "node-version: \[18.x, 20.x\]" .github/workflows/test.yml
grep "timeout-minutes: 10" .github/workflows/test.yml
```

**Expected output:** All grep commands return matches (no "not found" errors).

#### Relevant Files

- **Input:** Design spec Section 1.5 (Complete Workflow YAML)
- **Output:** `.github/workflows/test.yml` (new file)
- **Git status:** `git status` should show `.github/workflows/test.yml` as untracked/staged

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **YAML indentation issues** | Use 2-space indentation consistently; verify in text editor |
| **Unsure about YAML syntax** | Copy exact YAML from Design spec; use online YAML validator |
| **Directory doesn't exist** | `mkdir -p .github/workflows` creates directory and parent |
| **File editor mangles formatting** | Use `cat >` or `tee` to write file directly |

#### Dependencies

- **Blocks:** Task 7 (commit), Task 9 (PR validation)
- **Blocked by:** None

---

### Task 2: Create Pre-commit Hook Script

**ID:** `phase2-task-02`  
**Name:** Create `.husky/pre-commit` (Pre-commit Hook Script)  
**Phase:** Implementation  
**Time Estimate:** 20 minutes

#### Description

Create the Husky pre-commit hook script that runs unit tests before each commit. This is a simple bash script that:
- Sources Husky's environment
- Runs `bun run test:unit`
- Exits with test exit code (blocks commit if tests fail)

**What to create:**
- File: `.husky/pre-commit` (new file, needs to be executable)
- Lines: ~4 lines of bash

**Why this early:**
- No dependencies; pure file creation
- Needed for Task 5 (local testing)

#### Acceptance Criteria

- ✅ `.husky/` directory exists
- ✅ `.husky/pre-commit` file created with correct content
- ✅ File has exact shebang: `#!/bin/sh`
- ✅ File sources Husky: `. "$(dirname "$0")/_/husky.sh"`
- ✅ File runs command: `bun run test:unit`
- ✅ File is executable: `chmod +x .husky/pre-commit`
- ✅ No Windows line endings (CRLF) — use Unix LF only
- ✅ File is tracked by git

#### Testing & Verification

**Step 1: Verify file exists and is readable**
```bash
test -f .husky/pre-commit && echo "✅ File exists" || echo "❌ File missing"
cat .husky/pre-commit
```

**Step 2: Verify executable permission**
```bash
ls -la .husky/pre-commit
# Output should include: -rwxr-xr-x (or similar, with 'x' for executable)
```

**Step 3: Verify file content**
```bash
grep "#!/bin/sh" .husky/pre-commit
grep "husky.sh" .husky/pre-commit
grep "bun run test:unit" .husky/pre-commit
```

**Expected:** All three grep commands return matches.

**Step 4: Verify no Windows line endings**
```bash
file .husky/pre-commit
# Output should be: "...ASCII text" NOT "...CRLF"
```

#### Relevant Files

- **Input:** Design spec Section 2.2 (Pre-commit Hook Configuration)
- **Output:** `.husky/pre-commit` (new file)
- **Related:** `.husky/_/husky.sh` (auto-generated by Husky during Task 5; don't create manually)

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **File not executable** | Run `chmod +x .husky/pre-commit` to make executable |
| **Windows line endings** | Run `dos2unix .husky/pre-commit` or use `git config core.autocrlf false` |
| **`.husky/` directory missing** | Run `mkdir -p .husky` to create directory |
| **Text editor adds extra lines** | Use `echo -e '#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\n\nbun run test:unit' > .husky/pre-commit` |

#### Dependencies

- **Blocks:** Task 5 (install hook), Task 6 (test hook), Task 7 (commit)
- **Blocked by:** None

---

### Task 3: Update `package.json` with Husky Configuration

**ID:** `phase2-task-03`  
**Name:** Update `package.json` (Add `prepare` script & `husky` dependency)  
**Phase:** Implementation  
**Time Estimate:** 15 minutes

#### Description

Modify `package.json` to:
1. Add `"prepare": "husky install"` to scripts section
2. Add `"husky": "^9.1.7"` to devDependencies

**What to modify:**
- File: `package.json` (existing file)
- Changes:
  - Add 1 line to scripts: `"prepare": "husky install",`
  - Add 1 line to devDependencies: `"husky": "^9.1.7",`

**Why this early:**
- Needed for Task 5 (auto-installation of hooks)
- No dependencies; pure file modification

#### Acceptance Criteria

- ✅ `package.json` is valid JSON (parseable)
- ✅ `prepare` script added to `scripts` object: `"prepare": "husky install"`
- ✅ `husky` added to `devDependencies`: `"husky": "^9.1.7"`
- ✅ All existing scripts still present and unchanged (test, test:unit, test:components, etc.)
- ✅ All existing devDependencies still present
- ✅ No trailing commas or syntax errors
- ✅ File is properly formatted JSON

#### Testing & Verification

**Step 1: Validate JSON syntax**
```bash
bun run env 2>&1 | grep -i "error" || echo "✅ JSON valid"
# OR:
cat package.json | python3 -m json.tool > /dev/null && echo "✅ JSON valid" || echo "❌ JSON invalid"
```

**Step 2: Verify `prepare` script**
```bash
grep '"prepare": "husky install"' package.json && echo "✅ Prepare script added"
```

**Step 3: Verify `husky` dependency**
```bash
grep '"husky": "\^9.1.7"' package.json && echo "✅ Husky dependency added"
```

**Step 4: Verify existing scripts unchanged**
```bash
grep '"test":' package.json
grep '"test:unit":' package.json
grep '"test:components":' package.json
# All three should return matches
```

**Expected:** All grep commands return matches; JSON is valid.

#### Relevant Files

- **Input:** `package.json` (current state from Phase 1)
- **Output:** `package.json` (modified with 2 additions)
- **No conflicts:** All changes are additions; no existing content removed

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **JSON syntax error** | Use `cat package.json | python3 -m json.tool` to validate; fix indentation |
| **Trailing comma missing** | Check all existing lines end with comma (except last item in object) |
| **Version format issue** | Verify: `"husky": "^9.1.7"` (not `9.1.7` or `*`) |
| **Prepare script already exists** | Check if `"prepare"` key exists; if so, update value |

#### Dependencies

- **Blocks:** Task 5 (bun install runs prepare script), Task 7 (commit)
- **Blocked by:** None

---

### Task 4: Create Documentation File (`docs/CI-CD-SETUP.md`)

**ID:** `phase2-task-04`  
**Name:** Create `docs/CI-CD-SETUP.md` (CI/CD Setup & Troubleshooting Guide)  
**Phase:** Implementation  
**Time Estimate:** 60 minutes (comprehensive documentation)

#### Description

Create comprehensive documentation guide for the CI/CD system, including:
- Quick start (3 steps)
- Pre-commit hook overview (what, how, troubleshooting)
- GitHub Actions workflow overview (what, how, troubleshooting)
- Branch protection rules explanation
- Common questions and answers
- Emergency bypass instructions
- Coverage report review guide

**What to create:**
- File: `docs/CI-CD-SETUP.md` (new file)
- Lines: ~400 lines of markdown

**Why this as separate task:**
- Requires careful documentation (dev-facing content)
- Can be completed in parallel with other tasks
- Review checkpoint: Team reviews docs before commit

#### Acceptance Criteria

- ✅ `docs/CI-CD-SETUP.md` created with markdown format
- ✅ All major sections present:
  - Quick Start (3 steps)
  - Pre-commit Hook section (what, install, use, troubleshooting)
  - GitHub Actions Workflow section (what, view results, troubleshooting)
  - Branch Protection section (what, why, how to work with it)
  - Common Questions section (5+ Q&A pairs)
  - Emergency Bypass section (with ⚠️ warnings)
  - Coverage Report Review guide
- ✅ Code blocks are formatted with correct syntax (```bash, ```markdown, etc.)
- ✅ Links are relative and valid (if linking to other docs)
- ✅ Markdown syntax is correct (no broken headings, lists, etc.)
- ✅ Tone is developer-friendly and clear
- ✅ File is tracked by git

#### Testing & Verification

**Step 1: Verify file exists**
```bash
test -f docs/CI-CD-SETUP.md && echo "✅ File exists"
```

**Step 2: Verify markdown structure**
```bash
grep -c "^##" docs/CI-CD-SETUP.md
# Should return a number ≥ 5 (at least 5 major sections)

grep "Quick Start" docs/CI-CD-SETUP.md
grep "Pre-commit" docs/CI-CD-SETUP.md
grep "GitHub Actions" docs/CI-CD-SETUP.md
grep "Branch Protection" docs/CI-CD-SETUP.md
grep "Common Questions" docs/CI-CD-SETUP.md
# All should return matches
```

**Step 3: Verify code blocks**
```bash
grep -c "^\`\`\`" docs/CI-CD-SETUP.md
# Should return an even number (opening and closing backticks)
# Example: 6 means 3 code blocks
```

**Step 4: Manual review (spot check)**
- Open `docs/CI-CD-SETUP.md` in text editor
- Verify no broken markdown (all headings parse correctly)
- Verify code examples are readable
- Verify warnings are clear (⚠️ symbols present where needed)

#### Relevant Files

- **Input:** Design spec Section 8.1 (docs/CI-CD-SETUP.md Structure)
- **Output:** `docs/CI-CD-SETUP.md` (new file)
- **Related:** TESTING.md (can reference for consistency)

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **Markdown syntax errors** | Use online markdown validator (markdownlint.com) |
| **Code blocks look ugly** | Ensure triple backticks and language identifier: `\`\`\`bash` |
| **Content too verbose** | Keep to ~400 lines; focus on action items not theory |
| **Unsure what to include** | Copy structure from Design spec Section 8.1 |

#### Dependencies

- **Blocks:** Task 7 (commit), Task 12 (final documentation review)
- **Blocked by:** None

---

## Review Checkpoint: Implementation Complete

**Before proceeding to Task 5, review:**

1. ✅ All 4 infrastructure files created?
   - `.github/workflows/test.yml`
   - `.husky/pre-commit`
   - `package.json` modified
   - `docs/CI-CD-SETUP.md`

2. ✅ Files are correct and complete?
   - YAML syntax valid
   - Pre-commit hook is executable
   - package.json is valid JSON
   - Documentation is clear

3. ✅ Ready to commit?
   - Files staged: `git add .github .husky package.json docs/`
   - No uncommitted changes in other files
   - Git history is clean

**If all yes, proceed to Part B (Local Validation).**

---

## Part B: Local Validation Tasks (Test Pre-commit Hook Locally)

### Task 5: Install Pre-commit Hook Locally

**ID:** `phase2-task-05`  
**Name:** Install Pre-commit Hook via `bun install` (Trigger `prepare` Script)  
**Phase:** Local Validation  
**Time Estimate:** 10 minutes

#### Description

Run `bun install` to trigger the `prepare` script, which automatically installs the Husky pre-commit hook. After this task:
- `.husky/` directory structure is complete
- `.husky/_/husky.sh` is created by Husky
- `.git/hooks/pre-commit` is registered as Git pre-commit hook
- Future commits will trigger the pre-commit validation

**What to do:**
1. Ensure all Phase 2 files from Part A are in place (Tasks 1–4)
2. Run: `bun install` (or `bun install --frozen-lockfile`)
3. Verify hook is installed

**Why this before testing:**
- Must install hooks before they can be tested
- `prepare` script is the installation mechanism
- Isolated task for clarity

#### Acceptance Criteria

- ✅ `bun install` completes successfully (no errors)
- ✅ `.husky/_/` directory created with at least `husky.sh`
- ✅ `.husky/_/husky.sh` is executable
- ✅ `.git/hooks/pre-commit` exists and is a symlink/reference to `.husky/pre-commit`
- ✅ Hook installation message appears in output (if Husky is verbose)
- ✅ No errors in output about missing dependencies

#### Testing & Verification

**Step 1: Run bun install**
```bash
cd /Users/alvaldes/Developer/cinemas-henry
bun install
# Output should show: no errors, all packages installed
```

**Step 2: Verify `.husky/_/` directory and files**
```bash
ls -la .husky/_/
# Expected: husky.sh and other files created by Husky
test -f .husky/_/husky.sh && echo "✅ husky.sh exists"
```

**Step 3: Verify git hook is registered**
```bash
ls -la .git/hooks/pre-commit
# Expected: symlink or file pointing to .husky/pre-commit

# Alternative: check if git recognizes it
git config core.hooksPath
# Expected: .husky (if Husky configured correctly)
```

**Step 4: Verify hook can be executed**
```bash
./.husky/pre-commit --help 2>&1 || echo "✅ Hook file is executable"
```

#### Relevant Files

- **Modified:** `package.json` (already done in Task 3)
- **Created by Husky:** `.husky/_/` directory and contents
- **Modified by git:** `.git/hooks/pre-commit` (git hook registration)

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **`bun install` fails** | Check internet connection; try `bun install --offline` if cache exists |
| **Husky not installed** | Verify Task 3 completed: husky in devDependencies |
| **Hook not registered** | Run `husky install` manually: `npx husky install` or `bun exec husky install` |
| **Git repo issue** | Ensure repo is initialized: `git rev-parse --git-dir` should return `.git` |

#### Dependencies

- **Depends on:** Task 2 (`.husky/pre-commit` file exists), Task 3 (package.json updated)
- **Blocks:** Task 6 (test hook), Task 7 (commit)

---

### Task 6: Test Pre-commit Hook Locally

**ID:** `phase2-task-06`  
**Name:** Test Pre-commit Hook Behavior (Pass & Fail Scenarios)  
**Phase:** Local Validation  
**Time Estimate:** 30 minutes (multiple test scenarios)

#### Description

Verify the pre-commit hook works correctly in both pass and fail scenarios:
1. **Pass scenario:** Commit with passing tests (hook allows commit)
2. **Fail scenario:** Commit with failing test (hook blocks commit)
3. **Bypass scenario:** Bypass hook with `--no-verify` (hook is skipped)

**What to do:**
1. Create intentional test modification (working code)
2. Try to commit (should pass and commit succeeds)
3. Modify code to intentionally break a test
4. Try to commit (should fail and commit blocked)
5. Use `--no-verify` to bypass (should succeed)

**Why this before committing:**
- Validates hook is working before pushing to GitHub
- Catches configuration issues early
- Proves fail-fast mechanism works

#### Acceptance Criteria

- ✅ **Pass scenario:** Commit valid code → hook runs `bun run test:unit` → tests pass → commit succeeds
- ✅ **Fail scenario:** Modify code to break test → hook runs tests → tests fail → commit blocked with error message
- ✅ **Error message clear:** When hook fails, output shows which test failed
- ✅ **Bypass scenario:** Use `git commit --no-verify` → commit succeeds even with failing tests
- ✅ **No false positives:** Hook doesn't block valid commits
- ✅ **No false negatives:** Hook catches actual test failures

#### Testing & Verification

**Test 1: Verify Hook is Active (Pre-check)**

```bash
cd /Users/alvaldes/Developer/cinemas-henry

# Verify hook file exists and is executable
test -x .husky/pre-commit && echo "✅ Hook is executable"

# Verify git recognizes hook
ls .git/hooks/pre-commit 2>/dev/null && echo "✅ Git hook registered"
```

**Test 2: Pass Scenario (Valid Code, Hook Allows Commit)**

```bash
# Step 1: Make a valid change (add comment, won't break tests)
echo "# Test comment" >> src/lib/utils.ts

# Step 2: Stage the change
git add src/lib/utils.ts

# Step 3: Try to commit
git commit -m "Add test comment"

# Expected output:
# ✓ src/lib/__tests__/utils.test.ts (16 tests) ...
# [main abc1234] Add test comment
# This means: hook ran tests, they passed, commit succeeded
```

**Verification:**
```bash
# Check commit was created
git log --oneline | head -1
# Should show: "abc1234 Add test comment" (recent commit)

# Revert the test change
git revert --no-edit HEAD  # Removes the test commit
```

**Test 3: Fail Scenario (Broken Test, Hook Blocks Commit)**

```bash
# Step 1: Intentionally break a test
# Edit src/lib/__tests__/utils.test.ts
# Change a test expectation to fail:
# OLD: expect(result).toBe(true)
# NEW: expect(result).toBe(false)  # Intentional break

# In editor or via sed:
sed -i.bak 's/expect(result).toBe(true)/expect(result).toBe(false)/' src/lib/__tests__/utils.test.ts

# Step 2: Stage the change
git add src/lib/__tests__/utils.test.ts

# Step 3: Try to commit
git commit -m "Break test to test hook"

# Expected output:
# ✗ [error message showing which test failed]
# husky - pre-commit hook exited with code 1 (error)
# Commit aborted.
# This means: hook ran tests, they failed, commit was blocked
```

**Verification:**
```bash
# Check that commit was NOT created
git status
# Should show: still have staged changes (commit didn't go through)

# Revert the test break
git checkout src/lib/__tests__/utils.test.ts  # Undo the break
git add src/lib/__tests__/utils.test.ts
# Now files are clean
```

**Test 4: Bypass Scenario (Use --no-verify)**

```bash
# Step 1: Intentionally break a test again
sed -i.bak 's/expect(result).toBe(true)/expect(result).toBe(false)/' src/lib/__tests__/utils.test.ts

# Step 2: Stage the change
git add src/lib/__tests__/utils.test.ts

# Step 3: Commit with --no-verify (bypass hook)
git commit --no-verify -m "Emergency bypass commit"

# Expected output:
# [main def5678] Emergency bypass commit
# This means: hook was skipped, commit succeeded despite failing tests
```

**Verification:**
```bash
# Check commit was created (even though tests failed)
git log --oneline | head -1
# Should show: "def5678 Emergency bypass commit"

# Revert this commit (we don't want broken tests in history)
git revert --no-edit HEAD
```

#### Relevant Files

- **Tested:** `src/lib/__tests__/utils.test.ts` (modified during testing)
- **Hook:** `.husky/pre-commit` (being tested)
- **Config:** `vitest.config.ts`, `package.json` (test runner config)

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **Hook doesn't run** | Check: `.husky/pre-commit` is executable, `bun install` completed, git repo is initialized |
| **Tests timeout** | Hook might be slow; check `bun run test:unit` locally first |
| **Sed command fails** | Use text editor to manually break a test instead |
| **Can't revert changes** | Use `git reset --hard` to undo all changes (careful!) |
| **Hook fails with "command not found"** | Ensure `bun` is in PATH: `which bun` should return a path |

#### Dependencies

- **Depends on:** Task 5 (hook installed)
- **Blocks:** Task 7 (commit files to git)

#### Notes for Tester

- **Don't worry about perfection:** These are temporary test changes; they'll be reverted
- **If something breaks:** Use `git reset --hard` to clean up everything
- **Hook only runs on commit:** Pushing, branching, or other git operations don't trigger it
- **Hook is fast:** Should complete in <5 seconds per test

---

## Review Checkpoint: Local Validation Complete

**Before proceeding to Task 7, verify:**

1. ✅ Hook installed successfully?
   - `.husky/_/` directory exists
   - `.git/hooks/pre-commit` is registered

2. ✅ All three test scenarios passed?
   - Valid code → hook allows commit ✅
   - Broken code → hook blocks commit ✅
   - Bypass works (`--no-verify`) ✅

3. ✅ Repository is clean?
   - All temporary test changes reverted
   - `git status` shows clean working directory
   - No uncommitted changes

**If all yes, proceed to Part C (Integration & Commit).**

---

## Part C: Integration & Commit Tasks

### Task 7: Commit All Phase 2 Files to Git

**ID:** `phase2-task-07`  
**Name:** Stage and Commit Phase 2 Infrastructure Files  
**Phase:** Integration & Commit  
**Time Estimate:** 20 minutes

#### Description

Commit all Phase 2 infrastructure files in a clean, organized commit(s):
1. Stage all Phase 2 files (`.github/`, `.husky/`, `package.json`, `docs/`)
2. Verify git status shows only intended changes
3. Create commit(s) with clear messages
4. Verify commit history is clean

**What to do:**
1. Ensure all temporary test changes from Task 6 are reverted
2. Stage files: `git add .github .husky package.json docs/`
3. Verify status: `git status` shows only Phase 2 files
4. Commit with message(s)
5. Push to GitHub (or stage for later push)

**Why this as separate task:**
- Clean separation: Implementation (A) → Validation (B) → Commit (C)
- Allows review checkpoint before permanent commit
- Single commit vs multiple commits decision point

#### Acceptance Criteria

- ✅ `.git/hooks/pre-commit` hook file is executable
- ✅ `.github/workflows/test.yml` is staged and in commit
- ✅ `.husky/pre-commit` is staged and in commit
- ✅ `.husky/.gitignore` is staged (auto-generated by Husky; includes hook symlinks)
- ✅ `package.json` changes (prepare script + husky dependency) are staged
- ✅ `docs/CI-CD-SETUP.md` is staged and in commit
- ✅ **No other files modified:** `git status` shows ONLY Phase 2 files
- ✅ Commit message is clear: "ci: add GitHub Actions workflow and pre-commit hook"
- ✅ Commit is in local git history: `git log --oneline` shows new commit
- ✅ **No Phase 1 files modified:** Existing tests, vitest.config.ts, etc. are unchanged

#### Testing & Verification

**Step 1: Verify clean working directory**

```bash
cd /Users/alvaldes/Developer/cinemas-henry
git status --short
# Output should show NO modified files (only the 4 new Phase 2 files)
# If you see src/ or other files, you have uncommitted changes to clean up
```

**Step 2: Stage all Phase 2 files**

```bash
git add .github
git add .husky
git add package.json
git add docs/
```

**Step 3: Verify staging**

```bash
git status
# Should show:
# new file: .github/workflows/test.yml
# new file: .husky/pre-commit
# new file: .husky/.gitignore (auto-generated by Husky)
# modified: package.json
# new file: docs/CI-CD-SETUP.md
# No other files should appear
```

**Step 4: Review changes before commit**

```bash
git diff --cached | head -100
# Shows what will be committed; verify it looks correct
```

**Step 5: Commit**

```bash
git commit -m "ci: add GitHub Actions workflow and pre-commit hook

- Add .github/workflows/test.yml (GitHub Actions CI)
- Add .husky/pre-commit hook (local fail-fast validation)
- Update package.json with prepare script and husky dependency
- Add docs/CI-CD-SETUP.md (setup and troubleshooting guide)

Phase 2: CI/CD Integration infrastructure"
```

**Step 6: Verify commit**

```bash
git log --oneline -1
# Should show the new commit

git log -1 --stat
# Should show files added/modified:
# .github/workflows/test.yml | X lines
# .husky/pre-commit | X lines
# .husky/.gitignore | X lines
# package.json | X lines
# docs/CI-CD-SETUP.md | X lines

git show HEAD:.github/workflows/test.yml | head -5
# Verify workflow file content is correct
```

#### Relevant Files

- **Committed:** `.github/workflows/test.yml`, `.husky/pre-commit`, `.husky/.gitignore`, `package.json`, `docs/CI-CD-SETUP.md`
- **Not committed (should not appear):** Any src/, tests/, vitest.config.ts, etc.

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **Uncommitted changes to other files** | Run `git diff src/` to see what changed; revert if unintended: `git checkout src/` |
| **File permissions wrong** | Ensure `.husky/pre-commit` is executable: `chmod +x .husky/pre-commit` |
| **Package.json still invalid** | Validate JSON: `cat package.json \| python3 -m json.tool` |
| **YAML file has issues** | Review `.github/workflows/test.yml` manually; use online YAML validator |
| **Accidental commit of test changes** | Ammend commit: `git commit --amend` to add/remove files |

#### Dependencies

- **Depends on:** Task 1–4 (files created), Task 5–6 (validated locally)
- **Blocks:** Task 8 (GitHub config), Task 9 (PR validation), Task 11 (regression check)

#### Chained PR Consideration

**Option 1: Single PR (466 lines total)**
- Commit all files in one PR
- Advantage: Simpler; single review cycle
- Risk: Over 400 lines; review might be tedious

**Option 2: Two Chained PRs (recommended)**
- **PR1:** `.github/workflows/test.yml` + `.husky/pre-commit` + `package.json` (~120 lines)
  - Commit message: "ci: add GitHub Actions workflow and pre-commit infrastructure"
- **PR2:** `docs/CI-CD-SETUP.md` + GitHub branch protection config (~350 lines)
  - Commit message: "ci: add CI/CD documentation and branch protection"
  - Depends on PR1 being merged

**Recommendation:** Use Option 2 (chained PRs) for better review and rollback capability.

---

### Task 8: Configure GitHub Branch Protection Rule for Main

**ID:** `phase2-task-08`  
**Name:** Configure Branch Protection Rule on GitHub (Require CI Pass)  
**Phase:** Integration & Commit  
**Time Estimate:** 15 minutes (manual GitHub UI configuration)

#### Description

Configure GitHub branch protection rule for the `main` branch to:
- Require GitHub Actions workflow "Test Suite" to pass before merge
- Prevent force push to main
- Prevent accidental deletion of main branch

This is done entirely in GitHub UI (Settings → Branches).

**What to do:**
1. Go to GitHub repository Settings
2. Click "Branches" (left sidebar)
3. Add branch protection rule for `main`
4. Configure rule to require "test" workflow
5. Save and verify

**Why this is a separate task:**
- Requires GitHub UI access (not local)
- Cannot be automated via CLI in this phase
- Critical gating mechanism; deserves dedicated validation

#### Acceptance Criteria

- ✅ Branch protection rule created for `main` branch
- ✅ Rule requires status check: "test" (GitHub Actions workflow)
- ✅ Rule prevents force push: "Allow force pushes" = DISABLED
- ✅ Rule prevents deletion: "Allow deletions" = DISABLED
- ✅ Rule visible in GitHub Settings → Branches page
- ✅ Rule applies immediately (no delay)

#### Testing & Verification

**Step 1: Verify Rule Exists**

Go to GitHub repo → Settings → Branches → Look for "main" rule entry
- Should see: "Branch protection rule for main"
- Should show: "test" workflow required

**Step 2: Verify Merge Button Behavior (Tested in Task 10)**

- When CI passes on PR: Merge button ENABLED (green)
- When CI fails on PR: Merge button DISABLED (red)

**Step 3: Verify Force Push is Blocked (Manual Test)**

```bash
# Locally (don't actually do this; just verify it would fail):
git push origin main --force
# Expected: 
# remote: error: protected branch hook declined to update refs/heads/main
# remote: You do not have permission to force push to main
```

#### Relevant Files

- **No files modified/created**
- **GitHub UI setting:** Repository Settings → Branches → Add rule

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **Can't access repo settings** | Check GitHub permissions (must be admin or have `settings` scope) |
| **Can't find "Branches" option** | It's under Settings (top-right gear icon) → left sidebar → "Branches" |
| **"test" workflow not available** | Ensure Task 7 is committed and pushed to GitHub; wait 1-2 min for Actions to register |
| **Rule won't save** | Check for validation errors (GitHub shows message if rule config is invalid) |
| **Need to edit rule later** | Go back to same Settings → Branches page, click "Edit" on the rule |

#### Dependencies

- **Depends on:** Task 7 (files committed to GitHub; workflow registered)
- **Blocks:** Task 10 (test branch protection behavior)

#### Manual Steps (Detailed)

1. **Go to repository**
   - URL: https://github.com/alvaldes/cinemas-henry

2. **Open Settings**
   - Click "Settings" tab (top-right)

3. **Navigate to Branches**
   - Left sidebar → "Branches"

4. **Add rule**
   - Button: "Add rule"

5. **Fill in rule form**
   - Branch name pattern: `main`
   - Check: ✅ "Require a pull request before merging"
   - Check: ✅ "Require status checks to pass before merging"
   - Search for "test" in status check list
   - Select: ✅ "test" (from GitHub Actions)
   - Check: ✅ "Require branches to be up to date before merging" (optional but recommended)
   - Uncheck: ❌ "Allow force pushes"
   - Uncheck: ❌ "Allow deletions"

6. **Save rule**
   - Button: "Create" or "Save"

7. **Verify rule appears**
   - Go back to Branches page
   - Should see "main" listed under "Branch protection rules"

---

## Part D: Verification & Validation Tasks

### Task 9: Create Test PR to Validate GitHub Actions Workflow

**ID:** `phase2-task-09`  
**Name:** Create PR with Dummy Change to Validate Workflow Triggers  
**Phase:** Verification  
**Time Estimate:** 20 minutes

#### Description

Create a test PR to verify that GitHub Actions workflow triggers correctly on PR creation/update. This validates:
- Workflow triggers on PR push
- Workflow runs on both Node 18 and 20
- Workflow passes (green checkmark on PR)
- Coverage artifacts are generated

**What to do:**
1. Create a new branch from main
2. Make a small, valid change (e.g., add comment to a test file)
3. Push branch to GitHub
4. Create PR to main
5. Wait for GitHub Actions to run
6. Verify workflow status on PR

**Why this as separate task:**
- Validates CI pipeline works end-to-end
- Must be done AFTER files are committed and pushed
- Creates realistic PR scenario

#### Acceptance Criteria

- ✅ Branch created and pushed to GitHub
- ✅ PR created to main
- ✅ GitHub Actions workflow "Test Suite" appears in PR Checks section
- ✅ Workflow runs on both Node 18.x and 20.x (visible in workflow details)
- ✅ Workflow passes (green ✓ checkmark, not red X)
- ✅ All 28 tests pass in the workflow logs
- ✅ Coverage artifacts uploaded (visible in workflow run's "Artifacts" section)
- ✅ Coverage report is accessible (can download and inspect)
- ✅ No errors in workflow logs

#### Testing & Verification

**Step 1: Create test branch**

```bash
cd /Users/alvaldes/Developer/cinemas-henry
git checkout -b ci-test/workflow-validation
```

**Step 2: Make a valid, harmless change**

```bash
# Add a comment to a test file (doesn't break anything)
echo "# CI test validation comment" >> src/lib/__tests__/utils.test.ts
```

**Step 3: Stage and commit**

```bash
git add src/lib/__tests__/utils.test.ts
git commit -m "test: add CI validation comment (will revert)"
```

**Step 4: Push to GitHub**

```bash
git push origin ci-test/workflow-validation
```

**Step 5: Create PR (via GitHub UI)**

- Go to GitHub repository
- Click "Pull requests" tab
- Click "New Pull Request"
- Base: `main`
- Compare: `ci-test/workflow-validation`
- Click "Create Pull Request"
- Add title: "CI Test: Validate GitHub Actions Workflow"
- Add description: "This PR validates that GitHub Actions workflow triggers correctly"
- Click "Create Pull Request"

**Step 6: Wait for workflow to run**

```
Go to PR page
  ↓
Scroll to "Checks" section
  ↓
Verify "Test Suite" is running (spinning icon)
  ↓
Wait ~2 minutes for workflow to complete
  ↓
Verify "Test Suite" shows green ✓ (success)
```

**Step 7: Inspect workflow details**

- Click "Test Suite" in Checks section
- Click "Details" link
- View workflow run page

**Expected to see:**
- Job 1: Tests on Node 18.x → ✅ Passed
- Job 2: Tests on Node 20.x → ✅ Passed
- All 28 tests passed

**Step 8: Verify coverage artifacts**

- On workflow run page, scroll to bottom
- Look for "Artifacts" section
- Should see: `coverage-report-node-18.x` and `coverage-report-node-20.x`
- Click to download (don't need to; just verify it's there)

**Step 9: Close the PR (don't merge)**

- Click "Close pull request" (we don't want to merge test code)
- Confirm: "Yes, close this pull request"

**Step 10: Verify branch can be deleted**

```bash
# Locally delete the test branch
git checkout main
git branch -D ci-test/workflow-validation
git push origin --delete ci-test/workflow-validation
```

#### Relevant Files

- **Test branch:** `ci-test/workflow-validation` (temporary; deleted after)
- **Modified during test:** `src/lib/__tests__/utils.test.ts` (added comment; reverted in Step 10)

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **Workflow doesn't appear on PR** | Wait 1-2 minutes; refresh page. If still missing, check Actions tab to see if workflow ran at all |
| **Workflow fails** | Click workflow name to see logs; identify which test failed; debug locally |
| **Node 18 job fails but 20 passes** | Indicates version-specific issue; debug with `nvm use 18` locally or check workflow logs |
| **Coverage artifacts missing** | Workflow might have timed out; check workflow logs for upload step |
| **Can't create PR** | Ensure branch is pushed to GitHub: `git push origin ci-test/workflow-validation` |

#### Dependencies

- **Depends on:** Task 7 (files committed and pushed to main), Task 8 (branch protection rule configured)
- **Blocks:** Task 10 (test branch protection behavior)

---

### Task 10: Validate Branch Protection Blocks/Allows Merges

**ID:** `phase2-task-10`  
**Name:** Verify Branch Protection Rule Prevents Merge of Failing Code  
**Phase:** Verification  
**Time Estimate:** 25 minutes

#### Description

Verify that branch protection rule correctly:
1. **Blocks merge** when CI fails (red X on checks)
2. **Allows merge** when CI passes (green ✓ on checks)
3. **Enforces latest code** (stale checks = blocked)

This is the critical validation that branch protection works as intended.

**What to do:**
1. Create PR with intentionally broken test
2. Verify merge button is disabled (red)
3. Fix the test
4. Verify merge button becomes enabled (green)
5. Merge and verify

**Why this as separate task:**
- Validates the most critical safety mechanism
- Must test both fail and pass scenarios
- Deserves dedicated testing time

#### Acceptance Criteria

- ✅ **Fail scenario:** PR with broken test → Merge button DISABLED (red, can't click)
- ✅ **Fail message:** PR shows "Required status check 'test' is failing"
- ✅ **Pass scenario:** PR with fixed test → Merge button ENABLED (green, can click)
- ✅ **Pass message:** PR shows "All checks have passed"
- ✅ **Merge succeeds:** After merge, PR shows "Merged" badge
- ✅ **Main branch is safe:** After merge, CI still passes on main

#### Testing & Verification

**Scenario A: Test PR with Failing Code (Merge Button Disabled)**

**Step 1: Create test branch**

```bash
git checkout -b test/branch-protection-fail
```

**Step 2: Intentionally break a test**

```bash
# Modify a test to fail
sed -i.bak 's/expect(result).toBe(true)/expect(result).toBe(false)/' src/lib/__tests__/utils.test.ts
```

**Step 3: Commit and push**

```bash
git add src/lib/__tests__/utils.test.ts
git commit -m "test: intentionally break test to validate branch protection"
git push origin test/branch-protection-fail
```

**Step 4: Create PR (via GitHub UI)**

- Go to GitHub PR creation page
- Create PR to `main` from `test/branch-protection-fail`
- Title: "DRAFT: Test Branch Protection (Failing Tests)"
- Description: "This PR has intentionally broken tests; merge button should be disabled"

**Step 5: Wait for CI to run**

```
PR page → Checks section
  ↓
Verify "Test Suite" is running
  ↓
Wait ~2 minutes for completion
  ↓
Verify "Test Suite" shows red ❌ (failed)
```

**Step 6: Verify merge button is disabled**

```
PR page → Scroll to merge section
  ↓
Verify merge button is DISABLED (gray or red)
  ↓
Hover over button → See message:
  "Required status checks must pass before merging"
  OR "The 'test' check is required and must succeed before merging"
```

**Expected state:**
- ❌ Merge button: DISABLED (can't click)
- ❌ Checks: "test" shows red X (failed)

**Verification screenshot/confirmation:**
```
- PR URL: https://github.com/alvaldes/cinemas-henry/pull/X
- Merge button: DISABLED (red/gray)
- Checks section: Shows red X for "test"
```

---

**Scenario B: Fix the Test (Merge Button Enabled)**

**Step 7: Fix the broken test**

```bash
# Revert the intentional break
git checkout src/lib/__tests__/utils.test.ts
```

**Step 8: Commit and push the fix**

```bash
git add src/lib/__tests__/utils.test.ts
git commit -m "fix: fix test to enable merge"
git push origin test/branch-protection-fail
```

**Step 9: PR automatically re-runs CI**

```
GitHub automatically re-runs workflow when new commits are pushed
  ↓
Check PR page → Checks section
  ↓
Verify "Test Suite" is running again
  ↓
Wait ~2 minutes for completion
  ↓
Verify "Test Suite" shows green ✓ (passed)
```

**Step 10: Verify merge button is now enabled**

```
PR page → Scroll to merge section
  ↓
Verify merge button is ENABLED (green)
  ↓
Button is clickable; can now merge
```

**Expected state:**
- ✅ Merge button: ENABLED (green)
- ✅ Checks section: Shows green ✓ for "test"

**Verification screenshot/confirmation:**
```
- PR URL: https://github.com/alvaldes/cinemas-henry/pull/X
- Merge button: ENABLED (green, clickable)
- Checks section: Shows green ✓ for "test"
```

---

**Step 11: Merge the PR**

```bash
# Click "Merge pull request" button on GitHub UI
# Select merge strategy: "Create a merge commit" (default)
# Click "Confirm merge"
```

**Step 12: Verify main branch is safe after merge**

```
GitHub Actions workflow runs automatically on main branch push
  ↓
Go to repository Actions tab
  ↓
Verify latest workflow run shows green ✓
  ↓
All 28 tests passing on main
```

**Step 13: Clean up test branch**

```bash
# Locally delete test branch
git checkout main
git pull  # Fetch latest main with merged PR
git branch -D test/branch-protection-fail
git push origin --delete test/branch-protection-fail
```

#### Relevant Files

- **Test branch:** `test/branch-protection-fail` (temporary; deleted after)
- **Modified during test:** `src/lib/__tests__/utils.test.ts` (broken then fixed; same as original after)

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **Merge button not disabled** | Branch protection rule not working; verify it's configured correctly in Task 8 |
| **Merge button still disabled after fix** | GitHub might have stale checks; wait 1-2 min, refresh page |
| **Can't find Checks section on PR** | Scroll down on PR page; or click "Details" next to failing check |
| **Merge fails after button enabled** | Rare; check for other branch protection rules or permission issues |

#### Dependencies

- **Depends on:** Task 8 (branch protection rule configured), Task 9 (validated workflow)
- **Blocks:** Task 11 (Phase 1 regression check), Task 12 (final review)

---

### Task 11: Verify Phase 1 Tests Still Pass (No Regressions)

**ID:** `phase2-task-11`  
**Name:** Full Regression Test: Ensure Phase 1 Infrastructure Unchanged  
**Phase:** Verification  
**Time Estimate:** 15 minutes

#### Description

Verify that Phase 2 changes did NOT break Phase 1 infrastructure. This ensures:
- All 28 tests still pass locally
- Coverage still ~81%
- `bun run dev` still works
- `bun run build` still works (or fails with pre-existing error only)
- No Phase 1 files were modified

**What to do:**
1. Checkout main branch
2. Pull latest code (includes Phase 2 commits)
3. Run all test commands
4. Run dev server
5. Attempt build
6. Verify no regressions

**Why this as dedicated task:**
- Regression testing is critical before final approval
- Deserves explicit verification time
- Blocks final sign-off

#### Acceptance Criteria

- ✅ `bun run test` executes and returns exit code 0 (success)
- ✅ All 28 tests pass (16 unit + 12 component)
- ✅ Test output shows: "Test Files 2 passed (2)" and "Tests 28 passed (28)"
- ✅ `bun run test:coverage` generates coverage report
- ✅ Coverage ~81% (same as Phase 1 baseline)
- ✅ `bun run dev` starts Astro dev server on port 3000 (or 3001 if 3000 taken)
- ✅ Dev server responds to localhost (can curl or open in browser)
- ✅ `bun run build` produces output (either success or pre-existing failure, not new failure)
- ✅ No Phase 1 files modified: Only Phase 2 files in git diff

#### Testing & Verification

**Step 1: Ensure main branch is checked out and up-to-date**

```bash
cd /Users/alvaldes/Developer/cinemas-henry
git checkout main
git pull origin main
```

**Step 2: Install dependencies (if needed)**

```bash
bun install
```

**Step 3: Run full test suite**

```bash
bun run test
```

**Expected output:**
```
$ vitest run src/lib/__tests__

 ✓ src/lib/__tests__/utils.test.ts (16 tests)
   ...
 Test Files  1 passed (1)
      Tests  16 passed (16)

$ vitest run src/components/__tests__

 ✓ src/components/__tests__/NavDropdown.test.tsx (12 tests)
   ...
 Test Files  1 passed (1)
      Tests  12 passed (12)
```

**Verification:**
```bash
echo $?  # Should be 0 (success)
```

**Step 4: Run test:unit specifically**

```bash
bun run test:unit
```

**Expected:** 16 tests pass ✅

**Step 5: Run test:components specifically**

```bash
bun run test:components
```

**Expected:** 12 tests pass ✅

**Step 6: Generate coverage report**

```bash
bun run test:coverage
```

**Expected:**
```
Coverage summary:
Statements   : X% (should be ~81%)
Branches     : X% (should be ~75%)
Functions    : X% (should be 100%)
Lines        : X% (should be ~82%)
```

**Step 7: Start dev server**

```bash
# In one terminal:
bun run dev

# In another terminal (while dev server runs):
sleep 2  # Give server time to start
curl http://localhost:3000/ | head -20
# Should return HTML (not error)

# Kill dev server: Ctrl+C in original terminal
```

**Expected:** Server starts, responds to HTTP requests ✅

**Step 8: Attempt build**

```bash
bun run build
```

**Expected:**
- ✅ Success: `.astro/` directory created, no errors
- ⚠️ Pre-existing error: If build failed before Phase 2, that's OK (not a regression)
- ❌ NEW error: If Phase 2 broke something, this would fail

**Verification:**
```bash
# If build succeeded:
test -d .astro && echo "✅ Build successful; .astro/ directory exists"

# If build failed (pre-existing):
echo "✅ Build failure is pre-existing (not caused by Phase 2)"
```

**Step 9: Verify no Phase 1 files were modified**

```bash
# Show what changed in Phase 2
git diff main~1 HEAD --name-only | sort
# Should show only:
# .github/workflows/test.yml
# .husky/.gitignore
# .husky/pre-commit
# docs/CI-CD-SETUP.md
# package.json

# Verify Phase 1 files are unchanged
git diff main~1 HEAD -- src/lib/__tests__/utils.test.ts | wc -l
# Should be 0 (no diff)

git diff main~1 HEAD -- src/components/__tests__/NavDropdown.test.tsx | wc -l
# Should be 0 (no diff)

git diff main~1 HEAD -- vitest.config.ts | wc -l
# Should be 0 (no diff)
```

#### Relevant Files

- **Tested (unchanged):**
  - `src/lib/__tests__/utils.test.ts`
  - `src/components/__tests__/NavDropdown.test.tsx`
  - `vitest.config.ts`
  - `tests/fixtures/setup.ts`
  - `TESTING.md`

- **Modified (expected):**
  - `.github/workflows/test.yml` (new)
  - `.husky/pre-commit` (new)
  - `package.json` (updated with prepare + husky)
  - `docs/CI-CD-SETUP.md` (new)

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **Tests fail unexpectedly** | Run locally first; check if it's a pre-existing issue or Phase 2 caused it |
| **Build fails with new error** | Check error message; likely unrelated to Phase 2 (Phase 2 doesn't modify build config) |
| **Dev server won't start** | Check if port 3000 is in use: `lsof -i :3000`; kill process if blocking |
| **Coverage drops significantly** | Unlikely; Phase 2 doesn't modify code. If it happens, investigate test files |

#### Dependencies

- **Depends on:** Task 7 (Phase 2 committed to main)
- **Blocks:** Task 12 (final sign-off)

---

### Task 12: Final Documentation & Sign-Off Review

**ID:** `phase2-task-12`  
**Name:** Review Documentation and Prepare Phase 2 Summary  
**Phase:** Verification  
**Time Estimate:** 20 minutes

#### Description

Final review of all Phase 2 documentation and creation of summary document. This ensures:
- Documentation is clear and complete
- All tasks are verified and complete
- Known issues and next steps are documented
- Phase 2 success criteria are met

**What to do:**
1. Review `docs/CI-CD-SETUP.md` for clarity and completeness
2. Create summary document: `openspec/changes/cicd-integration-apply-summary.md`
3. Document any deviations from original plan
4. List known issues and workarounds
5. Outline next steps for Phase 3

**Why this as final task:**
- Captures lessons learned
- Enables smooth Phase 3 transition
- Provides team reference documentation

#### Acceptance Criteria

- ✅ `docs/CI-CD-SETUP.md` is clear, complete, and tested by team member
- ✅ All 12 tasks completed and verified
- ✅ Summary document created: `openspec/changes/cicd-integration-apply-summary.md`
- ✅ Summary includes:
  - Executive summary (Phase 2 complete and working)
  - Completed tasks list (all 12 tasks)
  - Test results (workflow passes, branch protection works, Phase 1 unchanged)
  - Known issues (if any)
  - Team feedback (if any)
- ✅ README or CONTRIBUTING guide updated (if needed) to reference CI/CD docs
- ✅ No outstanding blockers or critical issues

#### Testing & Verification

**Step 1: Review documentation**

```bash
# Open docs/CI-CD-SETUP.md and verify:
# - All sections are clear
# - Code examples are correct
# - Troubleshooting covers common issues
# - Team member has reviewed and approved
```

**Step 2: Create summary document**

Create file: `openspec/changes/cicd-integration-apply-summary.md`

**Content outline:**
```markdown
# CI/CD Integration Phase 2 — Apply Summary

## Status: ✅ COMPLETE

All 12 tasks completed successfully. Phase 2 CI/CD infrastructure is deployed and working.

## Completed Tasks

- [x] Task 1: Create `.github/workflows/test.yml`
- [x] Task 2: Create `.husky/pre-commit`
- [x] Task 3: Update `package.json`
- [x] Task 4: Create `docs/CI-CD-SETUP.md`
- [x] Task 5: Install pre-commit hook locally
- [x] Task 6: Test pre-commit hook behavior
- [x] Task 7: Commit Phase 2 files
- [x] Task 8: Configure GitHub branch protection
- [x] Task 9: Validate workflow triggers
- [x] Task 10: Validate branch protection
- [x] Task 11: Verify Phase 1 tests pass
- [x] Task 12: Final documentation review

## Test Results

- Unit tests: 16/16 passing ✅
- Component tests: 12/12 passing ✅
- Coverage: 81%+ (maintained from Phase 1) ✅
- GitHub Actions workflow: Passes on Node 18 & 20 ✅
- Branch protection: Correctly blocks/allows merges ✅
- Phase 1 regression: None detected ✅

## Deployment Details

- **Files created:**
  - `.github/workflows/test.yml` (~60 lines)
  - `.husky/pre-commit` (~4 lines)
  - `docs/CI-CD-SETUP.md` (~400 lines)

- **Files modified:**
  - `package.json` (2 additions: prepare script + husky)

- **Total changes:** ~466 lines
- **Commits:** 2 (Infrastructure + Documentation, or 1 if combined)

## Workflow Behavior

- **Pre-commit hook:** Blocks commits if unit tests fail; ~5 second validation
- **GitHub Actions:** Runs full test suite (unit + component) on PR/push to main; ~2 minutes per PR
- **Branch protection:** Prevents merge to main if CI fails; enforces passing tests before all merges
- **Coverage artifacts:** Uploaded to GitHub Actions for review (7-day retention)

## Known Issues

None currently. All systems operational.

## Next Steps (Phase 3)

1. **MSW Migration:** If HTTP mocks exceed 200 lines, migrate from vi.mock to MSW
2. **Coverage Enforcement:** Add coverage thresholds as CI gates (Phase 2 informational; Phase 3 enforced)
3. **E2E Expansion:** Add Playwright tests for booking flows, error scenarios
4. **CI/CD Notifications:** Add Slack webhooks for CI failures (optional)
5. **Performance Optimization:** Profile slow tests; optimize if > 10 seconds

## Team Feedback

(To be filled after team review)

- Developer 1: "..."
- Developer 2: "..."

## Lessons Learned

(To be filled after apply phase)

- What went well: ...
- What could improve: ...
- Recommendations for Phase 3: ...
```

**Step 3: Verify documentation completeness**

```bash
# Check that docs/CI-CD-SETUP.md has all required sections
grep "^## " docs/CI-CD-SETUP.md | wc -l
# Should be ≥ 6 (at least 6 main sections)

# Verify code examples are present
grep "^\`\`\`" docs/CI-CD-SETUP.md | wc -l
# Should be even number (opening and closing backticks)

# Check for common questions section
grep -i "common question" docs/CI-CD-SETUP.md && echo "✅ Q&A section found"
```

**Step 4: Verify all tasks are in git history**

```bash
git log --oneline main~15..main | grep -i "ci\|cicd\|github\|action\|husky\|hook"
# Should show commits related to Phase 2
```

**Step 5: Commit summary document**

```bash
git add openspec/changes/cicd-integration-apply-summary.md
git commit -m "docs: add Phase 2 CI/CD integration apply summary"
git push origin main
```

#### Relevant Files

- **Reviewed:** `docs/CI-CD-SETUP.md`
- **Created:** `openspec/changes/cicd-integration-apply-summary.md`
- **Updated (if needed):** `README.md` or `CONTRIBUTING.md` (to reference CI/CD docs)

#### Potential Blockers & Workarounds

| Blocker | Mitigation |
|---------|-----------|
| **Documentation unclear** | Rewrite sections; get peer review from team member |
| **Missing test results** | Run tests again; capture output and logs |
| **Unknown issues discovered** | Document as "Known Issue"; plan fix for Phase 3 |

#### Dependencies

- **Depends on:** Task 1–11 (all tasks completed)
- **Blocks:** None (final task)

---

## Task Dependency Graph

```
Task 1 (Workflow YAML)
  ↓
Task 7 (Commit)
  ↓
Task 9 (PR validation)
  ↓
Task 10 (Branch protection validation)

Task 2 (Pre-commit hook) → Task 5 (Install) → Task 6 (Test) → Task 7
Task 3 (package.json) ───────────────────────────────────→ Task 7
Task 4 (Documentation) ─────────────────────────────────→ Task 7

Task 7 ────→ Task 8 (GitHub branch protection config)
Task 7 ────→ Task 11 (Phase 1 regression check)
Task 8, 9 → Task 10 (Validate branch protection behavior)
Task 11 ──→ Task 12 (Final documentation review)
```

---

## Estimated Effort & Timeline

| Phase | Tasks | Est. Time | Notes |
|-------|-------|-----------|-------|
| **A: Implementation** | 1–4 | 2.5 hours | File creation, validation |
| **B: Local Validation** | 5–6 | 0.75 hours | Local testing, hook behavior |
| **C: Integration** | 7–8 | 0.75 hours | Commit, GitHub config |
| **D: Verification** | 9–12 | 1.5 hours | PR testing, regression check, docs |
| **TOTAL** | 1–12 | **5.5 hours** | Conservative; allows for debugging |

**Parallel execution possible:** Tasks 1–4 can run in parallel (no dependencies); sequential only from Task 5 onward.

---

## Critical Path Analysis

**Minimum sequential time (if all go smoothly):**
1. Tasks 1–4 in parallel: 1 hour
2. Task 5: 0.25 hour
3. Task 6: 0.5 hour
4. Task 7: 0.33 hour
5. Task 8: 0.25 hour
6. Task 9: 0.33 hour (includes wait time for CI)
7. Task 10: 0.5 hour (includes wait time for CI)
8. Task 11: 0.25 hour
9. Task 12: 0.33 hour

**Total: ~4 hours (with wait time for CI)**

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| **YAML syntax error in workflow** | Low | Medium | Validate YAML before commit; use GitHub editor |
| **Pre-commit hook doesn't trigger** | Low | Medium | Test locally before GitHub; verify `prepare` script ran |
| **GitHub Actions times out** | Low | Low | Check for hanging tests locally; 10-minute limit is generous |
| **Branch protection blocks unintentionally** | Low | Medium | Test with dummy PR; verify rule configuration |
| **Phase 1 tests break** | Very low | High | Monitor test output; rollback Task 7 if regression detected |
| **Merge conflicts in package.json** | Very low | Low | Keep changes minimal; 2 line additions only |

**Overall Risk:** **LOW** (Phase 2 is purely additive; no code changes to Phase 1)

---

## Success Criteria Checklist

- ✅ All 12 tasks completed without critical blockers
- ✅ GitHub Actions workflow working (triggers, runs, passes, uploads artifacts)
- ✅ Pre-commit hook working (blocks failing commits, allows passing commits)
- ✅ Branch protection working (enforces CI pass before merge)
- ✅ Documentation complete and tested
- ✅ Phase 1 tests unchanged and passing
- ✅ No Phase 1 files modified
- ✅ All git commits are clean and reviewable
- ✅ Team approval obtained (if required)
- ✅ Ready for Phase 3 planning

---

## Notes for Apply Phase Executor

1. **Follow tasks in order:** Dependencies are strict; skipping breaks later tasks
2. **Test thoroughly:** Each task has explicit verification steps; don't skip testing
3. **Commit incrementally:** Don't try to do all 12 tasks then commit once; commit at Task 7 checkpoint
4. **Watch for edge cases:** 
   - Windows line endings (pre-commit hook must be Unix LF only)
   - YAML indentation (must be 2-space consistent)
   - JSON trailing commas (must be correct in package.json)
5. **CI wait time:** GitHub Actions takes ~2 minutes per workflow run; plan time accordingly
6. **Rollback plan:** If critical issue found, revert Task 7 commit and debug

---

**Tasks Document Version:** 1.0  
**Status:** ✅ **READY FOR APPLY PHASE**  
**Total Lines Changed:** ~470 lines (infrastructure + docs)  
**Chained PRs:** 2 recommended (stacked-to-main)  
**Estimated Effort:** 5–6 hours  
**Risk Level:** LOW
