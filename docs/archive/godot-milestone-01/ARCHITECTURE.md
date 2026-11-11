# UMBRAL DE ACERO — Architecture

Status: Milestone 01 (Phase 01, technical foundation). Engine: Godot 4.7 (tested build: 4.7.2-stable). Language: GDScript.

## 1. Project layout

```
project.godot            Engine configuration, autoloads, main scene
icon.svg                 Original application icon
src/
  core/                  Shared app-level systems (autoloads and helpers)
    event_bus.gd          Autoload EventBus: signal hub, no state
    game_state.gd         Autoload GameState: active / previous screen id
    scene_manager.gd      Autoload SceneManager: screen id -> scene path, transitions
    settings.gd           Autoload Settings: camera sensitivities, ConfigFile persistence
    input_actions.gd      InputActions: abstract action names + default bindings
  tactical/
    simulation_clock.gd   SimulationClock: fixed-step clock, pause, speed levels (pure RefCounted)
  camera/
    camera_math.gd        CameraMath: pure geometry (zoom, pitch, yaw, orbit, pan, bounds)
    tactical_camera.gd    TacticalCamera: isometric orthographic rig, reads input
  ui/
    main_menu.gd          Main menu screen
    settings_menu.gd      Settings screen
    tactical_hud.gd       Tactical HUD (CanvasLayer) for the test range
  world/
    test_range_controller.gd  Phase 01 test scenario: owns clock, camera, HUD, probe
scenes/                  .tscn entry points (thin: root node + script)
tests/
  run_tests.gd           Headless test runner (SceneTree script)
  test_case.gd           Base class with assertions
  unit/                  Pure and autoload-level tests
  integration/           Tests that spawn scenes into the live tree
tools/run_tests.sh       Runs the suite with GODOT_BIN
docs/                    Reserved for longer design notes
```

Naming: `snake_case` files, `PascalCase` script constants, `SCREAMING_SNAKE` constants, `_leading_underscore` private members. Scripts never use `class_name`: each script references its dependencies with `const X := preload("res://...")`, so the project runs headless without the editor's global class cache (see D8).

## 2. Module ownership

Each module owns its state. Other modules read it through public methods or signals and never write to another module's fields.

| Module | Owns | Writes state via | Notes |
|---|---|---|---|
| EventBus (autoload) | nothing | signals | Consumers disconnect in `_exit_tree()` |
| GameState (autoload) | active/previous screen id | `set_current_screen()` (SceneManager only) | Campaign state will be added in Phase 05 |
| SceneManager (autoload) | screen registry | `change_scene()` | Unknown ids and missing files return an Error and do not switch scenes |
| Settings (autoload) | camera sensitivity values | `set_value()`, `load_settings()`, `save_settings()` | Values clamped to 0.25–3.0 |
| InputActions (static) | action names and default bindings | `register_defaults()` (idempotent) | Gameplay uses action names only |
| SimulationClock (RefCounted) | sim time, step count, pause, speed, accumulator | `advance()`, `pause()`, `resume()`, `set_speed*()` | No scene or autoload dependencies |
| TacticalCamera (Node3D) | pivot, yaw, pitch, zoom, bounds | `pan()`, `rotate_yaw()`, `set_pitch()`, `zoom_by()`, `focus_on()`, `reset_view()` | Emits `view_changed` |
| TestRangeController (Node3D) | the clock, camera, HUD and probe instances | `toggle_pause()`, `change_speed()` | Publishes `EventBus.simulation_state_changed` |
| TacticalHud (CanvasLayer) | its own labels, buttons, message timer | none (calls controller methods) | Never mutates the clock directly |

## 3. Simulation model

- The `SimulationClock` runs in fixed steps of **0.1 simulated seconds** (`STEP_SECONDS`). Real time is converted to simulated time as `real_delta * speed`, accumulated, and converted into whole steps.
- Speed levels are discrete: `0.5, 1, 2, 4` (`SPEED_LEVELS`). Arbitrary speeds are rejected.
- Pause halts accumulation completely; resuming continues from the frozen time.
- A single `advance()` call executes at most `MAX_STEPS_PER_ADVANCE` (40) steps. Excess backlog is dropped so a hitched frame cannot cause a catch-up spiral.
- Identical delta sequences produce identical step counts and simulated time (tested by `test_identical_inputs_replay_identically`). This is the foundation for deterministic replays; seeded randomness arrives with combat in Phase 03.
- Simulation logic lives in plain classes. Scenes listen to `step_advanced` and derive their visual state from `sim_time`, so rendering never drives the simulation.

## 4. Camera

- Orthographic projection (true isometric look with a 35.264° elevation default). Zoom maps to the orthographic `size` (8–40 world units).
- Yaw is wrapped to 0–360°. Pitch is clamped to 20–70°.
- Pan is relative to the current yaw and scaled by zoom so the on-screen speed stays consistent. The pivot is clamped to `bounds`.
- The rig computes its transform with `Basis.looking_at`, which works before the node is in the tree.

## 5. Input

- All bindings are defined in `src/core/input_actions.gd`, not in `project.godot`, and use **physical** keycodes.
- Gameplay code calls `is_action_pressed()` on action names only. This keeps a future gamepad layer a change to the binding table.
- Gamepad bindings are **not** defined and **not** tested. A test guards that no joypad event is claimed until it has been verified on hardware.

## 6. Scenes and screens

- Each `.tscn` is a thin entry point: one root node with a script. UI is built in code inside `_ready()`, so layout is reviewable in diffs and testable by node name.
- `SceneManager.SCENE_PATHS` is the only screen registry. Adding a screen means adding one entry and one `.tscn`.
- Main menu → Test Range → (Esc) → Main menu; Main menu → Settings → Back → Main menu.

## 7. Testing

- `tests/run_tests.gd` discovers `test_*.gd` in `tests/unit` and `tests/integration`, runs every `test_*` method, and exits 1 on any failure.
- Tests use the real autoloads and the real scene files. Integration tests spawn scenes into the live tree and drive them through the same handlers the input system calls.
- There is no third-party test framework dependency.

## 8. Decisions and assumptions

| # | Decision | Reason |
|---|---|---|
| D1 | Godot project lives at the repository root | The repo was empty; there is no existing project root to preserve |
| D2 | Repository name `paybacvk` kept; game title is UMBRAL DE ACERO | Renaming the repository is not required for the product and would break history. Display name is in `project.godot` |
| D3 | Orthographic camera | Readable isometric tactical view, consistent scale for future grid and cover logic |
| D4 | Fixed 0.1 s simulation step | Determinism and testability; decouples simulation from frame rate |
| D5 | Physical keycodes | Layout-independent positions across keyboard layouts |
| D6 | No third-party addons | Keeps licensing clean and the test runner small |
| D7 | UI built in code | Diff-friendly and testable without editor-specific layout state |
| D8 | No `class_name`; `preload()` references | The headless template build has no editor, so it cannot generate the global class cache. Preloads also make dependencies explicit and avoid load-order problems in autoloads |

## 9. Not yet architected (planned)

Save system (Phase 05), units/navigation/combat/LOS/cover (Phase 02–03), destruction (Phase 04), campaign, economy, headquarters, audio and performance instrumentation (Phase 06). See `ROADMAP.md`.
