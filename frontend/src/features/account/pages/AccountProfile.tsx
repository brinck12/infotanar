import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { tokenStore } from '../../../shared/api/tokenStore'
import { Badge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { Field } from '../../../shared/ui/Form'
import { Modal } from '../../../shared/ui/Modal'
import { Panel } from '../../../shared/ui/Panel'
import { SectionTitle } from '../../../shared/ui/Text'
import { useToast } from '../../../shared/ui/useToast'
import * as authApi from '../../auth/api'
import { useAuth } from '../../auth/context'
import { deleteAccount, exportAccountData } from '../api'

/** Fiókom: profil, e-mail-cím, jelszó, az adataim letöltése és a fiók törlése. */
export function AccountProfile() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="flex max-w-form flex-col gap-6">
      <Section id="profil" title="Profil">
        <dl className="text-16">
          <Row term="Név">{user.name}</Row>
          <Row term="E-mail-cím">
            <span className="flex flex-wrap items-center justify-end gap-2">
              {user.email}
              {user.email_verified_at ? <Badge kind="ok">Megerősítve</Badge> : <Badge kind="draft">Nincs megerősítve</Badge>}
            </span>
          </Row>
        </dl>
        {!user.email_verified_at && <ResendVerification />}
      </Section>

      <Section id="jelszo" title="Jelszó">
        <PasswordReset email={user.email} />
      </Section>

      <Section id="adataim" title="Az adataim">
        <DataExport />
      </Section>

      <Section id="torles" title="Fiók törlése" danger>
        <DeleteAccount />
      </Section>
    </div>
  )
}

function Section({ id, title, danger = false, children }: { id: string; title: string; danger?: boolean; children: ReactNode }) {
  return (
    <Panel as="section" pad="xl" aria-labelledby={id} className={danger ? 'border-wrong' : undefined}>
      <SectionTitle id={id} className="text-24">
        {title}
      </SectionTitle>
      <div className="mt-4">{children}</div>
    </Panel>
  )
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-grid py-3">
      <dt className="text-ink-soft">{term}</dt>
      <dd className="font-semibold">{children}</dd>
    </div>
  )
}

function ResendVerification() {
  const resend = useMutation({ mutationFn: authApi.resendVerification })

  return (
    <div className="mt-2 flex flex-col gap-3">
      {resend.isSuccess && <Banner kind="success">{resend.data}</Banner>}
      {resend.isError && <Banner kind="error">{hibaUzenet(resend.error)}</Banner>}
      <div>
        <Button variant="secondary" busy={resend.isPending} busyLabel="Küldés…" onClick={() => resend.mutate()}>
          Megerősítő levél újraküldése
        </Button>
      </div>
    </div>
  )
}

function PasswordReset({ email }: { email: string }) {
  const reset = useMutation({ mutationFn: () => authApi.forgotPassword(email) })

  return (
    <>
      <p className="text-16 leading-relaxed text-ink-soft">
        Küldünk egy linket a <strong className="text-ink">{email}</strong> címre, azzal állíthatsz be új jelszót. A link rövid ideig
        érvényes.
      </p>
      {reset.isSuccess && (
        <Banner kind="success" className="mt-4">
          {reset.data}
        </Banner>
      )}
      {reset.isError && (
        <Banner kind="error" className="mt-4">
          {hibaUzenet(reset.error)}
        </Banner>
      )}
      <Button variant="secondary" icon="mail" busy={reset.isPending} busyLabel="Küldés…" onClick={() => reset.mutate()} className="mt-4">
        Jelszó-visszaállító levél küldése
      </Button>
    </>
  )
}

function DataExport() {
  const toast = useToast()
  const download = useMutation({ mutationFn: exportAccountData, onSuccess: () => toast.show('Az adataidat letöltöttük.') })

  return (
    <>
      <p className="text-16 leading-relaxed text-ink-soft">
        Letöltheted a rólad tárolt adatokat: profil, haladás, beadott megoldások és fizetések. A letöltés óránként néhányszor kérhető.
      </p>
      {download.isError && (
        <Banner kind="error" className="mt-4">
          {hibaUzenet(download.error)}
        </Banner>
      )}
      <Button variant="secondary" icon="download" busy={download.isPending} busyLabel="Letöltés…" onClick={() => download.mutate()} className="mt-4">
        Adatok letöltése (JSON)
      </Button>
    </>
  )
}

function DeleteAccount() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')

  const remove = useMutation({
    mutationFn: () => deleteAccount(password),
    onSuccess: () => {
      // A fiók megszűnt: a token érvénytelen, minden felhasználóhoz kötött adatot eldobunk.
      tokenStore.set(null)
      queryClient.clear()
      navigate('/', { replace: true })
      window.location.reload()
    },
  })
  const passwordError = mezoHibak(remove.error).password
  const generalError = remove.isError && !passwordError ? hibaUzenet(remove.error) : null

  function submit(e: FormEvent) {
    e.preventDefault()
    remove.mutate()
  }

  function close() {
    setOpen(false)
    setPassword('')
    remove.reset()
  }

  return (
    <>
      <p className="text-16 leading-relaxed text-ink-soft">
        A fiókod és a haladásod véglegesen törlődik, az előfizetésed megszűnik. A kiállított számlákat a jogszabály szerint megőrizzük.
      </p>
      <Button variant="danger" icon="trash" onClick={() => setOpen(true)} className="mt-4">
        Fiók törlése
      </Button>

      <Modal
        open={open}
        title="Biztosan törlöd a fiókod?"
        onClose={close}
        actions={
          <>
            <Button variant="secondary" onClick={close}>
              Mégsem
            </Button>
            <Button type="submit" form={formId} variant="danger" icon="trash" busy={remove.isPending} busyLabel="Törlés…">
              Törlöm a fiókom
            </Button>
          </>
        }
      >
        <p>Ezt nem lehet visszavonni. A haladásod, a beadott megoldásaid és a hozzáférésed is megszűnik.</p>
        <form id={formId} onSubmit={submit} noValidate className="mt-4 flex flex-col gap-3">
          {generalError && <Banner kind="error">{generalError}</Banner>}
          <Field
            label="Jelszavad megerősítésként"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />
        </form>
      </Modal>
    </>
  )
}
