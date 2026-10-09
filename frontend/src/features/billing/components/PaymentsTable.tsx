import { useMutation } from '@tanstack/react-query'
import { hibaUzenet } from '../../../shared/api/errors'
import { Badge, type BadgeKind } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Table, Td, Th, Tr } from '../../../shared/ui/Table'
import type { PaymentSummary } from '../../../types'
import * as billingApi from '../api'
import { formatDate, formatHuf } from '../format'
import { PAYMENT_PURPOSE_LABEL, PAYMENT_STATUS_LABEL } from '../labels'

const STATUS_BADGE: Readonly<Record<PaymentSummary['status'], BadgeKind>> = {
  succeeded: 'ok',
  pending: 'neutral',
  failed: 'bad',
  canceled: 'neutral',
  expired: 'neutral',
}

/** Fizetések táblázata a számla állapotával: letölthető, készül, vagy nincs. */
export function PaymentsTable({ payments, caption }: { payments: PaymentSummary[]; caption: string }) {
  const download = useMutation({
    mutationFn: ({ id, number }: { id: string; number: string }) => billingApi.downloadInvoice(id, number),
  })

  return (
    <>
      {download.isError && (
        <Banner kind="error" title="Nem sikerült letölteni a számlát" className="mb-4">
          {hibaUzenet(download.error)}
        </Banner>
      )}
      <Table caption={caption}>
        <thead>
          <tr>
            <Th>Dátum</Th>
            <Th>Tétel</Th>
            <Th align="right">Összeg</Th>
            <Th>Állapot</Th>
            <Th>Számla</Th>
          </tr>
        </thead>
        <tbody>
          {payments.map((item) => {
            const number = item.invoice?.status === 'issued' ? item.invoice.number : null
            return (
              <Tr key={item.id}>
                <Td className="whitespace-nowrap" data-testid="payment-row">
                  {formatDate(item.paid_at ?? item.created_at)}
                </Td>
                <Td>{PAYMENT_PURPOSE_LABEL[item.purpose]}</Td>
                <Td align="right" className="whitespace-nowrap tabular-nums">
                  {formatHuf(item.amount)}
                </Td>
                <Td>
                  <Badge kind={STATUS_BADGE[item.status]}>{PAYMENT_STATUS_LABEL[item.status]}</Badge>
                </Td>
                <Td>
                  {number ? (
                    <button
                      type="button"
                      onClick={() => download.mutate({ id: item.id, number })}
                      className="min-h-8 font-mono text-14 text-accent underline underline-offset-4 hover:text-accent-dark"
                      aria-label={`${number} számla letöltése`}
                    >
                      {number}.pdf
                    </button>
                  ) : item.status === 'succeeded' ? (
                    <span className="text-14 text-ink-soft">Számla készül</span>
                  ) : (
                    <span aria-label="Nincs számla">–</span>
                  )}
                </Td>
              </Tr>
            )
          })}
        </tbody>
      </Table>
    </>
  )
}
