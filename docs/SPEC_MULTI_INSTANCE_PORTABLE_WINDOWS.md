# WaveTerm Multi-Instance Portable Windows Build Specification

**Version:** 1.0
**Date:** 2025-10-17
**Status:** Draft
**Author:** Agent2
**Repository:** https://github.com/a5af/waveterm (fork)

---

## Executive Summary

This specification defines modifications to the WaveTerm build system to enable **multiple portable Windows executable instances to run simultaneously**. Currently, WaveTerm enforces a single-instance model via Electron's `requestSingleInstanceLock()`. This spec proposes an **instance isolation architecture** allowing multiple independent WaveTerm instances with:

- Instance-specific data and configuration directories
- Unique backend (wavesrv) instances per frontend
- Portable mode with relative config paths
- Command-line flag to specify instance ID

**Target Platform:** Windows 10 1809+ (x64)

---

## 1. Current State Analysis

### 1.1 Fork Status

**Repository:** https://github.com/a5af/waveterm
**Upstream:** https://github.com/wavetermdev/waveterm
**Current Version:** 0.11.6

**Fork-Specific Changes:**
- Horizontal widget bar (vs. vertical sidebar)
- Optional pane title labels with auto-generation
- Layout simplification
- Various test stabilization improvements

### 1.2 Architecture Overview

**Technology Stack:**
- **Frontend:** Electron 38.1.2 + React 19 + Vite 6
- **Backend:** Go server (`wavesrv.x64.exe`) spawned by Electron
- **Build System:** electron-builder 26.0 + Task runner
- **IPC:** WebSocket connection between Electron and wavesrv

**Directory Structure:**
```
Windows:
%LOCALAPPDATA%\waveterm\
├── wave.db          # SQLite database (wavesrv)
├── wave.lock        # Backend lock file
├── logs\            # Application logs
└── ...

%LOCALAPPDATA%\waveterm-dev\  (if isDev mode)
```

**Environment Variables (Current):**
- `WAVETERM_HOME` - Legacy home directory
- `WAVETERM_CONFIG_HOME` - Override config directory
- `WAVETERM_DATA_HOME` - Override data directory
- `WAVETERM_DEV` - Dev mode flag

### 1.3 Single-Instance Enforcement

**Location:** `emain/emain.ts:681`

```typescript
const instanceLock = electronApp.requestSingleInstanceLock();
if (!instanceLock) {
    console.log("waveterm-app could not get single-instance-lock, shutting down");
    electronApp.quit();
    return;
}
```

**Electron Behavior:**
- Creates OS-level lock in user data directory
- Windows: Uses named mutex
- Second instance detects lock and quits immediately
- No CLI forwarding or window focus (current implementation)

**Constraints:**
| Component | Single-Instance Mechanism | File |
|-----------|--------------------------|------|
| Electron frontend | `requestSingleInstanceLock()` | `emain/emain.ts:681` |
| Go backend (wavesrv) | `wave.lock` file | Go code (backend) |
| Data directory | Shared `%LOCALAPPDATA%\waveterm` | `emain/platform.ts:131-149` |

---

## 2. Requirements

### 2.1 Functional Requirements

**FR1: Multiple Simultaneous Instances**
- Users MUST be able to run 2+ WaveTerm instances concurrently
- Each instance MUST have isolated data (databases, logs, config)
- Each instance MUST spawn its own `wavesrv` backend

**FR2: Instance Identification**
- Users MUST specify instance ID via CLI flag: `--instance <id>`
- Default instance ID: `default` (backward compatible)
- Instance IDs: alphanumeric + hyphens, max 64 chars (e.g., `work`, `dev-env`, `client1`)

**FR3: Portable Mode**
- Users MUST be able to run WaveTerm from USB drive or network share
- Config/data MUST be stored relative to executable
- No registry modifications or user profile dependencies

**FR4: Backend Isolation**
- Each instance MUST spawn separate `wavesrv` process
- Each `wavesrv` MUST use instance-specific data directory
- WebSocket ports MUST not conflict (dynamic allocation)

**FR5: Backward Compatibility**
- Default instance behavior MUST match current single-instance mode
- Existing data at `%LOCALAPPDATA%\waveterm` MUST be preserved
- No migration required for default instance

### 2.2 Non-Functional Requirements

**NFR1: Performance**
- Startup overhead per instance: <100ms
- Memory overhead per instance: <50MB (excluding normal app usage)

**NFR2: Usability**
- Window title MUST include instance ID for disambiguation
- Taskbar labels MUST show distinct instance names

