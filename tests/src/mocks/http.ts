// A kulso szolgaltatasokat (Judge0, Google) helyettesito mock-szerverek kozos alapja:
// JSON valasz, JSON torzs olvasasa, es a szerver inditasa a hibakezelessel egyutt.

import http, { type IncomingMessage, type ServerResponse } from 'node:http'

export function send(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) })
  res.end(payload)
}

/** A keres JSON torzse; ures torzsre `{}`. Ervenytelen JSON eseten elutasit. */
export function readJsonBody<T extends object = Record<string, unknown>>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString()
    })
    req.on('end', () => {
      try {
        resolve(raw ? (JSON.parse(raw) as T) : ({} as T))
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)))
      }
    })
    req.on('error', reject)
  })
}

export function requestUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? '/', `http://${req.headers.host ?? '127.0.0.1'}`)
}

/** Elinditja a mockot a helyi porton; a kezelo kivetelei 500-as valaszt adnak. */
export function serveMock(name: string, port: number, handle: (req: IncomingMessage, res: ServerResponse) => Promise<void>): void {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((err: unknown) => {
      console.error(err)
      send(res, 500, { error: 'mock failure' })
    })
  })

  server.listen(port, '127.0.0.1', () => {
    console.log(`${name} mock listening on http://127.0.0.1:${String(port)}`)
  })
}
