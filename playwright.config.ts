import { defineConfig } from '@playwright/test';

const PORT = 5173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--autoplay-policy=no-user-gesture-required', '--enable-unsafe-swiftshader'],
    },
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npm run start -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
