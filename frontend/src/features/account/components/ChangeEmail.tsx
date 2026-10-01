import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Alert, Field, SubmitButton } from '../../../shared/ui/Form'
import { useAuth } from '../../auth/context'
import * as accountApi from '../api'
import { AccountSection } from './AccountSection'

/**
 * E-mail-cím csere (#135). A belépés a régi címmel megy, amíg az új címre
 * küldött linket meg nem nyitják; addig az új cím „megerősítésre vár".
 */
export function ChangeEmail({ pendingEmail }: { pendingEmail: string | null }) {
  const { refresh } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const request = useMutation({
    mutationFn: accountApi.requestEmailChange,
    onSuccess: async () => {
      setEmail('')
      setPassword('')
      await refresh()
    },
  })

  const errors = mezoHibak(request.error)
  const generalError = request.isError && Object.keys(errors).length === 0 ? hibaUzenet(request.error) : null

  function submit(event: FormEvent) {
    event.preventDefault()
    request.mutate({ email, current_password: password })
  }

  return (
    <AccountSection title="E-mail-cím módosítása">
      {pendingEmail && (
        <Alert kind="info">
          Megerősítésre vár: <span className="break-all font-medium">{pendingEmail}</span>. Nyisd meg az oda küldött
          levélben lévő linket; addig a jelenlegi címeddel tudsz belépni.
        </Alert>
      )}
      {request.isSuccess && <Alert kind="success">{request.data}</Alert>}
      {generalError && <Alert kind="error">{generalError}</Alert>}

      <form onSubmit={submit} noValidate className="space-y-3">
        <Field
          label="Új e-mail-cím"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label="Jelenlegi jelszó"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.current_password}
        />
        <SubmitButton busy={request.isPending} fullWidth={false}>
          {request.isPending ? 'Küldés…' : 'Megerősítő levél kérése'}
        </SubmitButton>
      </form>
    </AccountSection>
  )
}
