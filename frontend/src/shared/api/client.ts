import axios from 'axios'
import { env } from '../config/env'
import { tokenStore } from './tokenStore'

export interface Envelope<T> {
  data: T
}

export const http = axios.create({
  baseURL: env.apiUrl,
  headers: { Accept: 'application/json' },
  // A kódfuttatás szinkron, több tesztesettel is elmehet fél percig.
  timeout: 60_000,
})

http.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
