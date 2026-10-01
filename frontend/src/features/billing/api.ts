import { http, type Envelope } from '../../shared/api/client'
import type { BillingProfile, BillingProfilePayload, HostedCheckout, Plan, Subscription } from '../../types'

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

export async function checkout(): Promise<HostedCheckout> {
  return (await http.post<Envelope<HostedCheckout>>('/billing/checkout')).data.data
}
