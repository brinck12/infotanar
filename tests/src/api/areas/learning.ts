/**
 * Tanulasi celok (account/preferences) es szobeli gyakorlas (oral/practice).
 *
 * A fajl gazdaja a WP7 csomag: ide kerulnek a terulet segedfuggvenyei. Mindegyik egy
 * `ApiClient`-et kap, es annak nyilvanos metodusaira epul (`get`, `post`, `put`,
 * `patch`, `delete`, `postMultipart`, `getBinary`), igy az ApiClient.ts-t nem kell
 * modositani. Minta: accounts.ts. A valaszok tipusai: ../types/learning.ts.
 */
import type { ApiClient, ApiResult } from '../ApiClient'
import type { DataEnvelope, OralPractice, OralPracticeInput, StudyPreferences } from '../types'

/** A szobeli temakorok slugjai (backend/config/learning.php `oral_topics`). */
export const ORAL_TOPICS = [
  'szovegszerkesztes',
  'grafika-es-kepszerkesztes',
  'bemutatokeszites',
  'publikalas-a-vilaghalon',
  'tablazatkezeles',
  'adatbazis-kezeles',
] as const

/** Az onertekelt szempontok (backend/config/learning.php `oral_self_criteria`). */
export const ORAL_SELF_CRITERIA = ['Logikai felépítés', 'Kifejezőkészség, szaknyelv', 'Kommunikatív készség'] as const

/** Ervenyes tanulasi celok; a felulirt mezokkel egy masik ervenyes valtozat keszitheto. */
export function studyPreferences(overrides: Partial<StudyPreferences> = {}): StudyPreferences {
  return { level: 'emelt', exam_period: '2027-10', language: 'csharp', weekly_hours: '5+', ...overrides }
}

/** Ervenyes szobeli allapot: ket kipipalt pont, jegyzet es egy pontozott szempont. */
export function oralPracticeInput(overrides: Partial<OralPracticeInput> = {}): OralPracticeInput {
  return { checked: [0, 2], notes: 'A stílusokat még át kell néznem.', scores: { [ORAL_SELF_CRITERIA[0]]: 3 }, ...overrides }
}

export function preferences(client: ApiClient): Promise<ApiResult<DataEnvelope<StudyPreferences | null>>> {
  return client.get('account/preferences')
}

/** A payload szandekosan barmi lehet, hogy a hianyzo es az ervenytelen mezok is tesztelhetok legyenek. */
export function savePreferences(client: ApiClient, payload: object): Promise<ApiResult<DataEnvelope<StudyPreferences>>> {
  return client.put('account/preferences', payload)
}

export function oralPractices(client: ApiClient): Promise<ApiResult<DataEnvelope<OralPractice[]>>> {
  return client.get('oral/practice')
}

/** A temakor es a payload szandekosan barmi lehet (ismeretlen temakor, ervenytelen mezok). */
export function saveOralPractice(client: ApiClient, topic: string, payload: object): Promise<ApiResult<DataEnvelope<OralPractice>>> {
  return client.put(`oral/practice/${topic}`, payload)
}

export function recordOralAttempt(client: ApiClient, topic: string): Promise<ApiResult<DataEnvelope<OralPractice>>> {
  return client.post(`oral/practice/${topic}/attempts`, {})
}
