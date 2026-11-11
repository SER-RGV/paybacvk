# UMBRAL DE ACERO — Art Bible

Status: draft. Describes rules that apply to all visual work from Phase 02 onward. The Phase 01 test range uses only primitive shapes and flat materials, so it establishes scale and palette, not final art.

## 1. Direction

Realistic military science fiction set in a fragmented industrial territory. Credible equipment, functional uniforms, believable materials, readable combat. No pixel art, no retro imitation, no decorative futurism. Every shape should suggest a function.

## 2. Camera and scale

- Isometric orthographic camera, elevation 35.264°, yaw 45° default (browser build, Three.js `OrthographicCamera`).
- Scale: **1 world unit = 1 metre**. Standing infantry ≈ 1.8 m tall; doorway ≈ 2.1 m high, 0.9 m wide.
- Ground grid cell: 1 m for navigation and cover placement (to be implemented in Phase 02).

## 3. Palette

| Role | Hex | Use |
|---|---|---|
| Ground, concrete | `#464A47` / `#6B6B66` | Terrain, walls |
| Background | `#171A1C` | Empty space, menus |
| Accent (warnings, titles) | `#D9A441` | Titles, selection, alerts |
| Friendly / running | `#8CCC8C` | Running state, friendly markers (later) |
| Hostile / paused | `#ED7359` | Paused state, hostile markers (later) |
| Text primary / muted | `#E0E6EB` / `#99A3AD` | HUD text and help text |

Colour is never the only signal: states are also written as text.

## 4. Materials

Use physically plausible roughness values. Concrete ≈ 0.9, steel ≈ 0.4–0.6, glass 0.1 (later). Keep albedo within real-world reflectance ranges (no pure black or pure white).

## 5. Lighting

One directional key light with shadows, colour ambient fill. Lighting must keep tactical cover readable: cover edges should not vanish into shadow.

## 6. Naming conventions

| Asset type | Pattern | Example |
|---|---|---|
| Code module | `PascalCase.ts` for classes, `camelCase.ts` for pure functions | `TacticalSimulation.ts`, `cameraMath.ts` |
| Test | `<Module>.test.ts` (unit), `<area>.spec.ts` (browser) | `IsoCamera.test.ts`, `app.spec.ts` |
| Model (glTF) | `msh_<category>_<name>_<variant>.glb` | `msh_env_concrete_block_a.glb` |
| Material (exported) | `mat_<category>_<name>.json` | `mat_env_concrete_rough.json` |
| Texture | `tex_<category>_<name>_<map>.png` (or `.webp`) | `tex_env_concrete_01_albedo.png` |
| Audio | `sfx_<category>_<name>.ogg` | `sfx_weapon_rifle_fire_01.ogg` |
| UI icon | `icn_<name>_<size>.svg` | `icn_pause_24.svg` |

Categories: `env`, `char`, `wpn`, `vfx`, `ui`, `sfx`, `mus`, `amb`.

## 7. Asset requirements

Every asset is registered in `ASSET_MANIFEST.json` with: unique id, category, source (original / commissioned / licensed), licence, specification (dimensions, polycount, texture resolution) and integration status.

Permitted sources: original work by the team, or third-party assets with a documented commercial licence. Nothing is used from PaybackTime 2 or any other external game.

## 8. Current state

Phase 01 uses primitive meshes created in code (boxes, a ground plane, a cylinder marker). They are placeholders and are listed in `ASSET_MANIFEST.json` with `placeholder: true`. They are replaced with final-quality models in Phase 06.
