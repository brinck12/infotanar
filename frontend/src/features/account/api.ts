import { http } from '../../shared/api/client'
import { saveBlob } from '../../shared/api/download'

/** A felhasználóról tárolt adatok letöltése JSON-ként (GDPR 20. cikk); óránként csak néhányszor kérhető. */
export async function exportAccountData(): Promise<void> {
  const response = await http.get<Blob>('/account/export', { responseType: 'blob' })
  saveBlob(response.data, 'infotanar-adataim.json')
}

/** A fiók végleges törlése; a jelszó a megerősítés. */
export async function deleteAccount(password: string): Promise<void> {
  await http.delete('/account', { data: { password } })
}