**NFR3: Security**
- Instance directories MUST have proper file permissions (user-only)
- WebSocket auth keys MUST be instance-specific

---

## 3. Design Approach

### 3.1 Instance Isolation Model

**Concept:** Each WaveTerm instance operates in a **sandboxed namespace** identified by `instance_id`.

**Directory Structure:**

**Normal Mode (System-wide):**
```
%LOCALAPPDATA%\waveterm\
├── default\           # Default instance (backward compatible)
│   ├── wave.db
│   ├── wave.lock
│   ├── config\
│   └── logs\
├── work\              # Named instance
│   ├── wave.db
│   ├── wave.lock
│   └── ...
└── dev-env\           # Another instance
    └── ...
```

**Portable Mode (Relative to Executable):**
```
Wave.exe
.waveterm\                 # Data dir alongside executable
├── default\
│   ├── wave.db
│   └── ...
├── usb-workspace\
│   └── ...
```

### 3.2 CLI Design

**New Command-Line Flags:**

```bash
--instance <id>        # Specify instance ID (default: "default")
--portable             # Enable portable mode (config relative to exe)
--instance-list        # List all running instances (JSON output)
--data-dir <path>      # Override data directory (advanced)
```

**Examples:**

```powershell
# Launch default instance (existing behavior)
Wave.exe

# Launch named instance
Wave.exe --instance work

# Portable mode
E:\Wave.exe --portable --instance project1

# Override data directory explicitly
Wave.exe --data-dir "D:\WaveData\instance1"

# List running instances
Wave.exe --instance-list
```

### 3.3 Electron Changes

#### 3.3.1 Remove Single-Instance Lock

**File:** `emain/emain.ts`

**Current (Lines 681-686):**
```typescript
const instanceLock = electronApp.requestSingleInstanceLock();
if (!instanceLock) {
    console.log("waveterm-app could not get single-instance-lock, shutting down");
    electronApp.quit();
    return;
}
```

**Proposed:**
```typescript
// Multi-instance support: do NOT enforce single-instance lock
// Each instance is isolated by data directory and backend process

// Parse instance ID from command-line args
const instanceId = parseInstanceId(process.argv);
const portableMode = process.argv.includes("--portable");

console.log(`Starting WaveTerm instance: ${instanceId} (portable: ${portableMode})`);

// Set user data directory BEFORE any Electron APIs are called
const userDataDir = getInstanceDataDir(instanceId, portableMode);
electronApp.setPath("userData", userDataDir);

console.log(`User data directory: ${userDataDir}`);
```

#### 3.3.2 Update Platform Module

**File:** `emain/platform.ts`

**Add Instance Context:**

```typescript
// New constants
const WaveInstanceIdVarName = "WAVETERM_INSTANCE_ID";
const WavePortableModeVarName = "WAVETERM_PORTABLE";

// Global instance configuration
let g_instanceId: string = "default";
let g_portableMode: boolean = false;

/**
 * Parse instance ID from command-line arguments.
 */
export function parseInstanceId(argv: string[]): string {
    const instanceFlag = argv.find((arg, i) =>
        arg === "--instance" && i < argv.length - 1
    );

    if (instanceFlag) {
        const instanceIdIndex = argv.indexOf(instanceFlag) + 1;
        const instanceId = argv[instanceIdIndex];

        // Validate instance ID
        if (!validateInstanceId(instanceId)) {
            throw new Error(`Invalid instance ID: "${instanceId}". Use alphanumeric characters, hyphens, and underscores only.`);
        }

        return instanceId;
    }

    // Check environment variable
    const envInstanceId = process.env[WaveInstanceIdVarName];
    if (envInstanceId) {
        return envInstanceId;
    }

    return "default";
}

/**
 * Validate instance ID format.
 */
function validateInstanceId(id: string): boolean {
    if (!id || id.length === 0 || id.length > 64) {
        return false;
    }

    // Allow alphanumeric, hyphens, underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;

    // Prevent path traversal
    if (id.includes("..") || id.includes("/") || id.includes("\\")) {
        return false;
    }

    return validPattern.test(id);
}

/**
 * Get the data directory for a specific instance.
 */
export function getInstanceDataDir(instanceId: string, portableMode: boolean): string {
    g_instanceId = instanceId;
    g_portableMode = portableMode;

    if (portableMode) {
        // Portable: data directory relative to executable
        const exePath = app.getPath("exe");
        const exeDir = path.dirname(exePath);
        return path.join(exeDir, ".waveterm", instanceId);
    }

    // Normal mode: use system data directory
    const baseDataDir = paths.data; // env-paths: %LOCALAPPDATA%\waveterm

    // For default instance, use legacy location for backward compatibility
    if (instanceId === "default") {
        return baseDataDir;
    }

    // For named instances, create subdirectory
    return path.join(baseDataDir, instanceId);
}

/**
 * Update getWaveDataDir to use instance-specific directory.
 */
function getWaveDataDir(): string {
    // If custom override is set, use it
    const override = process.env[WaveDataHomeVarName];
    if (override) {
        return ensurePathExists(override);
    }

    // Return instance-specific directory (already set via electronApp.setPath)
    return ensurePathExists(app.getPath("userData"));
}
```

