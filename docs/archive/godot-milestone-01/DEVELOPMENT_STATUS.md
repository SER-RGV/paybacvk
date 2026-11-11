# UMBRAL DE ACERO — Development Status

Last update: 2026-11-11 · Branch: `arena/37ba3921-paybacvk` (base `612200337312dd4c4687673140dd93809507adae` on `main`)

Status labels used: **COMPLETE** · **PARTIAL** · **BLOCKED** · **NOT STARTED**. Verification labels: *implemented*, *integrated*, *automated-tested*, *manually-tested*.

## 0. Summary

| Phase | Status | Verification |
|---|---|---|
| 00 Repository audit | **COMPLETE** | Audit below; baseline recorded |
| 01 Technical foundation | **PARTIAL** | Implemented, integrated, automated-tested (68/68). Manually-tested: **BLOCKED** (no display in sandbox) |
| 02 Tactical prototype | NOT STARTED | — |
| 03–07 | NOT STARTED | — |

---

## 1. PHASE 00 — Repository audit

### 1.1 Repository inventory (before any change)

- Branch: `arena/37ba3921-paybacvk` (active), at `612200337312dd4c4687673140dd93809507adae`. Tracked files: **1** (`README.md`, content `# paybacvk---`). Commits: **1** (`Initial commit`, author SER-RGV).
- Remote: `origin https://github.com/SER-RGV/paybacvk.git`. `main` exists and is at the same commit.
- Working tree: clean. No scenes, scripts, assets, engine files, tests, CI or documentation existed.
- **Project root:** none existed. The Godot project was created at the repository root (decision D1 in ARCHITECTURE.md).
- No asset files of any kind, so no duplicate resources were found.
- The repository name `paybacvk` suggests a reference-game name. Per the directive, the product is **UMBRAL DE ACERO**. The repository was **not renamed** (decision D2). Nothing from PaybackTime 2 is present, and none was used.

### 1.2 Existing architecture

None. The audit found no code to preserve, so no existing functional work needed protection.

### 1.3 Dependency report

| Dependency | Status | Notes |
|---|---|---|
| Godot 4.7.2-stable | Built from source for testing (headless template). Not vendored in the repo | Official tarball from codeload.github.com. Release-asset CDN was blocked in the sandbox, so the binary was compiled from source |
| SCons 4.11.1 | Build tool only (PyPI) | Not part of the project |
| gdtoolkit 4.5.0 | Lint and parse only (PyPI) | Dev tool, documented in README |
| pkg-config | Shim in `~/.local/bin` (sandbox only) | Not part of the project; no system libraries used |
| Third-party game code, addons, fonts | **None** | Intentional: keeps licensing clean |

### 1.4 Asset report

Zero assets existed. Current assets are listed in `ASSET_MANIFEST.json`: 4 entries, all original (3 procedural placeholders, 1 hand-written SVG icon), 0 third-party.

### 1.5 Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R1 | Scope: the directive describes a commercial game (6 characters, 12 weapons, 3 operations, 3 facilities, 4 enemy types, destruction, campaign). Far beyond one milestone | High | Phased roadmap; each phase has acceptance criteria; no phase claimed complete without tests |
| R2 | No GPU/display in the sandbox: visual quality, FPS and input-device behaviour cannot be verified here | High | Stated as BLOCKED in TEST_REPORT.md; no performance claim made |
| R3 | No audio device; audio cannot be verified | Medium | Audio not started; to be verified on a dev machine in Phase 06 |
| R4 | Engine not available from package registries; required a source build | Medium | Build reproducible from the recorded flags (TEST_REPORT.md §2). Developers should use the official Godot 4.7 editor |
| R5 | Licensing: no third-party asset has a documented commercial licence yet | Medium | ASSET_MANIFEST.json policy; no third-party assets allowed without a licence record |
| R6 | Godot template build cannot run `--import`, so the global class cache is unavailable | Low (resolved) | Removed `class_name` globals (D8) |
| R7 | Headless timing makes time-based tests flaky | Low (resolved) | Tests wait on conditions with bounded frame budgets; three consecutive stable runs |
| R8 | Gamepad support requested but unverifiable here | Medium | No gamepad bindings claimed; a test enforces this |

