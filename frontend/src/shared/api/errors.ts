import { AxiosError } from 'axios'
import type { ValidationErrorResponse } from '../../types'

export function httpStatus(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined
}

/**
 * A backend hibáiból olvasható magyar üzenetet állít elő. A backend minden
 * hibára magyar `message`-et ad; ezt használjuk, ha van.
 * Validációs hibánál (422) az első mezőhibát adja vissza.
 */
export function hibaUzenet(error: unknown): string {
  if (!(error instanceof AxiosError)) {
    return 'Váratlan hiba történt.'
  }

  if (error.code === 'ECONNABORTED') {
    return 'A kérés túl sokáig tartott, próbáld újra.'
  }

  if (!error.response) {
    return 'A szerver nem elérhető. Ellenőrizd az internetkapcsolatot, és próbáld újra.'
  }

  const data = error.response.data as Partial<ValidationErrorResponse> | undefined

  if (error.response.status === 422 && data?.errors) {
    const first = Object.values(data.errors)[0]?.[0]
    if (first) return first
  }

  if (typeof data?.message === 'string' && data.message !== '') {
    return data.message
  }

  return 'Váratlan hiba történt a szerveren.'
}

/** 422-es válasznál mezőnként az első hibaüzenet, hogy a mező alatt jelenhessen meg. */
export function mezoHibak(error: unknown): Record<string, string> {
  if (!(error instanceof AxiosError) || error.response?.status !== 422) return {}
  const errors = (error.response.data as Partial<ValidationErrorResponse> | undefined)?.errors ?? {}
  return Object.fromEntries(
    Object.entries(errors).flatMap(([field, messages]) => (messages[0] ? [[field, messages[0]]] : [])),
  )
}