#### 3.3.3 Window Title Differentiation

**File:** `emain/emain-window.ts`

**Update Window Creation:**

```typescript
function createBrowserWindow(
    windowData: WaveWindow,
    fullConfig: FullConfigType,
    clientData: ClientDataType
): Promise<WaveBrowserWindow> {
    // ... existing code ...

    // Update window title to include instance ID if not default
    let windowTitle = "Wave Terminal";
    if (g_instanceId !== "default") {
        windowTitle = `Wave Terminal - ${g_instanceId}`;
    }

    const winBounds = windowData?.winsize;
    const winOpts: Electron.BrowserWindowConstructorOptions = {
        titleBarStyle:
            unamePlatform === "darwin" ? "hiddenInset" : ("hidden" as Electron.TitleBarStyle),
        titleBarOverlay:
            unamePlatform !== "darwin"
                ? {
                      symbolColor: "white",
                      color: "#00000000",
                  }
                : false,
        x: winBounds?.x,
        y: winBounds?.y,
        width: winBounds?.width,
        height: winBounds?.height,
        minWidth: 400,
        minHeight: 300,
        icon:
            unamePlatform == "linux"
                ? path.join(getElectronAppBasePath(), "public/logos/wave-logo-dark.png")
                : undefined,
        webPreferences: {
            preload: path.join(getElectronAppBasePath(), "preload", "index.cjs"),
            webviewTag: true,
        },
        show: false,
        autoHideMenuBar: true,
        title: windowTitle, // <-- Set instance-specific title
    };

    // ... rest of existing code ...
}
```

### 3.4 Backend (wavesrv) Integration

#### 3.4.1 Pass Instance Config to Backend

**File:** `emain/emain-wavesrv.ts`

**Update wavesrv Spawn:**

```typescript
async function runWaveSrv(handleWSEvent: WSEventCallback): Promise<void> {
    const waveSrvCmd = getWaveSrvPath();
    const waveSrvCwd = getWaveSrvCwd(); // Already uses instance-specific data dir

    console.log("Starting wavesrv:", waveSrvCmd, "cwd:", waveSrvCwd);

    const env = {
        ...process.env,
        WAVETERM_DATA_HOME: waveSrvCwd,
        WAVETERM_INSTANCE_ID: g_instanceId, // Pass instance ID to backend
    };

    const proc = child_process.spawn(waveSrvCmd, [], {
        cwd: waveSrvCwd,
        env: env,
        // ... existing spawn options ...
    });

    // ... rest of existing code ...
}
```

#### 3.4.2 Backend Lock File

**Note:** The Go backend (`wavesrv`) already uses a `wave.lock` file in its working directory. Since we're changing the working directory per instance, lock files are automatically isolated. No Go code changes required for basic isolation.

**If backend needs instance ID awareness:**
- Read `WAVETERM_INSTANCE_ID` env var in Go code
- Use for logging or internal tracking
- Not strictly required for isolation

### 3.5 Build Configuration Changes

#### 3.5.1 electron-builder Config

**File:** `electron-builder.config.cjs`

**Current Windows Target (Line 93):**
```javascript
win: {
    target: ["nsis", "msi", "zip"],
    // ...
},
```

**No changes required** - ZIP target already provides portable option. Users can extract and run.

**Optional: Add Portable Installer:**

```javascript
win: {
    target: [
        { target: "nsis", arch: ["x64"] },
        { target: "msi", arch: ["x64"] },
        { target: "zip", arch: ["x64"] },
        { target: "portable", arch: ["x64"] } // Single-exe portable
    ],
    signtoolOptions: windowsShouldSign && {
        signingHashAlgorithms: ["sha256"],
        publisherName: "Command Line Inc",
        certificateSubjectName: "Command Line Inc",
        certificateSha1: process.env.SM_CODE_SIGNING_CERT_SHA1_HASH,
    },
},
```

**Portable Target Benefits:**
- Single executable with embedded app.asar
- No installation required
- Easy to copy to USB drives