### 1.6 Implementation roadmap

See `ROADMAP.md`. Phase 02 is next.

### 1.7 Baseline test report

Before changes: **no tests existed**. The baseline is therefore the empty project: 0 tests, 0 scenes, 0 scripts. After Phase 01: 68 tests, all passing (see TEST_REPORT.md).

---

## 2. Tooling used in this session

- Godot headless template build from source (see TEST_REPORT.md §2 for flags). Binary kept at `/tmp/godot-build/godot`, outside the repo.
- Build issues handled: pkg-config shim (needed to configure), Vulkan excluded (link error with the headless display path), `disable_path_overrides=no` (needed to run the project from its directory), and removal of `class_name` (D8).

---

## 3. PHASE 01 — Implemented report (A–H)

### A. IMPLEMENTED

| Area | Files |
|---|---|
| Project config | `project.godot`, `icon.svg`, `.gitignore`, `.gdlintrc` |
| Core autoloads | `src/core/event_bus.gd`, `src/core/game_state.gd`, `src/core/scene_manager.gd`, `src/core/settings.gd` |
| Input | `src/core/input_actions.gd` (abstract actions, physical keys, mouse wheel) |
| Simulation | `src/tactical/simulation_clock.gd` (fixed 0.1 s step, pause, speeds 0.5/1/2/4, catch-up cap, deterministic) |
| Camera | `src/camera/camera_math.gd` (pure maths), `src/camera/tactical_camera.gd` (isometric orthographic rig) |
| Scenario | `src/world/test_range_controller.gd` (owns clock, camera, HUD, probe; concrete blocks; ground) |
| UI | `src/ui/tactical_hud.gd`, `src/ui/main_menu.gd`, `src/ui/settings_menu.gd` |
| Scenes | `scenes/main_menu.tscn`, `scenes/settings_menu.tscn`, `scenes/test_range.tscn` |
| Tests | `tests/run_tests.gd`, `tests/test_case.gd`, `tests/unit/*` (6 files), `tests/integration/*` (3 files) |
| Tools | `tools/run_tests.sh`, `tools/lint.sh` |
| Docs | `README.md`, `ARCHITECTURE.md`, `ROADMAP.md`, `DEVELOPMENT_STATUS.md`, `TEST_REPORT.md`, `ART_BIBLE.md`, `ASSET_MANIFEST.json`, `CHANGELOG.md` |

Player-facing behaviour: main menu → test range (isometric camera with pan, rotate, zoom, middle-drag orbit; simulation clock with pause/resume and 4 speeds; HUD with time, state, speed, buttons and limit feedback; Esc back to menu) and settings (camera pan, rotate and zoom sensitivity, reset, persisted).

### B. INTEGRATED

- `SimulationClock` → `step_advanced` → probe rotation (scene reflects sim time, not frame time).
- `TestRangeController` → `EventBus.simulation_state_changed` → `TacticalHud` (labels and button text). The HUD unsubscribes on exit.
- Input action names → `TacticalCamera` and `TestRangeController` handlers; the HUD buttons call the same controller methods.
- `Settings` → `TacticalCamera` (speed multipliers) and `settings_menu` (sliders); persisted on leaving the screen.
- `SceneManager` → `GameState` and `EventBus.scene_changed`; the scene graph was exercised through real transitions in `test_scene_flow.gd`.

### C. TESTED

- Full suite: **68 passed, 0 failed, 215 assertions**, three consecutive stable runs (`tools/run_tests.sh`, via the headless template build of Godot 4.7.2).
- Mutation check: breaking the pause guard produces 2 failing tests and exit 1.
- Boot of the main scene: clean.
- `tools/lint.sh`: clean.
- Details and environment: TEST_REPORT.md.

### D. NOT TESTED

- Visual output, HUD layout, colours, shadows (no display).
- Real keyboard, mouse-wheel and middle-drag hardware input (verified via the InputMap and action handlers only).
- Gamepad (not implemented; not claimed).
- Audio (not implemented).
- Performance: FPS, frame time, CPU/GPU time, memory. Not measured; headless numbers would be meaningless.
- Import in the official Godot editor (only the template build was run).

