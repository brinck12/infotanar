import { useEffect } from 'react'
import { env } from '../config/env'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { barionPixelEnabled, syncBarionPixel } from './barionPixel'
import { consentStore, useConsent } from './consentStore'

/** A sáv azt írja le, ami a beállított mód szerint ténylegesen történik. */
const PIXEL_NOTICE = env.barionPixel.requiresConsent
  ? 'A fizetési partnerünk, a Barion csalásmegelőzési és marketing célú eszköze (Barion Pixel) csak akkor töltődik be, ha elfogadod.'
  : 'A fizetési partnerünk, a Barion a csalások megelőzéséhez használ sütiket; marketing célra csak akkor, ha elfogadod.'

/**
 * Süti-hozzájárulás (#139). Amíg a látogató nem döntött, a lap alján sáv kéri
 * a döntést; az oldal közben teljes egészében használható. A két gomb
 * egyenrangú: az elutasítás ugyanannyi kattintás, mint az elfogadás.
 *
 * A `privacyPath` kívülről jön, mert a `shared` réteg nem importálhat a jogi
 * dokumentumok nyilvántartásából.
 */
export function CookieBanner({ privacyPath }: { privacyPath: string }) {
  const consent = useConsent()

  // A Pixel a döntést követi: betöltéskor a tárolt döntést, később minden változást.
  useEffect(() => syncBarionPixel(consent), [consent])

  if (!barionPixelEnabled || consent !== null) return null

  return (
    <section aria-label="Sütik" className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:px-6" data-testid="cookie-banner">
      <div className="mx-auto max-w-account shadow-modal">
        <Banner
          kind="warn"
          title="Sütik és tárolt adatok"
          action={
            <>
              <Button variant="secondary" onClick={() => consentStore.set('rejected')}>
                Csak a szükségesek
              </Button>
              <Button variant="secondary" onClick={() => consentStore.set('granted')}>
                Elfogadom
              </Button>
            </>
          }
        >
          A belépéshez és a munkád megőrzéséhez szükséges adatokat a böngésződben tároljuk. {PIXEL_NOTICE} Részletek:{' '}
          <a href={privacyPath} target="_blank" rel="noopener noreferrer">
            Adatkezelési tájékoztató<span className="sr-only"> (új lapon nyílik)</span>
          </a>
          .
        </Banner>
      </div>
    </section>
  )
}
