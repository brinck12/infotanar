/**
 * Admin attekinto (admin/overview), es azok a listak, amelyekbol az admin
 * kezdooldal a vegpont elott szamolt: a tesztek ezekhez merik a szamokat.
 *
 * A fajl gazdaja a WP9 csomag. Minden fuggveny egy `ApiClient`-et kap, es annak
 * nyilvanos metodusaira epul, igy az ApiClient.ts-t nem kell modositani.
 * A valaszok tipusai: ../types/adminOverview.ts.
 */
import type { ApiClient, ApiResult } from '../ApiClient'
import type { AdminOverview, DataEnvelope } from '../types'

/** Az admin kepzesi ag (AdminTrackResource) itt hasznalt mezoi. */
export interface AdminTrackRow {
  id: number
  slug: string
  title: string
  is_published: boolean
}

export function adminOverview(client: ApiClient): Promise<ApiResult<DataEnvelope<AdminOverview>>> {
  return client.get('admin/overview')
}

/** A GET admin/users talalatainak szama a megadott szurokkel (a lapozo `total` mezoje). */
export async function adminUserTotal(admin: ApiClient, filters: Record<string, string> = {}): Promise<number> {
  const users = await admin.get<{ total: number }>('admin/users', { per_page: '5', ...filters })
  if (users.status !== 200) throw new Error(`A felhasznalolista lekerese sikertelen (${String(users.status)})`)

  return users.body.total
}

/** A figyelmet igenylo szamlak szama (GET admin/invoices `meta.total`). */
export async function adminInvoiceAttentionTotal(admin: ApiClient): Promise<number> {
  const invoices = await admin.get<{ meta: { total: number } }>('admin/invoices')
  if (invoices.status !== 200) throw new Error(`A szamlalista lekerese sikertelen (${String(invoices.status)})`)

  return invoices.body.meta.total
}

export async function adminTracks(admin: ApiClient): Promise<AdminTrackRow[]> {
  const tracks = await admin.get<DataEnvelope<AdminTrackRow[]>>('admin/tracks')
  if (tracks.status !== 200) throw new Error(`A kepzesi agak lekerese sikertelen (${String(tracks.status)})`)

  return tracks.body.data
}

/** Uj, nem publikalt kepzesi ag egyedi sluggal. A tesztnek kell torolnie (`deleteTrack`). */
export async function createDraftTrack(admin: ApiClient, slug: string): Promise<AdminTrackRow> {
  const created = await admin.post<DataEnvelope<AdminTrackRow>>('admin/tracks', { slug, title: `PW attekinto ${slug}`, is_published: false })
  if (created.status !== 201) throw new Error(`A kepzesi ag letrehozasa sikertelen (${String(created.status)})`)

  return created.body.data
}

export function updateTrack(admin: ApiClient, trackId: number, changes: Partial<Omit<AdminTrackRow, 'id'>>): Promise<ApiResult<DataEnvelope<AdminTrackRow>>> {
  return admin.put(`admin/tracks/${String(trackId)}`, changes)
}

export function deleteTrack(admin: ApiClient, trackId: number): Promise<ApiResult<null>> {
  return admin.delete(`admin/tracks/${String(trackId)}`)
}
