/** Fiok, bejelentkezes, elofizetes es szamlazas valaszainak semai (frontend: types/index.ts, features/billing, features/account). */
import { z } from 'zod'
import { envelope, isoDateTime, paginatedResource } from './common'

export const user = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  pending_email: z.string().nullable(),
  role: z.enum(['student', 'admin']),
  email_verified_at: isoDateTime.nullable(),
  has_password: z.boolean(),
  linked_providers: z.array(z.string()),
  weekly_summary: z.boolean(),
})

/** `GET /auth/me`. */
export const meResponse = envelope(user)

/** `POST /auth/login`. */
export const loginResponse = envelope(
  z.object({
    token: z.string().min(10),
    token_type: z.literal('Bearer'),
    expires_at: isoDateTime.nullable(),
    user,
  })
)

/** `GET /auth/providers`: mely kozossegi belepes van bekapcsolva. */
export const providersResponse = envelope(z.object({ google: z.boolean() }))

/** `GET /progress/rhythm`: a het hete napja; szam es szeria szandekosan nincs. */
export const rhythmResponse = envelope(
  z.object({
    week_start: z.iso.date(),
    today: z.iso.date(),
    days: z.array(z.object({ date: z.iso.date(), active: z.boolean() })).length(7),
    goal_days: z.number().int().min(1).nullable(),
    goal_reached: z.boolean(),
  })
)

/** `GET /billing/plan`. */
export const planResponse = envelope(z.object({ name: z.string(), price_huf: z.number(), period_months: z.number().int() }))

/** `GET /billing/subscription`: nincs elofizetes -> `data: null`. */
export const subscriptionResponse = envelope(
  z
    .object({
      status: z.enum(['active', 'past_due', 'canceled']),
      grants_access: z.boolean(),
      current_period_start: isoDateTime.nullable(),
      current_period_end: isoDateTime.nullable(),
      grace_ends_at: isoDateTime.nullable(),
      cancel_at_period_end: z.boolean(),
    })
    .nullable()
)

/** `GET /billing/profile`: nincs szamlazasi adat -> `data: null`. */
export const billingProfileResponse = envelope(
  z
    .object({
      customer_type: z.enum(['person', 'company']),
      name: z.string(),
      country: z.literal('HU'),
      postal_code: z.string(),
      city: z.string(),
      address_line: z.string(),
      tax_number: z.string().nullable(),
      updated_at: isoDateTime.nullable(),
    })
    .nullable()
)

const paymentSummary = z.object({
  id: z.string(),
  purpose: z.enum(['initial', 'renewal', 'card_change']),
  status: z.enum(['pending', 'succeeded', 'failed', 'canceled', 'expired']),
  is_final: z.boolean(),
  amount: z.number(),
  currency: z.string(),
  paid_at: isoDateTime.nullable(),
  created_at: isoDateTime.nullable(),
  invoice: z.object({ status: z.enum(['pending', 'issued', 'failed']), number: z.string().nullable(), download_url: z.string().nullable() }).nullable().optional(),
})

/** `GET /billing/payments`. */
export const paymentsResponse = paginatedResource(paymentSummary)

/** `GET /account/preferences`: meg nincs mentve -> `data: null`. */
export const preferencesResponse = envelope(
  z.object({ level: z.string(), exam_period: z.string(), language: z.string(), weekly_hours: z.string() }).nullable()
)

/** `GET /account/export` (GDPR adatexport): a gyoker mezok. */
export const accountExportResponse = z.object({
  exported_at: isoDateTime,
  profile: z.object({ id: z.number().int(), name: z.string(), email: z.string(), role: z.enum(['student', 'admin']), email_verified_at: isoDateTime.nullable(), registered_at: isoDateTime }),
  completed_lessons: z.array(z.unknown()),
  submissions: z.array(z.unknown()),
  subscriptions: z.array(z.unknown()),
  billing_profile: z.unknown().nullable(),
  payments: z.array(z.unknown()),
  invoices: z.array(z.unknown()),
  access_grants: z.array(z.object({ reason: z.string(), granted_at: isoDateTime, ends_at: isoDateTime.nullable(), revoked_at: isoDateTime.nullable() })),
  consents: z.array(z.object({ type: z.string(), document_version: z.string(), accepted_at: isoDateTime })),
  preferences: z.unknown().nullable(),
  oral_practice: z.array(z.unknown()),
  file_submissions: z.array(z.unknown()),
  exam_attempts: z.array(z.unknown()),
})
