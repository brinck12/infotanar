import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Banner } from '../../../shared/ui/Banner'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { EmptyState, LoadError, Skeleton } from '../../../shared/ui/States'
import { SectionTitle } from '../../../shared/ui/Text'
import * as billingApi from '../api'
import { PaymentsTable } from '../components/PaymentsTable'

/** Fizetési előzmények a számlákkal (#101). */
export function AccountPayments() {
  const [page, setPage] = useState(1)
  const history = useQuery({
    queryKey: billingApi.paymentKeys.list(page),
    queryFn: ({ signal }) => billingApi.payments(page, signal),
    placeholderData: keepPreviousData,
  })

  return (
    <section aria-labelledby="payments-title" className="max-w-account">
      <SectionTitle id="payments-title" className="text-24">
        Fizetések és számlák
      </SectionTitle>
      <Banner kind="info" title="Hol a számlám?" className="mt-4">
        A számlát a fizetés után általában percek alatt kiállítjuk. Ha egy számla nem készült el, magától újrapróbáljuk, és e-mailben
        elküldjük.
      </Banner>

      <div className="mt-6">
        {history.isError ? (
          <LoadError error={history.error} onRetry={() => void history.refetch()} />
        ) : !history.data ? (
          <Skeleton lines={4} />
        ) : history.data.data.length === 0 ? (
          <EmptyState title="Még nincs fizetésed" action={<ButtonLink to="/arak">Árak megtekintése</ButtonLink>}>
            Itt jelennek meg az előfizetésed díjai és a hozzájuk tartozó számlák.
          </EmptyState>
        ) : (
          <>
            <PaymentsTable payments={history.data.data} caption="Fizetések és számlák" />
            {history.data.meta.last_page > 1 && (
              <nav aria-label="Lapozás" className="mt-4 flex items-center justify-between gap-3">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Újabbak
                </Button>
                <span className="text-15 text-ink-soft">
                  {page}. oldal, összesen {history.data.meta.last_page}
                </span>
                <Button variant="secondary" disabled={page >= history.data.meta.last_page} onClick={() => setPage(page + 1)}>
                  Régebbiek
                </Button>
              </nav>
            )}
          </>
        )}
      </div>

      <p className="mt-6 text-15 leading-relaxed text-ink-soft">
        A számlázási adataidat a <Link to="/fiok/szamlazasi-adatok">Számlázási adatok</Link> oldalon módosíthatod.
      </p>
    </section>
  )
}
