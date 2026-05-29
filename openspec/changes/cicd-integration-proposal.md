# SDD Proposal: CI/CD Integration with GitHub Actions & Pre-commit Hooks

**Change ID:** `cicd-integration-phase2`  
**Date:** 2026-05-28  
**Status:** Proposal (awaiting approval)  
**Phase:** Phase 2 (follows Phase 1 TDD Infrastructure)

---

## 1. Problem Statement

### Current State (Pain Points)

The `cinemas-henry` project has solid local TDD infrastructure from Phase 1:
- ✅ 28 tests passing (16 unit + 12 component)
- ✅ `strict_tdd: true` enabled in openspec/config.yaml
- ✅ Test commands available (`bun run test`, `bun run test:unit`, `bun run test:components`)

**However, there is zero automated enforcement:**
- Developers CAN commit code without running tests locally
- PRs CAN be merged without tests passing
- Untested code REACHES main branch → production risk
- No feedback loop to catch failures early
- Team doesn't get immediate CI failure notifications

### Business Impact

1. **Production defects:** Untested code ships to production; bugs caught post-deployment instead of pre-merge
2. **Broken main branch:** Failed tests on main make it unsafe for other developers to branch from
3. **Lost TDD culture:** Without enforcement, developers deprioritize tests ("tests are optional")
4. **Slow debugging cycles:** CI failures discovered hours/days after commit, not immediately
5. **Onboarding friction:** New developers don't know if their code is safe to push

### Why Automate Testing Now?

- Phase 1 proved TDD works (28 passing tests, 81% coverage)
- Infrastructure is stable; ready for enforcement
- GitHub Actions is free for public/private repos
- Pre-commit hooks are zero-overhead locally (fail fast before push)
- Branch protection rules prevent merging broken code
- Team has agreed strict_tdd mode is the standard

---

## 2. Solution Summary

### Three-Layer CI/CD Strategy

#### Layer 1: Pre-commit Hook (Local, Fail Fast)
- **Trigger:** Before developer commits code
- **Action:** Run `bun run test:unit` only (fast; <5 seconds)
- **Behavior:** 
  - ✅ If tests pass → commit allowed
  - ❌ If tests fail → commit blocked; developer must fix locally
- **Benefit:** Immediate feedback; prevents broken commits reaching remote

#### Layer 2: GitHub Actions Workflow (Remote, Full Suite)
- **Trigger:** On every PR push and main branch push
- **Action:** Run full test suite (`bun run test`)
  - Unit tests (16 tests)
  - Component tests (12 tests)
- **Matrix:** Test on Node 18 + Node 20 (compatibility)
- **Behavior:**
  - ✅ If all tests pass → workflow passes (green checkmark on PR)
  - ❌ If any test fails → workflow fails (red X on PR); can't merge
- **Benefit:** Centralized enforcement; all code reviewed by CI before merge

#### Layer 3: Branch Protection Rules (GitHub, Enforce Policy)
- **Rule:** Require GitHub Actions workflow to pass before merge to main
- **Scope:** Only main branch
- **Behavior:**
  - Merge button DISABLED if CI workflow not passed
  - Merge button ENABLED only when CI passes
- **Benefit:** Technical enforcement; impossible to merge broken code

#### Layer 4: Documentation (Enable Team)
- **Setup Guide:** How to install pre-commit hook locally
- **Troubleshooting:** What to do when CI fails
- **CI/CD Overview:** Architecture and flow diagrams

---

## 3. Scope: What's IN, What's OUT

### IN Scope ✅

**Implementation:**
- Create `.github/workflows/test.yml` (GitHub Actions workflow)
- Create `.husky/pre-commit` hook configuration
- Add pre-commit framework to devDependencies
- Add `prepare` script to package.json (auto-install hooks on `bun install`)
- Configure GitHub branch protection rules for main branch
- Test workflow locally (dry-run)

**Documentation:**
- Create `docs/CI-CD-SETUP.md` with:
  - Pre-commit hook installation & troubleshooting
  - GitHub Actions workflow explanation
  - How to bypass pre-commit (if needed)
  - CI failure debugging guide
  - Branch protection rules explanation

**No Code Changes:**
- Existing source code in `src/` remains unchanged
- Existing tests remain unchanged
- Phase 1 infrastructure untouched

### OUT of Scope ❌

- **Slack/Email notifications** — Deferred to Phase 3 (nice-to-have)
- **Code coverage enforcement in CI** — Phase 2 only runs tests; coverage enforcement Phase 3
- **Performance benchmarking** — Out of scope
- **Deployment automation** — Out of scope (focus: testing only)
- **Secrets management** — Not needed for this phase
- **Multi-stage deployments** — Out of scope
- **Docker containerization** — Out of scope
- **E2E tests in CI** — Phase 3 (requires deployed frontend)

### Non-Goals

- Replace local development workflow (tests still optional to run locally if pre-commit skipped)
- Enforce 100% coverage; just ensure tests run and pass
- Optimize CI performance (defer to Phase 3)
- Support non-GitHub platforms (GitHub only)

---

## 4. Expected Benefits

### Immediate (Day 1 of Phase 2 Deployment)

1. **Fail-fast feedback:** Developers see test failures before pushing (pre-commit hook)
2. **No broken main:** Branch protection prevents untested code from reaching main
3. **Clear CI status:** PR dashboard shows green/red test status
4. **Team confidence:** "If it's green, it's safe to merge"

### Medium-term (Week 1–2)

