/**
 * A build-idejű környezet egyetlen, ellenőrzött belépési pontja. Hibás
 * konfigurációnál már induláskor érthető hibát kapunk, nem egy félresikerült
 * kérésnél.
 */
function readApiUrl(): string {
  const raw: unknown = import.meta.env.VITE_API_URL
  const value = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : 'http://127.0.0.1:8000/api/v1'

  // Relatív útvonal (pl. "/api/v1") éles környezetben, ahol az nginx proxyzza az API-t.
  if (!value.startsWith('/') && !/^https?:\/\//.test(value)) {
    throw new Error(`Érvénytelen VITE_API_URL: "${value}" (http(s):// vagy / kezdetű legyen)`)
  }

  return value.replace(/\/+$/, '')
}

export const env = Object.freeze({
  apiUrl: readApiUrl(),
})
