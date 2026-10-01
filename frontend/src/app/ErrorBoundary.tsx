import { Component, type ErrorInfo, type ReactNode } from 'react'
import { reportError } from '../shared/api/reportError'

interface State {
  error: Error | null
}

/**
 * Egy komponens renderelési hibája ne vigye el az egész oldalt fehér
 * képernyővel: érthető üzenet és újratöltés gomb jelenik meg helyette.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Nem kezelt renderelési hiba', error, info.componentStack)
    reportError(error, info.componentStack)
  }

  override render() {
    if (!this.state.error) return this.props.children

    return (
      <div role="alert" className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-xl font-semibold text-slate-100">Valami elromlott</h1>
        <p className="mt-2 text-slate-300">Váratlan hiba történt az oldal megjelenítésekor.</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-lg bg-sky-700 px-5 py-2.5 font-medium text-white transition hover:bg-sky-600"
        >
          Oldal újratöltése
        </button>
      </div>
    )
  }
}
