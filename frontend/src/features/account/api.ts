import { http, type Envelope } from '../../shared/api/client'
import { saveBlob } from '../../shared/api/download'
import type { AuthUser } from '../../types'

interface Message {
  message: string
}

export interface ChangePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

export interface ChangeEmailPayload {
  email: string
  current_password: string
}

/** A rólam tárolt összes adat letöltése JSON fájlként (GDPR adathordozhatóság). */
export async function downloadMyData(): Promise<void> {
  const response = await http.get<Blob>('/account/export', { responseType: 'blob' })

  saveBlob(response.data, `infotanar-adataim-${new Date().toISOString().slice(0, 10)}.json`)
}

/** Visszafordíthatatlan; a szerver a jelenlegi jelszót is kéri hozzá. */
export async function deleteMyAccount(password: string): Promise<void> {
  await http.delete('/account', { data: { password } })
}

export async function updateName(name: string): Promise<AuthUser> {
  return (await http.patch<Envelope<AuthUser>>('/account/profile', { name })).data.data
}

/** A többi eszközön lévő belépések megszűnnek; ez a munkamenet megmarad. */
export async function changePassword(payload: ChangePasswordPayload): Promise<string> {
  return (await http.put<Message>('/account/password', payload)).data.message
}

/** A csere csak az új címre küldött link megnyitásával lép életbe. */
export async function requestEmailChange(payload: ChangeEmailPayload): Promise<string> {
  return (await http.post<Message>('/account/email', payload)).data.message
}

/** Az új címre küldött link aláírt paramétereit továbbítja a szervernek. */
export async function confirmEmailChange(params: URLSearchParams): Promise<string> {
  const id = encodeURIComponent(params.get('id') ?? '')
  const hash = encodeURIComponent(params.get('hash') ?? '')
  const { data } = await http.get<Message>(`/account/email/confirm/${id}/${hash}`, {
    params: { expires: params.get('expires'), signature: params.get('signature') },
  })

  return data.message
}
