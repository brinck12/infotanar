import { Link } from 'react-router-dom'
import { LEGAL_DOCUMENTS } from '../../features/legal/documents'
import { barionPixelEnabled } from '../../shared/consent/barionPixel'
import { consentStore } from '../../shared/consent/consentStore'

const LINK = 'inline-flex min-h-11 items-center text-15 text-ink-soft'

/**
 * A Barion hivatalos kártyaelfogadó logója (#139). A fájlt a Barion adja, és
 * nem módosítható, ezért nincs a repóban: a letöltött képet
 * `src/assets/barion-card-acceptance.(svg|png)` néven kell elhelyezni. Amíg
 * hiányzik, a lábléc logó nélkül jelenik meg, és a build figyelmeztet.
 */
const barionLogo = Object.values(
  import.meta.glob<string>('../../assets/barion-card-acceptance.{svg,png}', { eager: true, query: '?url', import: 'default' }),
)[0]

/** Az oldal lábléce (#132): minden oldalról elérhetők a jogi dokumentumok és a süti-döntés. */
export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-sheet">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-7 md:px-6">
        <p className="max-w-prose text-15 leading-relaxed text-ink-soft">A megoldásaid a szerveren, elszigetelt környezetben futnak le.</p>
        <nav aria-label="Lábléc" className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {Object.values(LEGAL_DOCUMENTS).map((legal) => (
            <Link key={legal.path} to={legal.path} className={LINK}>
              {legal.title}
            </Link>
          ))}
          {/* A döntés törlésével a süti-sáv újra megjelenik. */}
          {barionPixelEnabled && (
            <button type="button" onClick={consentStore.reset} className={`${LINK} underline underline-offset-4`}>
              Sütibeállítások
            </button>
          )}
        </nav>
        {barionLogo && <img src={barionLogo} alt="Online bankkártyás fizetés a Barion rendszerén keresztül" className="h-8 w-auto" loading="lazy" />}
      </div>
    </footer>
  )
}
