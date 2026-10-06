import { http, type Envelope } from '../../shared/api/client'
import type { AuthUser, LoginResponse } from '../../types'

interface Message {
  message: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
  /** Az ÁSZF és az adatkezelési tájékoztató elfogadása, a megjelenített verziókkal (#133). */
  accept_terms: boolean
  terms_version: string
  privacy_version: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export const authKeys = {
  me: ['auth', 'me'] as const,
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  return (await http.post<Envelope<AuthUser>>('/auth/register', payload)).data.data
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return (await http.post<Envelope<LoginResponse>>('/auth/login', { email, password, device_name: 'web' })).data.data
}

export async function logout(): Promise<void> {
  await http.post('/auth/logout')
}

export async function me(signal?: AbortSignal): Promise<AuthUser> {
  return (await http.get<Envelope<AuthUser>>('/auth/me', { signal })).data.data
}

/** A levélben kapott link query paraméterei változatlanul mennek tovább. */
export async function verifyEmail(params: URLSearchParams): Promise<string> {
  const id = encodeURIComponent(params.get('id') ?? '')
  const hash = encodeURIComponent(params.get('hash') ?? '')
  const { data } = await http.get<Message>(`/auth/verify-email/${id}/${hash}`, {
    params: { expires: params.get('expires'), signature: params.get('signature') },
  })
  return data.message
}

export async function resendVerification(): Promise<string> {
  return (await http.post<Message>('/auth/email/verification-notification')).data.message
}

export async function forgotPassword(email: string): Promise<string> {
  return (await http.post<Message>('/auth/forgot-password', { email })).data.message
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<string> {
  return (await http.post<Message>('/auth/reset-password', payload)).data.message
}
