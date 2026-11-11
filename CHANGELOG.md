# Changelog

All notable changes to UMBRAL DE ACERO. Format follows Keep a Changelog. Versions track milestones, not releases.

## [0.1.0] — Milestone 01 (Technical foundation) — 2026-11-11

### Added
- Godot 4.7 project at the repository root (`project.godot`, original `icon.svg`).
- Core autoloads: `EventBus` (signals), `GameState` (active screen), `SceneManager` (screen registry and transitions), `Settings` (camera sensitivities with ConfigFile persistence).
- `InputActions`: abstract action names and idempotent default bindings (physical keycodes).
- `SimulationClock`: fixed 0.1 s step simulation, pause/resume, speed levels 0.5x/1x/2x/4x, catch-up cap, deterministic replay, time formatting.
- `TacticalCamera` with `CameraMath`: isometric orthographic rig, pan, rotate, zoom, pitch and bounds clamping, middle-drag orbit.
- Test range scene with ground, placeholder concrete blocks and a simulation probe that proves the clock controls scene state.
- `TacticalHud`: simulation time, running/paused state, speed, pause/speed/menu buttons, limit feedback, control help.
- Main menu (Enter Test Range, Settings, Quit) and Settings screen (three sliders, reset, back).
- Headless test runner (`tests/run_tests.gd`) with unit and integration suites, `tools/run_tests.sh`, `tools/lint.sh`, `.gdlintrc`.
- Documentation: README, ARCHITECTURE, ROADMAP, DEVELOPMENT_STATUS, TEST_REPORT, ART_BIBLE, ASSET_MANIFEST.json.

### Changed during verification
- Scripts use `preload()` instead of `class_name` so the headless build runs without the editor's global class cache.
- Settings slider value labels read `Label.text` (fixed a blank-label bug).

### Not included (planned)
- Units, navigation, combat, line of sight, cover, destruction, AI, campaign, headquarters, audio, final art, save/load. See ROADMAP.md.
