import { createContext, useContext } from 'react'

export type ToastKind = 'ok' | 'error'

export interface ToastApi {
  /** Rövid visszajelzés a képernyő alján; néhány másodperc múlva eltűnik. */
  show: (message: string, kind?: ToastKind) => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast csak ToastProvideren belül használható')
  return ctx
}
