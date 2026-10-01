import { randomUUID } from 'node:crypto'
import type { RegisterRequest } from '../../api/types'

export const DEFAULT_PASSWORD = 'Titkos123'

/** Egyedi e-mail-cimu, ervenyes regisztracios payload. */
export function registration(overrides: Partial<RegisterRequest> = {}): RegisterRequest {
  return {
    name: 'Teszt Elek',
    email: `pw-${randomUUID()}@example.test`,
    password: DEFAULT_PASSWORD,
    password_confirmation: DEFAULT_PASSWORD,
    accept_terms: true,
    terms_version: '0.1',
    privacy_version: '0.1',
    ...overrides,
  }
}
