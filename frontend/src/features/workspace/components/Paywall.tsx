import { useMutation } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
import type { LockReason } from '../../../types'
import * as authApi from '../../auth/api'

interface Props {
  reason: LockReason
  /** A backend indoklása; a cím alatt jelenik meg. */
  message: string
}

const COPY: Readonly<Record<LockReason, { icon: IconName; title: string; body: string }>> = {
  login_required: {
    icon: 'user',
    title: 'Lépj be a folytatáshoz',
    body: 'A regisztráció ingyenes, és a haladásodat is elmentjük.',
  },
  email_unverified: {
    icon: 'mail',
    title: 'Erősítsd meg az e-mail-címed',
    body: 'A levélben kapott linkre kattintva megnyílik a tartalom. Ha nem találod, nézd meg a levélszemét mappát is.',
  },
  subscription_required: {
    icon: 'lock',
    title: 'Ehhez Prémium előfizetés kell',
    body: 'Az első két lecke minden sávban ingyenes, a többi a Prémium előfizetőknek érhető el.',
  },
}

/** Zárolt lecke vagy feladat helyén: az ok szerinti következő lépéssel. */
export function Paywall({ reason, message }: Props) {
  const copy = COPY[reason]

  return (
    <Panel as="section" kind="sheet" pad="xl" className="rounded-lg" aria-labelledby="paywall-title" data-testid="paywall" data-reason={reason}>
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-note">
        <Icon name={copy.icon} size={28} />
      </span>
      <h2 id="paywall-title" className="mt-3.5 font-serif text-24 leading-snug font-semibold">
        {copy.title}
      </h2>
      <p className="mt-3 max-w-prose text-16 leading-relaxed text-ink-soft">
        {message} {copy.body}
      </p>
      <div className="mt-5">
        <PaywallAction reason={reason} />
      </div>
    </Panel>
  )
}

function PaywallAction({ reason }: { reason: LockReason }) {
  const location = useLocation()
  const resend = useMutation({ mutationFn: authApi.resendVerification })
  const from = { from: location.pathname + location.search }

  switch (reason) {
    case 'login_required':
      return (
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/bejelentkezes" state={from}>
            Belépés
          </ButtonLink>
          <ButtonLink to="/regisztracio" variant="secondary">
            Regisztráció
          </ButtonLink>
        </div>
      )
    case 'email_unverified':
      return (
        <div className="flex flex-col gap-3">
          {resend.isSuccess && <Banner kind="success">{resend.data}</Banner>}
          {resend.isError && <Banner kind="error">{hibaUzenet(resend.error)}</Banner>}
          <div className="flex flex-wrap gap-3">
            <Button busy={resend.isPending} busyLabel="Küldés…" disabled={resend.isSuccess} onClick={() => resend.mutate()}>
              Levél újraküldése
            </Button>
            <ButtonLink to="/fiok" variant="text">
              Másik cím megadása
            </ButtonLink>
          </div>
        </div>
      )
    case 'subscription_required':
      return (
        <div className="flex flex-wrap gap-3">
          <ButtonLink to="/elofizetes">Prémium előfizetés</ButtonLink>
          <ButtonLink to="/arak" variant="text">
            Árak
          </ButtonLink>
        </div>
      )
  }
}
