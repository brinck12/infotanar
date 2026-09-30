import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { CheckboxField, SubmitButton, TextAreaField } from '../../../../shared/ui/Form'
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
import { StatusPill } from './AdminShell'
import { MutationError } from './QueryState'

const TEST_CASE_FIELDS = ['stdin', 'expected_stdout', 'is_hidden'] as const

/**
 * Tesztesetek kezelése egy feladathoz (#48): felvétel, szerkesztés, törlés,
 * sorrend, és a nyilvános/rejtett kapcsoló. Minden változás után a diák
 * oldali feladat-cache is frissül, így a módosítás azonnal látszik.
 *
 * A backend nem engedi, hogy egy publikált feladat utolsó nyilvános
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

  if (testCases.isPending) return <p className="text-sm text-slate-400">Tesztesetek betöltése…</p>
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
    <div className="space-y-4" data-testid="test-case-manager">
      <p className="text-sm text-slate-400">
        {items.length} teszteset · {visible} nyilvános · {items.length - visible} rejtett. A nyilvánosakat a diák látja és a
        „Futtatás” ezeken fut; a rejtettek csak beadáskor, a diák elől elrejtve.
      </p>
      <MutationError error={reorderCases.error} />

      <ol className="space-y-3">
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

function TestCaseRow({
  testCase,
  index,
  count,
  busy,
  onMove,
}: {
  testCase: AdminTestCase
  index: number
  count: number
  busy: boolean
  onMove: (delta: -1 | 1) => void
}) {
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
    <li className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" data-testid="test-case" data-hidden={hidden}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        <StatusPill tone={hidden ? 'draft' : 'published'}>{hidden ? 'Rejtett' : 'Nyilvános'}</StatusPill>

        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 accent-sky-600"
              checked={hidden}
              disabled={update.isPending}
              onChange={(e) => {
                setPendingHidden(e.target.checked)
                update.mutate({ is_hidden: e.target.checked })
              }}
            />
            Rejtett
          </label>
          <button type="button" className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Mégse' : 'Szerkesztés'}
          </button>
          <button
            type="button"
            aria-label={`${label} feljebb`}
            disabled={busy || index === 0}
            onClick={() => onMove(-1)}
            className="h-7 w-7 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            <span aria-hidden="true">↑</span>
          </button>
          <button
            type="button"
            aria-label={`${label} lejjebb`}
            disabled={busy || index === count - 1}
            onClick={() => onMove(1)}
            className="h-7 w-7 rounded text-slate-300 hover:bg-slate-800 disabled:opacity-30"
          >
            <span aria-hidden="true">↓</span>
          </button>
          {confirmDelete ? (
            <span role="group" aria-label={`${label} törlésének megerősítése`} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false)
                  remove.mutate()
                }}
                className="rounded bg-red-800 px-2 py-1 text-white hover:bg-red-700"
              >
                Törlés
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800">
                Mégse
              </button>
            </span>
          ) : (
            <button
              type="button"
              aria-label={`${label} törlése`}
              onClick={() => setConfirmDelete(true)}
              className="h-7 w-7 rounded text-red-300 hover:bg-red-950"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      </div>

      <MutationError error={update.error ?? remove.error} fields={editing ? TEST_CASE_FIELDS : []} />

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
          <Block label="Bemenet (stdin)" value={testCase.stdin} />
          <Block label="Elvárt kimenet" value={testCase.expected_stdout} />
        </div>
      )}
    </li>
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
    <div className="rounded-lg border border-dashed border-slate-700 p-3">
      <h3 className="text-sm font-medium text-slate-200">Új teszteset</h3>
      <MutationError error={create.error} fields={TEST_CASE_FIELDS} />
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

function TestCaseForm({
  initial,
  busy,
  errors,
  submitLabel,
  onSubmit,
}: {
  initial: AdminTestCase | null
  busy: boolean
  errors: Record<string, string>
  submitLabel: string
  onSubmit: (payload: TestCasePayload) => void
}) {
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
    <form onSubmit={submit} noValidate className="mt-3 grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
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
        hint="Csak beadáskor fut, a diák nem látja a bemenetét és a kimenetét."
        checked={form.is_hidden}
        onChange={(e) => setForm({ ...form, is_hidden: e.target.checked })}
        error={errors.is_hidden}
      />
      <div>
        <SubmitButton busy={busy} fullWidth={false}>
          {busy ? 'Mentés…' : submitLabel}
        </SubmitButton>
      </div>
    </form>
  )
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <pre className="max-h-40 overflow-auto rounded border border-slate-800 bg-slate-950 p-2 font-mono text-xs whitespace-pre-wrap text-slate-300">
        {value === '' ? '(üres)' : value}
      </pre>
    </div>
  )
}
