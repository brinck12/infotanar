import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Badge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { Modal } from '../../../shared/ui/Modal'
import { Panel } from '../../../shared/ui/Panel'
import { LoadError, Skeleton } from '../../../shared/ui/States'
import { CardTitle, SectionTitle } from '../../../shared/ui/Text'
import { useToast } from '../../../shared/ui/useToast'
import type { Plan, Subscription } from '../../../types'
import * as billingApi from '../api'
import { billingKeys } from '../api'
import { PaymentsTable } from '../components/PaymentsTable'
import { daysUntil, formatDate, formatHuf, untilDate } from '../format'

/**
 * Önkiszolgáló előfizetés-kezelés (#101, a #17 végpontjain): állapot,
 * lemondás az időszak végére és visszavonása, kártyacsere. A Barionnak
 * nincs saját portálja.
 */
export function AccountSubscription() {
  const plan = useQuery({ queryKey: billingKeys.plan, queryFn: ({ signal }) => billingApi.plan(signal) })
  const subscription = useQuery({
    queryKey: billingKeys.subscription,
    queryFn: ({ signal }) => billingApi.subscription(signal),
  })

  if (plan.isError || subscription.isError) {
    return <LoadError error={plan.error ?? subscription.error} onRetry={() => void subscription.refetch()} />
  }
  if (!plan.isSuccess || !subscription.isSuccess) return <Skeleton lines={5} />

  return (
    <div className="flex max-w-account flex-col gap-6">
      {subscription.data ? <StatusCard subscription={subscription.data} plan={plan.data} /> : <NoSubscription plan={plan.data} />}
      <RecentPayments />
    </div>
  )
}

function NoSubscription({ plan }: { plan: Plan }) {
  return (
    <Panel as="section" pad="xl" aria-labelledby="sub-status" data-testid="subscription-status">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle id="sub-status" className="text-24">
          Nincs előfizetésed
        </SectionTitle>
        <Badge kind="prem">Ingyenes csomag</Badge>
      </div>
      <Banner kind="info" className="mt-4" action={<ButtonLink to="/elofizetes">Prémium előfizetés</ButtonLink>}>
        Az első két lecke minden sávban ingyenes. A többihez Prémium előfizetés kell, {formatHuf(plan.price_huf)} havonta.
      </Banner>
    </Panel>
  )
}

