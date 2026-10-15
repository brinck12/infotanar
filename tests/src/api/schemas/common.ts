/**
 * A szerzodes-ellenorzes (REL-3) kozos elemei: zod sema-epitok es a `parse` segedfuggveny.
 *
 * A semak SZANDEKOSAN nem `strictObject`-ek: egy ujonnan megjelenő extra mezo nem
 * torheti a teszteket, de a hianyzo vagy rossz tipusu mezo igen. A frontend
 * `src/types/index.ts` es a `src/features/*\/api.ts` tipusait tukrozik, a valodi
 * backend valaszai ellen igazitva.
 */
import { z } from 'zod'

/** ISO 8601 idopont id-eltolassal, ahogy a Laravel a `toIso8601String()`-et adja (`2026-10-14T20:43:11+00:00`). */
export const isoDateTime = z.iso.datetime({ offset: true })

/** `{ data: T }` boritek (az API Resource-ok alakja). */
export const envelope = <T extends z.ZodType>(data: T) => z.object({ data })

/** Resource-gyujtemeny `paginate()`-tel: `{ data, links, meta }`. */
export const paginatedResource = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    links: z.object({ first: z.string().nullable(), last: z.string().nullable(), prev: z.string().nullable(), next: z.string().nullable() }),
    meta: z.object({ current_page: z.number().int(), last_page: z.number().int(), per_page: z.number().int(), total: z.number().int(), path: z.string() }),
  })

/** Nyers Laravel paginator (a `GET /admin/users` valasza resource nelkul). */
export const rawPaginator = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    current_page: z.number().int(),
    last_page: z.number().int(),
    per_page: z.number().int(),
    total: z.number().int(),
    from: z.number().int().nullable(),
    to: z.number().int().nullable(),
  })

/** Kurzoros lapozas (`cursorPaginate()`): `{ data, links, meta: { per_page, next_cursor, ... } }`. */
export const cursorResource = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    links: z.object({ first: z.string().nullable(), last: z.string().nullable(), prev: z.string().nullable(), next: z.string().nullable() }),
    meta: z.object({ per_page: z.number().int(), next_cursor: z.string().nullable(), prev_cursor: z.string().nullable() }),
  })

/** Hibas valasz alakja (HTTP 4xx). */
export const messageResponse = z.object({ message: z.string() })

/** Validacios hiba (422). */
export const validationError = z.object({ message: z.string(), errors: z.record(z.string(), z.array(z.string())) })

/**
 * Validalja a valasz torzset, es olvashato hibaval bukik: melyik vegpont, melyik mezo.
 * A visszaadott ertek a sema szerint tipusos.
 */
export function parseContract<S extends z.ZodType>(schema: S, body: unknown, label: string): z.infer<S> {
  const result = schema.safeParse(body)
  if (result.success) return result.data

  const issues = result.error.issues.map((issue) => `  ${issue.path.join('.') || '(gyoker)'}: ${issue.message}`).join('\n')
  throw new Error(`Szerzodes-serules: ${label}\n${issues}`)
}
