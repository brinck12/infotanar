/**
 * Zart beta regisztracios kapu (LAUNCH-2): a nyilvanos mod/varolista vegpontok
 * es az admin meghivokod-kezeles. Minden fuggveny egy `ApiClient`-et kap.
 * A mod egy GLOBALIS, adatbazisban tarolt beallitas: aki atallitja, a vegen
 * allitsa vissza (`withRegistrationMode`).
 */
import type { ApiClient, ApiResult } from '../ApiClient'
import type { DataEnvelope, MessageResponse } from '../types'
import type { InviteCode, InviteCodeInput, Paginated, RegistrationMode, WaitlistEntry } from '../types/registrationGate'

export function publicRegistration(client: ApiClient): Promise<ApiResult<DataEnvelope<{ mode: RegistrationMode }>>> {
  return client.get('registration')
}

export function joinWaitlist(client: ApiClient, payload: { email?: string; note?: string }): Promise<ApiResult<MessageResponse>> {
  return client.post('waitlist', payload)
}

export function setRegistrationMode(admin: ApiClient, mode: RegistrationMode): Promise<ApiResult<DataEnvelope<{ mode: RegistrationMode }>>> {
  return admin.put('admin/registration', { mode })
}

export async function createInviteCode(admin: ApiClient, input: InviteCodeInput): Promise<InviteCode> {
  const created = await admin.post<DataEnvelope<InviteCode>>('admin/invite-codes', input)
  if (created.status !== 201) throw new Error(`A meghivokod letrehozasa sikertelen (${String(created.status)})`)

  return created.body.data
}

export function listInviteCodes(admin: ApiClient): Promise<ApiResult<Paginated<InviteCode>>> {
  return admin.get('admin/invite-codes')
}

export function disableInviteCode(admin: ApiClient, id: number): Promise<ApiResult<DataEnvelope<InviteCode>>> {
  return admin.post(`admin/invite-codes/${String(id)}/disable`, {})
}

export function listWaitlist(admin: ApiClient): Promise<ApiResult<Paginated<WaitlistEntry>>> {
  return admin.get('admin/waitlist')
}

/** Lefuttatja a torzset a megadott regisztracios modban, es utana visszaallitja a korabbit. */
export async function withRegistrationMode<T>(admin: ApiClient, mode: RegistrationMode, body: () => Promise<T>): Promise<T> {
  const before = (await admin.get<DataEnvelope<{ mode: RegistrationMode }>>('admin/registration')).body.data.mode
  await setRegistrationMode(admin, mode)
  try {
    return await body()
  } finally {
    await setRegistrationMode(admin, before)
  }
}
