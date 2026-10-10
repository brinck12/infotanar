import { useMutation } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { CheckboxField, Field, SubmitButton } from '../../../shared/ui/Form'
import { LEGAL_VERSIONS } from '../../legal/documents'
import { LegalLink } from '../../legal/LegalLink'
import * as authApi from '../api'
import { AuthCard } from '../components/AuthCard'
import { useAuth } from '../context'

/** A begépelhető mezők; az elfogadás és a dokumentumverziók küldéskor kerülnek mellé. */
type Form = Pick<authApi.RegisterPayload, 'name' | 'email' | 'password' | 'password_confirmation'>

export function Register() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>({ name: '', email: '', password: '', password_confirmation: '' })
  const [accepted, setAccepted] = useState(false)
  const [termsError, setTermsError] = useState(false)

  const mutation = useMutation({
    mutationFn: async (payload: authApi.RegisterPayload) => {
      await authApi.register(payload)
      await login(payload.email, payload.password)
    },
    onSuccess: (_, payload) => navigate('/regisztracio/kesz', { replace: true, state: { email: payload.email } }),
  })

  // Bejelentkezett felhasználónak nincs mit regisztrálnia (a saját sikeres regisztrációnk kivételével).
  if (user && mutation.isIdle) return <Navigate to="/feladatok" replace />

  const errors = mezoHibak(mutation.error)
  const generalError = mutation.isError && Object.keys(errors).length === 0 ? hibaUzenet(mutation.error) : null

  const set = (field: keyof Form) => (e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setTermsError(!accepted)
    // A szerver az elfogadást a megjelenített dokumentumverziókkal együtt rögzíti (#133).
    if (accepted) {
      mutation.mutate({ ...form, accept_terms: true, terms_version: LEGAL_VERSIONS.terms, privacy_version: LEGAL_VERSIONS.privacy })
    }
  }

  return (
    <AuthCard
      title="Regisztráció"
      lead="Ingyenes fiókkal elmented a haladásod, és megnyílik az első két lecke minden sávban."
      footer={
        <>
          Van már fiókod? <Link to="/bejelentkezes">Belépés</Link>
        </>
      }
    >
      {generalError && <Banner kind="error">{generalError}</Banner>}
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
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
          onChange={(e) => {
            setAccepted(e.target.checked)
            if (e.target.checked) setTermsError(false)
          }}
          required
          error={termsError ? 'A regisztrációhoz fogadd el a feltételeket és a tájékoztatót.' : errors.accept_terms}
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
    </AuthCard>
  )
}
