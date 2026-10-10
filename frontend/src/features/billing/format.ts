// A magyar területi beállítás a négyjegyű számot nem tagolja; az árakat mindig tagoljuk (2 990 Ft).
const huf = new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0, useGrouping: 'always' })
const longDate = new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long', day: 'numeric' })

/** `2 990 Ft`, nem törő szóközzel. */
export function formatHuf(amount: number): string {
  return huf.format(amount)
}

/** Kliensoldali előszűrés; a végső ellenőrzés (ellenőrzőszámmal) a backendé. */
export const POSTAL_CODE_PATTERN = '[1-9][0-9]{3}'

/** `2026. október 9.` */
export function formatDate(iso: string | null | undefined): string {
  return iso ? longDate.format(new Date(iso)) : '–'
}

/** „…-ig” toldalékkal: a dátum záró pontja elmarad (2026. október 9-ig). */
export function untilDate(iso: string | null | undefined): string {
  return `${formatDate(iso).replace(/\.$/, '')}-ig`
}

/** Hátralévő egész napok száma a megadott időpontig (legalább 0). */
export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}
