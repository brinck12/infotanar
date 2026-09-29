import { defineConfig, devices } from '@playwright/test'
import { env } from './config/env'
import { webServersFor } from './config/web-servers'
import type { FrameworkOptions } from './src/fixtures'

/**
 * Egyetlen Playwright konfiguracio a teljes tesztkeretrendszerhez.
 *
 * Projektek:
 *   - e2e-mocked:     bongeszos tesztek a buildelt frontend ellen, a backend
 *                     route interceptionnel mockolva (nem kell PHP/Judge0).
 *   - api:            nyers HTTP tesztek egy valodi, helyi Laravel backend
 *                     ellen, sqlite fixture adatbazissal es Judge0 mockkal.
 *   - api-rate-limit: a rate-limit teszt, amely kimeriti a kozos kvotat,
 *                     ezert az "api" projekt utan, kulon fut.
 *
 * A kornyezetet a config/env.ts adja (TEST_ENV=local|ci|staging).
 */
export default defineConfig<FrameworkOptions>({
  testDir: './specs',
  outputDir: './test-results',
  forbidOnly: env.CI,
  workers: env.CI ? 2 : undefined,
  reporter: env.CI
    ? [['github'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  expect: { timeout: 5_000 },

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'e2e-mocked',
      testDir: './specs/e2e',
      fullyParallel: true,
      retries: env.CI ? 2 : 0,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.BASE_URL,
        mockBackend: true,
      },
    },
    {
      name: 'api',
      testDir: './specs/api',
      testIgnore: /rate-limit\.spec\.ts$/,
      // Kozos, allapotos backend (sqlite, kozos rate-limit kvota): egyszerre
      // egy teszt fusson, es ne ismeteljunk, mert az ismetles is kvotat fogyaszt.
      fullyParallel: false,
      workers: 1,
      retries: 0,
      use: {
        // Kotelezo a zaro perjel: az ApiClient relativ utvonalai ez ala oldodnak fel.
        baseURL: env.API_BASE_URL,
        // Accept fejlec nelkul a Laravel validacios hiba 302-t ad JSON helyett.
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
    {
      name: 'api-rate-limit',
      testDir: './specs/api',
      testMatch: /rate-limit\.spec\.ts$/,
      dependencies: ['api'],
      workers: 1,
      retries: 0,
      use: {
        baseURL: env.API_BASE_URL,
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },
  ],

  webServer: webServersFor({
    'e2e-mocked': 'frontend',
    api: 'backend',
    'api-rate-limit': 'backend',
  }),
})
