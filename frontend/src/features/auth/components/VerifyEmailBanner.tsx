import { useMutation } from '@tanstack/react-query'
import { hibaUzenet } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import * as authApi from '../api'
import { useAuth } from '../context'

/** Megerősítetlen e-mail-címnél minden oldalon jelezzük, és kérhető új levél. */
export function VerifyEmailBanner() {
  const { user } = useAuth()
  const resend = useMutation({ mutationFn: authApi.resendVerification })

  if (!user || user.email_verified_at) return null

  const feedback = resend.isSuccess ? resend.data : resend.isError ? hibaUzenet(resend.error) : null

  return (
    <Banner
      kind="warn"
      title="Erősítsd meg az e-mail-címed"
      className="mb-3"
      action={
        feedback ? undefined : (
          <Button variant="secondary" busy={resend.isPending} busyLabel="Küldés…" onClick={() => resend.mutate()}>
            Új levél küldése
          </Button>
        )
      }
    >
      {feedback ?? 'Kattints a levélben kapott linkre. A fizetős leckék csak megerősített címmel nyílnak meg.'}
    </Banner>
  )
}
