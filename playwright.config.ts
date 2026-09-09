import { defineConfig, devices } from '@playwright/test';

const isCI = process.env['CI'] !== undefined;
const port = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: `http://localhost:${String(port)}`,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  // The browser suite runs against the production build so base-path and
  // bundling regressions surface here rather than on nn.eoin.ai.
  webServer: {
    command: `pnpm exec vite build && pnpm exec vite preview --port ${String(port)} --strictPort`,
    url: `http://localhost:${String(port)}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
