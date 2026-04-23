import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4200',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Starts `npm start` from the repo root if the stack is not already running.
  // If it is already running (reuseExistingServer: true), it is reused as-is.
  // Waits up to 2 min for localhost:4200 to respond before failing.
  webServer: {
    command: 'npm start',
    cwd: ROOT,
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
