import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { Field, SubmitButton, TextAreaField } from '../../../../shared/ui/Form'
import { MutationError } from '../../catalog/components/QueryState'
import { StatusPill } from '../../components/AdminShell'
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
    <div className="space-y-5" data-testid="access-grants">
      {active ? (
        <p className="text-sm text-slate-300">
          Érvényes kézi hozzáférése van. Új kiadás előtt vond vissza a jelenlegit, vagy várd meg a lejáratát.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="grid gap-3" aria-label="Kézi hozzáférés kiadása">
          <MutationError error={grant.error} fields={['reason', 'ends_at']} />
          <TextAreaField
            label="Indoklás"
            hint="Kötelező; később is kiderül belőle, miért kapott ingyenes hozzáférést."
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={errors.reason}
          />
          <Field
            label="Lejárat (opcionális)"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            hint="Üresen hagyva visszavonásig érvényes."
            error={errors.ends_at}
          />
          <div>
            <SubmitButton busy={grant.isPending} fullWidth={false}>
              {grant.isPending ? 'Kiadás…' : 'Prémium hozzáférés kiadása'}
            </SubmitButton>
          </div>
        </form>
      )}

      <MutationError error={revoke.error} />

      <div>
        <h3 className="mb-2 text-sm font-medium text-slate-300">Előzmények</h3>
        {grants.isPending ? (
          <p className="text-sm text-slate-400">Betöltés…</p>
        ) : grants.isError ? (
          <MutationError error={grants.error} />
        ) : grants.data.length === 0 ? (
          <p className="text-sm text-slate-400">Még nem kapott kézi hozzáférést.</p>
        ) : (
          <ul className="divide-y divide-slate-800 rounded-lg border border-slate-800">
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
  const [confirming, setConfirming] = useState(false)

  return (
    <li className="flex flex-wrap items-start gap-3 px-3 py-2.5 text-sm" data-testid="access-grant" data-active={grant.active}>
      <div className="min-w-0 flex-1">
        <p className="text-slate-100">„{grant.reason}”</p>
        <p className="mt-0.5 text-xs text-slate-400">
          Kiadta: {grant.granted_by?.name ?? 'ismeretlen'}, {formatDate(grant.granted_at)} ·{' '}
          {grant.ends_at ? `lejárat: ${formatDate(grant.ends_at)}` : 'lejárat nélkül'}
          {grant.revoked_at && ` · visszavonta: ${grant.revoked_by?.name ?? 'ismeretlen'}, ${formatDate(grant.revoked_at)}`}
        </p>
      </div>
      <StatusPill tone={grant.active ? 'published' : 'draft'}>{grant.active ? 'Érvényes' : grant.revoked_at ? 'Visszavonva' : 'Lejárt'}</StatusPill>
      {grant.active &&
        (confirming ? (
          <span role="group" aria-label="Visszavonás megerősítése" className="flex items-center gap-1 text-xs">
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setConfirming(false)
                onRevoke()
              }}
              className="rounded bg-red-800 px-2 py-1 text-white hover:bg-red-700 disabled:opacity-50"
            >
              Visszavonás
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800">
              Mégse
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirming(true)} className="rounded px-2 py-1 text-xs text-red-300 hover:bg-red-950">
            Visszavonás…
          </button>
        ))}
    </li>
  )
}
