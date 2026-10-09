import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { Badge } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { TextAreaField } from '../../../../shared/ui/Form'
import { Modal } from '../../../../shared/ui/Modal'
import type { Role } from '../../../../types'
import { useAuth } from '../../../auth/context'
import { MutationError } from '../../catalog/components/QueryState'
import { ConfirmAction } from '../../components/ConfirmAction'
import { adminUserKeys, changeRole, resendVerification, revokeTokens, sendPasswordReset, verifyEmail, type AdminUser } from '../api'

/** Egy művelet, amit az admin a felhasználó fiókján kérhet. A szerver minden hívást naplóz. */
type UserAction =
  | { kind: 'role'; role: Role }
  | { kind: 'resend-verification' }
  | { kind: 'verify-email'; reason: string }
  | { kind: 'revoke-tokens' }
  | { kind: 'password-reset' }

function perform(userId: number, action: UserAction): Promise<void> {
  switch (action.kind) {
    case 'role':
      return changeRole(userId, action.role)
    case 'resend-verification':
      return resendVerification(userId)
    case 'verify-email':
      return verifyEmail(userId, action.reason)
    case 'revoke-tokens':
      return revokeTokens(userId)
    case 'password-reset':
      return sendPasswordReset(userId)
  }
}

function successMessage(action: UserAction): string {
  switch (action.kind) {
    case 'role':
      return action.role === 'admin' ? 'A felhasználó mostantól admin.' : 'A felhasználó admin joga megszűnt.'
    case 'resend-verification':
      return 'A megerősítő levelet újra elküldtük.'
    case 'verify-email':
      return 'Az e-mail-címet megerősítettük.'
    case 'revoke-tokens':
      return 'Minden munkamenetet lezártunk. A felhasználónak újra be kell lépnie.'
    case 'password-reset':
      return 'A jelszó-visszaállító levelet elküldtük.'
  }
}

/**
 * Ügyfélszolgálati műveletek (#162): szerepkör, megerősítő levél, kézi
 * megerősítés, munkamenetek lezárása és jelszó-visszaállító levél. Az admin
 * jelszót nem állít be. Saját fiókon a szerver is megtagadja ezeket, ezért
 * itt egyáltalán nem kínáljuk fel őket.
 */