---

## 4. Implementation Plan

### Phase 1: CLI Argument Parsing (Week 1)

**Tasks:**
1. Add CLI flag parsing for `--instance`, `--portable`, `--instance-list`
2. Implement `parseInstanceId()` and validation
3. Add environment variable support (`WAVETERM_INSTANCE_ID`)
4. Add unit tests for argument parsing
5. Update help text and documentation

**Deliverables:**
- Working CLI flag parsing
- Validation prevents invalid instance IDs
- Tests passing

**Testing:**
```bash
Wave.exe --instance test1
# Should log: Starting WaveTerm instance: test1 (portable: false)

Wave.exe --instance "../../../bad"
# Should error: Invalid instance ID
```

---

### Phase 2: Directory Isolation (Week 2)

**Tasks:**
1. Implement `getInstanceDataDir()`
2. Call `electronApp.setPath("userData", ...)` before Electron ready
3. Update `getWaveDataDir()` to respect instance context
4. Test portable mode directory creation
5. Verify wavesrv uses correct working directory

**Deliverables:**
- Each instance uses separate data directory
- Portable mode creates `.waveterm/` alongside exe
- Backward compatibility: default instance uses `%LOCALAPPDATA%\waveterm`

**Testing:**
```bash
# Instance 1
Wave.exe --instance work
# Data: %LOCALAPPDATA%\waveterm\work\

# Instance 2 (default)
Wave.exe
# Data: %LOCALAPPDATA%\waveterm\ (backward compatible)

# Portable
E:\Wave.exe --portable --instance usb
# Data: E:\.waveterm\usb\
```

---

### Phase 3: Remove Single-Instance Lock (Week 3)

**Tasks:**
1. Remove `requestSingleInstanceLock()` call
2. Test multiple instances start simultaneously
3. Verify no interference between instances
4. Add startup logging for instance ID
5. Test process isolation (kill one instance, others unaffected)

**Deliverables:**
- Multiple instances run without conflicts
- Each instance independent (no shared state)
- Graceful handling of instance crashes

**Testing:**
```bash
# Start 3 instances
Start-Process Wave.exe -ArgumentList "--instance work"
Start-Process Wave.exe -ArgumentList "--instance dev"
Start-Process Wave.exe -ArgumentList "--instance prod"

# All 3 should start and run independently
# TaskManager should show 3 Wave.exe processes + 3 wavesrv.x64.exe processes
```

---

### Phase 4: Window Title & Taskbar Labels (Week 4)

**Tasks:**
1. Update `createBrowserWindow()` to set instance-specific title
2. Verify taskbar shows distinct labels per instance
3. Add instance ID to application menu (optional)
4. Test with Windows Snap layouts (Win+Arrow keys)
5. Ensure focus management works correctly

**Deliverables:**
- Window title: `Wave Terminal - {instance_id}`
- Taskbar shows distinct names
- Windows features work correctly

**Testing:**
- Launch 2 instances: `work` and `dev`
- Windows taskbar should show:
  - `Wave Terminal - work`
  - `Wave Terminal - dev`
- Alt+Tab should show both with distinct titles

---

### Phase 5: Instance List Command (Week 5)

**Tasks:**
1. Implement `--instance-list` flag
2. Scan data directory for active instances
3. Check `wave.lock` files for running processes
4. Output JSON with instance details (PID, data dir, uptime)
5. Add error handling for inaccessible instances

**Deliverables:**
- `Wave.exe --instance-list` outputs running instances
- JSON format for scripting

**Output Format:**
```json
{
  "instances": [
    {
      "id": "default",
      "pid": 12345,
      "dataDir": "C:\\Users\\User\\AppData\\Local\\waveterm",
      "portable": false,
      "uptime": 3600,
      "windowCount": 1
    },
    {
      "id": "work",
      "pid": 12346,
      "dataDir": "C:\\Users\\User\\AppData\\Local\\waveterm\\work",
      "portable": false,
      "uptime": 1800,
      "windowCount": 2
    }
  ]
}
```

---

### Phase 6: Testing & Documentation (Week 6)

**Tasks:**
1. Write comprehensive integration tests
2. Test portable mode on USB drives (different machines)
3. Test process cleanup (graceful shutdown)
4. Update BUILD.md with multi-instance instructions
5. Write user documentation (MULTI_INSTANCE_GUIDE.md)
6. Create example scripts for common workflows

**Deliverables:**
- Full test coverage
- User-facing documentation
- Migration guide (if needed)

---

## 5. Use Cases

