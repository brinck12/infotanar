import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../../shared/api/errors'
import { Alert, Field, SelectField, SubmitButton } from '../../../../shared/ui/Form'
import type { CustomerType } from '../../../../types'
import { formatHuf } from '../../../billing/format'
import { MutationError } from '../../catalog/components/QueryState'
import { AdminShell, StatusPill } from '../../components/AdminShell'
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
    <AdminShell crumbs={[{ label: 'Admin' }, { label: 'Számlák' }]} title="Figyelmet igénylő számlák">
      {invoices.isError ? (
        <Alert kind="error">{hibaUzenet(invoices.error)}</Alert>
      ) : !invoices.data ? (
        <p className="text-sm text-slate-400">Betöltés…</p>
      ) : invoices.data.data.length === 0 ? (
        <Alert kind="success">Nincs elakadt számla: minden sikeres fizetéshez elkészült a számla.</Alert>
      ) : (
        <>
          <p className="text-sm text-slate-400">
            {invoices.data.meta.total} számla vár beavatkozásra. A vevő adatait a fizetéskori másolat tartalmazza; javítás után indítsd újra a
            kiállítást.
          </p>
          <ul className="space-y-4">
            {invoices.data.data.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </ul>
          {invoices.data.meta.last_page > 1 && (
            <nav aria-label="Lapozás" className="flex justify-between text-sm">
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-slate-300 disabled:opacity-30">
                ← Előző
              </button>
              <button
                type="button"
                disabled={page >= invoices.data.meta.last_page}
                onClick={() => setPage(page + 1)}
                className="text-slate-300 disabled:opacity-30"
              >
                Következő →
              </button>
            </nav>
          )}
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
    <li className="space-y-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm" data-testid="admin-invoice" data-status={invoice.status}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={invoice.status === 'failed' ? 'draft' : 'info'}>{invoice.status === 'failed' ? 'Elutasítva' : 'Régóta függő'}</StatusPill>
        <span className="font-medium text-slate-100">{formatHuf(invoice.gross_amount)}</span>
        <span className="text-slate-400">· fizetve: {formatDate(invoice.payment?.paid_at ?? null)}</span>
        <span className="text-slate-400">· {invoice.attempts} kísérlet</span>
        {invoice.user && (
          <Link to={`/admin/felhasznalok/${invoice.user.id}`} className="ml-auto text-sky-400 hover:underline">
            {invoice.user.name}
          </Link>
        )}
      </div>

      {invoice.last_error && (
        <p className="rounded border border-red-900 bg-red-950/50 p-2 font-mono text-xs text-red-200" data-testid="invoice-error">
          {invoice.last_error}
        </p>
      )}

      <p className="text-slate-300">
        Vevő: {invoice.buyer.name}, {invoice.buyer.postal_code} {invoice.buyer.city}, {invoice.buyer.address_line}
        {invoice.buyer.tax_number ? ` · adószám: ${invoice.buyer.tax_number}` : ''} · {invoice.buyer.email}
      </p>

      <MutationError error={retry.error} />
      {retry.isSuccess && <Alert kind="info">Újraindítva; a kiállítás a háttérben fut.</Alert>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => retry.mutate()}
          disabled={retry.isPending}
          className="rounded-lg bg-sky-700 px-3 py-1.5 text-white hover:bg-sky-600 disabled:opacity-60"
        >
          {retry.isPending ? 'Indítás…' : 'Kiállítás újraindítása'}
        </button>
        <button type="button" onClick={() => setEditing((v) => !v)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800">
          {editing ? 'Mégse' : 'Vevő adatainak javítása'}
        </button>
      </div>

      {editing && <BuyerForm invoice={invoice} onSaved={() => setEditing(false)} />}
    </li>
  )
}

const CUSTOMER_TYPES = [
  { value: 'person', label: 'Magánszemély' },
  { value: 'company', label: 'Cég vagy egyéni vállalkozó' },
] as const

function BuyerForm({ invoice, onSaved }: { invoice: AdminInvoice; onSaved: () => void }) {
  const queryClient = useQueryClient()
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
    onSuccess: onSaved,
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
    <form onSubmit={submit} noValidate className="grid gap-3 border-t border-slate-800 pt-3 sm:grid-cols-2" aria-label="Vevő adatainak javítása">
      <div className="sm:col-span-2">
        <MutationError error={save.error} fields={['customer_type', 'name', 'postal_code', 'city', 'address_line', 'tax_number', 'email']} />
      </div>
      <SelectField
        label="Vevő típusa"
        options={CUSTOMER_TYPES}
        value={form.customer_type}
        onChange={(e) => set('customer_type', e.target.value as CustomerType)}
        error={errors.customer_type}
      />
      <Field label={isCompany ? 'Cégnév' : 'Név'} value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
      {isCompany && (
        <Field label="Adószám" value={form.tax_number ?? ''} onChange={(e) => set('tax_number', e.target.value)} error={errors.tax_number} />
      )}
      <Field label="Irányítószám" value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} error={errors.postal_code} />
      <Field label="Település" value={form.city} onChange={(e) => set('city', e.target.value)} error={errors.city} />
      <Field label="Utca, házszám" value={form.address_line} onChange={(e) => set('address_line', e.target.value)} error={errors.address_line} />
      <Field label="E-mail (ide küldi a számlát)" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
      <div className="sm:col-span-2">
        <SubmitButton busy={save.isPending} fullWidth={false}>
          {save.isPending ? 'Mentés…' : 'Javítás mentése'}
        </SubmitButton>
      </div>
    </form>
  )
}
