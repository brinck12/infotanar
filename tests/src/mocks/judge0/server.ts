// Minimalis Judge0-hasonmas az API tesztekhez (specs/api). A Playwright
// webServer inditja (config/web-servers.ts), a backend JUDGE0_URL-je erre mutat.
// Csak azt a keves vegpontot valositja meg, amit a Judge0Service hasznal.
//
// Alapertelmezes szerint "echot jatszik": a stdin-t adja vissza stdout-kent,
// igy az echo-jellegu fixture teszteseteket (lasd ApiTestSeeder) mindig
// teljesitik. Ket vezerlo string a source_code-ban a hiba-agakat probalja
// (lasd JUDGE0_CONTROL a src/data/seed.ts-ben):
//   - PW_JUDGE0_FORCE_WRONG       -> ervenyes, de rossz kimenet
//   - PW_JUDGE0_FORCE_UNAVAILABLE -> HTTP 503 (a szolgaltatas elerhetetlen)
// Ures (csak szokoz) forraskodra a mock ures kimenetet ad, nem echozik.
// Ketto pedig a reszfeladatos, adatfajlos fixture feladat megoldasait jatssza
// (lasd JUDGE0_EXECUTION_CONTROL a controls.ts-ben):
//   - PW_JUDGE0_SUBTASKS          -> az 1. resz jo, a 2. resz hibas
//   - PW_JUDGE0_REQUIRE_FILE      -> az `additional_files` adatfajljabol szamol;
//                                    fajl nelkul hibas kimenet

import type { IncomingMessage, ServerResponse } from 'node:http'
import { JUDGE0_CONTROL } from '../../data/seed'
import { readJsonBody, requestUrl, send, serveMock } from '../http'
import { hasAdditionalFiles, readAdditionalFiles } from './additional-files'
import { DATA_FILE_NAME, JUDGE0_EXECUTION_CONTROL, JUDGE0_FILE_OUTPUT, SUBTASKS_PARTIAL_STDOUT, subtasksStdout } from './controls'

const PORT = Number(process.env.JUDGE0_MOCK_PORT ?? 2358)

const LANGUAGES = [
  { id: 71, name: 'Python (3.8.1)' },
  { id: 51, name: 'C# (Mono 6.6.0.161)' },
]

interface SubmissionRequest {
  source_code?: string
  stdin?: string
  /** Base64-elt zip a program adatfajljaival; fajl nelkuli feladatnal a mezo hianyzik. */
  additional_files?: string
}

const fromBase64 = (value: unknown): string => Buffer.from(typeof value === 'string' ? value : '', 'base64').toString('utf8')
const toBase64 = (value: string): string => Buffer.from(value).toString('base64')

function acceptedWithStdout(stdout: string) {
  return {
    stdout: toBase64(stdout),
    stderr: null,
    compile_output: null,
    time: '0.01',
    memory: 3000,
    exit_code: 0,
    status: { id: 3, description: 'Accepted' },
  }
}

/**
 * A reszfeladatos fixture helyes megoldasa: az adatfajl szamainak darabszama
 * es osszege. A fajlt csak a kereshez mellekelt zipbol ismerheti, ezert a
 * helyes kimenet azt bizonyitja, hogy a backend a jo fajlt a jo neven kuldte.
 */
function solveFromDataFile(additionalFiles: unknown): string {
  if (!hasAdditionalFiles(additionalFiles)) return JUDGE0_FILE_OUTPUT.noArchive

  const dataFile = readAdditionalFiles(additionalFiles).get(DATA_FILE_NAME)
  if (!dataFile) return JUDGE0_FILE_OUTPUT.noDataFile

  return subtasksStdout(dataFile.toString('utf8').split(/\s+/).filter(Boolean).map(Number))
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = requestUrl(req)

  if (req.method === 'GET' && url.pathname === '/about') {
    send(res, 200, { version: 'playwright-mock' })
    return
  }

  if (req.method === 'GET' && url.pathname === '/languages') {
    send(res, 200, LANGUAGES)
    return
  }

  if (req.method === 'POST' && url.pathname === '/submissions') {
    let body: SubmissionRequest
    try {
      body = await readJsonBody<SubmissionRequest>(req)
    } catch {
      send(res, 400, { error: 'invalid json' })
      return
    }

    const sourceCode = fromBase64(body.source_code)
    const stdin = fromBase64(body.stdin)

    if (sourceCode.includes(JUDGE0_CONTROL.forceUnavailable)) {
      res.writeHead(503)
      res.end()
      return
    }

    if (sourceCode.includes(JUDGE0_CONTROL.forceWrong)) {
      send(res, 200, acceptedWithStdout('rossz\n'))
      return
    }

    if (sourceCode.includes(JUDGE0_EXECUTION_CONTROL.subtasks)) {
      send(res, 200, acceptedWithStdout(SUBTASKS_PARTIAL_STDOUT))
      return
    }

    if (sourceCode.includes(JUDGE0_EXECUTION_CONTROL.requireFile)) {
      send(res, 200, acceptedWithStdout(solveFromDataFile(body.additional_files)))
      return
    }

    // Az ures program nem ir ki semmit (a `catalog:verify --negative` ezt probalja ki).
    send(res, 200, acceptedWithStdout(sourceCode.trim() === '' ? '' : stdin))
    return
  }

  send(res, 404, { error: 'not found' })
}

serveMock('Judge0', PORT, handle)
