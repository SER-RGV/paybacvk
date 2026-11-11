# Phase 00 — Migration audit: Godot 4 → HTML5 (TypeScript, Three.js, Vite)

Date: 2026-11-11 · Branch: `arena/37ba3921-paybacvk` · Base: `main` @ `612200337312dd4c4687673140dd93809507adae` (not modified).

This audit classifies everything that existed before the web migration. It supersedes the earlier draft, which contained unverified counts and file names that did not exist. Corrections are listed in §8.

## 1. Repository state before the migration (verified with git, this session)

| Item | Value |
|---|---|
| Commits on the branch | `6122003` (base) → `788c750` (Godot Milestone 01) → `d46b245` (headless tests) → `e2ee2a9` (Phase 00 docs) → `9b4eef7` (verification record) |
| Remote branch | `origin/arena/37ba3921-paybacvk` = `9b4eef7` (verified with `git ls-remote`) |
| `main` | Not touched |
| Godot test result on record | `/tmp/godot-build/run4.log`: **Passed 66, Failed 0, Assertions 207, RESULT: PASS** |
| Per-area test counts | Not verified against the `tests/` files; removed from this audit |

Branch rule: the session is bound to `arena/37ba3921-paybacvk`. No other branch was created. No force-push, no merge, no PR.

## 2. Classification

Legend: **KEEP** (still valid, unchanged or minor edits) · **REVISE** (concept kept, content rewritten) · **ARCHIVE** (kept as history, not current) · **DISCARD** (Godot-specific, removed from the tree, still in history) · **REBUILD** (behaviour re-implemented in TypeScript, no line-by-line port).

### 2.1 Documents

| Original file | Class | Current location | Note |
|---|---|---|---|
| `README.md` | ARCHIVE + REVISE | `docs/archive/godot-milestone-01/README.md`; new `README.md` | Godot instructions |
| `ARCHITECTURE.md` | ARCHIVE + REVISE | `docs/archive/godot-milestone-01/ARCHITECTURE.md`; new `ARCHITECTURE.md` | Decisions D3–D7 kept, see §4 |
| `DEVELOPMENT_STATUS.md` | ARCHIVE + REVISE | `docs/archive/...`; new `DEVELOPMENT_STATUS.md` | Old phase report |
| `TEST_REPORT.md` | ARCHIVE + REVISE | `docs/archive/...`; new `TEST_REPORT.md` | Godot QA evidence kept as history |
| `ROADMAP.md` | REVISE | `ROADMAP.md` | Phase order kept; overclaimed Phase 00/01 status removed |
| `ART_BIBLE.md` | REVISE | `ART_BIBLE.md` | Direction, palette, scale kept; Godot naming and asset formats replaced |
| `ASSET_MANIFEST.json` | REVISE | `ASSET_MANIFEST.json` | Provenance policy kept; entries rewritten for the web build |
| `CHANGELOG.md` | KEEP + extend | `CHANGELOG.md` | Godot entry kept and marked superseded |
| `icon.svg` | KEEP (renamed) | `public/favicon.svg` | Original hand-made SVG, not the Godot logo |
| — | NEW | `docs/DESIGN_MASTER.md` | The repository held no design document; the directive is transcribed here |
| — | NEW | `docs/MIGRATION_AUDIT.md` | This file |

### 2.2 Code, scenes and tools (all Godot-specific; removed from the tree, recoverable from `9b4eef7`)

| Original file | Class | Web replacement |
|---|---|---|
| `project.godot` | DISCARD | `package.json`, `index.html`, `vite.config.ts` |
| `.gdlintrc` | DISCARD | `eslint.config.js` |
| `scenes/main_menu.tscn`, `settings_menu.tscn`, `test_range.tscn` | DISCARD | Scenes in `src/ui/screens/` and `src/tactical/TestRangeScene.ts` |
| `src/core/event_bus.gd` | REBUILD | `src/core/EventBus.ts` (typed events, `src/core/events.ts`) |
| `src/core/game_state.gd` | REBUILD | `src/core/GameState.ts` |
| `src/core/scene_manager.gd` | REBUILD | `src/core/SceneManager.ts` (factories, enter/update/render/exit) |
| `src/core/settings.gd` | REBUILD | `src/core/SettingsStore.ts` (schema version, localStorage, clamp) |
| `src/core/input_actions.gd` | REBUILD | `src/data/bindings.ts` + `src/core/InputController.ts` |
| `src/tactical/simulation_clock.gd` | REBUILD | `src/tactical/TacticalSimulation.ts` |
| `src/camera/camera_math.gd` | REBUILD | `src/engine/cameraMath.ts` (pure functions) |
| `src/camera/tactical_camera.gd` | REBUILD | `src/engine/IsoCamera.ts` |
| `src/world/test_range_controller.gd` | REBUILD | `src/data/testRange.ts`, `src/engine/World.ts`, `src/tactical/TestRangeScene.ts` |
| `src/ui/tactical_hud.gd` | REBUILD | `src/ui/hud/Hud.ts` |
| `src/ui/main_menu.gd`, `settings_menu.gd` | REBUILD | `src/ui/screens/MainMenuScene.ts`, `SettingsScene.ts` |
| `tests/run_tests.gd`, `tests/test_case.gd` | DISCARD | Vitest and Playwright |
| `tests/unit/*.gd`, `tests/integration/*.gd` | REBUILD as tests | `tests/unit/*.test.ts`, `tests/integration/app.spec.ts` |
| `tools/run_tests.sh`, `tools/lint.sh` | DISCARD | `npm run test`, `npm run lint` |

