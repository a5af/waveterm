# Claude Agent Notes

## Git & PRs
- Claude should push branches only to https://github.com/a5af/waveterm.
- Always open pull requests against the fork (a5af/waveterm) unless explicitly told otherwise.
- Never open PRs directly on https://github.com/wavetermdev/waveterm without maintainer approval.

## Development Workflow
**CRITICAL - READ CAREFULLY:**

### Running WaveTerm During Development
- **ALWAYS** use `task dev` or `npm run dev` to run the development server
- **NEVER** launch WaveTerm from `make/win-unpacked/` or other packaged directories during development
- The packaged app in `make/` is **NOT automatically updated** when you make code changes
- If you launch from `make/`, you'll get crashes like "wavesrv.x64.exe ENOENT" because it's stale

### When to Use Each Command
- `task dev` or `npm run dev` → **Use this for development** (hot reload, auto-updates)
- `task start` → Standalone build without hot reload (rarely needed)
- `task package` → **Only for creating final distributable packages** (installer/zip files)

### After Making Code Changes
1. Changes to TypeScript/React → Automatically reloaded by `task dev` ✅
2. Changes to Go backend (wavesrv) → Requires `task build` then restart `task dev`
3. To test packaged app → Run `task package` then install/extract the artifact

### What WaveTerm Actually Is
- **WaveTerm** is the Electron application (the terminal UI)
- **wavesrv** is the Go backend server (runs in the background)
- When launching the app, you're launching **WaveTerm**, not wavesrv
- The executable names:
  - macOS: `Wave.app`
  - Windows: `Wave.exe`
  - Linux: `waveterm` or `wave`

**DO NOT launch wavesrv directly** - it's spawned automatically by WaveTerm.

## Version Management

### Before You Start Working
1. **Check current version:** See [VERSION_HISTORY.md](./VERSION_HISTORY.md)
2. **Understand fork vs upstream:**
   - **Upstream:** Original [wavetermdev/waveterm](https://github.com/wavetermdev/waveterm) (base: v0.12.0)
   - **Fork:** This repo [a5af/waveterm](https://github.com/a5af/waveterm) (current: v0.12.3-fork)

### Bumping Version After Significant Changes

**ALWAYS use the version bump scripts** - they update all configs and docs:

**Windows:**
```powershell
./bump-version.ps1 patch -Message "Fix multi-instance bug"
./bump-version.ps1 minor -Message "Add new terminal borders feature"
./bump-version.ps1 0.12.10 -Message "Major release"
```

**macOS/Linux:**
```bash
./bump-version.sh patch --message "Fix multi-instance bug"
./bump-version.sh minor --message "Add new terminal borders feature"
./bump-version.sh 0.12.10 --message "Major release"
```

The script automatically:
- ✅ Updates `package.json` and `package-lock.json`
- ✅ Updates `VERSION_HISTORY.md` with your changes
- ✅ Creates git commit with version message
- ✅ Creates git tag (e.g., `v0.12.4-fork`)
- ✅ Tracks which agent made the change

**When to bump:**
- `patch`: Bug fixes, small improvements (0.12.3 → 0.12.4)
- `minor`: New features, significant changes (0.12.3 → 0.13.0)
- `major`: Breaking changes, major rewrites (0.12.3 → 1.0.0)
- Specific version: Jump to any version (e.g., 0.12.10)

**After bumping:**
```bash
git push origin <branch-name> --tags
```
