import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Icon } from './Icon'
import { ToastContext, type ToastApi, type ToastKind } from './useToast'

const VISIBLE_MS = 5000

interface ToastState {
  id: number
  message: string
  kind: ToastKind
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)

  const show = useCallback<ToastApi['show']>((message, kind = 'ok') => {
    setToast({ id: Date.now(), message, kind })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), VISIBLE_MS)
    return () => window.clearTimeout(timer)
  }, [toast])

  const api = useMemo<ToastApi>(() => ({ show }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <div
            key={toast.id}
            data-testid="toast"
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-ink px-5 py-3 text-15 font-semibold text-sheet shadow-modal"
          >
            <Icon name={toast.kind === 'ok' ? 'check' : 'warn'} size={18} />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