### E. BLOCKERS

| Blocker | Consequence | Action |
|---|---|---|
| No display/GPU in sandbox | Phase 01 manual acceptance cannot be confirmed; Phase 01 stays PARTIAL | Run the manual checklist below on a dev machine |
| No audio device | Audio cannot be verified | Phase 06 on a dev machine |
| Release-asset CDN blocked | Official prebuilt Godot binary unavailable here | Source build used; reproducible |

**Manual checklist for Phase 01 sign-off (to run in the Godot 4.7 editor):**
1. Open `project.godot`, press F5. The main menu appears with the title and three working buttons.
2. Enter Test Range. The grey ground and four concrete blocks are visible in isometric view. The HUD shows RUNNING, sim time advancing, Speed 1.0x.
3. WASD/arrows pan; Q/E rotate; wheel and +/- zoom; middle-drag orbits. Zoom and pitch stop at their limits.
4. Space pauses: state shows PAUSED, sim time and probe stop. Space again resumes.
5. `[` and `]` change speed through 0.5x, 1.0x, 2.0x, 4.0x. Pressing `]` at 4.0x shows "Speed limit reached".
6. Esc returns to the menu. Settings sliders change camera speed and persist after restart.

### F. TECHNICAL DEBT

- Simulation advances in `_process`, not a dedicated physics-style tick. Acceptable for Phase 01; Phase 02 should move orders and AI onto the fixed-step signal explicitly.
- `TacticalCamera` reads input directly. Gamepad abstraction exists only as action names; no joypad events are bound.
- Test range geometry is placeholder (primitives, no collision). Replaced in Phase 02.
- Settings save only when leaving the Settings screen. A crash in the screen would lose unsaved slider values (they are applied live, only the file write is deferred).
- Engine-level warning `Could not load global script cache` appears on every headless run. Harmless (no `class_name` used), but noisy.
- No save system (Phase 05).

### G. NEXT PHASE (Phase 02 — Tactical prototype)

In order (see ROADMAP.md): grid navigation and obstacle baking with update-on-change tests; four player units with selection, move orders and order queue; line-of-sight raycasts with visibility states; two enemy archetypes with Idle/Patrol/Detect/Engage; light and heavy cover; combat hooks for Phase 03; one scripted encounter with an end-to-end integration test.

### H. GIT

See §4 below.

---

## 4. Decisions

Architecture decisions D1–D8 are in `ARCHITECTURE.md` §8. Phase-01-specific decision:

- **D8 — no `class_name`.** The headless template binary has no editor and cannot build the global class cache (`--import` is editor-only). Every script references its dependencies with `const X := preload("res://...")`. This also makes dependencies explicit and avoids cyclic references (the HUD types the controller as `Node` for this reason).

## 5. Known limitations of this milestone

- Single test scenario, no gameplay. Milestone 01 is a technical foundation, not a game.
- Orthographic camera chosen for the isometric look; perspective is not offered.
- Keyboard and mouse only.

## 6. Quality rules applied

- Tests never disabled to pass. Failures were investigated, fixed in code, and documented in TEST_REPORT.md §4.
- A test with no assertions is a failure.
- Time-based tests wait on conditions rather than fixed frame counts.

## 7. Asset and IP compliance

- All assets created in this milestone are original and listed in `ASSET_MANIFEST.json`.
- No third-party files. No material from PaybackTime 2 or any other game was used or referenced beyond the directive's statement that it is a mechanical reference.

## 8. Git

- Branch: `arena/37ba3921-paybacvk` (not renamed; not merged; no force-push).
- Commits on `arena/37ba3921-paybacvk` (pushed to `origin`):
  - `788c750` Add Milestone 01 tactical foundation (Godot 4.7): project, core, simulation, camera, UI, scenes.
  - `d46b245` Add headless test runner, unit and integration tests (+ tools).
  - `e2ee2a9` Document Phase 00 audit and Milestone 01 status.
- Verification: a fresh clone of `e2ee2a9` passes 68/68.
- Working tree: clean after push. Generated `.godot/` cache is ignored and not committed.
- No pull request opened and nothing merged. Merge into `main` requires authorization.
