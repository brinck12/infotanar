import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { Badge, type BadgeKind } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { Field, Switch } from '../../../../shared/ui/Form'
import { Pager } from '../../../../shared/ui/Pager'
import { EmptyState, LoadError, Skeleton } from '../../../../shared/ui/States'
import { Table, Td, Th, Tr } from '../../../../shared/ui/Table'
import { useToast } from '../../../../shared/ui/useToast'
import { MutationError } from '../../catalog/components/QueryState'
import { AdminShell, Section } from '../../components/AdminShell'
import { ConfirmAction } from '../../components/ConfirmAction'
import { formatDate } from '../../users/format'
import {
  createInviteCode,
  disableInviteCode,
  inviteCodes,
  inviteLink,
  registrationKeys,
  registrationMode,
  setRegistrationMode,
  waitlist,
  type InviteCode,
  type InviteCodeState,
} from '../api'

const STATE_LABEL: Readonly<Record<InviteCodeState, string>> = {
  active: 'Aktív',
  disabled: 'Letiltva',
  expired: 'Lejárt',
  used_up: 'Elfogyott',
}

const STATE_KIND: Readonly<Record<InviteCodeState, BadgeKind>> = {
  active: 'ok',
  disabled: 'draft',
  expired: 'draft',
  used_up: 'neutral',
}

/**
 * Zárt béta kapuja: a regisztrációs mód, a meghívókódok és a várólista.
 * A kódot a szerver generálja (vagy megadható egyedi, pl. az osztály neve);
 * minden létrehozás, letiltás és módváltás naplózott.
 */
export function AdminInviteCodes() {
  return (
    <AdminShell crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Meghívókódok' }]} title="Meghívókódok és várólista">
      <ModeSection />
      <CreateSection />
      <CodesSection />
      <WaitlistSection />
    </AdminShell>
  )
}

function ModeSection() {
  const queryClient = useQueryClient()
  const mode = useQuery({ queryKey: registrationKeys.mode(), queryFn: ({ signal }) => registrationMode(signal) })
  const change = useMutation({
    mutationFn: setRegistrationMode,
    onSuccess: (next) => queryClient.setQueryData(registrationKeys.mode(), next),
  })

  return (
    <Section title="Regisztráció módja">
      {mode.isError ? (
        <LoadError error={mode.error} onRetry={() => void mode.refetch()} />
      ) : !mode.data ? (
        <Skeleton lines={2} />
      ) : (
        <>
          <Switch
            label="Zárt béta: csak meghívókóddal lehet regisztrálni"
            checked={mode.data === 'invite'}
            disabled={change.isPending}
            onChange={(checked) => change.mutate(checked ? 'invite' : 'open')}
          />
          <p className="mt-2 text-15 leading-relaxed text-ink-soft">
            {mode.data === 'invite'
              ? 'Most csak érvényes kóddal regisztrálhatnak; a többiek a várólistára iratkozhatnak fel.'
              : 'Most bárki regisztrálhat. Éles indulásnál kapcsold zártra, vagy állítsd a REGISTRATION_MODE értékét invite-ra.'}
          </p>
          <div className="mt-3 empty:hidden">
            <MutationError error={change.error} />
          </div>
        </>
      )}
    </Section>
  )
}

function CreateSection() {
  const queryClient = useQueryClient()
  const [label, setLabel] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [expires, setExpires] = useState('')
  const [code, setCode] = useState('')

  const create = useMutation({
    mutationFn: () =>
      createInviteCode({
        label: label.trim(),
        max_uses: maxUses.trim() === '' ? null : Number(maxUses),
        // A lejárat a megadott nap vége (helyi idő szerint).
        expires_at: expires === '' ? null : new Date(`${expires}T23:59:59`).toISOString(),
        code: code.trim() === '' ? null : code.trim(),
      }),
    onSuccess: () => {
      setLabel('')
      setMaxUses('')
      setExpires('')
      setCode('')
      return queryClient.invalidateQueries({ queryKey: registrationKeys.codesAll() })
    },
  })
  const errors = mezoHibak(create.error)

  function submit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <Section title="Új meghívókód">
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2" aria-label="Új meghívókód">
        <div className="empty:hidden sm:col-span-2">
          <MutationError error={create.error} fields={['label', 'max_uses', 'expires_at', 'code']} />
        </div>
        <Field
          label="Megnevezés (pl. az osztály)"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          error={errors.label}
        />
        <Field
          label="Hányan használhatják"
          type="number"
          min={1}
          inputMode="numeric"
          hint="Üresen hagyva korlátlan."
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          error={errors.max_uses}
        />
        <Field
          label="Lejárat napja"
          type="date"
          hint="Üresen hagyva nem jár le."
          value={expires}
          onChange={(e) => setExpires(e.target.value)}
          error={errors.expires_at}
        />
        <Field
          label="Egyedi kód"
          mono
          hint="Üresen hagyva a rendszer generál egyet."
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={errors.code}
        />
        <div className="sm:col-span-2">
          <Button type="submit" icon="plus" busy={create.isPending} busyLabel="Létrehozás…">
            Kód létrehozása
          </Button>
        </div>
      </form>
    </Section>
  )
}

