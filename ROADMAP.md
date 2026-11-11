# UMBRAL DE ACERO — Roadmap

Status key: **COMPLETE** · **PARTIAL** · **BLOCKED** · **NOT STARTED**. Details per phase in `DEVELOPMENT_STATUS.md`. Test evidence in `TEST_REPORT.md`.

Stack: HTML5 + TypeScript + Three.js + Vite. Unit tests Vitest, browser tests Playwright. No Godot.

| Phase | Goal | Acceptance criteria | Status |
|---|---|---|---|
| 00 Repository audit | Inventory, classification, migration plan | Every existing item classified; errors corrected | **COMPLETE** |
| 01 Technical foundation | Web project, core state, scenes, isometric camera, input, fixed-step simulation, pause and speeds, settings, save format, HUD, disposal | `npm install`, `npm run dev`, `build`, `test`, `lint` work; app runs in a browser; camera responds; pause stops the simulation; settings persist; automated tests and browser tests pass | **PARTIAL**: all automated criteria pass (75 unit, 13 browser). Gamepad hardware, real GPU and human playtest not done |
| 02 Tactical prototype | Four selectable soldiers, click-to-move, individual and group orders, obstacle navigation, order queue, line of sight, cover, two enemy types, basic AI, first complete encounter | A complete tactical encounter can be played in the browser | NOT STARTED |
| 03 Combat system | Weapons, damage, ammunition, reloading, accuracy, visibility, suppression, enemy AI | Combat is functional and tested | NOT STARTED |
| 04 Destruction | Four destructible materials, integrity, damage, destruction, navigation updates | Destruction changes the playable environment | NOT STARTED |
| 05 Persistent campaign | Characters, injuries, inventory, economy, HQ (armory, medical, workshop), contracts, outcomes, save/load | An operation changes the state of the next operation | NOT STARTED |
| 06 Vertical slice | Final environment, characters, animation, UI, audio, lighting, optimisation | Representative gameplay on the reference PC | NOT STARTED |
| 07 Content and polish | Full MVP content and release preparation | Vertical slice passes QA | NOT STARTED |

## MVP targets (from the directive)

1 map · 6 recruitable and 4 deployable characters · 4 enemy archetypes · 12 weapons · 8 attachments · 4 specialisations · 4 destructible materials · 3 facilities (armory, medical, workshop) · 3 operations · 3 factions (Varda Authority, Helix Consortium, Reconstruction Front).

None of the content targets exist yet.

## Phase 02 — planned breakdown (not started; wait for Phase 01 review)

1. Grid navigation over the test range; obstacle blocking; update on environment change (tested).
2. Four player units with selection (click and box select), move orders, order queue, interruption.
3. Line of sight with visibility states; fog of war for enemies.
4. Two enemy archetypes using Idle / Patrol / Detect / Engage.
5. Light and heavy cover with directional protection.
6. Basic combat hooks, so Phase 03 replaces numbers rather than architecture.
7. One scripted encounter and an end-to-end browser test.

## Open risks

- GPU performance, gamepad behaviour and non-Chromium browsers are not verified (see TEST_REPORT.md §5).
- Audio cannot be verified in this sandbox.
- Every third-party asset needs a documented commercial licence in `ASSET_MANIFEST.json` before import. The project currently uses none.
- The Chromium binary used for local browser tests is not part of the project and its licence has not been checked for redistribution.