No GDScript file was converted line by line. Each system was designed again for the web architecture.

Deliberate behaviour change: the Godot main menu had a **Quit** button. A browser tab cannot be closed by a game, so the web main menu has no Quit entry.

## 3. Tests and requirements still applicable

The Godot suite is kept as a specification. Its behaviours are covered by the new tests:

| Behaviour from the Godot suite | Web test |
|---|---|
| Fixed-step clock, pause, speed levels, catch-up cap, reproducibility | `tests/unit/TacticalSimulation.test.ts` |
| Camera math: zoom and pitch clamps, yaw wrap, orbit, pan direction, bounds | `tests/unit/cameraMath.test.ts`, `tests/unit/IsoCamera.test.ts` |
| Settings: defaults, clamp, unknown keys and NaN rejected, persistence, corrupt data | `tests/unit/SettingsStore.test.ts` |
| Event bus, state, scene registry, unknown ids rejected without switching | `tests/unit/EventBus.test.ts`, `tests/unit/SceneManager.test.ts` |
| Save format and versioning (new in Phase 01) | `tests/unit/SaveData.test.ts` |
| Pause stops simulation, HUD controls, menu flow, settings persistence, camera response | `tests/integration/app.spec.ts` (Playwright, real Chromium) |

QA rules kept: a test with no assertions fails; no test is disabled to pass; waits are condition-based, not frame counts; a missing capability is reported as NOT TESTED, never as passing.

## 4. Architecture decisions (from the archived ARCHITECTURE.md)

| # | Decision | Status | Reason |
|---|---|---|---|
| D1 | Project at the repository root | Kept | Root is the Vite project |
| D2 | Repository name `paybacvk` kept | Kept | Do not rename without need |
| D3 | Orthographic isometric camera | Kept | Tactical view |
| D4 | Fixed 0.1 s simulation step, independent of frame rate | Kept | Determinism and tests |
| D5 | Physical key codes, not characters | Kept | `KeyboardEvent.code` |
| D6 | No third-party addons | Kept | Only needed dependencies are added |
| D7 | UI built in code | Kept | UI is generated DOM from TypeScript |
| D8 | No `class_name`, no `preload` | Discarded | Godot-specific |

## 5. What is not carried over

- GDScript, `.tscn`, `project.godot` and the Godot runner (in history only).
- The Godot build in `/tmp/godot-build`, its sandbox workarounds and the `pkg-config` shim. These were environment tools, not project files.

## 6. Session tooling (not part of the project)

- Chromium 153 headless shell, extracted from the npm package `@sparticuz/chromium` to `/home/user/.local/share/chromium`. Used only because Playwright's browser CDN is unreachable from the sandbox. Not in the repository. Its licence is unverified and it must not be distributed.
- Runs use SwiftShader (software WebGL). Any performance figure from these runs does not represent a GPU.

## 7. Migration risks

| Risk | Mitigation |
|---|---|
| Godot documents describe a state that no longer exists | Archived under `docs/archive/`, linked from the new README |
| Software WebGL is not representative for performance | Reported as software-rendered; no GPU FPS is claimed |
| Loss of Godot tests | Behaviour mapping in §3 |
| Playwright needs a browser | `CHROMIUM_PATH` supports a local binary; Playwright's own browsers are used otherwise |

## 8. Corrections to the earlier draft of this audit

- Godot test totals: the draft said 68 tests / 215 assertions. The recorded result is 66 / 207 (`run4.log`). Corrected.
- Per-area test counts (16, 12, 7, …) were not checked against the files. Removed.
- The draft cited files that do not exist (`InputBindings.ts`, `Camera.ts`, `TacticalHud.ts`, `TestRangeScreen.ts`, `test-range.spec.ts`, `menus.spec.ts`, `scene-flow.spec.ts`). Replaced with the real paths above.
- The draft's statement about the pre-audit working tree was not re-verified in this session and has been removed.
