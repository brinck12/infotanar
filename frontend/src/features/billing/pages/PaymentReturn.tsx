import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Alert, AuthCard } from '../../../shared/ui/Form'
import type { PaymentSummary } from '../../../types'
import { useAuth } from '../../auth/context'
import * as billingApi from '../api'
import { formatHuf } from '../format'

const POLL_MS = 2000
/** Ennyi ideig várunk a Barion visszajelzésére; utána a fizetési előzményekre irányítunk. */
const GIVE_UP_MS = 90_000

/**
 * Visszatérés a Barion fizetőoldaláról (#101). A fizetés eredményét a
 * szerver a Barion callbackjéből tudja meg (#15), ezért addig kérdezzük,
 * amíg végleges nem lesz. Sikernél a prémium tartalom azonnal, újratöltés
 * nélkül elérhetővé válik.
 */
export function PaymentReturn() {
  const [params] = useSearchParams()
  const id = params.get('fizetes') ?? ''
  const [startedAt] = useState(() => Date.now())
  const [gaveUp, setGaveUp] = useState(false)

  const payment = useQuery({
    queryKey: billingApi.paymentKeys.one(id),
    queryFn: ({ signal }) => billingApi.payment(id, signal),
    enabled: id !== '',
    retry: 1,
    refetchInterval: (query) => (query.state.data?.is_final || gaveUp ? false : POLL_MS),
  })

  useEffect(() => {
    if (payment.data?.is_final) return
    const timer = window.setTimeout(() => setGaveUp(true), Math.max(0, GIVE_UP_MS - (Date.now() - startedAt)))
    return () => window.clearTimeout(timer)
  }, [payment.data?.is_final, startedAt])

  return (
    <AuthCard title="Fizetés">
      {id === '' ? (
        <Alert kind="error">Hiányzik a fizetés azonosítója.</Alert>
      ) : payment.isError ? (
        <Alert kind="error">{hibaUzenet(payment.error)}</Alert>
      ) : !payment.data || !payment.data.is_final ? (
        gaveUp ? (
          <Alert kind="info">
            A fizetés feldolgozása tovább tart a szokásosnál. Az eredményt pár perc múlva az{' '}
            <Link to="/elofizetes" className="underline">
              Előfizetés oldalon
            </Link>{' '}
            látod; ha sikeres volt, a számlát e-mailben is megkapod.
          </Alert>
        ) : (
          <p role="status" className="flex items-center gap-3 text-slate-300">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400" aria-hidden="true" />
            A fizetés feldolgozása folyamatban…
          </p>
        )
      ) : (
        <Outcome payment={payment.data} />
      )}
    </AuthCard>
  )
}

function Outcome({ payment }: { payment: PaymentSummary }) {
  const queryClient = useQueryClient()
  const { refresh } = useAuth()
  const refreshed = useRef(false)

  // Sikeres fizetés után a hozzáférés (auth, katalógus, előfizetés) egyszer frissül.
  useEffect(() => {
    if (payment.status !== 'succeeded' || refreshed.current) return
    refreshed.current = true
    void refresh()
    void queryClient.invalidateQueries({ queryKey: ['billing'] })
    void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    void queryClient.invalidateQueries({ queryKey: ['progress'] })
  }, [payment.status, queryClient, refresh])

  if (payment.status === 'succeeded') {
    return (
      <>
        <Alert kind="success">
          Sikeres fizetés: {formatHuf(payment.amount)}.{' '}
          {payment.purpose === 'card_change' ? 'Az új kártyád mentve, az előfizetésed meghosszabbítva.' : 'Az előfizetésed aktív.'} A
          számlát e-mailben küldjük.
        </Alert>
        <Link to="/feladatok" className="inline-block text-sky-400 hover:underline">
          Tovább a feladatokhoz
        </Link>
      </>
    )
  }

  const message = {
    failed: 'A fizetés nem sikerült (például a bank elutasította a terhelést).',
    canceled: 'A fizetést megszakítottad, nem történt terhelés.',
    expired: 'A fizetés időkorlátja lejárt, nem történt terhelés.',
    pending: '',
    succeeded: '',
  }[payment.status]

  return (
    <>
      <Alert kind="error">{message}</Alert>
      <Link to="/elofizetes" className="inline-block text-sky-400 hover:underline">
        Újrapróbálom
      </Link>
    </>
  )
}
