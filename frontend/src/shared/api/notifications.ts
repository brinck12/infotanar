import { http, type Envelope } from './client'
import type { AuthUser } from '../../types'

/**
 * A heti összefoglaló e-mail be- és kikapcsolása. Bekapcsoláskor a szerver rögzíti a
 * hozzájárulást, ehhez a felhasználó által látott adatkezelési tájékoztató verzióját kéri.
 */
export async function updateWeeklySummary(enabled: boolean, privacyVersion: string): Promise<AuthUser> {
  return (await http.put<Envelope<AuthUser>>('/account/notifications', enabled ? { enabled, privacy_version: privacyVersion } : { enabled })).data.data
}

/** A levélben kapott leiratkozó link paramétereivel; bejelentkezés nélkül is működik, az aláírás védi. */
export async function unsubscribeWeeklySummary(id: string, signature: string): Promise<string> {
  const { data } = await http.post<{ message: string }>(`/notifications/weekly-summary/${encodeURIComponent(id)}/unsubscribe`, null, {
    params: { signature },
  })
  return data.message
}
