import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
export const BASE = `http://127.0.0.1:${PORT}/`;

/* Runs against a production build (CSP included) with the test handle. In a
   cloud session set CHROMIUM_PATH=/opt/pw-browsers/chromium; CI installs its own. */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: BASE,
    ...devices['Pixel 5'],
    viewport: { width: 375, height: 812 },
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    /* a separate folder: the e2e build carries the test handle and must never be deployed */
    command: `npx vite build --outDir dist-e2e --logLevel error && npx vite preview --outDir dist-e2e --port ${PORT} --strictPort --host 127.0.0.1`,
    env: { VITE_E2E: '1', YUNABI_ORIGIN: BASE },
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
