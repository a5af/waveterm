# Upstream Merge Specification: WaveTerm v0.12.0

**Version:** 1.0
**Date:** 2025-10-17
**Status:** Draft
**Author:** Agent2
**Fork:** https://github.com/a5af/waveterm
**Upstream:** https://github.com/wavetermdev/waveterm

---

## Executive Summary

This specification defines the strategy for merging upstream WaveTerm v0.12.0 into the a5af fork. The upstream release includes **major AI enhancements** (batch tool approval, reasoning display, new AI SDK integration) that should be integrated before implementing multi-instance support. The fork currently maintains **two custom features** (horizontal widget bar, optional pane title labels) that will require careful conflict resolution during the merge.

**Key Statistics:**
- **Fork Version:** v0.11.6
- **Upstream Version:** v0.12.0
- **Commits to Merge:** 48
- **Files Changed:** ~150+
- **Major Conflicts Expected:** Layout system, widget positioning, block management

---

## 1. Current State Analysis

### 1.1 Fork Status

**Repository:** https://github.com/a5af/waveterm
**Branch:** main
**Version:** 0.11.6
**Last Upstream Sync:** 2025-10-09 (commit: 7681214f)

**Fork-Specific Features:**

| Feature | Commits | Status | Conflicts Expected |
|---------|---------|--------|-------------------|
| Horizontal widget bar | e21b8e1a5, 284e5f303 | Implemented | High - layout changes |
| Optional pane title labels | 6360935a9, dda0979af | Implemented | Medium - block system |
| Test stabilization | 38498da9b | Implemented | Low |
| Fork PR policy docs | 4d1b3f922 | Documentation | None |

