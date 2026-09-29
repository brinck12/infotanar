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

import http, { type IncomingMessage, type ServerResponse } from 'node:http'
import { JUDGE0_CONTROL } from '../../data/seed'

const PORT = Number(process.env.JUDGE0_MOCK_PORT ?? 2358)

const LANGUAGES = [
  { id: 71, name: 'Python (3.8.1)' },
  { id: 51, name: 'C# (Mono 6.6.0.161)' },
]

interface SubmissionRequest {
  source_code?: string
  stdin?: string
}

const fromBase64 = (value: unknown): string => Buffer.from(typeof value === 'string' ? value : '', 'base64').toString('utf8')
const toBase64 = (value: string): string => Buffer.from(value).toString('base64')

function readJsonBody(req: IncomingMessage): Promise<SubmissionRequest> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString()
    })
    req.on('end', () => {
      if (!raw) {
        resolve({})
        return
      }
      try {
        resolve(JSON.parse(raw) as SubmissionRequest)
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    })
    req.on('error', reject)
  })
}

function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

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

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`)

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
      body = await readJsonBody(req)
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

    send(res, 200, acceptedWithStdout(stdin))
    return
  }

  send(res, 404, { error: 'not found' })
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((err: unknown) => {
    console.error(err)
    send(res, 500, { error: 'mock failure' })
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Judge0 mock listening on http://127.0.0.1:${String(PORT)}`)
})
