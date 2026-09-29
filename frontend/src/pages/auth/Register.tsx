import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { hibaUzenet, mezoHibak } from '../../api/client'
import { useAuth } from '../../auth/context'
import { Alert, AuthCard, Field, SubmitButton } from '../../components/Form'

export function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setError(null)
    try {
      await authApi.register(form)
      await login(form.email, form.password)
      navigate('/regisztracio/kesz', { replace: true, state: { email: form.email } })
    } catch (err) {
      const fields = mezoHibak(err)
      setErrors(fields)
      if (Object.keys(fields).length === 0) setError(hibaUzenet(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Regisztráció">
      {error && <Alert kind="error">{error}</Alert>}
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
        <SubmitButton busy={busy}>{busy ? 'Regisztráció…' : 'Regisztrálok'}</SubmitButton>
      </form>
      <p className="text-sm text-slate-400">
        Van már fiókod?{' '}
        <Link to="/bejelentkezes" className="text-sky-400 hover:underline">
          Jelentkezz be
        </Link>
      </p>
    </AuthCard>
  )
}
