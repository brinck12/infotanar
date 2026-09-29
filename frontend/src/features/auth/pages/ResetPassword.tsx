import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Alert, AuthCard, Field, SubmitButton } from '../../../shared/ui/Form'
import * as authApi from '../api'

export function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  if (!token || !email) {
    return (
      <AuthCard title="Új jelszó beállítása">
        <Alert kind="error">A link hiányos. Kérj új visszaállító linket.</Alert>
        <Link to="/elfelejtett-jelszo" className="inline-block text-sm text-sky-400 hover:underline">
          Új link kérése
        </Link>
      </AuthCard>
    )
  }

  return <ResetPasswordForm token={token} email={email} />
}

function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const mutation = useMutation({ mutationFn: authApi.resetPassword })

  // A token/email hibája nem egy kitölthető mezőhöz tartozik, ezért felül jelenik meg.
  const { token: tokenError, email: emailError, ...fieldErrors } = mezoHibak(mutation.error)
  const linkError = tokenError ?? emailError
  const generalError =
    linkError ?? (mutation.isError && Object.keys(fieldErrors).length === 0 ? hibaUzenet(mutation.error) : null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({ token, email, password, password_confirmation: confirmation })
  }

  if (mutation.isSuccess) {
    return (
      <AuthCard title="Új jelszó beállítása">
        <Alert kind="success">{mutation.data}</Alert>
        <Link to="/bejelentkezes" className="inline-block text-sky-400 hover:underline">
          Bejelentkezés
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Új jelszó beállítása">
      <p className="text-sm text-slate-400">
        Fiók: <span className="text-slate-200">{email}</span>
      </p>
      {generalError && (
        <Alert kind="error">
          {generalError}{' '}
          <Link to="/elfelejtett-jelszo" className="underline">
            Új link kérése
          </Link>
        </Alert>
      )}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          label="Új jelszó"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="Legalább 8 karakter, betűvel és számmal."
        />
        <Field
          label="Új jelszó még egyszer"
          type="password"
          autoComplete="new-password"
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={fieldErrors.password_confirmation}
        />
        <SubmitButton busy={mutation.isPending}>{mutation.isPending ? 'Mentés…' : 'Jelszó mentése'}</SubmitButton>
      </form>
    </AuthCard>
  )
}
