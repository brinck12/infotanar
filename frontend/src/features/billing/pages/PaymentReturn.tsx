import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { Icon, type IconName } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
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
  const queryClient = useQueryClient()
  const { refresh } = useAuth()
  // A végleges eredményt megjegyezzük: a hozzáférés frissítése minden lekérdezést
  // (ezt is) alaphelyzetbe állít, és az eredmény közben nem tűnhet el a képernyőről.
  const [settled, setSettled] = useState<PaymentSummary | null>(null)
  const refreshed = useRef(false)

  const payment = useQuery({
    queryKey: billingApi.paymentKeys.one(id),
    queryFn: ({ signal }) => billingApi.payment(id, signal),
    enabled: id !== '',
    retry: 1,
    refetchInterval: (query) => (query.state.data?.is_final || gaveUp || settled ? false : POLL_MS),
  })

  if (payment.data?.is_final && settled?.id !== payment.data.id) setSettled(payment.data)

  // Sikeres fizetés után a hozzáférés (auth, katalógus, előfizetés) pontosan egyszer frissül.
  useEffect(() => {
    if (settled?.status !== 'succeeded' || refreshed.current) return
    refreshed.current = true
    void refresh()
    void queryClient.invalidateQueries({ queryKey: ['billing'] })
    void queryClient.invalidateQueries({ queryKey: ['catalog'] })
    void queryClient.invalidateQueries({ queryKey: ['progress'] })
  }, [settled?.status, queryClient, refresh])

  useEffect(() => {
    if (settled) return
    const timer = window.setTimeout(() => setGaveUp(true), Math.max(0, GIVE_UP_MS - (Date.now() - startedAt)))
    return () => window.clearTimeout(timer)
  }, [settled, startedAt])

  return (
    <main className="mx-auto w-full max-w-form flex-1 px-4 pt-12 pb-24 md:px-6">
      {id === '' ? (
        <Result
          tone="bad"
          icon="x"
          title="Hiányzik a fizetés azonosítója"
          actions={<ButtonLink to="/fiok/fizetesek">Fizetéseim megnyitása</ButtonLink>}
        >
          Ezt az oldalt a Barion fizetőoldaláról visszatérve látod. A fizetéseid állapotát a fiókodban találod.
        </Result>
      ) : settled ? (
        <Outcome payment={settled} />
      ) : payment.isError ? (
        <Result
          tone="bad"
          icon="x"
          title="Nem sikerült lekérdezni a fizetést"
          actions={
            <Button icon="refresh" onClick={() => void payment.refetch()}>
              Állapot frissítése
            </Button>
          }
        >
          {hibaUzenet(payment.error)}
        </Result>
      ) : (
        <Result
          tone="neutral"
          icon="clock"
          title="Még feldolgozzuk a fizetést"
          actions={
            gaveUp ? (
              <ButtonLink to="/fiok/fizetesek">Fizetéseim megnyitása</ButtonLink>
            ) : (
              <Button variant="secondary" icon="refresh" busy={payment.isFetching} busyLabel="Frissítés…" onClick={() => void payment.refetch()}>
                Állapot frissítése
              </Button>
            )
          }
        >
          {gaveUp
            ? 'A feldolgozás tovább tart a szokásosnál. Az eredményt pár perc múlva a fiókodban látod; ha sikeres volt, a számlát e-mailben is megkapod. Nem kell újra fizetned.'
            : 'A Barion még nem küldte vissza az eredményt. Ez általában egy-két percig tart. Az oldal magától frissül, nem kell újra fizetned.'}
        </Result>
      )}
    </main>
  )
}

interface ResultProps {
  tone: 'ok' | 'neutral' | 'bad'
  icon: IconName
  title: string
  children: ReactNode
  actions: ReactNode
}

function Result({ tone, icon, title, children, actions }: ResultProps) {
  return (
    <Panel pad="xl" className="rounded-lg" role={tone === 'bad' ? 'alert' : 'status'} data-testid="payment-result" data-tone={tone}>
      <span
        className={cx(
          'inline-flex size-14 items-center justify-center rounded-full',
          tone === 'ok' ? 'bg-accent-soft text-accent' : tone === 'bad' ? 'bg-wrong-soft text-wrong' : 'bg-note text-ink',
        )}
      >
        <Icon name={icon} size={28} />
      </span>
      <h1 className="mt-3.5 font-serif text-28 leading-snug font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-16 leading-relaxed text-ink-soft">{children}</p>
      <div className="mt-5 flex flex-wrap gap-3">{actions}</div>
    </Panel>
  )
}

function Outcome({ payment }: { payment: PaymentSummary }) {
  if (payment.status === 'succeeded') {
    return (
      <Result
        tone="ok"
        icon="check"
        title="Sikeres fizetés"
        actions={
          <>
            <ButtonLink to="/tanulasi-ut">Tovább a tanuláshoz</ButtonLink>
            <ButtonLink to="/fiok/fizetesek" variant="text">
              Számla megtekintése
            </ButtonLink>
          </>
        }
      >
        {formatHuf(payment.amount)} beérkezett.{' '}
        {payment.purpose === 'card_change'
          ? 'Az új kártyád mentve, az előfizetésed meghosszabbítva.'
          : 'A Prémium hozzáférésed azonnal él.'}{' '}
        A számlát e-mailben küldjük, és a fiókodban is megtalálod.
      </Result>
    )
  }

  const message = {
    failed: 'A bank elutasította a terhelést, a kártyádról nem vontunk le pénzt. Próbáld újra, vagy használj másik kártyát.',
    canceled: 'A fizetést megszakítottad, nem történt terhelés.',
    expired: 'A fizetés időkorlátja lejárt, nem történt terhelés.',
    pending: '',
    succeeded: '',
  }[payment.status]

  return (
    <Result
      tone="bad"
      icon="x"
      title="A fizetés nem sikerült"
      actions={
        <>
          <ButtonLink to="/elofizetes">Újrapróbálom</ButtonLink>
          <ButtonLink to="/arak" variant="text">
            Vissza az árakhoz
          </ButtonLink>
        </>
      }
    >
      {message}
    </Result>
  )
}
