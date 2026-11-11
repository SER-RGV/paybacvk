import { defineConfig, devices } from '@playwright/test';

// Browser tests run against the production bundle (vite preview), so they exercise what ships.
// CHROMIUM_PATH may point to a local Chromium binary when Playwright's downloaded browsers are unavailable.
const chromiumPath = process.env.CHROMIUM_PATH;

export default defineConfig({
  testDir: 'tests/integration',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'reports/playwright' }]],
  outputDir: 'reports/playwright-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath: chromiumPath || undefined,
      // The sandbox's local Chromium cannot create its setuid sandbox, so it runs without one.
      // This applies only when CHROMIUM_PATH is set; Playwright's own browsers keep the sandbox.
      args: [
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
        ...(chromiumPath ? ['--no-sandbox', '--no-zygote'] : []),
      ],
    },
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
