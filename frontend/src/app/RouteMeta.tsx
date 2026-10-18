import { useLocation } from 'react-router-dom'
import { LEGAL_DOCUMENTS } from '../features/legal/documents'
import { useDocumentMeta, type DocumentMeta } from '../shared/hooks/useDocumentMeta'

const PRIVATE_PREFIXES = ['/fiok', '/admin', '/vizsgak/', '/beadasok', '/elofizetes', '/haladas']
const AUTH_PATHS = [
  '/regisztracio',
  '/bejelentkezes',
  '/email-megerosites',
  '/elfelejtett-jelszo',
  '/jelszo-visszaallitas',
  '/email-csere',
]

/** Statikus, nyilvános oldalak. A sitemap ugyanezeket az útvonalakat sorolja fel (scripts/generate-seo.mjs). */
const PUBLIC_META: Readonly<Record<string, DocumentMeta>> = {
  '/': {
    title: '',
    description: 'Videós leckék és kódolós feladatok a digitális kultúra érettségihez: Python, C# és SQL, automatikus értékeléssel.',
  },
  '/tanulasi-ut': {
    title: 'Tanulási út',
    description: 'Programozás, adatbázis-kezelés és táblázatkezelés tanulási utakra bontva, leckékkel és gyakorlófeladatokkal.',
  },
  '/feladatok': {
    title: 'Feladatok',
    description: 'Az összes gyakorlófeladat egy helyen, a tananyag sorrendjében, böngészőben futtatható szerkesztővel és azonnali értékeléssel.',
  },
  '/vizsgak': {
    title: 'Érettségi gyakorlás',
    description: 'Teljes közép- és emelt szintű érettségi-jellegű feladatsorok, lépésenként vagy időmérővel, vizsgahelyzetben.',
  },
  '/szobeli': {
    title: 'Szóbeli felkészítő',
    description: 'A digitális kultúra szóbeli érettségi tételei: témakörök, vázlatok és gyakorló kérdések.',
  },
  '/arak': {
    title: 'Árak',
    description: 'Ingyenes leckékkel kezdhetsz; a teljes tananyaghoz havi előfizetés kell, bármikor lemondható.',
  },
  '/indulas': {
    title: 'Első lépések',
    description: 'Mondd el, mikor érettségizel és milyen szinten, és összeállítjuk a tanulási tervedet.',
  },
  [LEGAL_DOCUMENTS.terms.path]: { title: 'Általános szerződési feltételek', description: 'Az InfoTanár szolgáltatás általános szerződési feltételei.' },
  [LEGAL_DOCUMENTS.privacy.path]: { title: 'Adatkezelési tájékoztató', description: 'Milyen adatokat kezelünk, miért, és hogyan élhetsz a jogaiddal.' },
  [LEGAL_DOCUMENTS.imprint.path]: { title: 'Impresszum', description: 'A szolgáltató adatai és elérhetőségei.' },
}

/** Azok az útvonalak, amelyeknek a címét maga az oldal adja az adataiból (tanulási út, lecke, feladat, szóbeli téma). */
function isDataDriven(path: string): boolean {
  return (
    /^\/tanulasi-ut\/[^/]+/.test(path) ||
    path.startsWith('/leckek/') ||
    /^\/feladatok\/[^/]+/.test(path) ||
    /^\/szobeli\/[^/]+/.test(path)
  )
}

function metaFor(path: string): DocumentMeta | null {
  const normalized = path.length > 1 ? path.replace(/\/+$/, '') : path

  if (isDataDriven(normalized)) return null
  if (PRIVATE_PREFIXES.some((prefix) => normalized === prefix.replace(/\/$/, '') || normalized.startsWith(prefix))) {
    return { title: 'Fiók és vizsga', noindex: true }
  }
  if (AUTH_PATHS.includes(normalized)) return { title: 'Belépés és regisztráció', noindex: true }

  return PUBLIC_META[normalized] ?? { title: 'Az oldal nem található', noindex: true }
}

/** A statikus útvonalak címe és meta adata; a Routes mellé kerül, nem renderel semmit. */
export function RouteMeta() {
  const { pathname } = useLocation()
  useDocumentMeta(metaFor(pathname))
  return null
}