**Fork-Specific Files:**
- `PANE_TITLE_LABELS_FEATURE_SPEC.md` (exists in fork, deleted in upstream)
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md` (deleted in upstream)
- Various test improvements

### 1.2 Upstream v0.12.0 Release

**Major Features:**

#### AI Enhancements (Primary Focus)
1. **Batch Tool Approval System** (#2430)
   - Users can approve multiple AI tool calls at once
   - Improved security and control over AI actions
   - New approval UI in AI panel

2. **Reasoning Display** (#2443)
   - Display AI reasoning process in real-time
   - Support for reasoning deltas/streaming
   - Enhanced transparency in AI decision-making

3. **`wsh ai` Command Reimplementation** (#2435)
   - Complete rewrite of CLI AI interface
   - Better text file attachment format
   - Improved integration with backend

4. **New AI Tools**
   - `read_dir` tool (#2414) - Read directory contents
   - OpenAI native web search (#2410)
   - Custom streamdown components (#2404)

5. **AI Panel Redesign** (#2370)
   - New AIPanel component architecture
   - Better message handling
   - Improved scrolling and UX

#### Infrastructure Changes
1. **Layout Simplification** (#2387)
   - **⚠️ High Conflict Risk** - Core layout system refactored
   - Simplified pane management
   - May conflict with horizontal widget bar

2. **React 19 Migration** (#2272)
   - Upgraded to React 19
   - Updated all React dependencies
   - API changes throughout codebase

3. **Tailwind v4** (#2287)
   - Migration to Tailwind v4
   - SCSS removal continues
   - CSS architecture changes

4. **Log Rotation** (#2432)
   - Prevents unlimited log growth
   - Automatic cleanup of old logs

5. **Onboarding System** (#2428, #2433, #2434)
   - New user onboarding flow
   - Upgrade modals
   - Improved first-run experience

6. **Tsunami Framework** (#2315)
   - New app framework (waveapps v2)
   - Webview-based applications
   - Extensibility improvements

#### Other Notable Changes
- Block close behavior improvements (#2417)
- Web widget storage clearing (#2383)
- Switch from Yarn to NPM (#2347)
- Shift+Enter support for Claude Code (#2285)
- Various dependency updates (50+ commits)

### 1.3 Commit Analysis

**Total Commits:** 48 (from 7681214f to af3279b41)

**Breakdown by Category:**
- AI features: 15 commits (~31%)
- Infrastructure: 12 commits (~25%)
- Bug fixes: 8 commits (~17%)
- Dependency updates: 10 commits (~21%)
- Documentation: 3 commits (~6%)

**High-Impact Commits:**

| Commit | Description | Impact | Conflict Risk |
|--------|-------------|--------|---------------|
| af3279b41 | Reasoning deltas UI | High | Low |
| 2480ebe2d | Batch tool approval | High | Medium |
| 0fd0daf13 | `wsh ai` rewrite | High | Low |
| fa19d7c28 | read_dir AI tool | Medium | Low |
| 5a95e827b | Layout simplification | High | **High** |
| d272a4ec0 | New AIPanel | High | Low |
| a85b658cd | React 19 migration | High | Medium |
| 515863b55 | Tailwind v4 | Medium | Medium |
| 7681214fa | blocks list CLI | Low | Low |

---

## 2. Conflict Analysis

### 2.1 Predicted Conflicts

#### High-Risk Conflicts

**1. Layout System (`frontend/layout/`, `frontend/app/view/`)**

**Fork Changes:**
- Moved widgets from vertical sidebar to horizontal tab bar
- Modified layout component structure
- Custom widget positioning logic

**Upstream Changes:**
- Layout simplification (#2387)
- 1242 lines changed in block/layout code
- Pane management refactored

**Resolution Strategy:**
- Merge upstream layout changes first
- Re-apply horizontal widget bar on top of new layout system
- May require rewriting widget positioning logic
- Estimated time: 8-12 hours

**2. Block Management (`frontend/app/block/`)**

**Fork Changes:**
- Optional pane title labels
- Custom block title rendering
- Auto-generation of titles

**Upstream Changes:**
- Block close behavior changes (#2417)
- `titlebar.tsx` and `titlebar.scss` deleted upstream
- Block frame modifications
- New block management patterns

**Resolution Strategy:**
- Evaluate if pane title labels still make sense with new block system
- May need to reimpl ement title label logic
- Consider merging with upstream's block improvements
- Estimated time: 4-6 hours

#### Medium-Risk Conflicts

**3. React 19 Compatibility**

**Fork Changes:**
- Components using React 18 patterns
- May have incompatible lifecycle methods

**Upstream Changes:**
- Full React 19 migration
- Updated component patterns
- New APIs

**Resolution Strategy:**
- Fork code likely compatible (React 19 is mostly backward compatible)
- Test thoroughly after merge
- Update any deprecated patterns
- Estimated time: 2-3 hours

**4. AI Panel Integration**

**Fork Changes:**
- None (fork predates AI features)

**Upstream Changes:**
- Complete AI panel redesign
- New message handling
- Tool approval UI

**Resolution Strategy:**
- Clean integration (no fork conflicts)
- Adopt upstream AI features as-is
- Test AI functionality thoroughly
- Estimated time: 1-2 hours (testing only)

#### Low-Risk Conflicts

**5. Documentation Files**

**Files Deleted Upstream:**
- `PANE_TITLE_LABELS_FEATURE_SPEC.md` (exists in fork)
- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`
- `docs/AGENT1_UPSTREAM_SYNC.md`
- `docs/testing-improvement-report.md`

**Resolution Strategy:**
- Keep fork-specific docs if still relevant
- Remove upstream-deleted docs that aren't fork-specific
- Update references to removed files
- Estimated time: 30 minutes

### 2.2 Feature Compatibility Matrix

| Fork Feature | Upstream Changes | Compatible? | Action Required |
|--------------|------------------|-------------|-----------------|
| Horizontal widget bar | Layout simplification | **No** | Major refactor |
| Pane title labels | Block system changes | **Partial** | Moderate refactor |
| Test improvements | Various refactors | **Yes** | Minor updates |
| Fork PR policy | Documentation cleanup | **Yes** | Keep as-is |

---

## 3. Merge Strategy

### 3.1 Recommended Approach: Sequential Merge with Feature Branches

**Why Not Direct Merge:**
- 48 commits is too large for single merge
- High risk of breaking fork features
- Need to validate AI features work correctly
- Layout conflicts require careful handling

**Strategy: Incremental Integration**

```
main (fork)
  ↓
  ├─ Phase 1: Clean merge preparation
  ├─ Phase 2: Upstream merge (with conflicts)
  ├─ Phase 3: Resolve layout conflicts
  ├─ Phase 4: Re-implement horizontal widget bar
  ├─ Phase 5: Re-implement pane title labels (if needed)
  ├─ Phase 6: Testing & validation
  └─ Phase 7: Final integration
```

### 3.2 Pre-Merge Preparation (Phase 1)

