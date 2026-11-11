# UMBRAL DE ACERO

An original isometric tactical squad-management and persistent-campaign game. This repository is the **browser build** (HTML5, TypeScript, Three.js, Vite). The earlier Godot 4 milestone is archived under `docs/archive/godot-milestone-01/` and is not used.

**Current status:** Phase 01 (technical foundation) — see [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Requirements

- Node.js 22.12 or newer (developed with Node 22.22)
- A browser with WebGL (Chromium, Firefox, Safari)

## Getting started

```bash
npm install
npm run dev        # dev server on http://localhost:5173
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server, listens on all interfaces |
| `npm run build` | Type-check and production build into `dist/` |
| `npm run preview` | Serves the production build on port 4173 |
| `npm run typecheck` | TypeScript check only |
| `npm run test` | Unit tests (Vitest) in `tests/unit/` |
| `npm run test:e2e` | Browser tests (Playwright) in `tests/integration/` against the production build |
| `npm run lint` | ESLint (type-aware) and TypeScript check |

### Running browser tests with a local Chromium

Playwright normally downloads its own browser (`npx playwright install chromium`). If that is not possible, point the tests at an existing Chromium binary:

```bash
CHROMIUM_PATH=/path/to/chromium npm run test:e2e
```

When `CHROMIUM_PATH` is set, the tests add `--no-sandbox --no-zygote`. Only do this for a binary you trust.

## Controls

| Action | Keyboard | Mouse | Gamepad (standard mapping) |
|---|---|---|---|
| Pan | WASD / arrows | Middle-drag | Left stick |
| Rotate | Q / E | Right-drag (horizontal) | Right stick X |
| Pitch | — | Right-drag (vertical) | — |
| Zoom | + / − | Wheel | Triggers (LT out, RT in) |
| Pause / resume | Space | Pause button | Start |
| Slower / faster | [ / ] | Buttons | D-pad down / up |
| Back to menu | Esc | Menu button | B |

Camera controls keep working while the simulation is paused. Pausing stops only the simulation.

## Settings

Camera pan, rotation and zoom speed (25%–300%). Changes are saved in this browser's local storage as soon as they are made. Corrupt or incompatible settings are discarded and defaults are restored, with a notice.

## Saves

The Test Range can be saved and loaded (simulation clock, speed, pause state and camera). Saves are versioned JSON in local storage. A save from a newer version is refused, not guessed at.

## Project layout

See [ARCHITECTURE.md](ARCHITECTURE.md) for the layers and responsibilities, and [docs/MIGRATION_AUDIT.md](docs/MIGRATION_AUDIT.md) for what was kept from the Godot milestone.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) — structure and technical decisions
- [ROADMAP.md](ROADMAP.md) — phases and acceptance criteria
- [DEVELOPMENT_STATUS.md](DEVELOPMENT_STATUS.md) — per-phase status report
- [TEST_REPORT.md](TEST_REPORT.md) — test results and what was not tested
- [ART_BIBLE.md](ART_BIBLE.md) — art direction
- [ASSET_MANIFEST.json](ASSET_MANIFEST.json) — asset provenance
- [CHANGELOG.md](CHANGELOG.md) — change history
- [docs/DESIGN_MASTER.md](docs/DESIGN_MASTER.md) — design reference
- [docs/MIGRATION_AUDIT.md](docs/MIGRATION_AUDIT.md) — Phase 00 audit

## Licence and assets

The project is original work. Third-party assets require a documented commercial licence in `ASSET_MANIFEST.json` before import. Nothing from PaybackTime 2 or any other external game is used; PaybackTime 2 is a mechanical reference only.
