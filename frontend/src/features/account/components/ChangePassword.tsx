import { useMutation } from '@tanstack/react-query'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Alert, Field, SubmitButton } from '../../../shared/ui/Form'
import * as accountApi from '../api'
import { AccountSection } from './AccountSection'

const EMPTY: accountApi.ChangePasswordPayload = { current_password: '', password: '', password_confirmation: '' }

/** Jelszócsere (#135): a többi eszközön kijelentkeztet, ezen a munkameneten nem. */
export function ChangePassword() {
  const [form, setForm] = useState(EMPTY)
  const change = useMutation({ mutationFn: accountApi.changePassword, onSuccess: () => setForm(EMPTY) })

  const errors = mezoHibak(change.error)
  const generalError = change.isError && Object.keys(errors).length === 0 ? hibaUzenet(change.error) : null

  const set = (field: keyof accountApi.ChangePasswordPayload) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  function submit(event: FormEvent) {
    event.preventDefault()
    change.mutate(form)
  }

  return (
    <AccountSection title="Jelszó módosítása">
      {change.isSuccess && <Alert kind="success">{change.data}</Alert>}
      {generalError && <Alert kind="error">{generalError}</Alert>}

      <form onSubmit={submit} noValidate className="space-y-3">
        <Field
          label="Jelenlegi jelszó"
          type="password"
          autoComplete="current-password"
          required
          value={form.current_password}
          onChange={set('current_password')}
          error={errors.current_password}
        />
        <Field
          label="Új jelszó"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="Legalább 8 karakter, betűvel és számmal."
        />
        <Field
          label="Új jelszó még egyszer"
          type="password"
          autoComplete="new-password"
          required
          value={form.password_confirmation}
          onChange={set('password_confirmation')}
          error={errors.password_confirmation}
        />
        <SubmitButton busy={change.isPending} fullWidth={false}>
          {change.isPending ? 'Mentés…' : 'Jelszó módosítása'}
        </SubmitButton>
      </form>
    </AccountSection>
  )
}
