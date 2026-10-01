import { http, type Envelope } from '../../shared/api/client'
import type { BillingProfile, BillingProfilePayload, HostedCheckout, PaymentSummary, Plan, Subscription } from '../../types'

export const billingKeys = {
  all: ['billing'] as const,
  plan: ['billing', 'plan'] as const,
  profile: ['billing', 'profile'] as const,
  subscription: ['billing', 'subscription'] as const,
}

export async function plan(signal?: AbortSignal): Promise<Plan> {
  return (await http.get<Envelope<Plan>>('/billing/plan', { signal })).data.data
}

export async function profile(signal?: AbortSignal): Promise<BillingProfile | null> {
  return (await http.get<Envelope<BillingProfile | null>>('/billing/profile', { signal })).data.data
}

export async function saveProfile(payload: BillingProfilePayload): Promise<BillingProfile> {
  return (await http.put<Envelope<BillingProfile>>('/billing/profile', payload)).data.data
}

export async function subscription(signal?: AbortSignal): Promise<Subscription | null> {
  return (await http.get<Envelope<Subscription | null>>('/billing/subscription', { signal })).data.data
}

export interface CheckoutPayload {
  /** A vásárló kéri, hogy a szolgáltatás a fizetés után azonnal induljon (#133). */
  accept_immediate_performance: boolean
  terms_version: string
}

export async function checkout(payload: CheckoutPayload): Promise<HostedCheckout> {
  return (await http.post<Envelope<HostedCheckout>>('/billing/checkout', payload)).data.data
}

export const paymentKeys = {
  list: (page: number) => ['billing', 'payments', page] as const,
  one: (id: string) => ['billing', 'payment', id] as const,
}

export async function payment(id: string, signal?: AbortSignal): Promise<PaymentSummary> {
  return (await http.get<Envelope<PaymentSummary>>(`/billing/payments/${encodeURIComponent(id)}`, { signal })).data.data
}

export interface PaymentPage {
  data: PaymentSummary[]
  meta: { current_page: number; last_page: number; total: number }
}

export async function payments(page: number, signal?: AbortSignal): Promise<PaymentPage> {
  return (await http.get<PaymentPage>('/billing/payments', { params: { page }, signal })).data
}

export async function cancelSubscription(): Promise<Subscription> {
  return (await http.post<Envelope<Subscription>>('/billing/subscription/cancel')).data.data
}

export async function resumeSubscription(): Promise<Subscription> {
  return (await http.post<Envelope<Subscription>>('/billing/subscription/resume')).data.data
}

export async function changeCard(): Promise<HostedCheckout> {
  return (await http.post<Envelope<HostedCheckout>>('/billing/subscription/card')).data.data
}

/**
 * A számla PDF letöltése. Az API Bearer tokent vár, ezért sima link helyett
 * blobként kérjük le, és a böngésző letöltéseként mentjük.
 */
export async function downloadInvoice(paymentId: string, invoiceNumber: string): Promise<void> {
  const response = await http.get<Blob>(`/billing/payments/${encodeURIComponent(paymentId)}/invoice`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = `szamla-${invoiceNumber}.pdf`
    link.click()
  } finally {
    // A kattintás szinkron indítja a letöltést; utána az URL felszabadítható.
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}
