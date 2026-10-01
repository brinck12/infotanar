const huf = new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 })

export function formatHuf(amount: number): string {
  return huf.format(amount)
}

/** Kliensoldali előszűrés; a végső ellenőrzés (ellenőrzőszámmal) a backendé. */
export const POSTAL_CODE_PATTERN = '[1-9][0-9]{3}'

export function formatDate(iso: string | null | undefined): string {
  return iso ? new Date(iso).toLocaleDateString('hu-HU') : '–'
}

/** „…-ig” toldalékkal: a dátum záró pontja elmarad (2026. 10. 08-ig). */
export function untilDate(iso: string | null | undefined): string {
  return `${formatDate(iso).replace(/\.$/, '')}-ig`
}
