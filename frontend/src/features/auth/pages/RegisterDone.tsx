import { useMutation } from '@tanstack/react-query'
import { Link, useLocation } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import * as authApi from '../api'
import { AuthCard } from '../components/AuthCard'
import { useAuth } from '../context'

export function RegisterDone() {
  const { user } = useAuth()
  const email = (useLocation().state as { email?: string } | null)?.email ?? user?.email
  const resend = useMutation({ mutationFn: authApi.resendVerification })

  return (
    <AuthCard
      icon="mail"
      title="Nézd meg a leveleidet"
      lead={
        <>
          Küldtünk egy megerősítő levelet{email ? <> a <strong className="text-ink">{email}</strong> címre</> : null}. A benne
          lévő linkre kattintva aktiválod a fiókod.
        </>
      }
      footer={<Link to="/tanulasi-ut">Tovább a tanulási útra</Link>}
    >
      <Banner kind="info" title="Nem érkezett meg?">
        Nézd meg a levélszemét mappát is. Ha pár perc múlva sincs ott, kérhetsz újat.
      </Banner>
      {resend.isSuccess && <Banner kind="success">{resend.data}</Banner>}
      {resend.isError && <Banner kind="error">{hibaUzenet(resend.error)}</Banner>}
      {user && (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" busy={resend.isPending} busyLabel="Küldés…" onClick={() => resend.mutate()}>
            Levél újraküldése
          </Button>
          <ButtonLink to="/fiok" variant="text">
            Másik e-mail-cím
          </ButtonLink>
        </div>
      )}
      <p className="text-14 leading-relaxed text-ink-soft">Rövid időn belül csak néhány új levelet kérhetsz.</p>
    </AuthCard>
  )
}
