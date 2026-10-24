import { useMutation } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { CheckboxField, Field, SubmitButton } from '../../../shared/ui/Form'
import { Skeleton } from '../../../shared/ui/States'
import { LEGAL_VERSIONS } from '../../legal/documents'
import { LegalLink } from '../../legal/LegalLink'
import * as authApi from '../api'
import { AuthCard } from '../components/AuthCard'
import { SocialLogin } from '../components/GoogleButton'
import { WaitlistForm } from '../components/WaitlistForm'
import { useAuth } from '../context'
import { useRegistrationMode } from '../useRegistrationMode'

/** A begépelhető mezők; az elfogadás és a dokumentumverziók küldéskor kerülnek mellé. */
type Form = Pick<authApi.RegisterPayload, 'name' | 'email' | 'password' | 'password_confirmation'>

export function Register() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const { mode, pending: modePending } = useRegistrationMode()
  const [params] = useSearchParams()
  const [form, setForm] = useState<Form>({ name: '', email: '', password: '', password_confirmation: '' })
  // A meghívó linkje (?kod=…) előtölti a mezőt.
  const [inviteCode, setInviteCode] = useState(() => params.get('kod') ?? '')
  const [accepted, setAccepted] = useState(false)

  const mutation = useMutation({
    mutationFn: async (payload: authApi.RegisterPayload) => {
      await authApi.register(payload)
      // A szerver foglalt cimre is ugyanazt valaszolja (B13): ott a belepes nem sikerul, ez nem hiba.
      try {
        await login(payload.email, payload.password)
      } catch {
        // A "Nézd meg a leveleidet" oldal bejelentkezés nélkül is jó.
      }
    },
    onSuccess: (_, payload) => navigate('/regisztracio/kesz', { replace: true, state: { email: payload.email } }),
  })

  // Bejelentkezett felhasználónak nincs mit regisztrálnia (a saját sikeres regisztrációnk kivételével).
  if (user && mutation.isIdle) return <Navigate to="/feladatok" replace />

  const errors = mezoHibak(mutation.error)
  const generalError = mutation.isError && Object.keys(errors).length === 0 ? hibaUzenet(mutation.error) : null
  const inviteOnly = mode === 'invite'

  const set = (field: keyof Form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    // Mindig elküldjük: a szerver egyszerre adja vissza az összes hibát (a feltétel elfogadását is),
    // így nem kell egyenként kijavítgatni őket. Az elfogadást a megjelenített verziókkal rögzíti (#133).
    mutation.mutate({
      ...form,
      accept_terms: accepted,
      terms_version: LEGAL_VERSIONS.terms,
      privacy_version: LEGAL_VERSIONS.privacy,
      ...(inviteOnly ? { invite_code: inviteCode.trim() } : {}),
    })
  }

  return (
    <AuthCard
      title="Regisztráció"
      lead={
        inviteOnly
          ? 'Zárt bétát futtatunk: a regisztrációhoz meghívókód kell, amit a tanáraidtól vagy tőlünk kapsz.'
          : 'Ingyenes fiókkal elmented a haladásod, és megnyílik az első két lecke minden tanulási úton.'
      }
      footer={
        <>
          Van már fiókod? <Link to="/bejelentkezes">Belépés</Link>
        </>
      }
    >
      {generalError && <Banner kind="error">{generalError}</Banner>}
      {modePending ? (
        <Skeleton lines={4} />
      ) : (
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
            />
          )}
          <Field label="Név" autoComplete="name" required value={form.name} onChange={set('name')} error={errors.name} />
          <Field
            label="E-mail-cím"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />
          <Field
            label="Jelszó"
            type="password"
            autoComplete="new-password"
            required
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="Legalább 8 karakter, benne betű és szám is legyen."
          />
          <Field
            label="Jelszó újra"
            type="password"
            autoComplete="new-password"
            required
            value={form.password_confirmation}
            onChange={set('password_confirmation')}
            error={errors.password_confirmation}
          />
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
          <SubmitButton busy={mutation.isPending} busyLabel="Fiók létrehozása…" size="lg">
            Fiók létrehozása
          </SubmitButton>
        </form>
      )}
      {!modePending && <SocialLogin />}
      {inviteOnly && inviteCode.trim() === '' && (
        <section aria-label="Várólista" className="border-t border-grid pt-5">
          <h2 className="mb-1.5 text-17 font-bold">Nincs meghívókódod?</h2>
          <p className="mb-4 text-15 leading-relaxed text-ink-soft">Iratkozz fel a várólistára, és szólunk, amint van hely.</p>
          <WaitlistForm />
        </section>
      )}
    </AuthCard>
  )
}
