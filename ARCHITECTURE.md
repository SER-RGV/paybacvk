# Architecture — UMBRAL DE ACERO (browser build)

## 1. Stack

| Concern | Choice | Why |
|---|---|---|
| Language | TypeScript 5.9, `strict`, `noUncheckedIndexedAccess` | Typed systems; no `any` in game code |
| Rendering | Three.js 0.187 (WebGL) | Mature 3D in the browser |
| Build and dev server | Vite 8 | Fast dev server, production bundle |
| Unit tests | Vitest 5 | Pure logic, no browser needed |
| Browser tests | Playwright 1.65 | Real Chromium against the production build |
| Lint | ESLint 10 + typescript-eslint 8 (strict, type-aware) | Catches unsafe code |
| UI | DOM generated from TypeScript, CSS3 | No UI framework; small and direct |

TypeScript is pinned to 5.9.x because typescript-eslint 8 requires `<6.1.0`.

Runtime dependency: `three` only. Everything else is a dev dependency.

## 2. Layers

The rule: **simulation does not know about rendering, rendering does not know about rules, UI only displays and forwards input.**

```
src/
  main.ts            entry point: finds #app, starts Game
  core/              composition and application services
    Game             composition root: builds services, scenes, loop; error panel and reload
    GameLoop         requestAnimationFrame timing, clamped delta (no game logic)
    SceneManager     scene registry; enter/update/render/exit; rejects unknown ids
    GameState        active and previous screen id
    EventBus         typed publish/subscribe, one instance per Game (no singletons)
    InputController  keyboard, mouse, wheel, gamepad → InputFrame (per frame)
    SettingsStore    settings with schema version and injectable storage
    SaveData         pure versioned save envelope and validation
    SaveRepository   save slot in storage; failures returned as values
    storage.ts       browser storage access guard
    services.ts      services handed to scenes
  engine/            Three.js wrappers, no game rules
    Renderer         WebGLRenderer, canvas, resize observer, stats, disposal
    IsoCamera        orthographic isometric camera built on cameraMath
    cameraMath       pure camera geometry
    World            ground, obstacles, lights; owns and disposes its GPU resources
  tactical/          simulation of the tactical layer
    TacticalSimulation  fixed-step clock: pause, speeds, restore; no render dependency
    patrolPath          pure path-on-loop function
    TestRangeScene      the Test Range: wires simulation, camera, world and HUD
  ui/                DOM presentation
    hud/Hud          Test Range overlay (display + callbacks)
    screens/         MainMenuScene, SettingsScene
    Notices          transient error and status messages
    dom.ts           small typed DOM helper
    styles.css
  data/              constant data and tuning (no behaviour)
    tuning.ts        simulation, camera, settings, frame and gamepad constants
    bindings.ts      logical actions and device bindings
    testRange.ts     Test Range layout
  utils/errors.ts    user-safe error text
```

Folders planned for Phases 02–07 (`characters/`, `equipment/`, `combat/`, `destruction/`, `campaign/`, `headquarters/`) are **not created yet**, to avoid empty folders.

## 3. Lifecycle and resource rules

- A scene is created by a factory on every switch and destroyed on exit. Nothing survives a switch.
- A scene owns its DOM and its `World`. `exit()` removes the DOM, disposes the world (geometries, materials, textures, shadow maps) and drops references.
- The `Renderer` lives for the whole session. Its context is released in `Game.dispose()`.
- Any error thrown in a frame stops the loop, shuts down the active scene, disposes the renderer and shows an error panel with a Reload action. Errors are never swallowed silently.
- A lost WebGL context is reported through the same error panel.
- `switchTo` from inside a scene is queued (`requestSwitch`) and applied before the next update, so a scene never renders after it has exited.

## 4. Time and determinism

- `TacticalSimulation` advances in fixed steps of 0.1 simulated seconds. Real frame time is accumulated and converted to whole steps. The remainder carries over.
- Speed levels are discrete: 0.5×, 1×, 2×, 4×.
- At most 40 steps per frame. Any excess is discarded, which avoids a catch-up spiral after a stall.
- Pause stops `advance()` from producing steps. The camera and rendering still update, so the view remains usable.
- Frame delta is clamped to 0.25 s in `GameLoop`.

## 5. Input

- `InputController` reads `KeyboardEvent.code` (physical keys), pointer and wheel events on the canvas, and the Gamepad API (polled each frame, standard mapping).
- Bindings live in `src/data/bindings.ts`. Game code only sees `Action` values.
- Keys are ignored when a text field, select or slider has focus. Space and Enter are ignored when a button has focus (the button handles them). Other game keys still work while a HUD button has focus.
- Held state is cleared on window blur, so keys cannot stick.
- Stick input has a deadzone of 0.15.
- Gamepad support is implemented but **not tested on hardware** (see TEST_REPORT.md).

## 6. Settings and save data

- Settings: three camera sensitivities, each 0.25–3.0. Stored under `umbral.settings` with `schemaVersion`. Unknown keys and non-numbers are dropped. Values are clamped. Corrupt or unknown-version data is removed and defaults are used.
- Saves: envelope `{ format: 'umbral-de-acero/save', schemaVersion, savedAt, payload }`. Migrations are a table keyed by version; it is empty because only version 1 exists. A save from a newer version is rejected with a reason.

## 7. Decisions

| # | Decision | Status |
|---|---|---|
| W1 | Browser build replaces Godot 4 entirely (directive). No Godot, GDScript or `.tscn` | Accepted |
| W2 | Orthographic isometric camera, elevation 35.264°, yaw 45° default | Accepted (carried over, D3) |
| W3 | Fixed 0.1 s simulation step, independent of frame rate | Accepted (carried over, D4) |
| W4 | Physical key codes | Accepted (carried over, D5) |
| W5 | No third-party runtime libraries beyond Three.js | Accepted (carried over, D6) |
| W6 | UI is DOM generated from TypeScript (no framework) | Accepted (carried over, D7) |
| W7 | Simulation, rendering and UI are separate layers; the simulation has no DOM or Three.js dependency | Accepted |
| W8 | Production code contains no test data; the Test Range layout is a playable sandbox in `src/data/` | Accepted |
| W9 | Playwright runs against `vite preview` (the production bundle) | Accepted |
| W10 | Browser storage holds settings and saves; no server | Accepted for Phase 01; revisit with campaign persistence |

## 8. Known technical debt

- The bundle is about 570 kB before compression, almost all Three.js. Code splitting is deferred until there are several scenes that are worth splitting.
- `npm audit` reports 10 moderate advisories in development dependencies (none in production dependencies). Triage is planned with the Phase 02 dependency review.
- Tests run on Chromium only.
