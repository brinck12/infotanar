import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { hibaUzenet, mezoHibak } from '../../api/client'
import { Alert, AuthCard, Field, SubmitButton } from '../../components/Form'

export function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setError(null)
    try {
      setDone(await authApi.resetPassword({ token, email, password, password_confirmation: confirmation }))
    } catch (err) {
      const fields = mezoHibak(err)
      // A token/email hibája nem egy kitölthető mezőhöz tartozik, ezért felül jelenik meg.
      const { token: tokenError, email: emailError, ...rest } = fields
      setErrors(rest)
      if (tokenError ?? emailError) setError(tokenError ?? emailError ?? null)
      else if (Object.keys(fields).length === 0) setError(hibaUzenet(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Új jelszó beállítása">
      {done ? (
        <>
          <Alert kind="success">{done}</Alert>
          <Link to="/bejelentkezes" className="inline-block text-sky-400 hover:underline">
            Bejelentkezés
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            Fiók: <span className="text-slate-200">{email}</span>
          </p>
          {error && (
            <Alert kind="error">
              {error}{' '}
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
              error={errors.password}
              hint="Legalább 8 karakter, betűvel és számmal."
            />
            <Field
              label="Új jelszó még egyszer"
              type="password"
              autoComplete="new-password"
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              error={errors.password_confirmation}
            />
            <SubmitButton busy={busy}>{busy ? 'Mentés…' : 'Jelszó mentése'}</SubmitButton>
          </form>
        </>
      )}
    </AuthCard>
  )
}
