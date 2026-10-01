import { http, type Envelope } from '../../../shared/api/client'
import type { CustomerType } from '../../../types'

/** A számla kiállításkori vevő-másolata (#20). */
export interface InvoiceBuyer {
  customer_type: CustomerType
  name: string
  country: string
  postal_code: string
  city: string
  address_line: string
  tax_number: string | null
  email: string
}

/** Figyelmet igénylő számla (#103): véglegesen elutasított, vagy egy napnál régebben függő. */
export interface AdminInvoice {
  id: number
  status: 'pending' | 'issued' | 'failed'
  invoice_number: string | null
  buyer: InvoiceBuyer
  gross_amount: number
  currency: string
  attempts: number
  last_error: string | null
  created_at: string | null
  updated_at: string | null
  payment: { id: string; purpose: string; paid_at: string | null } | null
  user: { id: number; name: string; email: string } | null
}

export interface InvoicePage {
  data: AdminInvoice[]
  meta: { current_page: number; last_page: number; total: number }
}

export const adminInvoiceKeys = {
  all: ['admin', 'invoices'] as const,
  page: (page: number) => [...adminInvoiceKeys.all, page] as const,
}

export async function attentionInvoices(page: number, signal?: AbortSignal): Promise<InvoicePage> {
  return (await http.get<InvoicePage>('/admin/invoices', { params: { page }, signal })).data
}

export type BuyerPayload = Omit<InvoiceBuyer, 'country'>

export async function correctBuyer(id: number, buyer: BuyerPayload): Promise<AdminInvoice> {
  return (await http.put<Envelope<AdminInvoice>>(`/admin/invoices/${id}/buyer`, buyer)).data.data
}

export async function retryInvoice(id: number): Promise<AdminInvoice> {
  return (await http.post<Envelope<AdminInvoice>>(`/admin/invoices/${id}/retry`)).data.data
}
