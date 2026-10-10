import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Field, SubmitButton } from '../../../shared/ui/Form'
import * as authApi from '../api'
import { AuthCard } from '../components/AuthCard'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const mutation = useMutation({ mutationFn: authApi.forgotPassword })

  const fieldError = mezoHibak(mutation.error).email
  const generalError = mutation.isError && !fieldError ? hibaUzenet(mutation.error) : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate(email)
  }

  return (
    <>
      <AuthCard title="Elfelejtett jelszó" lead="Add meg az e-mail-címed, és küldünk egy linket az új jelszó beállításához.">
        {generalError && <Banner kind="error">{generalError}</Banner>}
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <Field
            label="E-mail-cím"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldError}
          />
          <SubmitButton busy={mutation.isPending} busyLabel="Küldés…" size="lg">
            Link küldése
          </SubmitButton>
        </form>
      </AuthCard>
      {/* Mindig ugyanaz a semleges szöveg: nem áruljuk el, hogy van-e ilyen fiók. */}
      {mutation.isSuccess && (
        <Banner kind="success" title="Elküldtük, ha van ilyen fiók" className="mt-6">
          {mutation.data} A link rövid ideig érvényes.
        </Banner>
      )}
      <p className="mt-5 text-15 leading-relaxed">
        <Link to="/bejelentkezes">Vissza a belépéshez</Link>
      </p>
    </>
  )
}
