// Minimalis Google-hasonmas a Google-belepes API tesztjeihez (specs/api). A Playwright
// webServer inditja (config/web-servers.ts), a backend GOOGLE_*_URL beallitasai erre mutatnak.
//
// Az "azonossagot" a teszt allitja be a vezerlo vegponton (POST /__identity), mert a valodi
// Google bongeszos bejelentkezest kerne:
//   - { identity: {...} }  a kovetkezo belepesek ezzel az azonossaggal jonnek vissza
//   - { deny: true }       a kovetkezo engedelykeres megszakad (a felhasznalo a "Megsem"-et nyomta)
// A tobbi vegpont azt utanozza, amit a backend (Laravel Socialite) hiv: /auth (engedelykeres atiranyitasa),
// /token (kodvaltas), /userinfo (profil), es /about az indulas jelzesehez.

import type { IncomingMessage, ServerResponse } from 'node:http'
import { readJsonBody, requestUrl, send, serveMock } from '../http'

const PORT = Number(process.env.GOOGLE_MOCK_PORT ?? 2359)
const ACCESS_TOKEN = 'pw-google-access-token'

interface GoogleIdentity {
  sub: string
  email: string
  email_verified: boolean
  name: string
}

const DEFAULT_IDENTITY: GoogleIdentity = { sub: 'pw-default', email: 'pw-default@example.test', email_verified: true, name: 'Teszt Elek' }

let identity: GoogleIdentity = DEFAULT_IDENTITY
let denyNext = false

async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = requestUrl(req)

  if (req.method === 'GET' && url.pathname === '/about') {
    send(res, 200, { mock: 'google' })
    return
  }

  if (req.method === 'POST' && url.pathname === '/__identity') {
    const body = await readJsonBody(req)
    if (body.deny === true) denyNext = true
    if (typeof body.identity === 'object' && body.identity !== null) identity = { ...DEFAULT_IDENTITY, ...(body.identity as Partial<GoogleIdentity>) }
    send(res, 200, { identity, denyNext })
    return
  }

  if (req.method === 'GET' && url.pathname === '/auth') {
    const redirectUri = url.searchParams.get('redirect_uri')
    if (!redirectUri) {
      send(res, 400, { error: 'redirect_uri hianyzik' })
      return
    }
    const target = new URL(redirectUri)
    const state = url.searchParams.get('state')
    if (denyNext) {
      denyNext = false
      target.searchParams.set('error', 'access_denied')
    } else {
      target.searchParams.set('code', 'pw-google-code')
    }
    if (state) target.searchParams.set('state', state)
    res.writeHead(302, { Location: target.toString() })
    res.end()
    return
  }

  if (req.method === 'POST' && url.pathname === '/token') {
    send(res, 200, { access_token: ACCESS_TOKEN, token_type: 'Bearer', expires_in: 3600 })
    return
  }

  if (req.method === 'GET' && url.pathname === '/userinfo') {
    if (req.headers.authorization !== `Bearer ${ACCESS_TOKEN}`) {
      send(res, 401, { error: 'invalid token' })
      return
    }
    send(res, 200, identity)
    return
  }

  send(res, 404, { error: 'not found' })
}

serveMock('Google', PORT, handle)
