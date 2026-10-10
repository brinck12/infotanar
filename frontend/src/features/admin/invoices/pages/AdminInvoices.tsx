import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { mezoHibak } from '../../../../shared/api/errors'
import { Badge } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { Field, SelectField } from '../../../../shared/ui/Form'
import { Modal } from '../../../../shared/ui/Modal'
import { Pager } from '../../../../shared/ui/Pager'
import { Panel } from '../../../../shared/ui/Panel'
import { LoadError, Skeleton } from '../../../../shared/ui/States'
import type { CustomerType } from '../../../../types'
import { formatHuf } from '../../../billing/format'
import { MutationError } from '../../catalog/components/QueryState'
import { AdminShell } from '../../components/AdminShell'
import { formatDate } from '../../users/format'
import { adminInvoiceKeys, attentionInvoices, correctBuyer, retryInvoice, type AdminInvoice, type BuyerPayload } from '../api'

/**
 * Elakadt számlák (#103): a Számlázz.hu által véglegesen elutasított és a
 * régóta függő számlák. A vevő adatai javíthatók, majd a kiállítás újra-
 * indítható; az újraindítás előbb rendelésszám alapján rákérdez, így egy
 * fizetéshez sosem készül két számla. Minden lépés naplózott.
 */
export function AdminInvoices() {
  const [page, setPage] = useState(1)
  const invoices = useQuery({
    queryKey: adminInvoiceKeys.page(page),
    queryFn: ({ signal }) => attentionInvoices(page, signal),
    placeholderData: keepPreviousData,
  })

  return (
    <AdminShell crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Számlák' }]} title="Sikertelen számlák">
      {invoices.isError ? (
        <LoadError error={invoices.error} onRetry={() => void invoices.refetch()} />
      ) : !invoices.data ? (
        <Skeleton lines={4} />
      ) : invoices.data.data.length === 0 ? (
        <Banner kind="success" title="Nincs elakadt számla">
          Minden sikeres fizetéshez elkészült a számla.
        </Banner>
      ) : (
        <>
          <Banner kind="info">
            {invoices.data.meta.total} számla vár beavatkozásra. A vevő adatait a fizetéskori másolat tartalmazza: javítsd ki, majd indítsd
            újra a kiállítást.
          </Banner>
          <ul className="flex flex-col gap-4">
            {invoices.data.data.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </ul>
          <Pager page={page} lastPage={invoices.data.meta.last_page} onChange={setPage} />
        </>
      )}
    </AdminShell>
  )
}

function InvoiceCard({ invoice }: { invoice: AdminInvoice }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminInvoiceKeys.all })
  const retry = useMutation({ mutationFn: () => retryInvoice(invoice.id), onSettled: refresh })

  return (
    <Panel as="li" data-testid="admin-invoice" data-status={invoice.status}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Badge kind={invoice.status === 'failed' ? 'bad' : 'neutral'}>{invoice.status === 'failed' ? 'Elutasítva' : 'Régóta függő'}</Badge>
        <span className="text-16 font-bold">{formatHuf(invoice.gross_amount)}</span>
        <span className="text-15 text-ink-soft">Fizetve: {formatDate(invoice.payment?.paid_at ?? null)}</span>
        <span className="text-15 text-ink-soft">{invoice.attempts} kísérlet</span>
        {invoice.user && (
          <Link to={`/admin/felhasznalok/${invoice.user.id}`} className="ml-auto inline-flex min-h-8 items-center text-15">
            {invoice.user.name}
          </Link>
        )}
      </div>

      {invoice.last_error && (
        <Banner kind="error" title="A kiállítás hibája" className="mt-4">
          <span className="font-mono text-14" data-testid="invoice-error">
            {invoice.last_error}
          </span>
        </Banner>
      )}

      <p className="mt-4 text-15 leading-relaxed">
        <span className="font-semibold">Vevő:</span> {invoice.buyer.name}, {invoice.buyer.postal_code} {invoice.buyer.city},{' '}
        {invoice.buyer.address_line}
        {invoice.buyer.tax_number ? `, adószám: ${invoice.buyer.tax_number}` : ''}, {invoice.buyer.email}
      </p>

      <div className="mt-4 empty:hidden">
        <MutationError error={retry.error} />
        {retry.isSuccess && <Banner kind="success">Újraindítva. A kiállítás a háttérben fut.</Banner>}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button icon="refresh" busy={retry.isPending} busyLabel="Indítás…" onClick={() => retry.mutate()}>
          Kiállítás újraindítása
        </Button>
        <Button variant="secondary" icon="edit" onClick={() => setEditing(true)}>
          Vevő adatainak javítása
        </Button>
      </div>

      <BuyerDialog invoice={invoice} open={editing} onClose={() => setEditing(false)} />
    </Panel>
  )
}

