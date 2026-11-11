# Changelog

All notable changes to UMBRAL DE ACERO. Format follows Keep a Changelog. Versions track milestones, not releases.

## [Unreleased] — Phase 01 on the web stack

### Changed
- **Engine migrated from Godot 4 to HTML5 + TypeScript + Three.js + Vite.** Godot, GDScript and `.tscn` are no longer used. Phase 01 was rebuilt in TypeScript; no file was ported line by line.
- Phase 00 audit recorded in `docs/MIGRATION_AUDIT.md` (classification of every existing item, corrected in §8).
- Design directive transcribed to `docs/DESIGN_MASTER.md`.
- Godot milestone documents moved to `docs/archive/godot-milestone-01/`.
- `icon.svg` renamed to `public/favicon.svg`.
- `.gitignore` now covers `node_modules/`, `dist/`, `coverage/` and Playwright output; Godot entries kept for old checkouts.
- ROADMAP, ART_BIBLE and ASSET_MANIFEST revised. Phase 00/01 overclaims removed.

### Added
- Project scaffold: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `index.html`.
- Core: `Game`, `GameLoop`, `SceneManager`, `GameState`, `EventBus`, `InputController`, `SettingsStore` (schema v1), `SaveData` and `SaveRepository` (schema v1).
- Engine: `Renderer` (responsive canvas, disposal, context-loss reporting), `IsoCamera` with pure `cameraMath`, `World` with resource disposal.
- Tactical: `TacticalSimulation` (fixed 0.1 s step, pause, speeds 0.5/1/2/4, catch-up cap, restore), `patrolPath`, Test Range scene.
- UI: main menu, settings screen (saved automatically), Test Range HUD with save/load, notices, loading state, fatal-error panel.
- Tests: 75 unit tests (Vitest), 13 browser tests (Playwright). See `TEST_REPORT.md`.

### Fixed during verification
- HUD simulation clock now refreshes every frame.
- Camera keys keep working after a HUD button has focus.
- Corrupt settings are discarded with a visible notice, not silently.

### Not included
- Units, navigation, combat, line of sight, cover, destruction, AI, campaign, headquarters, audio, final art. See ROADMAP.md.

## [0.1.0] — Godot Milestone 01 — 2026-11-11 (superseded)

Godot 4.7 prototype at commit `788c750`, with headless tests in `d46b245`. Superseded by the web build above. Kept as history; its files are archived or removed from the tree and can be restored from git history.
