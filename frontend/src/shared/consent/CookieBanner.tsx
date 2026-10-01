import { useEffect } from 'react'
import { LegalLink } from '../../features/legal/LegalLink'
import { env } from '../config/env'
import { barionPixelEnabled, syncBarionPixel } from './barionPixel'
import { consentStore, useConsent } from './consentStore'

/** A sáv azt írja le, ami a beállított mód szerint ténylegesen történik. */
const PIXEL_NOTICE = env.barionPixel.requiresConsent
  ? 'A fizetési partnerünk, a Barion csalásmegelőzési és marketing célú eszköze (Barion Pixel) csak akkor töltődik be, ha elfogadod.'
  : 'A fizetési partnerünk, a Barion a csalások megelőzéséhez használ sütiket; marketing célra csak akkor, ha elfogadod.'

const buttonClass =
  'rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'

/**
 * Süti-hozzájárulás (#139). Amíg a látogató nem döntött, a lap alján sáv kéri
 * a döntést; az oldal közben teljes egészében használható. A két gomb
 * egyenrangú: az elutasítás ugyanannyi kattintás, mint az elfogadás.
 */
export function CookieBanner() {
  const consent = useConsent()

  // A Pixel a döntést követi: betöltéskor a tárolt döntést, később minden változást.
  useEffect(() => syncBarionPixel(consent), [consent])

  if (!barionPixelEnabled || consent !== null) return null

  return (
    <section
      aria-label="Sütik"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-700 bg-slate-900 shadow-[0_-8px_24px_rgb(0_0_0/0.4)]"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
        <p className="min-w-64 flex-1 text-sm text-slate-300">
          Az oldal működéséhez szükséges adatokat a böngésződben tároljuk. {PIXEL_NOTICE} Részletek:{' '}
          <LegalLink to="privacy">Adatkezelési tájékoztató</LegalLink>.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => consentStore.set('rejected')}
            className={`${buttonClass} border border-slate-600 text-slate-100 hover:bg-slate-800`}
          >
            Csak a szükségesek
          </button>
          <button
            type="button"
            onClick={() => consentStore.set('granted')}
            className={`${buttonClass} bg-sky-700 text-white hover:bg-sky-600`}
          >
            Elfogadom
          </button>
        </div>
      </div>
    </section>
  )
}