function StatusCard({ subscription, plan }: { subscription: Subscription; plan: Plan }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const onSaved = (updated: Subscription) => queryClient.setQueryData(billingKeys.subscription, updated)
  const cancel = useMutation({
    mutationFn: billingApi.cancelSubscription,
    onSuccess: (updated) => {
      onSaved(updated)
      setConfirmCancel(false)
      toast.show('Az előfizetést lemondtad.')
    },
  })
  const resume = useMutation({
    mutationFn: billingApi.resumeSubscription,
    onSuccess: (updated) => {
      onSaved(updated)
      toast.show('A lemondást visszavontad.')
    },
  })
  const card = useMutation({ mutationFn: billingApi.changeCard, onSuccess: ({ checkout_url }) => window.location.assign(checkout_url) })
  const error = resume.error ?? card.error
  const pastDue = subscription.status === 'past_due'
  const canceled = subscription.cancel_at_period_end
  const graceDays = daysUntil(subscription.grace_ends_at)

  return (
    <Panel as="section" kind="highlight" pad="xl" aria-labelledby="sub-status" data-testid="subscription-status" data-status={subscription.status}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle id="sub-status" className="text-24">
          {plan.name}
        </SectionTitle>
        {pastDue ? <Badge kind="bad">Fizetési hiba</Badge> : canceled ? <Badge kind="neutral">Lemondva</Badge> : <Badge kind="ok">Aktív</Badge>}
      </div>
      <p className="mt-1 text-16 text-ink-soft">{formatHuf(plan.price_huf)} havonta</p>

      {pastDue && (
        <Banner kind="error" title="A legutóbbi terhelés nem sikerült" className="mt-5">
          {graceDays === null ? 'A' : `Még ${graceDays} napig, `}
          {graceDays === null ? ' hozzáférésed egyelőre megmarad.' : `${untilDate(subscription.grace_ends_at)} megtartod a Prémium hozzáférést.`}{' '}
          Fizess egy működő kártyával; ha addig nem sikerül, a hozzáférés megszűnik.
        </Banner>
      )}

      {!pastDue && canceled && (
        <Banner kind="warn" title={`Az előfizetésed ${formatDate(subscription.current_period_end).replace(/\.$/, '')}-én szűnik meg`} className="mt-5">
          Addig mindent használhatsz. Ha meggondolod magad, egy kattintással visszaállítod, és nem kell újra fizetned.
        </Banner>
      )}

      {!pastDue && !canceled && (
        <dl className="mt-5 text-16">
          <Row term="Következő terhelés" value={formatDate(subscription.current_period_end)} />
          <Row term="Fizetési mód" value="A Barionnál mentett bankkártya" />
          <Row term="A jelenlegi időszak kezdete" value={formatDate(subscription.current_period_start)} />
        </dl>
      )}

      {error && (
        <Banner kind="error" className="mt-5">
          {hibaUzenet(error)}
        </Banner>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant={pastDue ? 'primary' : 'secondary'}
          icon="card"
          busy={card.isPending || card.isSuccess}
          busyLabel="Átirányítás a Barionhoz…"
          onClick={() => card.mutate()}
        >
          {pastDue ? 'Fizetés új kártyával' : 'Kártya cseréje'}
        </Button>

        {canceled ? (
          <Button busy={resume.isPending} busyLabel="Visszaállítás…" onClick={() => resume.mutate()}>
            Mégsem mondom le
          </Button>
        ) : (
          <Button variant="text-danger" onClick={() => setConfirmCancel(true)}>
            Előfizetés lemondása
          </Button>
        )}
      </div>
      <p className="mt-4 text-14 leading-relaxed text-ink-soft">
        Kártyacserénél a következő hónapot most fizeted ki az új kártyával. Az előfizetés egy hónappal meghosszabbodik, és a további
        megújítások már ezt a kártyát terhelik.
      </p>

      <Modal
        open={confirmCancel}
        title="Biztosan lemondod?"
        onClose={() => setConfirmCancel(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmCancel(false)}>
              Mégsem
            </Button>
            <Button variant="danger" busy={cancel.isPending} busyLabel="Lemondás…" onClick={() => cancel.mutate()}>
              Lemondom
            </Button>
          </>
        }
      >
        <p>
          A hozzáférésed a már kifizetett időszak végéig, <strong>{untilDate(subscription.current_period_end)}</strong> megmarad. Utána
          az ingyenes csomagra váltasz, a haladásodat megtartjuk.
        </p>
        {cancel.isError && (
          <Banner kind="error" className="mt-4">
            {hibaUzenet(cancel.error)}
          </Banner>
        )}
      </Modal>
    </Panel>
  )
}

function Row({ term, value }: { term: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-grid py-3">
      <dt className="text-ink-soft">{term}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  )
}

function RecentPayments() {
  const history = useQuery({
    queryKey: billingApi.paymentKeys.list(1),
    queryFn: ({ signal }) => billingApi.payments(1, signal),
  })
  const recent = history.data?.data.slice(0, 3) ?? []

  if (recent.length === 0) return null

  return (
    <Panel as="section" aria-labelledby="sub-recent">
      <CardTitle id="sub-recent">Legutóbbi fizetések</CardTitle>
      <div className="mt-4">
        <PaymentsTable payments={recent} caption="Legutóbbi fizetések" />
      </div>
      <p className="mt-4 text-15">
        <Link to="/fiok/fizetesek">Összes fizetés</Link>
      </p>
    </Panel>
  )
}