**Goal:** Clean fork state before attempting merge

**Tasks:**

1. **Create Backup Branch**
   ```bash
   git checkout main
   git branch backup-pre-v0.12-merge
   git push origin backup-pre-v0.12-merge
   ```

2. **Document Current Fork Features**
   ```bash
   # Export current widget bar implementation
   git diff 7681214f..main -- frontend/layout/ > _temp/fork-widget-bar.diff

   # Export pane title labels
   git diff 7681214f..main -- frontend/app/block/ > _temp/fork-title-labels.diff
   ```

3. **Create Test Baseline**
   ```bash
   npm test > _temp/tests-pre-merge.txt
   npm run build:prod
   ```

4. **Tag Current State**
   ```bash
   git tag fork-v0.11.6-pre-merge
   git push origin fork-v0.11.6-pre-merge
   ```

**Duration:** 1 hour

---

### 3.3 Upstream Merge (Phase 2)

**Goal:** Merge upstream v0.12.0 and handle conflicts

**Steps:**

1. **Create Merge Branch**
   ```bash
   git checkout -b merge/upstream-v0.12.0
   ```

2. **Merge Upstream Main**
   ```bash
   git merge upstream/main
   # Expect conflicts
   ```

3. **Identify Conflicts**
   ```bash
   git status | grep "both modified"
   ```

4. **Document All Conflicts**
   ```bash
   git diff --name-only --diff-filter=U > _temp/merge-conflicts.txt
   ```

**Expected Conflicts (to be resolved manually):**

| File | Fork Changes | Upstream Changes | Resolution |
|------|--------------|------------------|------------|
| `frontend/layout/layout.tsx` | Horizontal widget bar | Layout simplification | Accept upstream, reapply fork later |
| `frontend/app/view/view.tsx` | Widget positioning | New view system | Accept upstream |
| `frontend/app/block/blockframe.tsx` | Title label rendering | Block close improvements | Merge both (complex) |
| `package.json` | Version 0.11.6 | Version 0.12.0 | Accept upstream |
| `go.mod` | May have diverged | Updated dependencies | Accept upstream |

**Resolution Strategy for Each Conflict:**

**A. Layout Files - Accept Upstream, Defer Fork Features**
```bash
# Accept upstream version completely
git checkout --theirs frontend/layout/layout.tsx
git checkout --theirs frontend/app/view/view.tsx

# We'll re-implement horizontal widget bar in Phase 4
```

**B. Block Frame - Manual Merge**
```bash
# Open in editor, merge both changes
code frontend/app/block/blockframe.tsx

# Keep upstream block close improvements
# Preserve fork's title label rendering logic IF compatible
# If not compatible, defer to Phase 5
```

**C. Package Files - Accept Upstream**
```bash
git checkout --theirs package.json
git checkout --theirs package-lock.json
git checkout --theirs go.mod
git checkout --theirs go.sum
```

**D. Deleted Docs - Keep Fork-Specific**
```bash
# Keep fork-specific pane title labels spec
git checkout --ours PANE_TITLE_LABELS_FEATURE_SPEC.md

# Remove upstream-deleted docs
git rm AGENTS.md CLAUDE.md GEMINI.md
```

5. **Complete Merge**
   ```bash
   git add .
   git commit -m "Merge upstream v0.12.0 into fork (conflicts resolved)"
   ```

**Duration:** 4-6 hours

---

### 3.4 Rebuild and Test (Phase 3)

**Goal:** Ensure merged codebase builds and core features work

**Tasks:**

1. **Install Dependencies**
   ```bash
   npm install
   # May have new dependencies from upstream
   ```

2. **Build Project**
   ```bash
   npm run build:prod
   # Expect TypeScript errors initially
   ```

3. **Fix TypeScript Errors**
   - Update fork code to match React 19 patterns
   - Fix any API changes from upstream refactors
   - Update imports for moved/deleted files

4. **Run Tests**
   ```bash
   npm test
   # Compare with pre-merge baseline
   ```

5. **Manual Testing**
   - Launch app (`npm run dev`)
   - Test core terminal functionality
   - Test AI features (batch approval, reasoning)
   - Verify no major regressions

**Success Criteria:**
- ✅ Build succeeds with zero errors
- ✅ All existing tests pass (may need updates)
- ✅ App launches without crashes
- ✅ Core terminal features work
- ✅ New AI features accessible

