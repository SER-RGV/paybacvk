# UMBRAL DE ACERO — Test Report

Milestone: 01 (Technical foundation) · Commit under test: see DEVELOPMENT_STATUS.md §8 · Date: 2026-11-11

## 1. How to run

```bash
GODOT_BIN=/path/to/godot tools/run_tests.sh                    # full suite
GODOT_BIN=/path/to/godot tools/run_tests.sh -- --filter=clock  # subset by substring
tools/lint.sh                                                  # GDScript parse + gdlint (no engine)
```

Exit code is `0` only when every test passes. Failures are printed as `FAIL <suite>::<test>` followed by the failed assertions.

## 2. Test environment

| Item | Value |
|---|---|
| OS | Debian GNU/Linux 12 (bookworm), x86_64, sandboxed |
| CPU / RAM | 2 vCPU / ~3.9 GiB |
| Engine | Godot **4.7.2-stable**, built from the official source tarball (`codeload.github.com/godotengine/godot`, tag `4.7.2-stable`) |
| Engine build | `platform=linuxbsd target=template_debug arch=x86_64 x11=no wayland=no alsa=no pulseaudio=no speechd=no dbus=no udev=no fontconfig=no libdecor=no accesskit=no vulkan=no disable_path_overrides=no`, SCons 4.11.1 |
| Display / GPU | None. Headless dummy display and dummy renderer. **No GPU rendering was exercised.** |
| Audio | None (dummy driver). |
| Build-environment workaround | A `pkg-config` shim in `~/.local/bin` reports "not found" for every library so the build configures. No system libraries were used by the build. The Vulkan driver is excluded; headless does not use it. |
| Static checks | gdtoolkit 4.5.0 (`gdparse`, `gdlint`) |

The engine binary is kept outside the repository (`/tmp/godot-build`) and is not committed.

## 3. Results

| Check | Command | Result |
|---|---|---|
| Full test suite (run 1) | `tools/run_tests.sh` | **68 passed, 0 failed**, 215 assertions, exit 0 |
| Full test suite (runs 2 and 3) | same, repeated | **68 passed, 0 failed** each (stability check) |
| Boot of the real main scene | `godot --headless --quit-after 120` | Clean boot, no script errors, exit 0 |
| Mutation check | Removed the pause guard in `SimulationClock.advance()` | **2 tests failed** (`test_pause_stops_simulation`, `test_resume_continues_from_frozen_time`), exit 1. File restored and verified byte-identical |
| Static parse + lint | `tools/lint.sh` | Clean (0 problems) |

### Per-suite breakdown (final run)

| Suite file | Tests | Result | Covers |
|---|---|---|---|
| unit/test_simulation_clock.gd | 16 | PASS | Fixed steps, remainder carry, pause/resume, speed levels and limits, invalid input, step signals, catch-up cap, deterministic replay, time formatting |
| unit/test_camera_math.gd | 12 | PASS | Zoom and pitch clamping, zoom direction, yaw wrap, orbit geometry, ground axes, pan direction and rotation, bounds |
| unit/test_settings.gd | 7 | PASS | Defaults, clamping, unknown key and NaN rejection, save/load round trip, missing file, out-of-range file values |
| unit/test_input_actions.gd | 5 | PASS | Idempotent registration, every action bound, Space = pause, wheel = zoom, sorted unique names |
| unit/test_event_bus_and_state.gd | 3 | PASS | Declared signals, payload delivery, GameState previous/current tracking |
| unit/test_scene_registry.gd | 4 | PASS | Screen id resolution, unknown id rejection (no scene switch), every scene loads and instantiates |
| integration/test_test_range.gd | 15 | PASS | Clock runs and pauses, probe frozen while paused, Space routes to clock and HUD, speed keys and limit feedback, HUD buttons, HUD time label, camera zoom/clamp/pan bounds/orbit/pitch, HUD unsubscribes on free, no gamepad bindings claimed |
| integration/test_menu_flow.gd | 4 | PASS | Menu buttons wired, exactly three entries, settings slider writes setting and label, reset restores defaults |
| integration/test_scene_flow.gd | 2 | PASS | Real transitions: menu → test range → menu, menu → settings |

Total: **68**. Assertions: **215**.

### Expected log noise

Some negative tests trigger `push_error` on purpose: unknown screen id, unknown settings key, NaN setting value. The first run also prints `Could not load global script cache`. This is expected because the project uses no `class_name` globals (see DEVELOPMENT_STATUS.md §4, D8). None of these lines are failures.

## 4. Bugs found and fixed during testing

| # | Found by | Problem | Fix |
|---|---|---|---|
| B1 | Test run | Settings screen called `String(label)`, a non-existent constructor, so value labels were blank | Read the `Label.text` property |
| B2 | Test run | Two clock tests assumed six headless frames would accumulate ≥ 0.1 s; headless frame deltas vary, so they were timing-dependent | Wait on the condition (`wait_for_condition`, bounded to 600 frames) |
| B3 | Test run | Test runner started before the root window was in the scene tree, so every integration test spawned into a null tree | Defer the run (`call_deferred`) |
| B4 | Test run | A test with zero assertions was reported PASS | Runner now fails tests that make no assertions |
| B5 | Engine build | Global class cache could not be generated: the template binary has no editor, so `--import` is unavailable | Removed all `class_name` globals; scripts reference each other with `preload()` paths |
| B6 | Lint | Definition-order rule (constants after variables) | Reordered |

## 5. Not tested (and why)

| Area | Status | Reason |
|---|---|---|
| Visual rendering (camera framing, HUD layout, colours, shadows) | **BLOCKED** | No display or GPU in the sandbox. Headless runs use the dummy renderer. |
| Manual play-through with keyboard and mouse | **BLOCKED** | Requires an interactive display. Input is verified through the same action handlers, not through OS event injection. |
| Real mouse wheel and middle-drag hardware events | **BLOCKED** | Not injectable headless. Mapping is verified through the InputMap (`test_zoom_wheel_is_bound`). |
| Gamepad | **BLOCKED / not claimed** | No controller, and no gamepad bindings exist yet. A test forbids claiming joypad bindings until verified. |
| Audio | **BLOCKED** | No audio device. No audio exists yet. |
| Performance (FPS, frame time, GPU time, memory) | **NOT MEASURED** | Headless builds with a dummy renderer produce no meaningful frame or GPU numbers. No performance claim is made. |
| Editor import of the project in the official Godot editor | **NOT TESTED** | Only the template binary was built. The project has no `class_name` dependency, so it should import cleanly, but this was not run in an editor. |
| Export to Windows/Steam | **NOT STARTED** | Out of scope for this milestone. |
| Save/load | **NOT STARTED** | Phase 05. |

## 6. Coverage gaps (known)

- Tests verify behaviour through public APIs and action handlers. They do not verify on-screen pixel output.
- `Settings.save_settings()` writes to `user://` in the sandbox. The test restores the defaults and removes its temporary file.
- The HUD message timer is not tested for its fade-out timing (it clears the text after 2.5 s).
