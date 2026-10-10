import { useMutation } from '@tanstack/react-query'
import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { tokenStore } from '../../../shared/api/tokenStore'
import { Badge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { Field, SubmitButton } from '../../../shared/ui/Form'
import { Modal } from '../../../shared/ui/Modal'
import { Panel } from '../../../shared/ui/Panel'
import { SectionTitle } from '../../../shared/ui/Text'
import { useToast } from '../../../shared/ui/useToast'
import * as authApi from '../../auth/api'
import { useAuth } from '../../auth/context'
import * as accountApi from '../api'

/** Fiókom: profil, e-mail-cím, jelszó, az adataim letöltése és a fiók törlése. */
export function AccountProfile() {
  const { user } = useAuth()
  if (!user) return null

  return (
    <div className="flex max-w-form flex-col gap-6">
      <Section id="profil" title="Profil">
        <NameForm currentName={user.name} />
      </Section>

      <Section id="email" title="E-mail-cím">
        <p className="flex flex-wrap items-center gap-2 text-16">
          <strong className="break-all">{user.email}</strong>
          {user.email_verified_at ? <Badge kind="ok">Megerősítve</Badge> : <Badge kind="draft">Nincs megerősítve</Badge>}
        </p>
        {!user.email_verified_at && <ResendVerification />}
        <ChangeEmail pendingEmail={user.pending_email} />
      </Section>

      <Section id="jelszo" title="Jelszó">
        <ChangePassword />
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

/** A megjelenített név módosítása (#135). */
function NameForm({ currentName }: { currentName: string }) {
  const { refresh } = useAuth()
  const toast = useToast()
  const [name, setName] = useState(currentName)
  const save = useMutation({
    mutationFn: accountApi.updateName,
    onSuccess: async () => {
      await refresh()
      toast.show('A nevedet elmentettük.')
    },
  })

  const nameError = mezoHibak(save.error).name
  const unchanged = name.trim() === currentName

  function submit(event: FormEvent) {
    event.preventDefault()
    save.mutate(name.trim())
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <Field
        label="Név"
        autoComplete="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={nameError ?? (save.isError ? hibaUzenet(save.error) : undefined)}
        hint="Ez jelenik meg a fiókodban és a leveleinkben."
      />
      <div>
        <SubmitButton busy={save.isPending} busyLabel="Mentés…" fullWidth={false} disabled={unchanged || name.trim() === ''}>
          Név mentése
        </SubmitButton>
      </div>
    </form>
  )
}

function ResendVerification() {
  const resend = useMutation({ mutationFn: authApi.resendVerification })

  return (
    <div className="mt-4 flex flex-col gap-3">
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

/**
 * E-mail-cím csere (#135). A belépés a régi címmel megy, amíg az új címre
 * küldött linket meg nem nyitják; addig az új cím megerősítésre vár.
 */
function ChangeEmail({ pendingEmail }: { pendingEmail: string | null }) {
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
    <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4 border-t border-grid pt-5">
      <h3 className="text-18 font-bold">Új e-mail-cím beállítása</h3>
      {pendingEmail && (
        <Banner kind="info" title="Megerősítésre vár" data-testid="pending-email">
          Nyisd meg a(z) <strong className="break-all">{pendingEmail}</strong> címre küldött levélben lévő linket. Addig a jelenlegi
          címeddel tudsz belépni.
        </Banner>
      )}
      {request.isSuccess && <Banner kind="success">{request.data}</Banner>}
      {generalError && <Banner kind="error">{generalError}</Banner>}
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
      <div>
        <SubmitButton busy={request.isPending} busyLabel="Küldés…" fullWidth={false}>
          Megerősítő levél kérése
        </SubmitButton>
      </div>
    </form>
  )
}

const EMPTY_PASSWORD: accountApi.ChangePasswordPayload = { current_password: '', password: '', password_confirmation: '' }

/** Jelszócsere (#135): a többi eszközön kijelentkeztet, ezen a munkameneten nem. */
function ChangePassword() {
  const [form, setForm] = useState(EMPTY_PASSWORD)
  const change = useMutation({ mutationFn: accountApi.changePassword, onSuccess: () => setForm(EMPTY_PASSWORD) })

  const errors = mezoHibak(change.error)
  const generalError = change.isError && Object.keys(errors).length === 0 ? hibaUzenet(change.error) : null

  const set = (field: keyof accountApi.ChangePasswordPayload) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  function submit(event: FormEvent) {
    event.preventDefault()
    change.mutate(form)
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <p className="text-16 leading-relaxed text-ink-soft">A jelszócsere után a többi eszközödön újra be kell lépned; itt bejelentkezve maradsz.</p>
      {change.isSuccess && <Banner kind="success">{change.data}</Banner>}
      {generalError && <Banner kind="error">{generalError}</Banner>}
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
        hint="Legalább 8 karakter, benne betű és szám is legyen."
      />
      <Field
        label="Új jelszó újra"
        type="password"
        autoComplete="new-password"
        required
        value={form.password_confirmation}
        onChange={set('password_confirmation')}
        error={errors.password_confirmation}
      />
      <div>
        <SubmitButton busy={change.isPending} busyLabel="Mentés…" fullWidth={false}>
          Jelszó módosítása
        </SubmitButton>
      </div>
    </form>
  )
}

function DataExport() {
  const toast = useToast()
  const download = useMutation({ mutationFn: accountApi.downloadMyData, onSuccess: () => toast.show('Az adataidat letöltöttük.') })

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
  const { refresh } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')

  const remove = useMutation({
    mutationFn: () => accountApi.deleteMyAccount(password),
    onSuccess: async () => {
      // A szerver már visszavonta a tokent; a kliens állapotát is kijelentkezettre állítjuk.
      tokenStore.set(null)
      await refresh()
      navigate('/', { replace: true })
      toast.show('A fiókodat töröltük.')
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
