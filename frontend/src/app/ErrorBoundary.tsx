import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Crashed } from '../features/system/ErrorPage'
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

    return <Crashed />
  }
}
