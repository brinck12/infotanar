import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { Badge } from '../../../../shared/ui/Badge'
import { Button } from '../../../../shared/ui/Button'
import { CheckboxField, SubmitButton, Switch, TextAreaField } from '../../../../shared/ui/Form'
import { Modal } from '../../../../shared/ui/Modal'
import { Panel } from '../../../../shared/ui/Panel'
import { OutputBlock } from '../../../../shared/ui/ResultRow'
import { Skeleton } from '../../../../shared/ui/States'
import { CardTitle } from '../../../../shared/ui/Text'
import {
  createTestCase,
  deleteTestCase,
  invalidateCatalog,
  reorder,
  testCasesQuery,
  updateTestCase,
  type AdminTestCase,
  type TestCasePayload,
} from '../api'
import { IconButton } from './ChildList'
import { MutationError } from './QueryState'

const TEST_CASE_FIELDS = ['stdin', 'expected_stdout', 'is_hidden'] as const

/**
 * Tesztesetek kezelése egy feladathoz (#48): felvétel, szerkesztés, törlés,
 * sorrend, és a nyilvános/rejtett kapcsoló. Minden változás után a tanulói
 * oldali feladat-cache is frissül, így a módosítás azonnal látszik.
 *
 * A backend nem engedi, hogy egy közzétett feladat utolsó nyilvános
 * tesztesete rejtett legyen vagy törlődjön; ez a hiba az adott sornál jelenik meg.
 */
export function TestCaseManager({ exerciseId }: { exerciseId: number }) {
  const queryClient = useQueryClient()
  const testCases = useQuery(testCasesQuery(exerciseId))
  const refresh = () => invalidateCatalog(queryClient)
  const reorderCases = useMutation({
    mutationFn: (ids: number[]) => reorder(`/admin/exercises/${exerciseId}/test-cases/order`, ids),
    onSettled: refresh,
  })

  if (testCases.isPending) return <Skeleton lines={3} label="Tesztesetek betöltése…" />
  if (testCases.isError) return <MutationError error={testCases.error} />

  const items = testCases.data
  const visible = items.filter((tc) => !tc.is_hidden).length

  function move(index: number, delta: -1 | 1) {
    const ids = items.map((tc) => tc.id)
    const [moved] = ids.splice(index, 1)
    if (moved === undefined) return
    ids.splice(index + delta, 0, moved)
    reorderCases.mutate(ids)
  }

  return (
    <div className="flex flex-col gap-4" data-testid="test-case-manager">
      <p className="text-15 leading-relaxed text-ink-soft">
        {items.length} teszteset, ebből {visible} nyilvános és {items.length - visible} rejtett. A nyilvánosakat a tanuló látja, és a
        Futtatás ezeken fut; a rejtettek csak beadáskor futnak le, és az adatuk rejtve marad.
      </p>
      <MutationError error={reorderCases.error} />

      <ol className="flex flex-col gap-4">
        {items.map((testCase, index) => (
          <TestCaseRow
            key={testCase.id}
            testCase={testCase}
            index={index}
            count={items.length}
            busy={reorderCases.isPending}
            onMove={(delta) => move(index, delta)}
          />
        ))}
      </ol>

      <NewTestCase exerciseId={exerciseId} />
    </div>
  )
}

interface TestCaseRowProps {
  testCase: AdminTestCase
  index: number
  count: number
  busy: boolean
  onMove: (delta: -1 | 1) => void
}

