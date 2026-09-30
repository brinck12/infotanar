const huf = new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 })

export function formatHuf(amount: number): string {
  return huf.format(amount)
}

/** Kliensoldali előszűrés; a végső ellenőrzés (ellenőrzőszámmal) a backendé. */
export const POSTAL_CODE_PATTERN = '[1-9][0-9]{3}'