1. **Reduced debugging time:** Failures caught immediately, not hours later
2. **Improved code quality:** Code review + tests + CI = triple validation
3. **Onboarding clarity:** New developers see: "Tests must pass before merge"
4. **Broken build awareness:** Team knows immediately when main is broken

### Long-term (Month 1+)

1. **Cultural shift:** TDD becomes non-negotiable (enforcement = culture)
2. **Faster iteration:** Less time fixing CI failures; more time on features
3. **Production stability:** Fewer post-deployment bugs
4. **Audit trail:** GitHub Actions logs prove tests ran before each merge

---

## 5. Success Criteria

### Infrastructure

- ✅ `.github/workflows/test.yml` created and deployed
- ✅ Workflow runs on every PR push and main branch push
- ✅ Workflow passes for Phase 1 test suite (28 tests)
- ✅ Workflow fails if any test fails (catches regressions)
- ✅ Pre-commit hook installed locally and blocks commits when tests fail

### Configuration

- ✅ Branch protection rule enforced on main: "Require GitHub Actions to pass"
- ✅ `package.json` includes `prepare` script to install pre-commit hooks
- ✅ `.husky/pre-commit` configured to run `bun run test:unit`
- ✅ `.gitignore` updated to exclude `.husky` (already included)

### Documentation

- ✅ `docs/CI-CD-SETUP.md` created with:
  - Pre-commit installation steps
  - Workflow explanation
  - Bypass instructions (if needed)
  - Troubleshooting guide
  - Branch protection overview

### Team Validation

- ✅ Pre-commit hook works locally (tested on 2+ machines)
- ✅ GitHub Actions workflow passes on actual PR
- ✅ Branch protection rule prevents merge when CI fails (tested)
- ✅ Team can bypass pre-commit if absolutely needed (documented)
- ✅ Documentation is clear and actionable

### No Regressions

- ✅ Existing tests pass with no modifications
- ✅ `bun run build` still works
- ✅ `bun run dev` starts without issues
- ✅ Local development workflow unchanged (except pre-commit addition)

---

## 6. Assumptions

1. **GitHub is the primary platform** — All changes assume GitHub.com (not GitLab, Gitea, etc.)
2. **Team uses `bun` package manager** — CI commands assume `bun` is available
3. **Node.js 18+ is the minimum** — CI will test on Node 18 and 20
4. **Main branch is stable** — No major breaking changes during Phase 2 implementation
5. **Pre-commit hooks are acceptable** — Team comfortable with local hook installation
6. **No manual CI approvals needed** — Automated gates only (no human approval step)

---

## 7. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Pre-commit hook slows dev** | Low | Hook runs only `test:unit` (~5s); can be bypassed if needed |
| **CI flakiness (random failures)** | Medium | Use deterministic tests; add retries if needed; document known flaky tests |
| **GitHub Actions quota exceeded** | Low | Free tier includes 3,000 minutes/month; cinemas-henry won't exceed |
| **Developer frustration (can't commit)** | Medium | Document bypass: `git commit --no-verify`; educate on TDD culture |
| **Main branch accidentally broken** | Medium | Branch protection prevents merge; rollback via revert commit |
| **New developer forgets to run tests** | Low | Pre-commit hook catches failures; clear onboarding docs |
| **CI environment differs from local** | Medium | Test on same Node versions; run same commands as local |

---

## 8. Next Steps (Phase Handoff)

If approved, this proposal moves to:

1. **Spec Phase:** Define exact workflow YAML, pre-commit hook config, and branch protection rules
2. **Design Phase:** Architect GitHub Actions setup, node matrix, artifact handling
3. **Tasks Phase:** Create granular tasks for workflow creation, hook setup, docs
4. **Apply Phase:** Create workflows, configure GitHub, install hooks, test end-to-end
5. **Verify Phase:** Validate CI gates work; test branch protection prevents merges

---

## 9. Approval Requirements

Before proceeding to Spec phase, confirm:

- [ ] **Team agrees:** CI/CD is the Phase 2 priority (vs. E2E, Astro tests, MSW)
- [ ] **GitHub Actions is acceptable:** No enterprise policies blocking it
- [ ] **Pre-commit hooks are welcomed:** Team OK with local hook installation
- [ ] **Main branch protection desired:** Enforcing merge gates is acceptable
- [ ] **Phase 1 TDD is stable:** No major test failures or infrastructure changes needed

---

## 10. Related Documents

- Phase 1 Proposal: `openspec/changes/tdd-vitest-proposal.md`
- Phase 1 Spec: `openspec/changes/tdd-vitest-spec.md`
- Phase 1 Design: `openspec/changes/tdd-vitest-design.md`
- Phase 1 Tasks: `openspec/changes/tdd-vitest-tasks.md`
- Phase 1 Apply Summary: `SDD_APPLY_COMPLETE.md`
- Testing Guide: `TESTING.md` (includes Phase 2 roadmap)

---

## Sign-Off

**Proposed by:** AI Assistant  
**Date:** 2026-05-28  
**Phase:** Phase 2  
**Status:** 🟡 **Awaiting Review & Approval**

---

## Timeline & Effort

- **Proposal:** This document (✅ Complete)
- **Spec → Design → Tasks → Apply:** Estimated 4–6 hours total
- **Team review & feedback:** 1–2 hours
- **Total Phase 2 time:** 1–2 days of focused work

---

**Proposal Version:** 2.0  
**Last Updated:** 2026-05-28  
**Next Phase:** Spec (if approved)

