# Test report

Status of this report: Phase 01 (web). Only results produced in the sessions listed below are reported. Anything not run is listed under NOT TESTED.

## 1. Environment

| Item | Value |
|---|---|
| Date | 2026-11-11 |
| OS / CPU | Linux sandbox, 2 CPUs, about 4 GB RAM |
| Node | 22.22 |
| Browser | Chromium 153.0.8010.0 (headless shell build, run with `--headless`), SwiftShader software WebGL |
| Browser source | Extracted from npm package `@sparticuz/chromium`; Playwright's CDN is unreachable from the sandbox |
| Playwright | 1.65.0 with `CHROMIUM_PATH` |

**Rendering caveat:** all browser runs used software WebGL. Frame rates are not GPU measurements.

## 2. Commands and results

| Command | Result |
|---|---|
| `npm install` | Pass (141 packages). `npm audit --omit=dev`: 0 vulnerabilities |
| `npm run typecheck` (via build and lint) | Pass |
| `npm run lint` | Pass (ESLint strict, type-aware, zero problems) |
| `npm run test` | **Pass: 75 tests in 10 files** (TacticalSimulation 15, SettingsStore 12, IsoCamera 10, SceneManager 8, cameraMath 7, SaveData 6, EventBus 5, patrolPath 5, GameLoop 4, InputController 3) |
| `npm run build` | Pass. `dist/` 0.68 kB HTML, 3.9 kB CSS, 569 kB JS (143 kB gzip) |
| `CHROMIUM_PATH=… npx playwright test` | **Pass: 13 tests** (see §3). Final run: 13 passed |

Failures during development, and how they were fixed (not hidden):
- ESLint `strictTypeChecked` found issues in several files; fixed in code. The void-expression style rule was turned off on purpose (documented in `eslint.config.js`).
- A unit test combined zoom values incorrectly. Test bug, fixed.
- A GameLoop test checked a stale fake callback. Test bug, fixed (it now counts frame requests).
- The HUD clock only refreshed on state changes. App bug, fixed (refresh every frame, skip unchanged DOM writes).
- Camera keys stopped working after clicking a HUD button. App bug, fixed (only Space and Enter are left to the focused button).
- The settings reload test failed because the test cleared storage on every navigation. Test bug, fixed (clear once per test).

## 3. Browser tests (Playwright)

| # | Test | What is verified | Result |
|---|---|---|---|
| 1 | starts, shows main menu, no page errors | Heading, canvas present, no console or page errors | Pass |
| 2 | renders test range, sim advances | Scene enters, sim time > 1 s, stats readout | Pass |
| 3 | pause really stops, resume restarts | Sim time identical after 1.5 s paused; advances after resume | Pass |
| 4 | Space toggles pause, no double toggle | Space pauses and resumes once | Pass |
| 5 | speed buttons | 1x → 2x → 4x, clamped at 4x, down to 0.5x | Pass |
| 6 | higher speed advances faster | Delta at 0.5x vs 4x over 1 s | Pass |
| 7 | keyboard rotate and wheel zoom | Camera readout changes after Q/E hold and wheel | Pass |
| 8 | camera responds while paused | Rotation changes readout while status stays PAUSED | Pass |
| 9 | save and load | Clock and speed restored; state restored as PAUSED | Pass |
| 10 | settings persist across reload | Value saved, survives reload, reset to 1 | Pass |
| 11 | corrupt settings | Defaults restored with an alert notice | Pass |
| 12 | scene cycles release resources | Geometry count unchanged after 3 test-range → menu cycles | Pass |
| 13 | canvas follows window size | Canvas width > 1200 at 1280 wide, ≤ 800 and ≤ 600 after resize | Pass |

Screenshots (visual check): `docs/qa/screenshots/main-menu.png`, `test-range.png`, `test-range-800x600.png`.

Playwright artefacts (traces, failure contexts) go to `reports/`, which is ignored by Git.

## 4. Running in this sandbox

The extracted Chromium needs its bundled libraries on the loader path:

```bash
LD_LIBRARY_PATH=/home/user/.local/share/chromium/lib:/home/user/.local/share/chromium \
CHROMIUM_PATH=/home/user/.local/share/chromium/chromium \
npx playwright test
```

The sandbox runs Chromium without its setuid sandbox (`--no-sandbox`), which is applied only when `CHROMIUM_PATH` is set.

## 5. NOT TESTED (explicitly)

- **Gamepad hardware:** the Gamepad API mapping, deadzone and button edges are implemented but no controller was connected. Not claimed as working.
- **Real GPU rendering, frame timing and shadows on real hardware.**
- **Other browsers:** Firefox, Safari, mobile browsers.
- **Human playtest and subjective usability.**
- **Multiplayer and external services:** not in scope; none exist.
- **Audio:** not in scope for Phase 01.
- **Long-running memory behaviour** beyond three scene cycles.
- **Reduced-motion and high-contrast preferences:** CSS includes a reduced-motion rule, but it was not checked in a browser.

## 6. Godot milestone (archived history)

The Godot milestone reported 66 passing headless tests with 207 assertions (`/tmp/godot-build/run4.log`). Those results were for the old engine and are not counted toward the web build. The Godot test files were removed from the tree; the earlier report is in `docs/archive/godot-milestone-01/TEST_REPORT.md`.