### Use Case 1: Work/Personal Separation

**Scenario:** User wants separate WaveTerm environments for work and personal projects.

**Workflow:**
```powershell
# Work instance (connected to work servers)
Wave.exe --instance work

# Personal instance (connected to personal servers)
Wave.exe --instance personal
```

**Benefits:**
- No mixing of SSH keys, configs, or connection history
- Clear mental separation
- Can close work instance at end of day

---

### Use Case 2: Client Projects

**Scenario:** Consultant managing multiple client environments.

**Workflow:**
```powershell
# Create desktop shortcuts
# C:\Users\User\Desktop\Client-Acme.lnk
# Target: "C:\Program Files\Wave\Wave.exe" --instance acme

# C:\Users\User\Desktop\Client-Beta.lnk
# Target: "C:\Program Files\Wave\Wave.exe" --instance beta
```

**Benefits:**
- Each client has isolated terminal history and connections
- Easy to switch contexts
- No risk of running commands on wrong client servers

---

### Use Case 3: USB Portable Workspace

**Scenario:** Developer working on shared computers (library, university lab).

**Workflow:**
```powershell
# USB drive: E:\
# Extract Wave portable ZIP to E:\WaveTerm\

# Run portable instance
E:\WaveTerm\Wave.exe --portable --instance my-workspace

# Data stored at: E:\WaveTerm\.waveterm\my-workspace\
# Unplug USB, data goes with you
```

**Benefits:**
- No installation required
- Consistent environment across machines
- Private data on personal USB drive

---

### Use Case 4: Testing New Versions

**Scenario:** User wants to test beta version without disrupting stable instance.

**Workflow:**
```powershell
# Stable instance (production work)
"C:\Program Files\Wave\Wave.exe" --instance stable

# Beta instance (testing new features)
"C:\Program Files\Wave Beta\Wave.exe" --instance beta
```

**Benefits:**
- Safe testing environment
- Rollback by closing beta instance
- No data contamination

---

## 6. Migration & Backward Compatibility

### 6.1 Existing Users

**Default Behavior Unchanged:**
- Running `Wave.exe` without flags uses `--instance default`
- Data directory remains `%LOCALAPPDATA%\waveterm`
- **No migration required**

**Auto-Detection:**
```typescript
// If existing data exists at %LOCALAPPDATA%\waveterm:
// - Use it for default instance (backward compatible)
// - Named instances create subdirectories

if (instanceId === "default") {
    // Check if legacy data exists
    const legacyDataDir = path.join(paths.data); // %LOCALAPPDATA%\waveterm
    if (existsSync(legacyDataDir)) {
        return legacyDataDir; // Use legacy location
    }
}
```

### 6.2 Upgrade Path

**Version 0.11.6 → 0.12.0 (Multi-Instance Support):**

1. Install new version (MSI/NSIS)
2. First launch uses existing data (no changes)
3. User can create named instances as needed
4. No forced migration

**Communication:**
- Release notes: "WaveTerm now supports multiple instances! Use `--instance <name>` to create isolated environments."
- Documentation: Add MULTI_INSTANCE_GUIDE.md

---

## 7. Security Considerations

### 7.1 Instance Isolation

**Threat:** Malicious process reads data from other instances.

**Mitigation:**
- Instance directories use Windows ACLs (user-only access)
- Auth keys are instance-specific (already generated by wavesrv)
- No shared state between instances

### 7.2 Path Traversal

**Threat:** Malicious instance ID attempts path traversal (e.g., `--instance ../../../Windows`)

**Mitigation:**
```typescript
function validateInstanceId(id: string): boolean {
    // Prevent path traversal
    if (id.includes("..") || id.includes("/") || id.includes("\\")) {
        return false;
    }

    // Whitelist pattern
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return validPattern.test(id);
}
```

### 7.3 Portable Mode on Shared Drives

**Threat:** USB drive or network share accessed by untrusted users.

**Mitigation:**
- Document security best practices:
  - Use encrypted USB drives for sensitive data
  - Don't store credentials in portable instances
  - Clear data when done on shared computers

---

## 8. Performance Impact

### 8.1 Startup Time

**Per Instance Overhead:**
- Directory creation: ~5ms
- Instance ID validation: <1ms
- Path resolution: ~5ms

**Total:** ~10ms (negligible)

### 8.2 Memory Usage

**Per Instance:**
- Electron process: ~150MB (normal usage)
- wavesrv process: ~50MB
- Additional overhead for instance context: <1MB

**Multiple Instances:**
- 3 instances: ~600MB total (3 × 200MB)
- Acceptable for modern systems (8GB+ RAM)

