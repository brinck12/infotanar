import { useMutation } from '@tanstack/react-query'
import { hibaUzenet } from '../../../shared/api/errors'
import type { AuthUser } from '../../../types'
import * as authApi from '../../auth/api'
import { AccountSection } from './AccountSection'

/** Név, e-mail-cím és a megerősítés állapota; megerősítetlen címnél új levél kérhető. */
export function ProfileSummary({ user }: { user: AuthUser }) {
  const resend = useMutation({ mutationFn: authApi.resendVerification })

  return (
    <AccountSection title="Adataim">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="text-slate-400">Név</dt>
        <dd className="text-slate-100">{user.name}</dd>
        <dt className="text-slate-400">E-mail-cím</dt>
        <dd className="break-all text-slate-100">{user.email}</dd>
        <dt className="text-slate-400">Állapot</dt>
        <dd>{user.email_verified_at ? 'Megerősített e-mail-cím' : 'Az e-mail-cím még nincs megerősítve'}</dd>
      </dl>

      {!user.email_verified_at && (
        <div role="status">
          {resend.isSuccess ? (
            <p className="text-emerald-300">{resend.data}</p>
          ) : (
            <button
              type="button"
              onClick={() => resend.mutate()}
              disabled={resend.isPending}
              className="rounded-sm text-sky-400 underline underline-offset-2 hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60"
            >
              {resend.isPending ? 'Küldés…' : 'Megerősítő levél újraküldése'}
            </button>
          )}
          {resend.isError && <p className="mt-1 text-red-300">{hibaUzenet(resend.error)}</p>}
        </div>
      )}
    </AccountSection>
  )
}
