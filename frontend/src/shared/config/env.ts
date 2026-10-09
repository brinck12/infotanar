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

/**
 * Az írásbeli érettségi napja (ÉÉÉÉ-HH-NN) a visszaszámláláshoz. Az alapérték
 * helykitöltő: élesben a hivatalos vizsganaptár szerinti dátumot kell megadni.
 */
function readExamDate(): string {
  const raw: unknown = import.meta.env.VITE_EXAM_DATE
  const value = typeof raw === 'string' && raw.trim() !== '' ? raw.trim() : '2027-05-10'

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T08:00:00`).getTime())) {
    throw new Error(`Érvénytelen VITE_EXAM_DATE: "${value}" (ÉÉÉÉ-HH-NN formátumú legyen)`)
  }

  return value
}

export const env = Object.freeze({
  apiUrl: readApiUrl(),
  examDate: readExamDate(),
})