### 8.3 Disk Usage

**Per Instance:**
- Database (wave.db): Variable (grows with usage)
- Logs: ~10MB typical
- Config: ~1MB

---

## 9. Testing Strategy

### 9.1 Unit Tests

**New Test Files:**
- `emain/platform.test.ts` (instance ID parsing, validation)

**Test Cases:**
```typescript
describe("parseInstanceId", () => {
    test("returns default when no flag provided", () => {
        const id = parseInstanceId(["Wave.exe"]);
        expect(id).toBe("default");
    });

    test("parses --instance flag", () => {
        const id = parseInstanceId(["Wave.exe", "--instance", "work"]);
        expect(id).toBe("work");
    });

    test("rejects invalid characters", () => {
        expect(() => parseInstanceId(["Wave.exe", "--instance", "../bad"]))
            .toThrow("Invalid instance ID");
    });

    test("validates max length", () => {
        const longId = "a".repeat(65);
        expect(() => parseInstanceId(["Wave.exe", "--instance", longId]))
            .toThrow("Invalid instance ID");
    });
});
```

### 9.2 Integration Tests

**Test Scenarios:**
1. **Multiple instances start without conflicts**
   - Start 3 instances with different IDs
   - Verify all 3 are running
   - Verify separate data directories created

2. **Instance data isolation**
   - Create connection in instance 1
   - Verify it doesn't appear in instance 2

3. **Portable mode**
   - Extract Wave to USB drive (simulate: D:\Test\)
   - Run with `--portable`
   - Verify `.waveterm\` directory created alongside exe

4. **Process cleanup**
   - Start instance
   - Kill Electron process (simulate crash)
   - Verify wavesrv terminates
   - Restart instance (should work normally)

5. **Window titles**
   - Start instances `work` and `dev`
   - Verify window titles show instance IDs
   - Verify taskbar labels are distinct

### 9.3 Manual Testing Checklist

- [ ] Install via MSI
- [ ] Launch default instance (no flags)
- [ ] Launch named instance (`--instance test`)
- [ ] Verify 2 windows open with distinct titles
- [ ] Create terminal in instance 1, verify isolated
- [ ] Kill instance 1, verify instance 2 unaffected
- [ ] Extract ZIP to USB drive
- [ ] Run portable mode, verify `.waveterm\` created
- [ ] Unplug USB, plug into different PC, run again
- [ ] Verify data persists across machines
- [ ] Run `--instance-list`, verify output correct

---

## 10. Build Instructions

### 10.1 Local Development Build

```bash
# Install dependencies
npm install

# Build frontend and backend
task build

# Package Windows builds (includes multi-instance support)
task package:windows
```

### 10.2 Artifacts

**Output Directory:** `make/`

**Generated Files:**
- `Wave-win-x64-0.12.0.exe` (NSIS installer)
- `Wave-win-x64-0.12.0.msi` (MSI installer)
- `Wave-win-x64-0.12.0.zip` (Portable ZIP)
- `Wave-win-x64-0.12.0-portable.exe` (Optional: Single-exe portable)

### 10.3 Testing Portable Build

```powershell
# Extract ZIP
Expand-Archive -Path "make\Wave-win-x64-0.12.0.zip" -DestinationPath "E:\WaveTest"

# Run portable instance
E:\WaveTest\Wave.exe --portable --instance test1

# Verify data directory created
Test-Path "E:\WaveTest\.waveterm\test1\wave.db"  # Should be True
```

---

## 11. Documentation Updates

### 11.1 README.md

**Add Section: Multi-Instance Support**

```markdown
## Multi-Instance Support

WaveTerm supports running multiple independent instances simultaneously.

### Usage

```powershell
# Launch default instance
Wave.exe

# Launch named instances
Wave.exe --instance work
Wave.exe --instance personal

# Portable mode (data stored alongside executable)
Wave.exe --portable --instance my-workspace

# List running instances
Wave.exe --instance-list
```

### Use Cases

- **Work/Personal Separation:** Keep work and personal terminals isolated
- **Client Projects:** Manage multiple client environments
- **Testing:** Run stable and beta versions side-by-side
- **Portable:** Use WaveTerm on USB drives across different computers

