/**
 * Heti ritmus (GET /progress/rhythm), a heti osszefoglalo e-mail kapcsoloja (PUT /account/notifications)
 * es a leiratkozas a level linkjerol (POST /notifications/weekly-summary/{id}/unsubscribe).
 */
import type { ApiClient, ApiResult } from '../ApiClient'
import type { DataEnvelope, MessageResponse, User } from '../types'

export interface RhythmDay {
  date: string
  active: boolean
}

/** A het hete napja, hetfotol vasarnapig (magyar ido szerint); szam es szeria szandekosan nincs. */
export interface WeeklyRhythm {
  week_start: string
  today: string
  days: RhythmDay[]
  goal_days: number | null
  goal_reached: boolean
}

export function weeklyRhythm(client: ApiClient): Promise<ApiResult<DataEnvelope<WeeklyRhythm>>> {
  return client.get('progress/rhythm')
}

/** A payload szandekosan barmi lehet (hianyzo verzio, nem logikai ertek), hogy a hibaagak is tesztelhetok legyenek. */
export function setWeeklySummary(client: ApiClient, payload: object): Promise<ApiResult<DataEnvelope<User>>> {
  return client.put('account/notifications', payload)
}

/** Bekapcsolas az ervenyes alakkal: a latott adatkezelesi tajekoztato verziojaval. */
export function enableWeeklySummary(client: ApiClient, privacyVersion = '0.1'): Promise<ApiResult<DataEnvelope<User>>> {
  return setWeeklySummary(client, { enabled: true, privacy_version: privacyVersion })
}

export function disableWeeklySummary(client: ApiClient): Promise<ApiResult<DataEnvelope<User>>> {
  return setWeeklySummary(client, { enabled: false })
}

/** A levelbeli (frontend) leiratkozo link parameterei: a felhasznalo azonositoja es az alairas. */
export interface UnsubscribeLink {
  id: string
  signature: string
}

/** Kiolvassa a leiratkozo linket a level szovegebol; hibat dob, ha nincs benne. */
export function unsubscribeLinkIn(mailText: string): UnsubscribeLink {
  const match = /\/leiratkozas\?id=(\d+)&signature=([0-9a-f]+)/.exec(mailText)
  if (!match?.[1] || !match[2]) throw new Error(`A levelben nincs leiratkozo link:\n${mailText.slice(0, 500)}`)
  return { id: match[1], signature: match[2] }
}

/** A leiratkozo vegpont hivasa a megadott azonositoval es alairassal (bejelentkezes nelkul is megy). */
export function unsubscribe(client: ApiClient, id: string, signature?: string): Promise<ApiResult<MessageResponse>> {
  const query = signature === undefined ? '' : `?signature=${signature}`
  return client.post(`notifications/weekly-summary/${id}/unsubscribe${query}`, {})
}
