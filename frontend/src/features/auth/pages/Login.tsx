import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Alert, AuthCard, Field, SubmitButton } from '../../../shared/ui/Form'
import { useAuth } from '../context'

/** Sikeres belépés után a GuestOnly guard visz tovább (a `from` helyre vagy a feladatokhoz). */
export function Login() {
  const { login, sessionExpired } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({ mutationFn: () => login(email, password) })

  const errors = mezoHibak(mutation.error)
  const generalError = mutation.isError && Object.keys(errors).length === 0 ? hibaUzenet(mutation.error) : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <AuthCard title="Bejelentkezés">
      {sessionExpired && !generalError && <Alert kind="info">A munkameneted lejárt, jelentkezz be újra.</Alert>}
      {generalError && <Alert kind="error">{generalError}</Alert>}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          label="E-mail-cím"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label="Jelszó"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />
        <SubmitButton busy={mutation.isPending}>{mutation.isPending ? 'Bejelentkezés…' : 'Bejelentkezem'}</SubmitButton>
      </form>
      <div className="flex justify-between text-sm text-slate-400">
        <Link to="/elfelejtett-jelszo" className="text-sky-400 hover:underline">
          Elfelejtetted a jelszavad?
        </Link>
        <Link to="/regisztracio" className="text-sky-400 hover:underline">
          Regisztráció
        </Link>
      </div>
    </AuthCard>
  )
}
