/**
 * Vegpont-lefedettseg (REL-10): osszeveti az API tesztek altal elert utvonalakat
 * (test-results/endpoint-hits.ndjson, az ApiClient irja) a docs/api-endpoints.md-vel,
 * es kiirja azokat az utvonalakat, amelyekre nulla talalat volt.
 *
 * Egyelore nem buktat: a kilepesi kod mindig 0. Hasznalat: `npm run test:api`,
 * majd `npm run coverage:endpoints`.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { HITS_FILE, normalizeApiPath } from '../src/support/endpointHits'

const ENDPOINTS_DOC = path.resolve(__dirname, '../../docs/api-endpoints.md')

interface Route {
  method: string
  template: string
  pattern: RegExp
}

interface Hit {
  method: string
  path: string
}

/** A docs/api-endpoints.md tablazatsorai: `| `GET|HEAD` | `/auth/me` | ... |`. */
function readRoutes(): Route[] {
  const routes: Route[] = []
  for (const line of readFileSync(ENDPOINTS_DOC, 'utf8').split(/\r?\n/)) {
    const match = /^\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/.exec(line)
    if (!match?.[1] || !match[2]) continue

    const template = normalizeApiPath(match[2])
    const pattern = new RegExp(`^${template.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{[^}]+\}/g, '[^/]+')}$`)
    for (const method of match[1].split('|')) routes.push({ method: method.trim(), template, pattern })
  }
  return routes
}

function readHits(): Hit[] {
  if (!existsSync(HITS_FILE)) return []
  return readFileSync(HITS_FILE, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as Hit)
}

const routes = readRoutes()
const hits = readHits()

if (routes.length === 0) {
  console.error(`Nem talaltam utvonalat: ${ENDPOINTS_DOC}`)
  process.exit(0)
}
if (hits.length === 0) {
  console.log(`Nincs rogzitett kerelem (${HITS_FILE}). Elobb futtasd: npm run test:api`)
  process.exit(0)
}

const counts = new Map<Route, number>(routes.map((route) => [route, 0]))
for (const hit of hits) {
  for (const route of routes) {
    if (route.method === hit.method && route.pattern.test(hit.path)) counts.set(route, (counts.get(route) ?? 0) + 1)
  }
}

const missed = routes.filter((route) => counts.get(route) === 0)
const covered = routes.length - missed.length

console.log(`Vegpont-lefedettseg: ${String(covered)} / ${String(routes.length)} (${String(Math.round((covered / routes.length) * 100))}%), ${String(hits.length)} rogzitett kerelem`)
if (missed.length > 0) {
  console.log('\nNulla talalat:')
  for (const route of missed) console.log(`  ${route.method.padEnd(7)} /${route.template}`)
}
