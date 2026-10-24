import type { APIRequestContext } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { env } from '../../../config/env'

/** Egy Google-azonossag, ahogy a mock visszaadja (a valodi userinfo mezoi). */
export interface GoogleIdentity {
  sub: string
  email: string
  email_verified: boolean
  name: string
}

/**
 * A Google-mock vezerlo kliense (src/mocks/google/server.ts): a teszt allitja be, ki "lep be a Googlen".
 * A mock egyetlen aktualis azonossagot ismer; az API projekt egy munkafolyamaton, sorban fut, ezert
 * a tesztek nem zavarjak egymast.
 */
export class GoogleStub {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl = `http://127.0.0.1:${String(env.GOOGLE_MOCK_PORT)}`
  ) {}

  /** Egyedi, ervenyes azonossag; a felulirt mezokkel kulonbozo helyzetek (nem igazolt cim, mas nev) allithatok be. */
  static identity(overrides: Partial<GoogleIdentity> = {}): GoogleIdentity {
    const id = randomUUID()
    return { sub: `pw-${id}`, email: `pw-${id}@example.test`, email_verified: true, name: 'Google Gabi', ...overrides }
  }

  /** A kovetkezo Google-belepesek ezzel az azonossaggal jonnek vissza; a beallitott azonossagot adja. */
  async signInAs(overrides: Partial<GoogleIdentity> = {}): Promise<GoogleIdentity> {
    const identity = GoogleStub.identity(overrides)
    await this.control({ identity })
    return identity
  }

  /** A kovetkezo engedelykeres megszakad, mintha a felhasznalo a "Megsem"-et nyomta volna. */
  async denyNext(): Promise<void> {
    await this.control({ deny: true })
  }

  private async control(body: object): Promise<void> {
    const response = await this.request.post(`${this.baseUrl}/__identity`, { data: body })
    if (!response.ok()) throw new Error(`A Google-mock vezerlese sikertelen (${String(response.status())})`)
  }
}
