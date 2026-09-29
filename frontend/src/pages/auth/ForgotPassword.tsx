import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { hibaUzenet, mezoHibak } from '../../api/client'
import { Alert, AuthCard, Field, SubmitButton } from '../../components/Form'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setFieldError(undefined)
    setError(null)
    try {
      setSent(await authApi.forgotPassword(email))
    } catch (err) {
      const fields = mezoHibak(err)
      setFieldError(fields.email)
      if (!fields.email) setError(hibaUzenet(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Elfelejtett jelszó">
      {sent ? (
        <Alert kind="success">{sent}</Alert>
      ) : (
        <>
          <p className="text-sm text-slate-400">Add meg az e-mail-címed, és küldünk egy linket az új jelszó beállításához.</p>
          {error && <Alert kind="error">{error}</Alert>}
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
            <SubmitButton busy={busy}>{busy ? 'Küldés…' : 'Link küldése'}</SubmitButton>
          </form>
        </>
      )}
      <Link to="/bejelentkezes" className="inline-block text-sm text-sky-400 hover:underline">
        Vissza a bejelentkezéshez
      </Link>
    </AuthCard>
  )
}