function CodesSection() {
  const [page, setPage] = useState(1)
  const codes = useQuery({
    queryKey: registrationKeys.codes(page),
    queryFn: ({ signal }) => inviteCodes(page, signal),
    placeholderData: keepPreviousData,
  })

  return (
    <Section title="Kódok">
      {codes.isError ? (
        <LoadError error={codes.error} onRetry={() => void codes.refetch()} />
      ) : !codes.data ? (
        <Skeleton lines={3} />
      ) : codes.data.data.length === 0 ? (
        <EmptyState title="Még nincs meghívókód">Hozz létre egyet fent, és küldd el a linkjét az osztálynak.</EmptyState>
      ) : (
        <>
          <Table caption="Meghívókódok">
            <thead>
              <tr>
                <Th>Kód</Th>
                <Th>Megnevezés</Th>
                <Th>Használat</Th>
                <Th>Lejárat</Th>
                <Th>Állapot</Th>
                <Th>Műveletek</Th>
              </tr>
            </thead>
            <tbody>
              {codes.data.data.map((invite) => (
                <CodeRow key={invite.id} invite={invite} />
              ))}
            </tbody>
          </Table>
          <Pager page={page} lastPage={codes.data.last_page} onChange={setPage} />
        </>
      )}
    </Section>
  )
}

function CodeRow({ invite }: { invite: InviteCode }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const disable = useMutation({
    mutationFn: () => disableInviteCode(invite.id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: registrationKeys.codesAll() }),
  })

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteLink(invite.code))
      toast.show('A meghívó linkje a vágólapon van.')
    } catch {
      toast.show('A vágólapra másolás nem sikerült, másold ki a kódot kézzel.', 'error')
    }
  }

  return (
    <Tr>
      <Td className="font-mono" data-testid="invite-code">
        {invite.code}
      </Td>
      <Td>{invite.label}</Td>
      <Td>
        {invite.uses}
        {invite.max_uses !== null ? ` / ${invite.max_uses}` : ''}
      </Td>
      <Td>{formatDate(invite.expires_at)}</Td>
      <Td>
        <Badge kind={STATE_KIND[invite.state]}>{STATE_LABEL[invite.state]}</Badge>
      </Td>
      <Td>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon="file" onClick={() => void copy()}>
            Link másolása
          </Button>
          {invite.state !== 'disabled' && (
            <ConfirmAction
              label="Letiltás"
              question={`Biztosan letiltod a(z) ${invite.code} kódot? Ezzel a kóddal már nem lehet regisztrálni.`}
              confirmLabel="Letiltom"
              danger
              busy={disable.isPending}
              onConfirm={() => disable.mutate()}
            />
          )}
        </div>
        {disable.isError && <MutationError error={disable.error} />}
      </Td>
    </Tr>
  )
}

function WaitlistSection() {
  const [page, setPage] = useState(1)
  const entries = useQuery({
    queryKey: registrationKeys.waitlist(page),
    queryFn: ({ signal }) => waitlist(page, signal),
    placeholderData: keepPreviousData,
  })

  return (
    <Section title="Várólista">
      {entries.isError ? (
        <LoadError error={entries.error} onRetry={() => void entries.refetch()} />
      ) : !entries.data ? (
        <Skeleton lines={3} />
      ) : entries.data.data.length === 0 ? (
        <Banner kind="info">Még senki nem iratkozott fel a várólistára.</Banner>
      ) : (
        <>
          <p className="mb-3 text-15 text-ink-soft" data-testid="waitlist-total">
            {entries.data.total} feliratkozó
          </p>
          <Table caption="Várólista">
            <thead>
              <tr>
                <Th>E-mail-cím</Th>
                <Th>Megjegyzés</Th>
                <Th>Feliratkozott</Th>
              </tr>
            </thead>
            <tbody>
              {entries.data.data.map((entry) => (
                <Tr key={entry.id}>
                  <Td>{entry.email}</Td>
                  <Td>{entry.note ?? '–'}</Td>
                  <Td>{formatDate(entry.created_at)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pager page={page} lastPage={entries.data.last_page} onChange={setPage} />
        </>
      )}
    </Section>
  )
}
