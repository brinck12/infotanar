import { useMutation } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import type { LockReason } from '../../../types'
import { LockIcon } from '../../../shared/ui/LockIcon'
import * as authApi from '../../auth/api'

interface Props {
  reason: LockReason
  message: string
}

/** Zárolt (fizetős) feladat helyén: az ok szerinti következő lépéssel. */
export function Paywall({ reason, message }: Props) {
  return (
    <section
      aria-labelledby="paywall-title"
      data-testid="paywall"
      data-reason={reason}
      className="rounded-lg border border-amber-800 bg-amber-950/40 p-6"
    >
      <h2 id="paywall-title" className="flex items-center gap-2 text-lg font-semibold text-amber-100">
        <LockIcon />
        Előfizetéses tartalom
      </h2>
      <p className="mt-2 text-amber-200">{message}</p>
      <div className="mt-5">
        <PaywallAction reason={reason} />
      </div>
    </section>
  )
}

function PaywallAction({ reason }: { reason: LockReason }) {
  const location = useLocation()
  const resend = useMutation({ mutationFn: authApi.resendVerification })

  switch (reason) {
    case 'login_required':
      return (
        <Link
          to="/bejelentkezes"
          state={{ from: location.pathname + location.search }}
          className="inline-block rounded-lg bg-sky-700 px-5 py-2.5 font-medium text-white transition hover:bg-sky-600"
        >
          Bejelentkezés
        </Link>
      )
    case 'email_unverified':
      if (resend.isSuccess) return <p className="text-sm text-amber-100">{resend.data}</p>
      return (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => resend.mutate()}
            disabled={resend.isPending}
            className="rounded-lg bg-sky-700 px-5 py-2.5 font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
          >
            {resend.isPending ? 'Küldés…' : 'Megerősítő levél újraküldése'}
          </button>
          {resend.isError && <p className="text-sm text-red-300">{hibaUzenet(resend.error)}</p>}
        </div>
      )
    case 'subscription_required':
      return (
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/elofizetes"
            className="inline-block rounded-lg bg-sky-700 px-5 py-2.5 font-medium text-white transition hover:bg-sky-600"
          >
            Előfizetek
          </Link>
          <Link to="/feladatok" className="text-sm text-sky-400 hover:underline">
            Vissza az ingyenes feladatokhoz
          </Link>
        </div>
      )
  }
}
