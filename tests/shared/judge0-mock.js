// Minimalis Judge0-hasonmas a Playwright API tesztekhez (tests/api).
// Csak azt a keves vegpontot valositja meg, amit a Judge0Service hasznal.
//
// Alapertelmezes szerint "echot jatszik": a stdin-t adja vissza stdout-kent,
// igy az echo-jellegu fixture teszteseteket (lasd ApiTestSeeder) mindig
// teljesitik. Ket vezerlo string a source_code-ban a hiba-agakat probalja:
//   - PW_JUDGE0_FORCE_WRONG       -> ervenyes, de rossz kimenet
//   - PW_JUDGE0_FORCE_UNAVAILABLE -> HTTP 503 (a szolgaltatas elerhetetlen)

const http = require('node:http')

const PORT = Number(process.env.JUDGE0_MOCK_PORT || 2358)

const LANGUAGES = [
  { id: 71, name: 'Python (3.8.1)' },
  { id: 51, name: 'C# (Mono 6.6.0.161)' },
]

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
    })
    req.on('end', () => {
      if (!raw) return resolve({})
      try {
        resolve(JSON.parse(raw))
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function send(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  if (req.method === 'GET' && url.pathname === '/about') {
    return send(res, 200, { version: 'playwright-mock' })
  }

  if (req.method === 'GET' && url.pathname === '/languages') {
    return send(res, 200, LANGUAGES)
  }

  if (req.method === 'POST' && url.pathname === '/submissions') {
    let body
    try {
      body = await readJsonBody(req)
    } catch {
      return send(res, 400, { error: 'invalid json' })
    }

    const sourceCode = Buffer.from(String(body.source_code ?? ''), 'base64').toString('utf8')
    const stdin = Buffer.from(String(body.stdin ?? ''), 'base64').toString('utf8')

    if (sourceCode.includes('PW_JUDGE0_FORCE_UNAVAILABLE')) {
      res.writeHead(503)
      return res.end()
    }

    if (sourceCode.includes('PW_JUDGE0_FORCE_WRONG')) {
      return send(res, 200, {
        stdout: Buffer.from('rossz\n').toString('base64'),
        stderr: null,
        compile_output: null,
        time: '0.01',
        memory: 3000,
        exit_code: 0,
        status: { id: 3, description: 'Accepted' },
      })
    }

    return send(res, 200, {
      stdout: Buffer.from(stdin).toString('base64'),
      stderr: null,
      compile_output: null,
      time: '0.01',
      memory: 3000,
      exit_code: 0,
      status: { id: 3, description: 'Accepted' },
    })
  }

  send(res, 404, { error: 'not found' })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Judge0 mock listening on http://127.0.0.1:${PORT}`)
})
