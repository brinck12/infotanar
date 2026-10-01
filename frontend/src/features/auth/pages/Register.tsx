import { useMutation } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Alert, AuthCard, CheckboxField, Field, SubmitButton } from '../../../shared/ui/Form'
import { LEGAL_VERSIONS } from '../../legal/documents'
import { LegalLink } from '../../legal/LegalLink'
import * as authApi from '../api'
import { useAuth } from '../context'

/** A begépelhető mezők; az elfogadás és a dokumentumverziók küldéskor kerülnek mellé. */
type Form = Pick<authApi.RegisterPayload, 'name' | 'email' | 'password' | 'password_confirmation'>

export function Register() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>({ name: '', email: '', password: '', password_confirmation: '' })
  const [acceptTerms, setAcceptTerms] = useState(false)

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
    mutation.mutate({
      ...form,
      accept_terms: acceptTerms,
      terms_version: LEGAL_VERSIONS.terms,
      privacy_version: LEGAL_VERSIONS.privacy,
    })
  }

  return (
    <AuthCard title="Regisztráció">
      {generalError && <Alert kind="error">{generalError}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
          hint="Legalább 8 karakter, betűvel és számmal."
        />
        <Field
          label="Jelszó még egyszer"
          type="password"
          autoComplete="new-password"
          required
          value={form.password_confirmation}
          onChange={set('password_confirmation')}
          error={errors.password_confirmation}
        />
        <CheckboxField
          label={
            <span>
              Elfogadom az <LegalLink to="terms">Általános Szerződési Feltételeket</LegalLink>, és megismertem az{' '}
              <LegalLink to="privacy">Adatkezelési tájékoztatót</LegalLink>.
            </span>
          }
          required
          checked={acceptTerms}
          onChange={(e) => setAcceptTerms(e.target.checked)}
          error={errors.accept_terms}
        />
        <SubmitButton busy={mutation.isPending}>{mutation.isPending ? 'Regisztráció…' : 'Regisztrálok'}</SubmitButton>
      </form>
      <p className="text-sm text-slate-400">
        Van már fiókod?{' '}
        <Link to="/bejelentkezes" className="text-sky-400 underline underline-offset-2 hover:text-sky-300">
          Jelentkezz be
        </Link>
      </p>
    </AuthCard>
  )
}
