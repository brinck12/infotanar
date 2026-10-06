import path from 'node:path'
import dotenv from 'dotenv'
import { z } from 'zod'

/**
 * Tipusos, validalt kornyezeti konfiguracio a teljes tesztkeretrendszerhez.
 *
 * Betoltesi sorrend (a korabbi nyer):
 *   1. a folyamat valodi kornyezeti valtozoi (pl. CI secretek)
 *   2. config/environments/<TEST_ENV>.local.env  (gitignore-olt, szemelyes felulirasok)
 *   3. config/environments/<TEST_ENV>.env        (verziokezelt, titokmentes alapertekek)
 *
 * A TEST_ENV alapertelmezese CI-ban "ci", egyebkent "local".
 */

const STAGES = ['local', 'ci', 'staging'] as const
export type Stage = (typeof STAGES)[number]

const stage = z
  .enum(STAGES)
  .parse(process.env.TEST_ENV ?? (process.env.CI ? 'ci' : 'local'))

const envDir = path.join(__dirname, 'environments')
// A dotenv nem irja felul a mar beallitott valtozokat, ezert eloszor a
// specifikusabb (.local) fajlt toltjuk be.
dotenv.config({ path: path.join(envDir, `${stage}.local.env`), quiet: true })
dotenv.config({ path: path.join(envDir, `${stage}.env`), quiet: true })

const booleanFromString = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1')

/** A relativ utvonalak (pl. `tasks`) csak zaro perjellel oldodnak fel az /api/v1 ala. */
const urlWithTrailingSlash = z.url().transform((url) => (url.endsWith('/') ? url : `${url}/`))

const EnvSchema = z.object({
  TEST_ENV: z.enum(STAGES),
  CI: booleanFromString.default(false),

  /** A kiszolgalt frontend cime (E2E). */
  BASE_URL: z.url(),
  /** A backend API gyokere, pl. http://127.0.0.1:8000/api/v1/ (API tesztek). */
  API_BASE_URL: urlWithTrailingSlash,

  /**
   * Inditsa-e a Playwright a helyi szervereket (frontend preview, backend,
   * Judge0 mock). Tavoli stage eseten (staging) false.
   */
  START_WEB_SERVERS: booleanFromString,
  JUDGE0_MOCK_PORT: z.coerce.number().int().positive().default(2358),

  /**
   * A helyben inditott teszt-backend adatbazisa. Megadas nelkul eldobhato
   * sqlite fajl; megadva MySQL, pl. mysql://root:root@127.0.0.1:3306/infotanar_test
   * (az adatbazis nevenek `_test`-re kell vegzodnie, kulonben a backend elutasitja).
   */
  API_DATABASE_URL: z.url({ protocol: /^mysql$/ }).optional(),

  /**
   * Honnan toltodjon a Monaco szerkeszto: "local" = a frontend
   * node_modules-abol route interceptionnel (hermetikus, CDN nelkul),
   * "cdn" = ahogy az eles app is, a jsDelivr-rol.
   */
  MONACO_SOURCE: z.enum(['local', 'cdn']).default('local'),
})

export type Env = z.infer<typeof EnvSchema>

function loadEnv(): Env {
  const result = EnvSchema.safeParse({ ...process.env, TEST_ENV: stage, CI: process.env.CI ? 'true' : 'false' })
  if (!result.success) {
    throw new Error(`Ervenytelen teszt-konfiguracio (TEST_ENV=${stage}):\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

export const env: Env = Object.freeze(loadEnv())
