import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';

/* Browser tests against the local backend (scripts/local-stack): a fresh
   database with the fixture seed, the app built to talk to it. */
const PORT = 4174;
export const BASE = `http://127.0.0.1:${PORT}/`;
const ANON = execSync(
  `node -e 'import("./scripts/local-stack/keys.mjs").then(k=>console.log(k.ANON_KEY))'`,
)
  .toString()
  .trim();

export default defineConfig({
  testDir: 'tests/e2e-backend',
  timeout: 60_000,
  workers: 1,
  reporter: [['list']],
  globalSetup: './tests/e2e-backend/setup.ts',
  use: {
    baseURL: BASE,
    ...devices['Pixel 5'],
    viewport: { width: 375, height: 812 },
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command: `npx vite build --outDir dist-e2e-backend --logLevel error && npx vite preview --outDir dist-e2e-backend --port ${PORT} --strictPort --host 127.0.0.1`,
    env: {
      VITE_E2E: '1',
      YUNABI_ORIGIN: BASE,
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: ANON,
    },
    url: BASE,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
