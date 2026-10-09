import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { Badge } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Field, SubmitButton, TextAreaField } from '../../../../shared/ui/Form'
import { Skeleton } from '../../../../shared/ui/States'
import { MutationError } from '../../catalog/components/QueryState'
import { ConfirmAction } from '../../components/ConfirmAction'
import { accessGrantsQuery, adminUserKeys, grantAccess, revokeAccess, type AccessGrant } from '../api'
import { formatDate } from '../format'

/**
 * Kézi prémium hozzáférés (#51) ösztöndíjhoz vagy ügyfélszolgálati esethez,
 * a számlázástól függetlenül. Minden kiadás és visszavonás a kiadó/visszavonó
 * adminnal és időponttal naplózott; itt a teljes története látszik.
 */
export function AccessGrants({ userId }: { userId: number }) {
  const queryClient = useQueryClient()
  const grants = useQuery(accessGrantsQuery(userId))
  // A lista, a részletek (prémium jelző) és az áttekintő lista is frissüljön.
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminUserKeys.all })

  const [reason, setReason] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const grant = useMutation({
    mutationFn: () => grantAccess(userId, { reason: reason.trim(), ends_at: endsAt ? new Date(`${endsAt}T23:59:59`).toISOString() : null }),
    onSuccess: () => {
      setReason('')
      setEndsAt('')
    },
    onSettled: refresh,
  })
  const revoke = useMutation({ mutationFn: revokeAccess, onSettled: refresh })
  const errors = mezoHibak(grant.error)
  const active = grants.data?.find((g) => g.active)

  function submit(e: FormEvent) {
    e.preventDefault()
    grant.mutate()
  }

  return (
    <div className="flex flex-col gap-6" data-testid="access-grants">
      {active ? (
        <Banner kind="info">Érvényes kézi hozzáférése van. Új kiadás előtt vond vissza a jelenlegit, vagy várd meg a lejáratát.</Banner>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4" aria-label="Kézi hozzáférés kiadása">
          <MutationError error={grant.error} fields={['reason', 'ends_at']} />
          <TextAreaField
            label="Indoklás"
            hint="Kötelező. Később is kiderül belőle, miért kapott ingyenes hozzáférést."
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={errors.reason}
          />
          <Field
            className="max-w-xs"
            label="Lejárat (nem kötelező)"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            hint="Üresen hagyva visszavonásig érvényes."
            error={errors.ends_at}
          />
          <div>
            <SubmitButton busy={grant.isPending} busyLabel="Kiadás…" fullWidth={false}>
              Prémium hozzáférés kiadása
            </SubmitButton>
          </div>
        </form>
      )}

      <MutationError error={revoke.error} />

      <div>
        <h3 className="text-15 font-bold">Előzmények</h3>
        {grants.isPending ? (
          <Skeleton lines={2} className="mt-3" />
        ) : grants.isError ? (
          <MutationError error={grants.error} />
        ) : grants.data.length === 0 ? (
          <p className="mt-2 text-15 text-ink-soft">Még nem kapott kézi hozzáférést.</p>
        ) : (
          <ul className="mt-2">
            {grants.data.map((item) => (
              <GrantRow key={item.id} grant={item} busy={revoke.isPending} onRevoke={() => revoke.mutate(item.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function GrantRow({ grant, busy, onRevoke }: { grant: AccessGrant; busy: boolean; onRevoke: () => void }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-grid py-3" data-testid="access-grant" data-active={grant.active}>
      <div className="min-w-0 flex-1 basis-64">
        <p className="text-16">„{grant.reason}”</p>
        <p className="mt-0.5 text-14 leading-normal text-ink-soft">
          Kiadta: {grant.granted_by?.name ?? 'ismeretlen'}, {formatDate(grant.granted_at)}.{' '}
          {grant.ends_at ? `Lejárat: ${formatDate(grant.ends_at)}.` : 'Lejárat nélkül.'}
          {grant.revoked_at && ` Visszavonta: ${grant.revoked_by?.name ?? 'ismeretlen'}, ${formatDate(grant.revoked_at)}.`}
        </p>
      </div>
      <Badge kind={grant.active ? 'ok' : 'draft'}>{grant.active ? 'Érvényes' : grant.revoked_at ? 'Visszavonva' : 'Lejárt'}</Badge>
      {grant.active && (
        <ConfirmAction
          label="Hozzáférés visszavonása"
          question="A kézi prémium hozzáférés azonnal megszűnik. Ha nincs előfizetése, a fizetős leckék bezárulnak előtte."
          confirmLabel="Visszavonom"
          danger
          busy={busy}
          onConfirm={onRevoke}
        />
      )}
    </li>
  )
}
