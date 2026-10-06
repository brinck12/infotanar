import { Link } from 'react-router-dom'
import { LEGAL_DOCUMENTS } from '../features/legal/documents'
import { barionPixelEnabled } from '../shared/consent/barionPixel'
import { consentStore } from '../shared/consent/consentStore'

const linkClass =
  'rounded-sm py-2 text-slate-400 transition hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'

/**
 * A Barion hivatalos kártyaelfogadó logója (#139). A fájlt a Barion adja, és
 * nem módosítható, ezért nincs a repóban: a letöltött képet
 * `src/assets/barion-card-acceptance.(svg|png)` néven kell elhelyezni. Amíg
 * hiányzik, a lábléc logó nélkül jelenik meg, és a build figyelmeztet.
 */
const barionLogo = Object.values(
  import.meta.glob<string>('../assets/barion-card-acceptance.{svg,png}', { eager: true, query: '?url', import: 'default' }),
)[0]

/** Az oldal lábléce (#132): minden oldalról elérhetők a jogi dokumentumok és a süti-döntés. */
export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-4 text-sm">
        <p className="text-slate-400">© {new Date().getFullYear()} InfoTanár</p>
        <nav aria-label="Jogi információk" className="flex flex-wrap items-center gap-x-6">
          {Object.values(LEGAL_DOCUMENTS).map((legal) => (
            <Link key={legal.path} to={legal.path} className={linkClass}>
              {legal.shortTitle}
            </Link>
          ))}
          {/* A döntés törlésével a süti-sáv újra megjelenik. */}
          {barionPixelEnabled && (
            <button type="button" onClick={consentStore.reset} className={linkClass}>
              Sütibeállítások
            </button>
          )}
        </nav>
        {barionLogo && (
          <img
            src={barionLogo}
            alt="Online bankkártyás fizetés a Barion rendszerén keresztül"
            className="ml-auto h-8 w-auto"
            loading="lazy"
          />
        )}
      </div>
    </footer>
  )
}