See [Multi-Instance Guide](docs/MULTI_INSTANCE_GUIDE.md) for detailed documentation.
```

### 11.2 New Documentation Files

**Files to Create:**
- `docs/MULTI_INSTANCE_GUIDE.md` - Comprehensive usage guide
- `docs/PORTABLE_MODE_GUIDE.md` - USB drive setup instructions
- `docs/TROUBLESHOOTING_MULTI_INSTANCE.md` - Common issues

---

## 12. Open Questions

### Q1: Should we add instance discovery UI?

**Options:**
- A. CLI only (`--instance-list`)
- B. Add "Switch Instance" menu in GUI
- C. Tray icon showing all instances

**Recommendation:** A for v0.12.0, B for v0.13.0

---

### Q2: Should portable mode auto-detect?

**Options:**
- A. Require explicit `--portable` flag
- B. Auto-detect if `.waveterm\` exists alongside exe
- C. Auto-detect if running from removable drive

**Recommendation:** B (auto-detect `.waveterm\`)

---

### Q3: Should instances share UI settings?

**Options:**
- A. Fully isolated (each instance has own theme, settings)
- B. Shared UI preferences, isolated data
- C. User preference (opt-in sharing)

**Recommendation:** A (fully isolated) for simplicity

---

## 13. Success Criteria

### Release Acceptance Criteria (v0.12.0)

**Must Have:**
- ✅ Multiple instances run simultaneously on Windows
- ✅ Each instance has isolated data directory
- ✅ `--instance <id>` flag works correctly
- ✅ `--portable` mode stores data relative to executable
- ✅ Window titles show instance ID
- ✅ Backward compatibility: default instance unchanged
- ✅ All unit tests passing
- ✅ All integration tests passing
- ✅ Documentation updated

**Nice to Have:**
- Instance list command (`--instance-list`)
- Taskbar jump list for common instances
- Portable single-exe build

**Future (v0.13.0):**
- GUI instance switcher
- Instance templates (pre-configured setups)
- Cloud sync for portable instances
- Cross-platform multi-instance support (macOS, Linux)

---

## 14. Timeline

| Phase | Duration | Deliverables |
|-------|----------|-------------|
| Phase 1: CLI Parsing | Week 1 | Argument parsing, validation |
| Phase 2: Directory Isolation | Week 2 | Instance-specific data dirs |
| Phase 3: Remove Lock | Week 3 | Multiple instances running |
| Phase 4: Window Titles | Week 4 | UI differentiation |
| Phase 5: Instance List | Week 5 | `--instance-list` command |
| Phase 6: Testing & Docs | Week 6 | Full test coverage, docs |
| **Total** | **6 weeks** | **v0.12.0 Release** |

---

## 15. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Data corruption if instances conflict | High | Low | Robust directory isolation, validation |
| Performance degradation with many instances | Medium | Medium | Document recommended limits (4-5 instances) |
| User confusion about which instance is active | Medium | High | Clear window titles, documentation |
| Portable mode data loss on USB failure | High | Low | Document backup best practices |
| Breaking existing workflows | High | Low | Backward compatibility (default instance) |

---

## 16. Future Enhancements

### Post v0.12.0 (Windows Only)

- **Instance Templates:** Pre-configured instances for common scenarios
- **Tray Icon:** Quick access to all running instances
- **Inter-Instance Messaging:** Copy/paste data between instances
- **Instance Profiles:** Import/export instance configurations

### v0.13.0+ (Cross-Platform)

- **macOS Support:** Multi-instance on macOS
- **Linux Support:** Multi-instance on Linux
- **Cloud Sync:** Sync portable instances via cloud storage
- **Remote Instances:** Connect to WaveTerm running on remote machines

---

## 17. References

- **Electron Single-Instance:** https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelock
- **env-paths Library:** https://github.com/sindresorhus/env-paths
- **WaveTerm Architecture:** (internal docs)
- **Similar Projects:** VS Code Insiders/Stable, Firefox profiles

---

## Appendix A: Code Changes Summary

### Files Modified

| File | Changes | Lines Changed |
|------|---------|---------------|
| `emain/emain.ts` | Remove single-instance lock, add instance context | ~20 |
| `emain/platform.ts` | Add instance dir logic, CLI parsing | ~150 |
| `emain/emain-window.ts` | Update window title with instance ID | ~5 |
| `emain/emain-wavesrv.ts` | Pass instance ID env var to backend | ~3 |
| `package.json` | Update version to 0.12.0 | ~1 |
| **Total** | | **~180 lines** |

### New Files

- `docs/MULTI_INSTANCE_GUIDE.md` (new)
- `docs/PORTABLE_MODE_GUIDE.md` (new)
- `docs/TROUBLESHOOTING_MULTI_INSTANCE.md` (new)
- `emain/platform.test.ts` (new)

---

## Appendix B: Example Implementation

### Complete Implementation of Instance Parsing

```typescript
// emain/platform.ts