function TestCaseRow({ testCase, index, count, busy, onMove }: TestCaseRowProps) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const refresh = () => invalidateCatalog(queryClient)
  // Optimista kijelzés: a kapcsoló azonnal vált, és a friss szerverállapotig így marad;
  // hiba esetén visszaáll a szerver szerinti értékre.
  const [pendingHidden, setPendingHidden] = useState<boolean | null>(null)
  const update = useMutation({
    mutationFn: (payload: Partial<TestCasePayload>) => updateTestCase(testCase.id, payload),
    onSuccess: () => setEditing(false),
    onSettled: async () => {
      await refresh()
      setPendingHidden(null)
    },
  })
  const remove = useMutation({ mutationFn: () => deleteTestCase(testCase.id), onSettled: refresh })
  const label = `${index + 1}. teszteset`
  const hidden = pendingHidden ?? testCase.is_hidden

  return (
    <Panel as="li" pad="md" data-testid="test-case" data-hidden={hidden}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-16 font-bold">{label}</span>
        <Badge kind={hidden ? 'hidden' : 'pub'}>{hidden ? 'Rejtett' : 'Nyilvános'}</Badge>

        <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1">
          <Switch
            label="Rejtett"
            checked={hidden}
            disabled={update.isPending}
            onChange={(checked) => {
              setPendingHidden(checked)
              update.mutate({ is_hidden: checked })
            }}
          />
          <Button variant="text" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Mégsem' : 'Szerkesztés'}
          </Button>
          <IconButton icon="chevron-up" label={`${label} feljebb`} disabled={busy || index === 0} onClick={() => onMove(-1)} />
          <IconButton icon="chevron-down" label={`${label} lejjebb`} disabled={busy || index === count - 1} onClick={() => onMove(1)} />
          <IconButton icon="trash" label={`${label} törlése`} disabled={remove.isPending} onClick={() => setConfirmDelete(true)} danger />
        </div>
      </div>

      <div className="mt-3 empty:hidden">
        <MutationError error={update.error ?? remove.error} fields={editing ? TEST_CASE_FIELDS : []} />
      </div>

      {editing ? (
        <TestCaseForm
          initial={testCase}
          busy={update.isPending}
          errors={mezoHibak(update.error)}
          submitLabel="Mentés"
          onSubmit={(payload) => update.mutate(payload)}
        />
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <OutputBlock label="Bemenet (stdin)" value={testCase.stdin} />
          <OutputBlock label="Elvárt kimenet" value={testCase.expected_stdout} />
        </div>
      )}

      <Modal
        open={confirmDelete}
        title={`Biztosan törlöd: ${label}?`}
        onClose={() => setConfirmDelete(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Mégsem
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                setConfirmDelete(false)
                remove.mutate()
              }}
            >
              Törlés
            </Button>
          </>
        }
      >
        <p>A teszteset véglegesen törlődik. A korábbi beadások eredménye nem változik.</p>
      </Modal>
    </Panel>
  )
}

function NewTestCase({ exerciseId }: { exerciseId: number }) {
  const queryClient = useQueryClient()
  // A key-váltás üríti az űrlapot sikeres felvétel után.
  const [formKey, setFormKey] = useState(0)
  const create = useMutation({
    mutationFn: (payload: TestCasePayload) => createTestCase(exerciseId, payload),
    onSuccess: () => setFormKey((k) => k + 1),
    onSettled: () => invalidateCatalog(queryClient),
  })

  return (
    <div className="rounded-md border-2 border-dashed border-muted bg-sheet p-5">
      <CardTitle as="h3">Új teszteset</CardTitle>
      <div className="mt-3 empty:hidden">
        <MutationError error={create.error} fields={TEST_CASE_FIELDS} />
      </div>
      <TestCaseForm
        key={formKey}
        initial={null}
        busy={create.isPending}
        errors={mezoHibak(create.error)}
        submitLabel="Teszteset hozzáadása"
        onSubmit={(payload) => create.mutate(payload)}
      />
    </div>
  )
}

interface TestCaseFormProps {
  initial: AdminTestCase | null
  busy: boolean
  errors: Record<string, string>
  submitLabel: string
  onSubmit: (payload: TestCasePayload) => void
}

function TestCaseForm({ initial, busy, errors, submitLabel, onSubmit }: TestCaseFormProps) {
  const [form, setForm] = useState<TestCasePayload>({
    stdin: initial?.stdin ?? '',
    expected_stdout: initial?.expected_stdout ?? '',
    is_hidden: initial?.is_hidden ?? false,
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={submit} noValidate className="mt-3 flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextAreaField
          label="Bemenet (stdin)"
          rows={4}
          mono
          value={form.stdin}
          onChange={(e) => setForm({ ...form, stdin: e.target.value })}
          error={errors.stdin}
        />
        <TextAreaField
          label="Elvárt kimenet"
          rows={4}
          mono
          value={form.expected_stdout}
          onChange={(e) => setForm({ ...form, expected_stdout: e.target.value })}
          error={errors.expected_stdout}
        />
      </div>
      <CheckboxField
        label="Rejtett teszteset"
        hint="Csak beadáskor fut, a tanuló nem látja a bemenetét és a kimenetét."
        checked={form.is_hidden}
        onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })}
        error={errors.is_hidden}
      />
      <div>
        <SubmitButton busy={busy} busyLabel="Mentés…" fullWidth={false}>
          {submitLabel}
        </SubmitButton>
      </div>
    </form>
  )
}
