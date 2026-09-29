import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Alert, AuthCard, Field, SubmitButton } from '../../../shared/ui/Form'
import * as authApi from '../api'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const mutation = useMutation({ mutationFn: authApi.forgotPassword })

  const fieldError = mezoHibak(mutation.error).email
  const generalError = mutation.isError && !fieldError ? hibaUzenet(mutation.error) : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate(email)
  }

  return (
    <AuthCard title="Elfelejtett jelszó">
      {mutation.isSuccess ? (
        <Alert kind="success">{mutation.data}</Alert>
      ) : (
        <>
          <p className="text-sm text-slate-400">Add meg az e-mail-címed, és küldünk egy linket az új jelszó beállításához.</p>
          {generalError && <Alert kind="error">{generalError}</Alert>}
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Field
              label="E-mail-cím"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldError}
            />
            <SubmitButton busy={mutation.isPending}>{mutation.isPending ? 'Küldés…' : 'Link küldése'}</SubmitButton>
          </form>
        </>
      )}
      <Link to="/bejelentkezes" className="inline-block text-sm text-sky-400 hover:underline">
        Vissza a bejelentkezéshez
      </Link>
    </AuthCard>
  )
}
