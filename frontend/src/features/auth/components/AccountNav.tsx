import { useMutation } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import * as authApi from '../api'
import { useAuth } from '../context'

const linkClass = 'text-sm text-slate-400 transition hover:text-slate-100'

export function AccountNav() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  if (loading) return null

  if (!user) {
    return (
      <div className="ml-auto flex items-center gap-4">
        <Link to="/bejelentkezes" className={linkClass}>
          Bejelentkezés
        </Link>
        <Link
          to="/regisztracio"
          className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600"
        >
          Regisztráció
        </Link>
      </div>
    )
  }

  return (
    <div className="ml-auto flex items-center gap-4">
      <Link to="/elofizetes" className={linkClass}>
        Előfizetés
      </Link>
      <span className="text-sm text-slate-300" data-testid="account-name">
        {user.name}
      </span>
      <button
        type="button"
        className={linkClass}
        onClick={() => {
          void logout().then(() => navigate('/'))
        }}
      >
        Kijelentkezés
      </button>
    </div>
  )
}

export function VerifyEmailBanner() {
  const { user } = useAuth()
  const resend = useMutation({ mutationFn: authApi.resendVerification })

  if (!user || user.email_verified_at) return null

  const feedback = resend.isSuccess ? resend.data : resend.isError ? hibaUzenet(resend.error) : null

  return (
    <div role="status" className="border-b border-amber-900 bg-amber-950/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2 text-sm text-amber-200">
        <span>Erősítsd meg az e-mail-címed a levélben kapott linkkel.</span>
        {feedback ? (
          <span className="text-amber-100">{feedback}</span>
        ) : (
          <button
            type="button"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
            className="underline hover:text-amber-100"
          >
            {resend.isPending ? 'Küldés…' : 'Új levél küldése'}
          </button>
        )}
      </div>
    </div>
  )
}
