import { useMutation } from '@tanstack/react-query'
import { hibaUzenet } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { beginGoogleLogin, GoogleStorageUnavailable } from '../social'
import { useAuthProviders } from '../useAuthProviders'

/**
 * A Google "G" jele: a márkairányelv szerint változatlan, négyszínű. A színek a Google
 * márkájának részei, nem a mi tokenjeink, ezért itt SVG-attribútumként állnak.
 */
function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4.5" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.96 10.72A5.41 5.41 0 0 1 3.68 9c0-.6.1-1.18.28-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.65 8.65 0 0 0 9 0 9 9 0 0 0 .96 4.95l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" />
    </svg>
  )
}

/**
 * „Folytatás Google-lel" a belépő és a regisztrációs oldal űrlapja alatt. Ha a szerver nem
 * kínálja a Google-belépést, semmit nem rajzol ki. A belépés és a regisztráció itt egy lépés:
 * a szerver dönti el, van-e már fiók.
 */
export function SocialLogin({ returnTo }: { returnTo?: string }) {
  const { google } = useAuthProviders()

  const start = useMutation({
    mutationFn: async () => beginGoogleLogin(returnTo),
    // Teljes oldalváltás a Google-re; a visszatérés a /belepes/google oldalra érkezik.
    onSuccess: (url) => window.location.assign(url),
  })

  if (!google) return null

  return (
    <section aria-label="Belépés Google-lel" className="flex flex-col gap-4 border-t border-grid pt-5">
      {start.isError && (
        <Banner kind="error">{start.error instanceof GoogleStorageUnavailable ? start.error.message : hibaUzenet(start.error)}</Banner>
      )}
      <Button variant="secondary" size="lg" fullWidth busy={start.isPending || start.isSuccess} busyLabel="Átirányítás a Google-hez…" onClick={() => start.mutate()}>
        <GoogleMark />
        Folytatás Google-lel
      </Button>
    </section>
  )
}
