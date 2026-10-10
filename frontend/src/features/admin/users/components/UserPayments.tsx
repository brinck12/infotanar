import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { hibaUzenet } from '../../../../shared/api/errors'
import { Badge, type BadgeKind } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Pager } from '../../../../shared/ui/Pager'
import { LoadError, Skeleton } from '../../../../shared/ui/States'
import { Table, Td, Th, Tr } from '../../../../shared/ui/Table'
import { formatHuf } from '../../../billing/format'
import { PAYMENT_PURPOSE_LABEL, PAYMENT_STATUS_LABEL } from '../../../billing/labels'
import { downloadInvoice, paymentsQuery, type AdminPayment } from '../api'
import { formatDate } from '../format'

const INVOICE_STATUS_LABEL = { pending: 'Készül', issued: 'Kiállítva', failed: 'Sikertelen' } as const

const STATUS_BADGE: Readonly<Record<AdminPayment['status'], BadgeKind>> = {
  succeeded: 'ok',
  pending: 'neutral',
  failed: 'bad',
  canceled: 'neutral',
  expired: 'neutral',
}

/**
 * Egy felhasználó fizetései és számlái ügyfélszolgálatnak (#162): a saját
 * előzményeken túl a Barion azonosítóval, amellyel a tranzakció a Barionban
 * megkereshető. A számla letöltése naplózott.
 */
export function UserPayments({ userId }: { userId: number }) {
  const [page, setPage] = useState(1)
  const payments = useQuery(paymentsQuery(userId, page))
  const download = useMutation({
    mutationFn: ({ paymentId, number }: { paymentId: string; number: string }) => downloadInvoice(userId, paymentId, number),
  })

  if (payments.isError) return <LoadError error={payments.error} onRetry={() => void payments.refetch()} />
  if (!payments.data) return <Skeleton lines={3} />
  if (payments.data.data.length === 0) return <p className="text-15 text-ink-soft">Még nincs fizetése.</p>

  const { data: rows, meta } = payments.data

  return (
    <div>
      {download.isError && (
        <Banner kind="error" title="Nem sikerült letölteni a számlát" className="mb-4">
          {hibaUzenet(download.error)}
        </Banner>
      )}
      <div data-testid="user-payments">
        <Table caption="Fizetések és számlák">
          <thead>
            <tr>
              <Th>Dátum</Th>
              <Th>Típus</Th>
              <Th align="right">Összeg</Th>
              <Th>Állapot</Th>
              <Th>Barion</Th>
              <Th>Számla</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((payment) => (
              <Tr key={payment.id}>
                <Td className="whitespace-nowrap">{formatDate(payment.paid_at ?? payment.created_at)}</Td>
                <Td>{PAYMENT_PURPOSE_LABEL[payment.purpose]}</Td>
                <Td align="right" className="whitespace-nowrap tabular-nums">
                  {formatHuf(payment.amount)}
                </Td>
                <Td>
                  <Badge kind={STATUS_BADGE[payment.status]}>{PAYMENT_STATUS_LABEL[payment.status]}</Badge>
                </Td>
                <Td className="font-mono text-13 text-ink-soft">
                  {payment.provider_payment_id ?? '–'}
                  {payment.provider_status && <span className="block font-sans">{payment.provider_status}</span>}
                </Td>
                <Td>
                  <InvoiceCell payment={payment} busy={download.isPending} onDownload={(number) => download.mutate({ paymentId: payment.id, number })} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </div>
      <Pager page={page} lastPage={meta.last_page} onChange={setPage} previousLabel="Újabbak" nextLabel="Régebbiek" />
    </div>
  )
}

function InvoiceCell({ payment, busy, onDownload }: { payment: AdminPayment; busy: boolean; onDownload: (number: string) => void }) {
  const invoice = payment.invoice
  if (!invoice) return <span aria-label="Nincs számla">–</span>

  const number = invoice.number
  return (
    <span className="flex flex-col items-start">
      {invoice.download_url && number ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => onDownload(number)}
          aria-label={`${number} számla letöltése`}
          className="min-h-8 font-mono text-14 text-accent underline underline-offset-4 hover:text-accent-dark disabled:text-muted"
        >
          {number}
        </button>
      ) : (
        <span className="font-mono text-14">{number ?? '–'}</span>
      )}
      <span className="text-13 text-ink-soft">{INVOICE_STATUS_LABEL[invoice.status]}</span>
    </span>
  )
}
