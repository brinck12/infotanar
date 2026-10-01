import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Alert } from '../../../shared/ui/Form'
import type { BillingProfile, PaymentSummary, Subscription } from '../../../types'
import * as billingApi from '../api'
import { billingKeys } from '../api'
import { formatDate, formatHuf, untilDate } from '../format'
import { BillingProfileForm } from './BillingProfileForm'

/**
 * Önkiszolgáló előfizetés-kezelés (#101, a #17 végpontjain): állapot,
 * lemondás az időszak végére és visszavonása, kártyacsere, számlázási adatok
 * és fizetési előzmények számlával. A Barionnak nincs saját portálja.
 */
export function SubscriptionManager({ subscription, profile }: { subscription: Subscription; profile: BillingProfile | null }) {
  return (
    <div className="space-y-8">
      <StatusCard subscription={subscription} />
      <ProfileSection profile={profile} />
      <PaymentHistory />
    </div>
  )
}

function StatusCard({ subscription }: { subscription: Subscription }) {
  const queryClient = useQueryClient()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const onSaved = (updated: Subscription) => queryClient.setQueryData(billingKeys.subscription, updated)
  const cancel = useMutation({ mutationFn: billingApi.cancelSubscription, onSuccess: onSaved })
  const resume = useMutation({ mutationFn: billingApi.resumeSubscription, onSuccess: onSaved })
  const card = useMutation({ mutationFn: billingApi.changeCard, onSuccess: ({ checkout_url }) => window.location.assign(checkout_url) })
  const error = cancel.error ?? resume.error ?? card.error
  const pastDue = subscription.status === 'past_due'

  return (
    <section aria-labelledby="sub-status" className="space-y-4 rounded-lg border border-slate-800 bg-slate-900 p-5" data-testid="subscription-status">
      <h2 id="sub-status" className="text-lg font-semibold text-slate-100">
        Előfizetésed
      </h2>

      {pastDue ? (
        <Alert kind="error">
          A legutóbbi megújítás nem sikerült. A hozzáférésed {untilDate(subscription.grace_ends_at)} megmarad; addig fizess egy másik
          kártyával, különben az előfizetés lezárul.
        </Alert>
      ) : subscription.cancel_at_period_end ? (
        <Alert kind="info">
          Lemondtad: {untilDate(subscription.current_period_end)} minden elérhető, utána nem terhelünk tovább.
        </Alert>
      ) : (
        <p className="text-sm text-slate-300">
          Aktív. A következő megújítás: <strong className="text-slate-100">{formatDate(subscription.current_period_end)}</strong>, a mentett
          kártyáddal.
        </p>
      )}

      {error && <Alert kind="error">{hibaUzenet(error)}</Alert>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => card.mutate()}
          disabled={card.isPending || card.isSuccess}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-60"
        >
          {card.isPending || card.isSuccess ? 'Átirányítás…' : pastDue ? 'Fizetés új kártyával' : 'Kártyacsere'}
        </button>

        {subscription.cancel_at_period_end ? (
          <button
            type="button"
            onClick={() => resume.mutate()}
            disabled={resume.isPending}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            Lemondás visszavonása
          </button>
        ) : confirmCancel ? (
          <span role="group" aria-label="Lemondás megerősítése" className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-amber-200">Biztosan lemondod? A kifizetett időszak végéig minden elérhető marad.</span>
            <button
              type="button"
              onClick={() => {
                setConfirmCancel(false)
                cancel.mutate()
              }}
              className="rounded-lg bg-red-800 px-3 py-1.5 text-white hover:bg-red-700"
            >
              Igen, lemondom
            </button>
            <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-lg px-3 py-1.5 text-slate-300 hover:bg-slate-800">
              Mégse
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="rounded-lg px-4 py-2 text-sm text-red-300 hover:bg-red-950"
          >
            Lemondás az időszak végére
          </button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        Kártyacserénél a következő hónapot most fizeted ki az új kártyával; az előfizetés egy hónappal meghosszabbodik, és a további
        megújítások már ezt a kártyát terhelik.
      </p>
    </section>
  )
}

function ProfileSection({ profile }: { profile: BillingProfile | null }) {
  const queryClient = useQueryClient()
  const save = useMutation({
    mutationFn: billingApi.saveProfile,
    onSuccess: (saved) => queryClient.setQueryData(billingKeys.profile, saved),
  })
  const fieldErrors = mezoHibak(save.error)

  return (
    <section aria-labelledby="sub-profile" className="space-y-4">
      <h2 id="sub-profile" className="text-lg font-semibold text-slate-100">
        Számlázási adatok
      </h2>
      {save.isSuccess && <Alert kind="success">Mentve. A következő számla már ezekkel az adatokkal készül.</Alert>}
      {save.isError && Object.keys(fieldErrors).length === 0 && <Alert kind="error">{hibaUzenet(save.error)}</Alert>}
      <BillingProfileForm
        initial={profile}
        errors={fieldErrors}
        busy={save.isPending}
        submitLabel={save.isPending ? 'Mentés…' : 'Adatok mentése'}
        onSubmit={(payload) => save.mutate(payload)}
      />
    </section>
  )
}

const PURPOSE_LABEL: Record<PaymentSummary['purpose'], string> = {
  initial: 'Előfizetés',
  renewal: 'Havi megújítás',
  card_change: 'Kártyacsere',
}

const STATUS_LABEL: Record<PaymentSummary['status'], string> = {
  pending: 'Folyamatban',
  succeeded: 'Sikeres',
  failed: 'Sikertelen',
  canceled: 'Megszakítva',
  expired: 'Lejárt',
}

function PaymentHistory() {
  const [page, setPage] = useState(1)
  const history = useQuery({
    queryKey: billingApi.paymentKeys.list(page),
    queryFn: ({ signal }) => billingApi.payments(page, signal),
    placeholderData: keepPreviousData,
  })
  const download = useMutation({
    mutationFn: ({ id, number }: { id: string; number: string }) => billingApi.downloadInvoice(id, number),
  })

  return (
    <section aria-labelledby="sub-history" className="space-y-3">
      <h2 id="sub-history" className="text-lg font-semibold text-slate-100">
        Fizetések és számlák
      </h2>
      {download.isError && <Alert kind="error">{hibaUzenet(download.error)}</Alert>}
      {history.isError ? (
        <Alert kind="error">{hibaUzenet(history.error)}</Alert>
      ) : !history.data ? (
        <p className="text-sm text-slate-400">Betöltés…</p>
      ) : history.data.data.length === 0 ? (
        <p className="text-sm text-slate-400">Még nincs fizetésed.</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
            {history.data.data.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-3 px-3 py-2.5 text-sm" data-testid="payment-row">
                <span className="w-28 text-slate-400">{formatDate(item.paid_at ?? item.created_at)}</span>
                <span className="flex-1 text-slate-200">{PURPOSE_LABEL[item.purpose]}</span>
                <span className="tabular-nums text-slate-200">{formatHuf(item.amount)}</span>
                <span className={item.status === 'succeeded' ? 'text-emerald-300' : 'text-slate-400'}>{STATUS_LABEL[item.status]}</span>
                {item.invoice?.status === 'issued' && item.invoice.number ? (
                  <button
                    type="button"
                    onClick={() => item.invoice?.number && download.mutate({ id: item.id, number: item.invoice.number })}
                    className="text-sky-400 hover:underline"
                  >
                    Számla ({item.invoice.number})
                  </button>
                ) : item.status === 'succeeded' ? (
                  <span className="text-xs text-slate-500">Számla készül…</span>
                ) : null}
              </li>
            ))}
          </ul>
          {history.data.meta.last_page > 1 && (
            <nav aria-label="Lapozás" className="flex items-center justify-between text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-slate-300 disabled:opacity-30">
                ← Újabbak
              </button>
              <span className="text-slate-400">
                {page}. / {history.data.meta.last_page}
              </span>
              <button
                type="button"
                disabled={page >= history.data.meta.last_page}
                onClick={() => setPage(page + 1)}
                className="text-slate-300 disabled:opacity-30"
              >
                Régebbiek →
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
