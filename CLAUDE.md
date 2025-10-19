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
