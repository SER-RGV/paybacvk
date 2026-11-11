# Development status

Status labels: **COMPLETE** · **PARTIAL** · **BLOCKED** · **NOT STARTED**. Fields: IMPLEMENTED, INTEGRATED, TESTED, NOT TESTED, BLOCKERS, TECHNICAL DEBT, NEXT PHASE, GIT.

Date of this report: 2026-11-11. Branch: `arena/37ba3921-paybacvk`.

## Phase 00 — Repository audit and migration plan

- **Status:** COMPLETE
- **IMPLEMENTED:** Audit and classification of every existing file, with corrections recorded in `docs/MIGRATION_AUDIT.md`. Design directive transcribed to `docs/DESIGN_MASTER.md`. Godot milestone documents archived under `docs/archive/godot-milestone-01/`.
- **INTEGRATED:** Yes. Documents are linked from `README.md`.
- **TESTED:** The audit's claims about the Godot test totals were checked against the recorded run (`run4.log`: 66 passed, 207 assertions). The Godot suite itself was not re-run.
- **NOT TESTED:** Reproducing the Godot build. Not needed after the migration.
- **BLOCKERS:** None.
- **TECHNICAL DEBT:** The Godot code removal is staged or committed as one step and is recoverable from `9b4eef7`. Its reversal is a single `git revert`.
- **NEXT PHASE:** Phase 01.
- **GIT:** Commits listed in the Git section below.

## Phase 01 — Technical foundation (web)

- **Status:** PARTIAL
- **IMPLEMENTED:**
  - Vite + TypeScript + Three.js project with `dev`, `build`, `test`, `lint`, `test:e2e`, `typecheck` scripts.
  - Core: Game composition root, GameLoop, SceneManager, GameState, typed EventBus, SettingsStore (versioned), SaveData and SaveRepository (versioned), InputController (keyboard, mouse, wheel, gamepad).
  - Engine: Renderer (WebGL canvas, responsive resize, disposal, context-loss handling), IsoCamera (orthographic, pan, rotate, pitch, zoom, bounds), World (ground, obstacles, lights, disposal).
  - Tactical: TacticalSimulation (fixed 0.1 s step, pause, speeds 0.5/1/2/4, catch-up cap, restore), patrol path, Test Range scene.
  - UI: main menu (Test Range, Continue saved Test Range when a save exists, Settings), Settings screen (three sliders, reset, back, saved automatically), Test Range HUD (sim time, state, speed, pause/slower/faster, save/load, main menu, camera readout, render stats, controls help), notices, loading state, fatal-error panel with reload.
- **INTEGRATED:** Yes. The production build runs in Chromium and passes the browser tests.
- **TESTED (automated, this session):**
  - Unit tests (Vitest): 75 passing across 10 files.
  - Browser tests (Playwright, Chromium 153, SwiftShader): 13 passing.
  - Type check, ESLint (strict, type-aware), production build: passing.
  - Details in `TEST_REPORT.md`.
- **Visual check (manual, by reading captured screenshots):** Main menu and Test Range at 1280×720 and 800×600 render as expected. Screenshots are in `docs/qa/screenshots/`.
- **NOT TESTED:**
  - Gamepad hardware. Mapping is implemented but not exercised on a real controller.
  - Real GPU rendering and frame timing. All runs used software WebGL.
  - Firefox and Safari. Only Chromium was tested.
  - Human play-testing and subjective UI review.
  - Long sessions (memory beyond 3 scene cycles).
  - Audio (not in scope for Phase 01).
- **BLOCKERS:** None for the automated scope. Gamepad and GPU checks need hardware that the sandbox does not have.
- **TECHNICAL DEBT:**
  - Bundle about 570 kB before compression (Three.js). No code splitting yet.
  - `npm audit`: 0 vulnerabilities in production dependencies, 10 moderate in development dependencies. Triage pending.
  - Test Range uses primitive shapes only (placeholders listed in `ASSET_MANIFEST.json`).
  - The e2e tests need `LD_LIBRARY_PATH` pointing at the extracted Chromium libraries in this sandbox. Documented in TEST_REPORT.md.
  - Save slot holds one test-range save only.
- **NEXT PHASE:** Phase 02 has **not** been started. The Phase 01 result should be reviewed (and the gamepad/GPU items checked on a real machine) before Phase 02 begins.

## Phase 02 — Tactical prototype

- **Status:** NOT STARTED
- **Scope (from ROADMAP):** four selectable soldiers, click-to-move, individual and group orders, obstacle navigation, order queue, line of sight, cover, two enemy types, state-based AI, first complete encounter.

## Phases 03–07

- **Status:** NOT STARTED (combat, destruction, persistent campaign, vertical slice, content and polish).

## Git

Branch `arena/37ba3921-paybacvk`. Base `612200337312dd4c4687673140dd93809507adae` on `main`. Earlier commits from the Godot milestone are kept as history: `788c750`, `d46b245`, `e2ee2a9`, `9b4eef7`. Migration commits are listed in `CHANGELOG.md` and in the session report.
