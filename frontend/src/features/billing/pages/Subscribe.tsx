import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Alert } from '../../../shared/ui/Form'
import { PageLoader } from '../../../shared/ui/PageLoader'
import type { BillingProfile, BillingProfilePayload, Plan, Subscription } from '../../../types'
import { useAuth } from '../../auth/context'
import * as billingApi from '../api'
import { billingKeys } from '../api'
import { BillingProfileForm } from '../components/BillingProfileForm'
import { formatHuf } from '../format'

/**
 * Előfizetés (#19): számlázási adatok, majd tovább a Barion fizetőoldalára.
 * A számla ezekből az adatokból készül, ezért fizetni csak utánuk lehet.
 */
export function Subscribe() {
  const { user } = useAuth()
  const plan = useQuery({ queryKey: billingKeys.plan, queryFn: ({ signal }) => billingApi.plan(signal) })
  const subscription = useQuery({
    queryKey: billingKeys.subscription,
    queryFn: ({ signal }) => billingApi.subscription(signal),
  })
  const profile = useQuery({ queryKey: billingKeys.profile, queryFn: ({ signal }) => billingApi.profile(signal) })

  if (plan.isError || subscription.isError || profile.isError) {
    return (
      <Page>
        <Alert kind="error">{hibaUzenet(plan.error ?? subscription.error ?? profile.error)}</Alert>
      </Page>
    )
  }

  if (!plan.isSuccess || !subscription.isSuccess || !profile.isSuccess) return <PageLoader />

  return (
    <Page>
      <PlanSummary plan={plan.data} />
      {subscription.data ? (
        <AlreadySubscribed subscription={subscription.data} />
      ) : !user?.email_verified_at ? (
        <Alert kind="info">Előfizetés előtt erősítsd meg az e-mail-címed a regisztrációkor kapott levélben.</Alert>
      ) : (
        <CheckoutForm initial={profile.data} />
      )}
    </Page>
  )
}

function CheckoutForm({ initial }: { initial: BillingProfile | null }) {
  const queryClient = useQueryClient()

  // Két lépés egy gombnyomásra: az adatok mentése, majd a fizetés indítása.
  // A mentés hibái mezőnként jelennek meg; a fizetésé általános hibaként.
  const save = useMutation({
    mutationFn: billingApi.saveProfile,
    onSuccess: (saved) => queryClient.setQueryData(billingKeys.profile, saved),
  })
  const checkout = useMutation({
    mutationFn: billingApi.checkout,
    onSuccess: ({ checkout_url }) => window.location.assign(checkout_url),
  })

  const busy = save.isPending || checkout.isPending || checkout.isSuccess
  const fieldErrors = mezoHibak(save.error)
  const generalError =
    save.isError && Object.keys(fieldErrors).length === 0
      ? hibaUzenet(save.error)
      : checkout.isError
        ? hibaUzenet(checkout.error)
        : null

  function submit(payload: BillingProfilePayload) {
    checkout.reset()
    save.mutate(payload, { onSuccess: () => checkout.mutate() })
  }

  return (
    <section aria-labelledby="billing-title" className="space-y-4">
      <h2 id="billing-title" className="text-lg font-semibold text-slate-100">
        Számlázási adatok
      </h2>
      {generalError && <Alert kind="error">{generalError}</Alert>}
      <BillingProfileForm
        initial={initial}
        errors={fieldErrors}
        busy={busy}
        submitLabel={busy ? 'Átirányítás a fizetéshez…' : 'Tovább a fizetéshez'}
        onSubmit={submit}
      />
      <p className="text-xs text-slate-500">
        A fizetés a Barion biztonságos oldalán történik; a kártyaadataid hozzánk nem jutnak el. A kártyád a havi
        megújításhoz tárolásra kerül a Barionnál, és az előfizetés bármikor lemondható.
      </p>
    </section>
  )
}

function PlanSummary({ plan }: { plan: Plan }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{plan.name}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-100">
        {formatHuf(plan.price_huf)}
        <span className="text-base font-normal text-slate-400"> / hónap</span>
      </p>
      <p className="mt-2 text-sm text-slate-400">Minden feladat és videó elérhető, havonta megújul, bármikor lemondható.</p>
    </div>
  )
}

function AlreadySubscribed({ subscription }: { subscription: Subscription }) {
  const end = subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('hu-HU') : null

  return (
    <Alert kind="success">
      Már előfizető vagy{end ? `, a jelenlegi időszak vége: ${end}` : ''}.{' '}
      <Link to="/feladatok" className="underline">
        Tovább a feladatokhoz
      </Link>
    </Alert>
  )
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-100">Előfizetés</h1>
      {children}
    </div>
  )
}
