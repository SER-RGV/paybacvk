# UMBRAL DE ACERO

Original isometric 3D tactical military strategy game with squad management and a persistent campaign.
Engine: **Godot 4.7** (GDScript). Target platform: PC / Steam (not yet released).

> Repository name `paybacvk` is historical. The product title is **UMBRAL DE ACERO**.
> PaybackTime 2 is a mechanical reference only. No code, assets, names or content are reused from it.

## Current status

**Milestone 01 — Technical foundation.** The project boots into a main menu, opens a tactical test range with an isometric camera, and supports pause/resume and speed control of a fixed-step simulation clock. Automated tests cover the simulation, camera, settings, input and scene flow.

What is **not** in the game yet: units, navigation, combat, destruction, campaign, headquarters, audio, final art. See [`ROADMAP.md`](ROADMAP.md) and [`DEVELOPMENT_STATUS.md`](DEVELOPMENT_STATUS.md).

## Run the game

1. Install **Godot 4.7** (standard or .NET-free build).
2. Open the Godot project manager → *Import* → select `project.godot` in this folder.
3. Press **F5** (Play). The main scene is `scenes/main_menu.tscn`.

## Controls (test range)

| Action | Keys |
|---|---|
| Pause / resume simulation | `Space` (or HUD button) |
| Simulation speed down / up | `[` / `]` (or HUD buttons). Levels: 0.5x, 1x, 2x, 4x |
| Pan camera | `W A S D` or arrow keys |
| Rotate camera | `Q` / `E`, or hold middle mouse and drag |
| Zoom | Mouse wheel, `+` / `-` |
| Back to main menu | `Esc` |

Settings (main menu → Settings) adjust camera pan, rotation and zoom speed. They are saved to the Godot user-data folder (`user://settings.cfg`).

## Run the tests

Requires a Godot 4.7 binary (headless is enough). No third-party addons.

```bash
GODOT_BIN=/path/to/godot tools/run_tests.sh
GODOT_BIN=/path/to/godot tools/run_tests.sh -- --filter=clock   # subset
```

Static checks (no engine needed):

```bash
pip install "gdtoolkit==4.*"
tools/lint.sh
```

Results and limits of testing are recorded in [`TEST_REPORT.md`](TEST_REPORT.md).

## Documentation

| File | Purpose |
|---|---|
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Modules, ownership, simulation model, decisions |
| [`ROADMAP.md`](ROADMAP.md) | Phases, acceptance criteria, status |
| [`DEVELOPMENT_STATUS.md`](DEVELOPMENT_STATUS.md) | Phase reports (audit, implemented, tested, blockers, git) |
| [`TEST_REPORT.md`](TEST_REPORT.md) | Test commands, results, environment, what was not tested |
| [`ART_BIBLE.md`](ART_BIBLE.md) | Art direction, palette, naming conventions |
| [`ASSET_MANIFEST.json`](ASSET_MANIFEST.json) | Asset provenance and licence registry |
| [`CHANGELOG.md`](CHANGELOG.md) | Notable changes per milestone |

## Licence

Project source is proprietary and all rights are reserved for now. No licence has been granted yet; this will be decided before any public release. Third-party assets will be listed in `ASSET_MANIFEST.json` with their licence.
