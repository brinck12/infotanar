import { defineConfig, devices } from '@playwright/test'

/**
 * A tesztek mockolt API ellen futnak (route interception), igy nincs
 * szukseg elo backendre es Judge0-ra a CI pipeline-ban.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // A buildelt appot szolgaljuk ki: ugyanaz fut, mint ami deployolodik.
  webServer: {
    command:
      'npm --prefix ../frontend run build && npm --prefix ../frontend run preview -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