const CUSTOMER_TYPES = [
  { value: 'person', label: 'Magánszemély' },
  { value: 'company', label: 'Cég vagy egyéni vállalkozó' },
] as const

function BuyerDialog({ invoice, open, onClose }: { invoice: AdminInvoice; open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const formId = useId()
  const [form, setForm] = useState<BuyerPayload>({
    customer_type: invoice.buyer.customer_type,
    name: invoice.buyer.name,
    postal_code: invoice.buyer.postal_code,
    city: invoice.buyer.city,
    address_line: invoice.buyer.address_line,
    tax_number: invoice.buyer.tax_number,
    email: invoice.buyer.email,
  })
  const save = useMutation({
    mutationFn: (payload: BuyerPayload) => correctBuyer(invoice.id, payload),
    onSuccess: onClose,
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminInvoiceKeys.all }),
  })
  const errors = mezoHibak(save.error)
  const set = <K extends keyof BuyerPayload>(key: K, value: BuyerPayload[K]) => setForm((f) => ({ ...f, [key]: value }))
  const isCompany = form.customer_type === 'company'

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate({ ...form, tax_number: isCompany ? form.tax_number : null })
  }

  return (
    <Modal
      open={open}
      size="lg"
      title="Vevő adatainak javítása"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Mégsem
          </Button>
          <Button type="submit" form={formId} busy={save.isPending} busyLabel="Mentés…">
            Javítás mentése
          </Button>
        </>
      }
    >
      <p className="text-15 text-ink-soft">Csak ennek a számlának a vevőadatai változnak, a felhasználó számlázási adatai nem.</p>
      <form id={formId} onSubmit={submit} noValidate className="mt-4 grid gap-4 sm:grid-cols-2" aria-label="Vevő adatainak javítása">
        <div className="empty:hidden sm:col-span-2">
          <MutationError error={save.error} fields={['customer_type', 'name', 'postal_code', 'city', 'address_line', 'tax_number', 'email']} />
        </div>
        <SelectField
          label="Vevő típusa"
          options={CUSTOMER_TYPES}
          value={form.customer_type}
          onChange={(e) => set('customer_type', e.target.value as CustomerType)}
          error={errors.customer_type}
        />
        <Field label={isCompany ? 'Cég neve' : 'Név'} value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
        {isCompany && (
          <Field
            label="Adószám"
            hint="Formátum: 12345678-1-42"
            value={form.tax_number ?? ''}
            onChange={(e) => set('tax_number', e.target.value)}
            error={errors.tax_number}
          />
        )}
        <Field label="Irányítószám" value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} error={errors.postal_code} />
        <Field label="Település" value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} />
        <Field label="Utca, házszám" value={form.address_line} onChange={(e) => set('address_line', e.target.value)} error={errors.address_line} />
        <Field
          label="Számla e-mail-címe"
          type="email"
          hint="Ide küldjük a számlát."
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          error={errors.email}
        />
      </form>
    </Modal>
  )
}
