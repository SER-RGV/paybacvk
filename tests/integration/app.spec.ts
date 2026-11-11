import { expect, test, type Page } from '@playwright/test';

/**
 * Browser tests against the production build (vite preview).
 * Each test starts from a clean localStorage. Assertions read the DOM the player sees.
 * Gamepad hardware, GPU-specific performance and multiplayer are NOT covered here.
 */

const SETTINGS_KEY = 'umbral.settings';

async function openTestRange(page: Page): Promise<void> {
  await page.getByTestId('menu-test-range').click();
  await expect(page.getByTestId('sim-time')).toBeVisible();
}

async function simSeconds(page: Page): Promise<number> {
  const text = (await page.getByTestId('sim-time').textContent()) ?? '';
  const match = /^(\d{2}):(\d{2})\.(\d)$/.exec(text.trim());
  if (!match) {
    throw new Error(`Unexpected sim time text: "${text}"`);
  }
  return Number(match[1]) * 60 + Number(match[2]) + Number(match[3]) / 10;
}

function geometriesFrom(text: string): number {
  const match = /geometries (\d+)/.exec(text);
  if (!match?.[1]) {
    throw new Error(`No geometry count in "${text}"`);
  }
  return Number(match[1]);
}

test.beforeEach(async ({ page }) => {
  // Clear storage once per test. The guard keeps data across reloads within the same test.
  await page.addInitScript(() => {
    if (!window.sessionStorage.getItem('e2e-storage-initialised')) {
      window.localStorage.clear();
      window.sessionStorage.setItem('e2e-storage-initialised', '1');
    }
  });
});

test('starts, shows the main menu and reports no page errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'UMBRAL DE ACERO' })).toBeVisible();
  await expect(page.getByTestId('game-canvas')).toHaveCount(1);
  await page.screenshot({ path: 'docs/qa/screenshots/main-menu.png' });
  expect(errors).toEqual([]);
});

test('renders the test range and the simulation advances while running', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  await expect(page.getByTestId('sim-status')).toHaveText('RUNNING');
  await expect.poll(() => simSeconds(page), { timeout: 10_000 }).toBeGreaterThan(1);
  await expect(page.getByTestId('stats-readout')).toContainText('draw calls');
  await page.screenshot({ path: 'docs/qa/screenshots/test-range.png' });
});

test('pause really stops the simulation and resume restarts it', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  await expect.poll(() => simSeconds(page), { timeout: 10_000 }).toBeGreaterThan(0.5);
  await page.getByTestId('btn-pause').click();
  await expect(page.getByTestId('sim-status')).toHaveText('PAUSED');
  const frozen = await simSeconds(page);
  await page.waitForTimeout(1500);
  expect(await simSeconds(page)).toBe(frozen);
  await page.getByTestId('btn-pause').click();
  await expect(page.getByTestId('sim-status')).toHaveText('RUNNING');
  await expect.poll(() => simSeconds(page), { timeout: 10_000 }).toBeGreaterThan(frozen);
});

test('Space toggles pause from the keyboard without double-toggling a focused button', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Space');
  await expect(page.getByTestId('sim-status')).toHaveText('PAUSED');
  await page.keyboard.press('Space');
  await expect(page.getByTestId('sim-status')).toHaveText('RUNNING');
});

test('speed buttons change the simulation speed within the allowed levels', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  await expect(page.getByTestId('sim-speed')).toContainText('1x');
  await page.getByTestId('btn-faster').click();
  await expect(page.getByTestId('sim-speed')).toContainText('2x');
  await page.getByTestId('btn-faster').click();
  await expect(page.getByTestId('sim-speed')).toContainText('4x');
  await page.getByTestId('btn-faster').click();
  await expect(page.getByTestId('sim-speed')).toContainText('4x');
  await page.getByTestId('btn-slower').click();
  await page.getByTestId('btn-slower').click();
  await page.getByTestId('btn-slower').click();
  await expect(page.getByTestId('sim-speed')).toContainText('0.5x');
});

test('higher speed advances simulated time faster', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  await page.getByTestId('btn-slower').click();
  await page.getByTestId('btn-slower').click();
  const slowStart = await simSeconds(page);
  await page.waitForTimeout(1000);
  const slowDelta = (await simSeconds(page)) - slowStart;
  await page.getByTestId('btn-faster').click();
  await page.getByTestId('btn-faster').click();
  await page.getByTestId('btn-faster').click();
  const fastStart = await simSeconds(page);
  await page.waitForTimeout(1000);
  const fastDelta = (await simSeconds(page)) - fastStart;
  expect(fastDelta).toBeGreaterThan(slowDelta * 2);
});

