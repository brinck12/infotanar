import { useMutation } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { unsubscribeWeeklySummary } from '../../../shared/api/notifications'
import { hibaUzenet } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { AuthCard } from '../components/AuthCard'

/**
 * Leiratkozás a heti összefoglalóról a levél linkjéről (bejelentkezés nélkül). A gombnyomás kell
 * hozzá, hogy a levélszűrők előzetes link-megnyitása ne iratkoztassa le véletlenül a címzettet.
 */
export function WeeklySummaryUnsubscribe() {
  const [params] = useSearchParams()
  const id = params.get('id')
  const signature = params.get('signature')

  const unsubscribe = useMutation({
    mutationFn: async () => {
      if (!id || !signature) throw new Error('Hiányzik a leiratkozó link azonosítója.')
      return unsubscribeWeeklySummary(id, signature)
    },
  })

  if (!id || !signature) {
    return (
      <AuthCard icon="clock" iconTone="neutral" title="Ez a link nem érvényes" lead="A leiratkozást a fiókodnál is elintézheted, bejelentkezés után.">
        <ButtonLink to="/fiok">Fiókom</ButtonLink>
      </AuthCard>
    )
  }

  if (unsubscribe.isSuccess) {
    return (
      <AuthCard icon="check" title="Leiratkoztál" lead={unsubscribe.data}>
        <ButtonLink to="/tanulasi-ut">Tovább a tanuláshoz</ButtonLink>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Leiratkozás a heti összefoglalóról"
      lead="Egy kattintás, és nem küldünk több heti összefoglalót. Bármikor visszakapcsolhatod a fiókodnál."
      footer={<Link to="/fiok">Inkább a fiókomnál állítom</Link>}
    >
      {unsubscribe.isError && <Banner kind="error">{hibaUzenet(unsubscribe.error)} Próbáld újra, vagy állítsd be a fiókodnál.</Banner>}
      <Button size="lg" busy={unsubscribe.isPending} busyLabel="Leiratkozás…" onClick={() => unsubscribe.mutate()}>
        Leiratkozom a heti összefoglalóról
      </Button>
    </AuthCard>
  )
}
