import type { AuthUser, LoginResponse } from '../types'
import { client } from './client'

interface Envelope<T> {
  data: T
}

interface Message {
  message: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await client.post<Envelope<AuthUser>>('/auth/register', payload)
  return data.data
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await client.post<Envelope<LoginResponse>>('/auth/login', { email, password, device_name: 'web' })
  return data.data
}

export async function logout(): Promise<void> {
  await client.post('/auth/logout')
}

export async function me(): Promise<AuthUser> {
  const { data } = await client.get<Envelope<AuthUser>>('/auth/me')
  return data.data
}

/** A levélben kapott link query paraméterei változatlanul mennek tovább. */
export async function verifyEmail(params: URLSearchParams): Promise<string> {
  const id = params.get('id') ?? ''
  const hash = params.get('hash') ?? ''
  const { data } = await client.get<Message>(`/auth/verify-email/${encodeURIComponent(id)}/${encodeURIComponent(hash)}`, {
    params: { expires: params.get('expires'), signature: params.get('signature') },
  })
  return data.message
}

export async function resendVerification(): Promise<string> {
  const { data } = await client.post<Message>('/auth/email/verification-notification')
  return data.message
}

export async function forgotPassword(email: string): Promise<string> {
  const { data } = await client.post<Message>('/auth/forgot-password', { email })
  return data.message
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<string> {
  const { data } = await client.post<Message>('/auth/reset-password', payload)
  return data.message
}
