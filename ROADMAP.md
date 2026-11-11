# UMBRAL DE ACERO — Roadmap

Status key: **COMPLETE** · **PARTIAL** · **BLOCKED** · **NOT STARTED**. Updated at the end of each phase (see `DEVELOPMENT_STATUS.md`).

| Phase | Goal | Acceptance criteria | Status |
|---|---|---|---|
| 00 Repository audit | Inventory, architecture, dependencies, assets, risks, roadmap, baseline | Audit documented; baseline test run recorded | **COMPLETE** (see DEVELOPMENT_STATUS.md §1) |
| 01 Technical foundation | Project structure, core state, scene management, camera, input, simulation clock, pause, basic UI | Open game → enter test scenario → control camera → pause/resume simulation; automated tests pass | **PARTIAL**: implemented, integrated and automated-tested (68/68). Manual play-test on a display is **BLOCKED** in this sandbox (see TEST_REPORT.md §5) |
| 02 Tactical prototype | 4 controllable units, movement, selection, orders, navigation, enemies, basic combat, cover | A complete tactical encounter can be played | NOT STARTED |
| 03 Combat system | Weapons, damage, ammunition, reloading, accuracy, visibility, suppression, enemy AI | Combat functional and testable | NOT STARTED |
| 04 Destruction | Materials, integrity, damage, destruction, navigation updates | Destruction changes the playable environment | NOT STARTED |
| 05 Persistent campaign | Characters, injuries, inventory, economy, HQ, contracts, mission outcomes, save/load | An operation changes the state of the next operation | NOT STARTED |
| 06 Vertical slice | Final-quality environment, characters, animation, UI, audio, lighting, optimization | Complete, representative gameplay experience | NOT STARTED |
| 07 Content and polish | Content expansion and commercial release preparation | Vertical slice passes QA | NOT STARTED |

## Phase 02 — planned breakdown (next)

1. Grid-based navigation mesh over the test range; obstacle baking; update on environment change (tested).
2. Four player units with selection (click and box select), move orders, order queue, interruption.
3. Line-of-sight raycasts with visibility states; fog of war for enemies.
4. Two enemy archetypes using the Idle / Patrol / Detect / Engage states only.
5. Light and heavy cover volumes with directional protection.
6. Basic combat hooks (hit resolution placeholder), so Phase 03 replaces numbers, not architecture.
7. One scripted encounter scenario and an end-to-end integration test.

## Open blockers and risks

- Real GPU rendering, frame timing on the reference PC and gamepad behaviour are not verifiable in this sandbox (headless only). See TEST_REPORT.md.
- Audio cannot be verified here (no audio device in headless mode).
- Commercial asset licensing requires a documented source for every third-party file before import. The project currently uses none.