**Duration:** 3-5 hours

---

### 3.5 Re-implement Horizontal Widget Bar (Phase 4)

**Goal:** Port fork's horizontal widget bar to new layout system

**Background:**
Upstream's layout simplification (#2387) likely broke the horizontal widget bar. We need to re-implement it on top of the new layout system.

**Steps:**

1. **Analyze New Layout System**
   ```bash
   # Compare old vs new layout code
   git show upstream/main:frontend/layout/layout.tsx > _temp/new-layout.tsx
   git show 7681214f:frontend/layout/layout.tsx > _temp/old-layout.tsx
   diff _temp/old-layout.tsx _temp/new-layout.tsx
   ```

2. **Identify Widget Integration Points**
   - Where widgets are rendered in new system
   - How panes are managed
   - Where to inject horizontal tab bar

3. **Port Widget Bar Code**
   ```bash
   # Reference original implementation
   git show e21b8e1a5:frontend/layout/layout.tsx

   # Create new implementation compatible with v0.12.0
   # File: frontend/layout/horizontal-widgets.tsx (new file)
   ```

4. **Update Layout Component**
   ```typescript
   // frontend/layout/layout.tsx
   // Add horizontal widget bar below title bar
   // Position: top of workspace, above panes
   ```

5. **Test Widget Functionality**
   - Terminal widget opens
   - Preview widget works
   - AI widget accessible
   - Widget switching smooth

**Acceptance Criteria:**
- ✅ Widgets appear in horizontal bar at top
- ✅ No vertical sidebar visible
- ✅ All widget types functional
- ✅ Layout matches fork's original design
- ✅ No regressions in pane management

**Duration:** 8-12 hours

---

### 3.6 Evaluate and Port Pane Title Labels (Phase 5)

**Goal:** Decide if pane title labels are still viable, port if yes

**Decision Tree:**

```
Does new block system support custom titles?
├─ Yes → Port title labels with minimal changes
└─ No → Options:
    ├─ A. Redesign feature for new block system
    ├─ B. Request upstream support for custom titles
    └─ C. Defer feature (mark as TODO)
```

**Analysis Steps:**

1. **Check Block System Compatibility**
   ```bash
   # Review new block frame code
   git show upstream/main:frontend/app/block/blockframe.tsx

   # Check if custom title rendering is possible
   grep -r "title" frontend/app/block/
   ```

2. **Evaluate Upstream Changes**
   - Did upstream add title customization?
   - Is `titlebar.tsx` deletion critical?
   - Can we add custom title layer?

3. **Decision Point**
   ```
   IF (upstream has better title system):
       THEN: Adopt upstream, abandon fork feature
   ELIF (fork feature still valuable):
       THEN: Port with refactor
   ELSE:
       THEN: Defer feature, document decision
   ```

**If Porting:**

4. **Port Title Label Logic**
   ```typescript
   // frontend/app/block/pane-title-label.tsx (new file)
   // Implement title label component for new block system
   ```

5. **Integrate with Block Frame**
   ```typescript
   // frontend/app/block/blockframe.tsx
   // Add optional title label rendering
   ```

6. **Update Auto-Generation**
   ```typescript
   // Ensure auto-generated titles work with new system
   ```

**Acceptance Criteria (if porting):**
- ✅ Title labels display correctly
- ✅ Auto-generation works
- ✅ User can customize labels
- ✅ No conflicts with new block system
- ✅ Performance acceptable

**Duration:** 4-6 hours (port) OR 1 hour (defer)

---

### 3.7 Comprehensive Testing (Phase 6)

**Goal:** Validate all features work correctly in merged codebase

**Test Matrix:**

| Feature Category | Tests | Expected Result |
|------------------|-------|-----------------|
| **AI Features** | | |
| - Batch tool approval | Trigger multiple tools, approve batch | Tools execute correctly |
| - Reasoning display | Ask complex question | Reasoning shown in real-time |
| - `wsh ai` command | Run `wsh ai "test"` | CLI AI works |
| - read_dir tool | Ask AI to list directory | Tool executes, shows files |
| **Layout & UI** | | |
| - Horizontal widgets | Open terminal, preview, AI | All widgets accessible |
| - Pane management | Split, resize, close panes | Works smoothly |
| - Block system | Create, move, close blocks | No regressions |
| - Title labels | If ported: show/hide labels | Labels display correctly |
| **Core Features** | | |
| - Terminal | Run commands, interact | Fully functional |
| - SSH connections | Connect to remote | Works as before |
| - File preview | Open images, PDFs | Previews render |
| **Infrastructure** | | |
| - Build system | `npm run build:prod` | Builds successfully |
| - Dev mode | `npm run dev` | Hot reload works |
| - Tests | `npm test` | All tests pass |

