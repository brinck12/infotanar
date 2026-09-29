import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as authApi from '../../api/auth'
import { hibaUzenet } from '../../api/client'
import { useAuth } from '../../auth/context'
import { Alert, AuthCard } from '../../components/Form'

type State = { kind: 'loading' } | { kind: 'success'; message: string } | { kind: 'error'; message: string }

export function VerifyEmail() {
  const [params] = useSearchParams()
  const { refresh } = useAuth()
  const [state, setState] = useState<State>({ kind: 'loading' })
  // StrictMode alatt az effekt kétszer fut; a linket elég egyszer beváltani.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    authApi
      .verifyEmail(params)
      .then(async (message) => {
        setState({ kind: 'success', message })
        await refresh()
      })
      .catch((err: unknown) => setState({ kind: 'error', message: hibaUzenet(err) }))
  }, [params, refresh])

  return (
    <AuthCard title="E-mail-cím megerősítése">
      {state.kind === 'loading' && <p className="text-slate-400">Megerősítés folyamatban…</p>}
      {state.kind === 'success' && (
        <>
          <Alert kind="success">{state.message}</Alert>
          <Link to="/feladatok" className="inline-block text-sky-400 hover:underline">
            Tovább a feladatokhoz
          </Link>
        </>
      )}
      {state.kind === 'error' && (
        <>
          <Alert kind="error">{state.message}</Alert>
          <p className="text-sm text-slate-400">Jelentkezz be, és kérj új megerősítő levelet a fejlécben.</p>
        </>
      )}
    </AuthCard>
  )
}
