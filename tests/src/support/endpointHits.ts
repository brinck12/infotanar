/**
 * Vegpont-lefedettseg (REL-10): az `ApiClient` minden kerelme ide naplozza a metodust es az
 * utvonalat. A `npm run coverage:endpoints` a naplot veti ossze a docs/api-endpoints.md-vel.
 *
 * Az utvonal a konkret (azonositokkal kitoltott) alakban megy a fajlba; a sablonra (`{user}`)
 * illesztest az osszevevo szkript vegzi. A Playwright minden futas elejen torli a
 * test-results mappat, igy a fajl mindig az utolso futast tukrozi.
 */
import { appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/** A teszt-eredmenyek (gitignore-olt) mappaja, a `tests/` gyokeretol. */
export const HITS_FILE = path.resolve(__dirname, '../../test-results/endpoint-hits.ndjson')

let prepared = false

/** Az API gyokerehez (`/api/v1/`) viszonyitott, lekerdezes nelkuli utvonal. */
export function normalizeApiPath(requestPath: string): string {
  const withoutOrigin = requestPath.replace(/^https?:\/\/[^/]+/, '')
  const withoutQuery = withoutOrigin.split(/[?#]/)[0] ?? ''
  return withoutQuery.replace(/^\/?(api\/v1\/)?/, '').replace(/\/+$/, '')
}

/** Egy kerelem rogzitese; a naplozas hibaja sosem buktathat tesztet. */
export function recordEndpointHit(method: string, requestPath: string): void {
  try {
    if (!prepared) {
      mkdirSync(path.dirname(HITS_FILE), { recursive: true })
      prepared = true
    }
    appendFileSync(HITS_FILE, `${JSON.stringify({ method: method.toUpperCase(), path: normalizeApiPath(requestPath) })}\n`)
  } catch {
    // A lefedettseg-naplo nem kritikus.
  }
}