**Regression Testing:**

```bash
# Run full test suite
npm test

# Compare with pre-merge baseline
diff _temp/tests-pre-merge.txt _temp/tests-post-merge.txt

# Identify any broken tests
# Fix or update tests as needed
```

**Manual Testing Checklist:**

- [ ] Launch app successfully
- [ ] Create new terminal block
- [ ] Run shell commands
- [ ] Test AI chat (batch approval)
- [ ] Test AI reasoning display
- [ ] Test `wsh ai` command
- [ ] Test read_dir AI tool
- [ ] Open multiple panes, split layout
- [ ] Verify horizontal widget bar works
- [ ] Test pane title labels (if ported)
- [ ] Connect to SSH server
- [ ] Preview markdown file
- [ ] Preview image file
- [ ] Test block close (Cmd-W / Ctrl-W)
- [ ] Test keyboard shortcuts
- [ ] Check for memory leaks (open/close many blocks)
- [ ] Test app restart (state persistence)

**Duration:** 4-6 hours

---

### 3.8 Final Integration (Phase 7)

**Goal:** Merge feature branch back to main, tag release

**Steps:**

1. **Final Code Review**
   ```bash
   # Review all changes since merge started
   git diff backup-pre-v0.12-merge..merge/upstream-v0.12.0
   ```

2. **Update Documentation**
   - Update CHANGELOG.md (if exists)
   - Document breaking changes
   - Update build instructions if changed
   - Note removed features (if any)

3. **Create PR** (if using fork PR workflow)
   ```bash
   git push origin merge/upstream-v0.12.0
   gh pr create --title "Merge upstream v0.12.0 (AI features + layout updates)" \
                --body "See docs/SPEC_UPSTREAM_MERGE_V0.12.0.md"
   ```

4. **Final Testing on CI** (if configured)
   - Wait for CI tests
   - Fix any CI-specific issues

5. **Merge to Main**
   ```bash
   git checkout main
   git merge merge/upstream-v0.12.0
   git push origin main
   ```

6. **Tag Release**
   ```bash
   git tag fork-v0.12.0-post-merge
   git push origin fork-v0.12.0-post-merge
   ```

7. **Cleanup**
   ```bash
   git branch -d merge/upstream-v0.12.0
   # Keep backup branch for reference
   ```

**Duration:** 2-3 hours

---

## 4. Detailed Implementation Timeline

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|--------------|
| **Phase 1** | Pre-merge preparation | 1 hour | None |
| **Phase 2** | Upstream merge | 4-6 hours | Phase 1 |
| **Phase 3** | Rebuild and test | 3-5 hours | Phase 2 |
| **Phase 4** | Re-implement widget bar | 8-12 hours | Phase 3 |
| **Phase 5** | Port title labels | 4-6 hours (or 1h defer) | Phase 4 |
| **Phase 6** | Comprehensive testing | 4-6 hours | Phase 5 |
| **Phase 7** | Final integration | 2-3 hours | Phase 6 |
| **Total** | **26-39 hours** | **3-5 days** | |

**Recommended Schedule:**

**Day 1 (8 hours):**
- Morning: Phase 1 (1h) + Phase 2 start (4h)
- Afternoon: Phase 2 complete (2h) + Phase 3 start (1h)

**Day 2 (8 hours):**
- Morning: Phase 3 complete (2h) + Phase 4 start (4h)
- Afternoon: Phase 4 continue (2h)

**Day 3 (8 hours):**
- Morning: Phase 4 complete (6h)
- Afternoon: Phase 5 (2h)

**Day 4 (8 hours):**
- Morning: Phase 5 complete (2h) + Phase 6 start (4h)
- Afternoon: Phase 6 complete (2h)

**Day 5 (3 hours):**
- Morning: Phase 7 (3h) - Final integration and release

---

## 5. Risk Assessment & Mitigation

