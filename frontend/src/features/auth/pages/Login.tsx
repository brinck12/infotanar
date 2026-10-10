import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Field, SubmitButton } from '../../../shared/ui/Form'
import { AuthCard } from '../components/AuthCard'
import { useAuth } from '../context'

/** Sikeres belépés után a GuestOnly guard visz tovább (a `from` helyre vagy a feladatokhoz). */
export function Login() {
  const { login, sessionExpired } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({ mutationFn: () => login(email, password) })

  const errors = mezoHibak(mutation.error)
  const generalError = mutation.isError && Object.keys(errors).length === 0 ? hibaUzenet(mutation.error) : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <AuthCard
      title="Belépés"
      lead="Folytasd ott, ahol abbahagytad."
      footer={
        <>
          Még nincs fiókod? <Link to="/regisztracio">Regisztrálj</Link>, ingyenes.
        </>
      }
    >
      {sessionExpired && !generalError && <Banner kind="info">A munkameneted lejárt, lépj be újra.</Banner>}
      {generalError && <Banner kind="error">{generalError}</Banner>}
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <Field
          label="E-mail-cím"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <Field
          label="Jelszó"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          labelAction={<Link to="/elfelejtett-jelszo">Elfelejtetted?</Link>}
        />
        <SubmitButton busy={mutation.isPending} busyLabel="Belépés…" size="lg">
          Belépés
        </SubmitButton>
      </form>
    </AuthCard>
  )
}
