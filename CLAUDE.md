# Claude Agent Development Guide

## Git & Pull Requests
- Push branches only to https://github.com/a5af/waveterm
- Open PRs against the fork (a5af/waveterm), not upstream
- Never PR directly to wavetermdev/waveterm without maintainer approval

---

## Development Workflow

### Commands (Use Correctly!)

| Command | Use When | Auto-Updates? |
|---------|----------|---------------|
| `task dev` | **Development** (normal work) | ✅ Yes - hot reload |
| `task start` | Standalone testing (rare) | ❌ No |
| `task package` | **Final release builds ONLY** | ❌ No |

**CRITICAL:** Never launch from `make/` during development - it's stale and will crash with "wavesrv.x64.exe ENOENT"

### After Code Changes

- **TypeScript/React** → Auto-reloads in `task dev` ✅
- **Go backend** → `task build:backend` then restart `task dev`
- **Test package** → `task package` then extract/install artifact

### Architecture

- **Wave.exe** = Electron app (UI)
- **wavesrv** = Go backend (auto-spawned, don't run manually)
- **wsh** = Shell integration (must be versioned correctly)

---

## Version Management

**See [README.md - Version Management](README.md#-version-management--critical---read-this) for complete guide.**

### Quick Reference

```bash
# Bump version (updates ALL files)
./bump-version.sh patch --message "Description"

# Rebuild binaries with new version
task build:backend

# Verify consistency
bash scripts/verify-version.sh

# Push
git push origin <branch> --tags
```

**Current version:** See [VERSION_HISTORY.md](VERSION_HISTORY.md)
