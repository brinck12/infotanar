import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { ButtonLink } from '../../../shared/ui/Button'
import { Field, SubmitButton } from '../../../shared/ui/Form'
import * as authApi from '../api'
import { AuthCard } from '../components/AuthCard'

export function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''

  if (!token || !email) {
    return (
      <AuthCard title="Új jelszó beállítása">
        <Banner kind="error">A link hiányos. Kérj új visszaállító linket.</Banner>
        <ButtonLink to="/elfelejtett-jelszo" variant="secondary">
          Új link kérése
        </ButtonLink>
      </AuthCard>
    )
  }

  return <ResetPasswordForm token={token} email={email} />
}

function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const mutation = useMutation({ mutationFn: authApi.resetPassword })

  // A token/email hibája nem egy kitölthető mezőhöz tartozik, ezért felül jelenik meg.
  const { token: tokenError, email: emailError, ...fieldErrors } = mezoHibak(mutation.error)
  const linkError = tokenError ?? emailError
  const generalError =
    linkError ?? (mutation.isError && Object.keys(fieldErrors).length === 0 ? hibaUzenet(mutation.error) : null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate({ token, email, password, password_confirmation: confirmation })
  }

  if (mutation.isSuccess) {
    return (
      <AuthCard icon="check" title="Az új jelszavad elmentve" lead={mutation.data}>
        <ButtonLink to="/bejelentkezes">Belépés</ButtonLink>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Új jelszó beállítása"
      lead={
        <>
          Válassz új jelszót a <strong className="text-ink">{email}</strong> fiókhoz. A régi jelszóval nem tudsz majd belépni.
        </>
      }
    >
      {generalError && (
        <Banner kind="error" action={<Link to="/elfelejtett-jelszo">Új link kérése</Link>}>
          {generalError}
        </Banner>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <Field
          label="Új jelszó"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="Legalább 8 karakter, benne betű és szám is legyen."
        />
        <Field
          label="Új jelszó újra"
          type="password"
          autoComplete="new-password"
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          error={fieldErrors.password_confirmation}
        />
        <SubmitButton busy={mutation.isPending} busyLabel="Mentés…" size="lg">
          Jelszó mentése
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