### 5.1 High-Risk Areas

**Risk 1: Layout System Breaking Widget Bar**

**Impact:** High (core fork feature)
**Likelihood:** High (1242 lines changed in layout)
**Mitigation:**
- Phase 4 dedicated to widget bar re-implementation
- Reference original widget bar code
- Prototype on isolated branch first
- Fallback: Temporarily disable widget bar if critical

**Risk 2: Block System Incompatible with Title Labels**

**Impact:** Medium (nice-to-have feature)
**Likelihood:** Medium (block system refactored)
**Mitigation:**
- Phase 5 includes decision point (port vs defer)
- Document decision clearly
- If deferring, create tracking issue for future
- Fallback: Remove title labels, revisit later

**Risk 3: React 19 Breaking Changes**

**Impact:** High (app won't run)
**Likelihood:** Low (React 19 mostly backward compatible)
**Mitigation:**
- Upstream already migrated, code should be compatible
- Phase 3 includes TypeScript error fixing
- Test thoroughly in Phase 6
- Fallback: Fix compatibility issues case-by-case

### 5.2 Medium-Risk Areas

**Risk 4: AI Features Broken in Fork**

**Impact:** Medium (new features, not critical to fork)
**Likelihood:** Low (clean integration expected)
**Mitigation:**
- Phase 6 includes AI feature testing
- Test all AI tools individually
- Compare behavior with upstream
- Fallback: Report upstream bugs if found

**Risk 5: Build System Changes**

**Impact:** Medium (development workflow affected)
**Likelihood:** Low (upstream already stable)
**Mitigation:**
- Phase 3 includes npm install and rebuild
- Update any fork-specific build scripts
- Document build changes
- Fallback: Revert build config if needed

### 5.3 Low-Risk Areas

**Risk 6: Documentation Conflicts**

**Impact:** Low (cosmetic)
**Likelihood:** High (many docs changed/deleted)
**Mitigation:**
- Simple conflict resolution in Phase 2
- Keep fork-specific docs
- Remove obsolete docs
- Fallback: Manual doc cleanup later

---

## 6. Testing Strategy

### 6.1 Automated Testing

**Unit Tests:**
```bash
npm test
```

**Expected Coverage:**
- Layout components: >80%
- Block system: >75%
- AI panel: >70%
- Widget management: >75%

**Test Failures:**
- Accept: Tests that need updates for new system
- Investigate: Unexpected failures
- Fix: Broken fork features

### 6.2 Integration Testing

**Test Scenarios:**

**1. AI Feature Integration**
```bash
# Test batch tool approval
wsh ai "List files in current directory and create a summary file"
# Expected: Two tool calls (read_dir, write_file), batch approval prompt

# Test reasoning display
wsh ai "Explain step-by-step how to set up a web server"
# Expected: Reasoning shown in real-time, step-by-step display

# Test CLI AI
wsh ai "What is the weather?"
# Expected: CLI response, proper formatting
```

**2. Layout System**
```bash
# Test horizontal widget bar
# 1. Open app
# 2. Verify widgets in horizontal bar (top of window)
# 3. Click each widget (terminal, preview, AI)
# 4. Verify correct pane opens

# Test pane management
# 1. Split pane (Cmd-Shift-S / Ctrl-Shift-S)
# 2. Resize pane (drag divider)
# 3. Close pane (Cmd-W / Ctrl-W)
# 4. Verify layout persists on restart
```

**3. Block System**
```bash
# Test block lifecycle
# 1. Create terminal block
# 2. Run command
# 3. Close block (Cmd-W)
# 4. Verify block cleanup (no memory leaks)

# Test title labels (if ported)
# 1. Enable title labels in settings
# 2. Verify auto-generated titles
# 3. Customize title
# 4. Verify title persists
```

### 6.3 Performance Testing

**Metrics to Track:**

| Metric | Pre-Merge | Post-Merge | Threshold |
|--------|-----------|------------|-----------|
| App startup time | ~2s | ? | <3s |
| Block creation | ~100ms | ? | <150ms |
| Pane split | ~50ms | ? | <100ms |
| Memory usage (idle) | ~200MB | ? | <300MB |
| Memory usage (10 blocks) | ~400MB | ? | <600MB |

**Test Method:**
```bash
# Startup time
time npm run dev

# Memory usage
# Open Chrome DevTools → Memory → Take heap snapshot
```

---

## 7. Rollback Plan

### 7.1 If Merge Fails

**Scenario:** Major issues discovered, merge must be aborted.

**Steps:**
1. **Revert to Backup**
   ```bash
   git checkout main
   git reset --hard backup-pre-v0.12-merge
   git push origin main --force
   ```

2. **Assess Problem**
   - Identify root cause
   - Document blockers
   - Re-evaluate strategy

3. **Alternative Approaches**
   - Cherry-pick specific AI commits instead of full merge
   - Wait for upstream to stabilize further
   - Report critical issues to upstream

### 7.2 If Widget Bar Can't Be Ported

**Scenario:** New layout system incompatible with horizontal widget bar.

**Options:**

**Option A: Revert to Vertical Sidebar**
- Adopt upstream's vertical sidebar
- Lose fork's UX improvement
- Simpler maintenance going forward

**Option B: Fork Layout System**
- Maintain separate layout fork
- High maintenance burden
- Only if widget bar is critical requirement

**Option C: Hybrid Approach**
- Use upstream layout for core
- Add widget bar as optional plugin
- Best of both worlds, more complex

**Recommendation:** Option A (revert to vertical) unless widget bar is absolutely critical.

### 7.3 If Title Labels Can't Be Ported

**Scenario:** Block system doesn't support custom titles.

**Steps:**
1. Document decision in `docs/REMOVED_FEATURES.md`
2. Remove title label code
3. Create tracking issue for future implementation
4. Notify users of removal (if any fork users exist)

**Impact:** Low (nice-to-have feature, not critical)

---

## 8. Post-Merge Tasks

### 8.1 Documentation Updates

**Files to Update:**

1. **README.md**
   - Update version number to v0.12.0
   - Mention new AI features
   - Update screenshots if widget bar changed

2. **BUILD.md**
   - Verify build instructions still accurate
   - Update dependency versions
   - Note any new build requirements

3. **CHANGELOG.md** (create if missing)
   ```markdown
   ## [0.12.0-fork] - 2025-10-17

   ### Added
   - Batch AI tool approval system
   - AI reasoning display
   - read_dir AI tool
   - Onboarding system
   - Log rotation

   ### Changed
   - Upgraded to React 19
   - Migrated to Tailwind v4
   - Layout system simplified
   - Re-implemented horizontal widget bar on new layout

   ### Removed
   - Pane title labels (deferred, incompatible with new block system)

   ### Fork-Specific
   - Horizontal widget bar preserved
   - Fork PR policy maintained
   ```

4. **SPEC_MULTI_INSTANCE_PORTABLE_WINDOWS.md**
   - Update references to v0.11.6 → v0.12.0
   - Verify single-instance code still at same location
   - Update line numbers if code moved

### 8.2 Upstream Sync Documentation

**Create:** `docs/UPSTREAM_SYNC_HISTORY.md`

```markdown
# Upstream Sync History

## v0.12.0 (2025-10-17)
- **Commits Merged:** 48
- **Conflicts:** 12 files
- **Duration:** 5 days
- **Fork Features Preserved:** Horizontal widget bar
- **Fork Features Removed:** Pane title labels (deferred)
- **New Features:** AI tool approval, reasoning display, read_dir tool, onboarding
- **Spec:** docs/SPEC_UPSTREAM_MERGE_V0.12.0.md
```

### 8.3 User Communication

**If Fork Has Users:**

**Communication Plan:**
1. **Pre-Merge Announcement**
   - Notify upcoming upgrade
   - List new features
   - Warn about potential breaking changes
   - Provide rollback instructions

2. **Post-Merge Release Notes**
   - Highlight AI improvements
   - Note removed features (title labels)
   - Link to issue tracker for bugs
   - Thank users for patience

**Sample Announcement:**
```markdown
# WaveTerm Fork v0.12.0 Release

We've merged upstream WaveTerm v0.12.0, bringing major AI enhancements:

## New Features
- 🤖 Batch AI tool approval for better control
- 🧠 Real-time AI reasoning display
- 📁 read_dir AI tool for directory exploration
- 🎓 Improved onboarding for new users
- 🔄 Automatic log rotation

## Fork Features
- ✅ Horizontal widget bar preserved
- ⏸️ Pane title labels temporarily removed (working on compatibility)

## Upgrade Notes
- Backup your data before upgrading
- Settings may reset due to layout changes
- Report issues at: https://github.com/a5af/waveterm/issues

## Rollback
If issues occur, revert to v0.11.6:
git checkout fork-v0.11.6-pre-merge
```

---

## 9. Success Criteria

### 9.1 Merge Success

**Must Have:**
- ✅ App builds successfully
- ✅ App launches without errors
- ✅ Core terminal features work
- ✅ All automated tests pass
- ✅ No major regressions in functionality

**Should Have:**
- ✅ Horizontal widget bar preserved
- ✅ AI features functional (batch approval, reasoning, read_dir)
- ✅ Onboarding system works
- ✅ Performance within acceptable range

**Nice to Have:**
- ✅ Pane title labels ported (or documented as deferred)
- ✅ Zero manual test failures
- ✅ Documentation complete

### 9.2 Quality Gates

**Phase 2 (Merge):**
- All conflicts resolved
- Code compiles (may have warnings)

**Phase 3 (Rebuild):**
- Zero build errors
- All TypeScript errors fixed
- App launches successfully

**Phase 6 (Testing):**
- >90% automated tests passing
- All critical features work
- No P0/P1 bugs

**Phase 7 (Integration):**
- Code review approved (if applicable)
- Documentation updated
- Release notes complete

---

## 10. Appendix

### 10.1 Key Upstream Commits

**AI Features:**
```
af3279b41 - Reasoning deltas UI
2480ebe2d - Batch tool approval
0fd0daf13 - wsh ai rewrite
fa19d7c28 - read_dir tool
fd0e75a98 - Tool approvals + data-tooluse AI SDK
ef6366f6c - OpenAI web search
23127520 - Custom streamdown components
```

**Infrastructure:**
```
5a95e827b - Layout simplification
d272a4ec0 - New AIPanel
a85b658cd - React 19 migration
515863b55 - Tailwind v4
3f41c643b - Log rotation
822f05e37 - Onboarding updates
88747742c - Yarn to NPM
```

### 10.2 Useful Commands

**Check Merge Status:**
```bash
git status
git diff --name-status origin/main..upstream/main
```

**Compare Specific Files:**
```bash
git diff origin/main upstream/main -- frontend/layout/layout.tsx
```

**List Commits Between Versions:**
```bash
git log --oneline origin/main..upstream/main
```

**Find When File Was Deleted:**
```bash
git log --all --full-history -- PANE_TITLE_LABELS_FEATURE_SPEC.md
```

**Check Merge Base:**
```bash
git merge-base origin/main upstream/main
```

### 10.3 Reference Links

- **Fork Repository:** https://github.com/a5af/waveterm
- **Upstream Repository:** https://github.com/wavetermdev/waveterm
- **Upstream v0.12.0 Release:** https://github.com/wavetermdev/waveterm/releases/tag/v0.12.0
- **Layout Simplification PR:** https://github.com/wavetermdev/waveterm/pull/2387
- **Batch Tool Approval PR:** https://github.com/wavetermdev/waveterm/pull/2430
- **React 19 Migration PR:** https://github.com/wavetermdev/waveterm/pull/2272

---

## 11. Next Steps

### 11.1 Immediate Actions

1. **Review this Spec**
   - Get approval from maintainer
   - Clarify any questions
   - Confirm timeline acceptable

2. **Prepare Environment**
   - Ensure clean working directory
   - Update all tools (git, node, npm)
   - Free up disk space for builds

3. **Schedule Work**
   - Block 3-5 days for merge work
   - Minimize interruptions
   - Plan for testing time

### 11.2 After Successful Merge

1. **Proceed with Multi-Instance Implementation**
   - Use `docs/SPEC_MULTI_INSTANCE_PORTABLE_WINDOWS.md`
   - Now working on v0.12.0 codebase
   - AI features available as baseline

2. **Monitor for Upstream Patches**
   - v0.12.1, v0.12.2 may have bug fixes
   - Cherry-pick critical fixes
   - Avoid another full merge soon

3. **Contribute Back to Upstream** (optional)
   - If horizontal widget bar is valuable
   - If pane title labels are desired
   - Submit PRs to upstream with fork features

---

**Last Updated:** 2025-10-17
**Prepared By:** Agent2
**Status:** Ready for execution
**Estimated Effort:** 26-39 hours (3-5 days)
