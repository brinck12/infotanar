import { http } from '../../shared/api/client'
import { saveBlob } from '../../shared/api/download'

/** A rólam tárolt összes adat letöltése JSON fájlként (GDPR adathordozhatóság). */
export async function downloadMyData(): Promise<void> {
  const response = await http.get<Blob>('/account/export', { responseType: 'blob' })

  saveBlob(response.data, `infotanar-adataim-${new Date().toISOString().slice(0, 10)}.json`)
}

/** Visszafordíthatatlan; a szerver a jelenlegi jelszót is kéri hozzá. */
export async function deleteMyAccount(password: string): Promise<void> {
  await http.delete('/account', { data: { password } })
}