test('keyboard rotation and mouse wheel zoom change the camera readout', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  const before = (await page.getByTestId('camera-readout').textContent()) ?? '';
  await page.locator('[data-testid="game-canvas"]').hover();
  await page.keyboard.down('KeyE');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyE');
  const afterRotate = (await page.getByTestId('camera-readout').textContent()) ?? '';
  expect(afterRotate).not.toBe(before);
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(200);
  const afterZoom = (await page.getByTestId('camera-readout').textContent()) ?? '';
  expect(afterZoom).not.toBe(afterRotate);
});

test('camera keeps responding while the simulation is paused', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  await page.getByTestId('btn-pause').click();
  const before = (await page.getByTestId('camera-readout').textContent()) ?? '';
  await page.locator('[data-testid="game-canvas"]').hover();
  await page.keyboard.down('KeyQ');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyQ');
  expect((await page.getByTestId('camera-readout').textContent()) ?? '').not.toBe(before);
  await expect(page.getByTestId('sim-status')).toHaveText('PAUSED');
});

test('save and load restore the simulation clock', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  await expect.poll(() => simSeconds(page), { timeout: 10_000 }).toBeGreaterThan(2);
  await page.getByTestId('btn-pause').click();
  await page.getByTestId('btn-faster').click();
  const saved = await simSeconds(page);
  await page.getByTestId('btn-save').click();
  await expect(page.getByTestId('hud-message')).toHaveText('Test range saved.');
  await page.getByTestId('btn-menu').click();
  await expect(page.getByTestId('menu-continue')).toBeVisible();
  await page.getByTestId('menu-continue').click();
  await expect(page.getByTestId('sim-time')).toBeVisible();
  await expect(page.getByTestId('hud-message')).toHaveText('Test range loaded.');
  expect(await simSeconds(page)).toBeCloseTo(saved, 1);
  await expect(page.getByTestId('sim-status')).toHaveText('PAUSED');
  await expect(page.getByTestId('sim-speed')).toContainText('2x');
});

test('settings are saved and persist across a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('menu-settings').click();
  const slider = page.getByTestId('setting-cameraRotateSpeed');
  await slider.fill('2');
  await expect(slider).toHaveValue('2');
  const stored = await page.evaluate((key) => window.localStorage.getItem(key), SETTINGS_KEY);
  expect(stored).toContain('"cameraRotateSpeed":2');
  await page.reload();
  await page.getByTestId('menu-settings').click();
  await expect(page.getByTestId('setting-cameraRotateSpeed')).toHaveValue('2');
  await page.getByTestId('settings-reset').click();
  await expect(page.getByTestId('setting-cameraRotateSpeed')).toHaveValue('1');
});

test('corrupt stored settings are discarded with a visible notice', async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, '{broken json');
  }, SETTINGS_KEY);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'UMBRAL DE ACERO' })).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'defaults restored' })).toBeVisible();
  await page.getByTestId('menu-settings').click();
  await expect(page.getByTestId('setting-cameraRotateSpeed')).toHaveValue('1');
});

test('scene changes release GPU resources (no growth across cycles)', async ({ page }) => {
  await page.goto('/');
  await openTestRange(page);
  await expect(page.getByTestId('stats-readout')).toContainText('geometries');
  await page.waitForTimeout(400);
  const first = geometriesFrom((await page.getByTestId('stats-readout').textContent()) ?? '');
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await page.getByTestId('btn-menu').click();
    await expect(page.getByTestId('main-menu')).toBeVisible();
    await openTestRange(page);
  }
  await page.waitForTimeout(400);
  const later = geometriesFrom((await page.getByTestId('stats-readout').textContent()) ?? '');
  expect(later).toBe(first);
});

test('the canvas follows the window size', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await openTestRange(page);
  const canvas = page.getByTestId('game-canvas');
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeGreaterThan(1200);
  await page.setViewportSize({ width: 800, height: 600 });
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0, { timeout: 5000 }).toBeLessThanOrEqual(800);
  await expect.poll(async () => (await canvas.boundingBox())?.height ?? 0, { timeout: 5000 }).toBeLessThanOrEqual(600);
  await page.screenshot({ path: 'docs/qa/screenshots/test-range-800x600.png' });
});
