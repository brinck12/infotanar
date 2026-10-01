import { useMutation } from '@tanstack/react-query'
import { hibaUzenet } from '../../../shared/api/errors'
import * as authApi from '../api'
import { useAuth } from '../context'

/** Meg nem erősített e-mail-címnél minden oldalon emlékeztet, és új levelet lehet kérni. */
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
