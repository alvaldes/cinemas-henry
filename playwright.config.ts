import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing.
 * This is a skeleton; full implementation in Phase 2.
 * 
 * Usage: bun run test:e2e
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Execution settings
  fullyParallel: true,    // Run tests in parallel
  forbidOnly: !!process.env.CI,  // Fail if test.only is found in CI
  retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI
  workers: process.env.CI ? 1 : undefined,  // Single worker in CI (safer)

  // Reporting
  reporter: 'html',       // HTML report generated in playwright-report/

  // Browser configuration
  use: {
    baseURL: 'http://localhost:3000',  // Astro dev server
    trace: 'on-first-retry',  // Trace failures for debugging
  },

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Dev server integration (Phase 2: enable when ready)
  // webServer: {
  //   command: 'bun run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,  // Reuse if already running
  //   timeout: 120 * 1000,  // Wait up to 2min for server startup
  // },
});
