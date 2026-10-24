import { useMutation } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { CheckboxField, Field, SubmitButton } from '../../../shared/ui/Form'
import { Skeleton } from '../../../shared/ui/States'
import { LEGAL_VERSIONS } from '../../legal/documents'
import { LegalLink } from '../../legal/LegalLink'
import * as authApi from '../api'
import { AuthCard } from '../components/AuthCard'
import { useAuth } from '../context'
import { clearPendingGoogleLogin, pendingGoogleLogin } from '../social'
import { useRegistrationMode } from '../useRegistrationMode'

const DEFAULT_LANDING = '/feladatok'

const FAILED_TEXT = 'A Google-belépés nem sikerült. Próbáld újra, vagy lépj be e-mail-címmel.'
const CANCELLED_TEXT = 'A Google-belépést megszakítottad. Ha mégis szeretnéd, próbáld újra, vagy lépj be e-mail-címmel.'

/**
 * Ide érkezik vissza a böngésző a Google-ról (`/belepes/google?code=…`). A kódot a böngészőben
 * tartott titokkal váltjuk be; meglévő fióknál ezzel kész a belépés, új fióknál előbb a
 * hozzájárulást kérjük, mint a jelszavas regisztrációnál.
 */
export function GoogleCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { acceptLogin } = useAuth()
  const started = useRef(false)
  const code = params.get('code')
  const errorCode = params.get('error')
  // A tárolt adat a renderek között változatlan; egyszer olvassuk, mielőtt a belépés törölné.
  const [pending] = useState(pendingGoogleLogin)

  const landing = pending?.from ?? DEFAULT_LANDING

  const exchange = useMutation({
    mutationFn: async (): Promise<authApi.GoogleExchange> => {
      if (!code || !pending) throw new Error(FAILED_TEXT)
      return authApi.googleExchange(code, pending.verifier)
    },
    onSuccess: async (result) => {
      if (result.status !== 'signed_in') return
      clearPendingGoogleLogin()
      await acceptLogin(result)
      navigate(landing, { replace: true })
    },
  })

  // Egyszer váltjuk be: a kód sikeres belépéskor elfogy, a második próbálkozás hibát adna.
  useEffect(() => {
    if (started.current || errorCode || !code) return
    started.current = true
    exchange.mutate()
  }, [code, errorCode, exchange])

  const consent = exchange.data?.status === 'consent_required' ? exchange.data : null

  if (errorCode || !code) {
    return <Failure message={errorCode === 'cancelled' ? CANCELLED_TEXT : FAILED_TEXT} />
  }

  if (exchange.isError) {
    return <Failure message={!pending ? 'A belépés lejárt, mert megszakadt a folyamat. Kezdd újra.' : hibaUzenet(exchange.error)} />
  }

  if (consent && pending) {
    return <Consent name={consent.name} email={consent.email} code={code} verifier={pending.verifier} landing={landing} />
  }

  return (
    <AuthCard title="Belépés Google-lel" lead="Egy pillanat, ellenőrizzük a belépésed.">
      <Skeleton lines={2} />
    </AuthCard>
  )
}

function Failure({ message }: { message: string }) {
  return (
    <AuthCard
      title="Nem sikerült belépni"
      footer={
        <>
          <Link to="/bejelentkezes">Vissza a belépéshez</Link>
        </>
      }
    >
      <Banner kind="error">{message}</Banner>
    </AuthCard>
  )
}

/** Új fiók: ugyanaz az elfogadás (és zárt béta alatt meghívókód), mint a jelszavas regisztrációnál. */
function Consent({ name, email, code, verifier, landing }: { name: string; email: string; code: string; verifier: string; landing: string }) {
  const navigate = useNavigate()
  const { acceptLogin } = useAuth()
  const { mode } = useRegistrationMode()
  const [accepted, setAccepted] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const inviteOnly = mode === 'invite'

  const complete = useMutation({
    mutationFn: () =>
      authApi.googleComplete({
        code,
        code_verifier: verifier,
        accept_terms: accepted,
        terms_version: LEGAL_VERSIONS.terms,
        privacy_version: LEGAL_VERSIONS.privacy,
        ...(inviteOnly ? { invite_code: inviteCode.trim() } : {}),
      }),
    onSuccess: async (response) => {
      clearPendingGoogleLogin()
      await acceptLogin(response)
      navigate(landing, { replace: true })
    },
  })

  const errors = mezoHibak(complete.error)
  const generalError = complete.isError && Object.keys(errors).length === 0 ? hibaUzenet(complete.error) : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    // Mindig elküldjük: a szerver egyszerre adja vissza az összes hibát, az elfogadás hiányát is.
    complete.mutate()
  }

  return (
    <AuthCard
      title="Fiók létrehozása"
      lead={
        <>
          Még nincs fiókod ezzel a Google-fiókkal: <strong className="break-all">{email}</strong>. Egy lépés van hátra, hogy létrehozzuk
          {name ? ` (${name} néven)` : ''}.
        </>
      }
      footer={<Link to="/bejelentkezes">Mégsem, vissza a belépéshez</Link>}
    >
      {generalError && <Banner kind="error">{generalError}</Banner>}
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {inviteOnly && (
          <Field
            label="Meghívókód"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            mono
            required
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            error={errors.invite_code}
            hint="Zárt bétát futtatunk: a fiók létrehozásához meghívókód kell."
          />
        )}
        <CheckboxField
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          required
          error={errors.accept_terms}
          label={
            <>
              Elfogadom az <LegalLink to="terms">általános szerződési feltételeket</LegalLink>, és megismertem az{' '}
              <LegalLink to="privacy">adatkezelési tájékoztatót</LegalLink>.
            </>
          }
        />
        <SubmitButton busy={complete.isPending} busyLabel="Fiók létrehozása…" size="lg">
          Fiók létrehozása
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
