import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../api/client'
import { useAuth } from '../../auth/context'
import { Alert, AuthCard, Field, SubmitButton } from '../../components/Form'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/feladatok'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setError(null)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const fields = mezoHibak(err)
      setErrors(fields)
      if (Object.keys(fields).length === 0) setError(hibaUzenet(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Bejelentkezés">
      {error && <Alert kind="error">{error}</Alert>}
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
        <SubmitButton busy={busy}>{busy ? 'Bejelentkezés…' : 'Bejelentkezem'}</SubmitButton>
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