export function UserActions({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient()
  const { user: me } = useAuth()
  const [notice, setNotice] = useState<string | null>(null)

  // Egyetlen mutáció: egyszerre egy művelet fut, és a hiba mindig az utolsóé.
  const action = useMutation({
    mutationFn: (request: UserAction) => perform(user.id, request),
    onMutate: () => setNotice(null),
    onSuccess: (_data, request) => setNotice(successMessage(request)),
    // A részletek (szerep, megerősítés), a lista és az előzmények is frissüljenek.
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
  })

  if (me?.id === user.id) {
    return <p className="text-15 text-ink-soft">A saját fiókodon ezeket a műveleteket nem végezheted el.</p>
  }

  const isAdmin = user.role === 'admin'
  const unverified = user.email_verified_at === null
  const busy = action.isPending

  return (
    <div data-testid="user-actions">
      {notice && (
        <Banner kind="success" className="mb-4">
          {notice}
        </Banner>
      )}
      {action.variables?.kind !== 'verify-email' && <MutationError error={action.error} />}

      <ul>
        <ActionRow
          title="Szerepkör"
          description={isAdmin ? 'Az adminok a teljes felületet kezelik.' : 'A tanuló a tananyagot használja, a felületet nem kezeli.'}
          badge={<Badge kind={isAdmin ? 'admin' : 'neutral'}>{isAdmin ? 'Admin' : 'Tanuló'}</Badge>}
        >
          <ConfirmAction
            label={isAdmin ? 'Admin jog elvétele' : 'Kinevezés adminná'}
            question={
              isAdmin
                ? `${user.name} elveszíti az admin jogot, és csak tanulóként használhatja az oldalt.`
                : `${user.name} a teljes admin felületet kezelheti, a felhasználókat és a számlákat is.`
            }
            confirmLabel={isAdmin ? 'Elveszem' : 'Kinevezem'}
            danger={isAdmin}
            busy={busy}
            onConfirm={() => action.mutate({ kind: 'role', role: isAdmin ? 'student' : 'admin' })}
          />
        </ActionRow>

        {unverified && (
          <>
            <ActionRow title="Megerősítő levél" description="Újraküldi a levelet az e-mail-címre (rövid időn belül csak néhányszor).">
              <ConfirmAction
                label="Levél újraküldése"
                question={`Újraküldjük a megerősítő levelet erre a címre: ${user.email}.`}
                confirmLabel="Elküldöm"
                busy={busy}
                onConfirm={() => action.mutate({ kind: 'resend-verification' })}
              />
            </ActionRow>
            <ActionRow title="E-mail kézi megerősítése" description="Ha a levél nem ér el hozzá. Az indoklás kötelező, és bekerül a naplóba.">
              <ManualVerification
                busy={busy}
                error={action.variables?.kind === 'verify-email' ? action.error : null}
                onSubmit={(reason) => action.mutateAsync({ kind: 'verify-email', reason })}
              />
            </ActionRow>
          </>
        )}

        <ActionRow title="Munkamenetek" description="Kilépteti mindenhol, például ha feltörték a fiókot.">
          <ConfirmAction
            label="Munkamenetek lezárása"
            question={`${user.name} minden eszközön kilép, és újra be kell lépnie.`}
            confirmLabel="Lezárom"
            danger
            busy={busy}
            onConfirm={() => action.mutate({ kind: 'revoke-tokens' })}
          />
        </ActionRow>

        <ActionRow title="Jelszó" description="Jelszó-visszaállító levelet küld. Az új jelszót csak a felhasználó ismeri meg.">
          <ConfirmAction
            label="Visszaállító levél küldése"
            question={`Jelszó-visszaállító levelet küldünk erre a címre: ${user.email}.`}
            confirmLabel="Elküldöm"
            busy={busy}
            onConfirm={() => action.mutate({ kind: 'password-reset' })}
          />
        </ActionRow>
      </ul>
    </div>
  )
}

function ActionRow({ title, description, badge, children }: { title: string; description: string; badge?: ReactNode; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-grid py-3">
      <div className="min-w-0 flex-1 basis-64">
        <p className="flex flex-wrap items-center gap-2 text-16 font-semibold">
          {title}
          {badge}
        </p>
        <p className="mt-0.5 text-14 leading-normal text-ink-soft">{description}</p>
      </div>
      <div>{children}</div>
    </li>
  )
}

function ManualVerification({ busy, error, onSubmit }: { busy: boolean; error: unknown; onSubmit: (reason: string) => Promise<void> }) {
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    try {
      await onSubmit(reason.trim())
      setOpen(false)
      setReason('')
    } catch {
      // Hiba esetén az ablak nyitva marad az indoklással; a hibát a mutáció mutatja.
    }
  }

  return (
    <>
      <Button variant="secondary" disabled={busy} onClick={() => setOpen(true)}>
        Megerősítettnek jelölöm
      </Button>
      <Modal
        open={open}
        title="E-mail kézi megerősítése"
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Mégsem
            </Button>
            <Button type="submit" form={formId} busy={busy} busyLabel="Mentés…">
              Megerősítem
            </Button>
          </>
        }
      >
        <form id={formId} onSubmit={(e) => void submit(e)} noValidate aria-label="E-mail kézi megerősítése" className="flex flex-col gap-3">
          <MutationError error={error} fields={['reason']} />
          <TextAreaField
            label="Indoklás"
            hint="Például: telefonon egyeztettük, a levél nem érkezett meg."
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={mezoHibak(error).reason}
          />
        </form>
      </Modal>
    </>
  )
}
