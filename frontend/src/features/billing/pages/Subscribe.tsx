import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Breadcrumb } from '../../../shared/ui/Breadcrumb'
import { Button } from '../../../shared/ui/Button'
import { CheckboxField } from '../../../shared/ui/Form'
import { StateIcon } from '../../../shared/ui/Icon'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { LoadError } from '../../../shared/ui/States'
import { CardTitle, PageTitle, SectionTitle } from '../../../shared/ui/Text'
import type { BillingProfile, BillingProfilePayload, Plan } from '../../../types'
import { useAuth } from '../../auth/context'
import * as billingApi from '../api'
import { billingKeys } from '../api'
import { BillingProfileForm } from '../components/BillingProfileForm'
import { formatHuf } from '../format'

const STEPS = ['Fiók', 'Számlázási adatok', 'Fizetés'] as const

/**
 * Megrendelés (#19): számlázási adatok, majd tovább a Barion fizetőoldalára.
 * A számla ezekből az adatokból készül, ezért fizetni csak utánuk lehet.
 * Aki már előfizető, azt a fiók Előfizetés oldalára visszük (#101).
 */
export function Subscribe() {
  const { user } = useAuth()
  const plan = useQuery({ queryKey: billingKeys.plan, queryFn: ({ signal }) => billingApi.plan(signal) })
  const subscription = useQuery({
    queryKey: billingKeys.subscription,
    queryFn: ({ signal }) => billingApi.subscription(signal),
  })
  const profile = useQuery({ queryKey: billingKeys.profile, queryFn: ({ signal }) => billingApi.profile(signal) })

  const error = plan.error ?? subscription.error ?? profile.error

  if (subscription.data) return <Navigate to="/fiok/elofizetes" replace />

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <Breadcrumb items={[{ label: 'Árak', to: '/arak' }, { label: 'Megrendelés' }]} />
      <PageTitle className="mt-4">Prémium előfizetés</PageTitle>

      <ol className="mt-6 flex flex-wrap gap-x-8 gap-y-2">
        {STEPS.map((step, index) => (
          <li key={step} aria-current={index === 1 ? 'step' : undefined} className="flex items-center gap-2 text-16 font-semibold">
            <StateIcon kind={index === 0 ? 'ok' : 'empty'} label={index === 0 ? 'Kész' : 'Hátravan'} />
            {step}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        {error ? (
          <LoadError error={error} />
        ) : !plan.isSuccess || !subscription.isSuccess || !profile.isSuccess ? (
          <PageLoader />
        ) : user?.email_verified_at ? (
          <CheckoutForm initial={profile.data} plan={plan.data} />
        ) : (
          <Banner kind="warn" title="Előbb erősítsd meg az e-mail-címed">
            A regisztrációkor kapott levélben találod a linket. Megerősített cím nélkül nem indítható fizetés.
          </Banner>
        )}
      </div>
    </main>
  )
}

function CheckoutForm({ initial, plan }: { initial: BillingProfile | null; plan: Plan }) {
  const queryClient = useQueryClient()
  const formId = useId()
  const [accepted, setAccepted] = useState(false)
  const [termsError, setTermsError] = useState(false)

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
    setTermsError(!accepted)
    if (!accepted) return
    checkout.reset()
    save.mutate(payload, { onSuccess: () => checkout.mutate() })
  }

  return (
    <div className="flex flex-wrap items-start gap-8">
      <Panel as="section" pad="xl" aria-labelledby="billing-title" className="min-w-0 flex-1 basis-96">
        <SectionTitle id="billing-title" className="text-24">
          Számlázási adatok
        </SectionTitle>
        <p className="mt-2 mb-6 text-16 leading-relaxed text-ink-soft">
          Ezek kerülnek a számlára. Később a fiókodban módosíthatod, de a már kiállított számla nem változik.
        </p>
        <BillingProfileForm formId={formId} initial={initial} errors={fieldErrors} busy={busy} onSubmit={submit} />
      </Panel>

      <Panel as="aside" kind="highlight" aria-labelledby="summary-title" className="w-full md:w-96 md:flex-none">
        <CardTitle id="summary-title">Összegzés</CardTitle>
        <dl className="mt-4 text-16">
          <div className="flex justify-between gap-4 border-t border-grid py-3">
            <dt>{plan.name}, havi előfizetés</dt>
            <dd className="font-semibold whitespace-nowrap">{formatHuf(plan.price_huf)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-ink py-3 font-bold">
            <dt>Ma fizetendő</dt>
            <dd className="whitespace-nowrap">{formatHuf(plan.price_huf)}</dd>
          </div>
        </dl>
        <p className="text-14 leading-relaxed text-ink-soft">Ezután havonta, ugyanezen a napon. Bármikor lemondható a fiókodban.</p>

        <CheckboxField
          className="mt-5"
          checked={accepted}
          onChange={(e) => {
            setAccepted(e.target.checked)
            if (e.target.checked) setTermsError(false)
          }}
          error={termsError ? 'A fizetéshez fogadd el a feltételeket és a tájékoztatót.' : undefined}
          label={
            <>
              Elfogadom az <Link to="/aszf">általános szerződési feltételeket</Link> és az{' '}
              <Link to="/adatkezeles">adatkezelési tájékoztatót</Link>.
            </>
          }
        />

        {generalError && (
          <Banner kind="error" className="mt-4">
            {generalError}
          </Banner>
        )}

        <Button type="submit" form={formId} size="lg" icon="lock" fullWidth busy={busy} busyLabel="Átirányítás a Barionhoz…" className="mt-5">
          Fizetés Barionnal
        </Button>
        <p className="mt-3 text-14 leading-relaxed text-ink-soft">
          A Barion fizetőoldalára viszünk. A kártyaadataidat mi nem látjuk; a kártyát a Barion tárolja a havi megújításhoz.
        </p>
      </Panel>
    </div>
  )
}
