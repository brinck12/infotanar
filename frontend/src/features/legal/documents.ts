/**
 * A jogi dokumentumok egyetlen nyilvántartása (#132): útvonal, cím, verzió,
 * hatálybalépés. A szöveg a `content/*.md` fájlokban van, és csak az oldal
 * megnyitásakor töltődik be.
 *
 * Szövegcsere: a megfelelő .md fájl tartalmát kell lecserélni, itt pedig a
 * verziót és a dátumot léptetni. A regisztrációkor elfogadott verzió (#133)
 * innen származik, ezért érdemi módosításnál a verzió mindig változzon.
 */
export interface LegalDocument {
  path: string
  title: string
  /** Rövid név a láblécben. */
  shortTitle: string
  version: string
  /** ISO dátum (ÉÉÉÉ-HH-NN). */
  effectiveFrom: string
  load: () => Promise<string>
}

const markdown = (loader: () => Promise<{ default: string }>) => async () => (await loader()).default

export const LEGAL_DOCUMENTS = {
  terms: {
    path: '/aszf',
    title: 'Általános Szerződési Feltételek',
    shortTitle: 'ÁSZF',
    version: '0.1',
    effectiveFrom: '2026-10-01',
    load: markdown(() => import('./content/aszf.md?raw')),
  },
  privacy: {
    path: '/adatkezeles',
    title: 'Adatkezelési tájékoztató',
    shortTitle: 'Adatkezelés',
    version: '0.1',
    effectiveFrom: '2026-10-01',
    load: markdown(() => import('./content/adatkezeles.md?raw')),
  },
  imprint: {
    path: '/impresszum',
    title: 'Impresszum',
    shortTitle: 'Impresszum',
    version: '0.1',
    effectiveFrom: '2026-10-01',
    load: markdown(() => import('./content/impresszum.md?raw')),
  },
} as const satisfies Record<string, LegalDocument>

export type LegalDocumentKey = keyof typeof LEGAL_DOCUMENTS

/** A regisztrációkor rögzítendő verziók (#133). */
export const LEGAL_VERSIONS = {
  terms: LEGAL_DOCUMENTS.terms.version,
  privacy: LEGAL_DOCUMENTS.privacy.version,
} as const

/**
 * Amíg egy dokumentum első sora ez a megjegyzés, a szöveg csak vázlat: az
 * oldal figyelmeztetést mutat, a build pedig figyelmeztet (vite.config.ts).
 * Az ügyvéd által jóváhagyott szöveg beillesztésekor a sort törölni kell.
 */
export const PLACEHOLDER_MARKER = '<!-- status: placeholder -->'
