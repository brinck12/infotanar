import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Field, SubmitButton } from '../../../shared/ui/Form'
import * as authApi from '../api'

/** Várólista a zárt bétában: csak e-mail-cím, a válasz mindig ugyanaz. */
export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const mutation = useMutation({ mutationFn: () => authApi.joinWaitlist(email.trim()) })

  const errors = mezoHibak(mutation.error)
  const generalError = mutation.isError && Object.keys(errors).length === 0 ? hibaUzenet(mutation.error) : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  if (mutation.isSuccess) {
    return (
      <Banner kind="success" title="Felkerültél a várólistára" data-testid="waitlist-done">
        {mutation.data}
      </Banner>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate aria-label="Feliratkozás a várólistára">
      {generalError && <Banner kind="error">{generalError}</Banner>}
      <Field
        label="E-mail-cím a várólistához"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <SubmitButton busy={mutation.isPending} busyLabel="Feliratkozás…">
        Feliratkozom a várólistára
      </SubmitButton>
    </form>
  )
}