import { app } from "electron";
import path from "path";
import { existsSync, mkdirSync } from "fs";

// Global instance context
let g_instanceId: string = "default";
let g_portableMode: boolean = false;

/**
 * Parse instance ID from command-line arguments.
 */
export function parseInstanceId(argv: string[]): string {
    // Check for --instance flag
    const instanceIndex = argv.indexOf("--instance");
    if (instanceIndex !== -1 && instanceIndex < argv.length - 1) {
        const instanceId = argv[instanceIndex + 1];

        if (!validateInstanceId(instanceId)) {
            throw new Error(
                `Invalid instance ID: "${instanceId}". ` +
                `Use alphanumeric characters, hyphens, and underscores only (max 64 chars).`
            );
        }

        return instanceId;
    }

    // Check environment variable
    const envInstanceId = process.env.WAVETERM_INSTANCE_ID;
    if (envInstanceId) {
        if (!validateInstanceId(envInstanceId)) {
            throw new Error(`Invalid WAVETERM_INSTANCE_ID env var: "${envInstanceId}"`);
        }
        return envInstanceId;
    }

    return "default";
}

/**
 * Check if portable mode is enabled.
 */
export function isPortableMode(argv: string[]): boolean {
    return argv.includes("--portable") ||
           process.env.WAVETERM_PORTABLE === "1";
}

/**
 * Validate instance ID format.
 */
function validateInstanceId(id: string): boolean {
    if (!id || id.length === 0 || id.length > 64) {
        return false;
    }

    // Allow: alphanumeric, hyphens, underscores
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(id)) {
        return false;
    }

    // Prevent path traversal
    if (id.includes("..") || id.includes("/") || id.includes("\\")) {
        return false;
    }

    return true;
}

/**
 * Get instance-specific data directory.
 */
export function getInstanceDataDir(instanceId: string, portableMode: boolean): string {
    g_instanceId = instanceId;
    g_portableMode = portableMode;

    if (portableMode) {
        // Portable mode: data dir relative to executable
        const exePath = app.getPath("exe");
        const exeDir = path.dirname(exePath);
        const dataDir = path.join(exeDir, ".waveterm", instanceId);

        // Ensure directory exists
        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
        }

        return dataDir;
    }

    // Normal mode: system data directory
    const baseDataDir = path.join(
        app.getPath("appData"),
        "waveterm"
    );

    // Default instance uses legacy location (backward compatible)
    if (instanceId === "default") {
        return baseDataDir;
    }

    // Named instances use subdirectory
    const dataDir = path.join(baseDataDir, instanceId);

    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }

    return dataDir;
}

/**
 * Get current instance ID.
 */
export function getInstanceId(): string {
    return g_instanceId;
}

/**
 * Check if running in portable mode.
 */
export function getPortableMode(): boolean {
    return g_portableMode;
}
```

### Usage in emain.ts

```typescript
// emain/emain.ts

async function appMain() {
    // Set disableHardwareAcceleration as early as possible
    const launchSettings = getLaunchSettings();
    if (launchSettings?.["window:disablehardwareacceleration"]) {
        console.log("disabling hardware acceleration, per launch settings");
        electronApp.disableHardwareAcceleration();
    }

    const startTs = Date.now();

    // ===== MULTI-INSTANCE SUPPORT =====
    // Parse instance configuration from CLI
    const instanceId = parseInstanceId(process.argv);
    const portableMode = isPortableMode(process.argv);

    console.log(`[INSTANCE] Starting Wave Terminal`);
    console.log(`[INSTANCE] ID: ${instanceId}`);
    console.log(`[INSTANCE] Portable: ${portableMode}`);

    // Set instance-specific user data directory BEFORE any Electron APIs
    const userDataDir = getInstanceDataDir(instanceId, portableMode);
    electronApp.setPath("userData", userDataDir);

    console.log(`[INSTANCE] Data directory: ${userDataDir}`);

    // NO LONGER ENFORCING SINGLE-INSTANCE LOCK
    // Each instance is isolated by data directory

    // ===== END MULTI-INSTANCE SETUP =====

    // Continue with normal startup...
    try {
        await runWaveSrv(handleWSEvent);
    } catch (e) {
        console.log(e.toString());
    }

    // ... rest of existing code ...
}
```

---

**Last Updated:** 2025-10-17
**Next Review:** After Phase 1 implementation
**Status:** Ready for implementation

**Fork Repository:** https://github.com/a5af/waveterm
**Upstream:** https://github.com/wavetermdev/waveterm
