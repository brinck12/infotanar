import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { SubmitButton, TextAreaField } from '../../../../shared/ui/Form'
import {
  createExerciseHint,
  deleteExerciseHint,
  exerciseHintsQuery,
  invalidateCatalog,
  reorder,
  updateExerciseHint,
  type AdminExerciseHint,
} from '../api'
import { MutationError } from './QueryState'

const HINT_FIELDS = ['body'] as const

/**
 * Tippek kezelése egy feladathoz (#154): felvétel, szerkesztés, törlés és
 * sorrend. A diák a tippeket ebben a sorrendben, egyenként kéri; aki már
 * megnyitott k tippet, az az új sorrend első k tippjét látja.
 */
export function ExerciseHintManager({ exerciseId }: { exerciseId: number }) {
  const queryClient = useQueryClient()
  const hints = useQuery(exerciseHintsQuery(exerciseId))
  const reorderHints = useMutation({
    mutationFn: (ids: number[]) => reorder(`/admin/exercises/${exerciseId}/hints/order`, ids),
    onSettled: () => invalidateCatalog(queryClient),
  })

  if (hints.isPending) return <p className="text-sm text-slate-400">Tippek betöltése…</p>
  if (hints.isError) return <MutationError error={hints.error} />

  const items = hints.data

  function move(index: number, delta: -1 | 1) {
    const ids = items.map((hint) => hint.id)
    const [moved] = ids.splice(index, 1)
    if (moved === undefined) return
    ids.splice(index + delta, 0, moved)
    reorderHints.mutate(ids)
  }

  return (
    <div className="space-y-4" data-testid="exercise-hint-manager">
      <p className="text-sm text-slate-400">
        {items.length === 0 ? 'Még nincs tipp.' : `${items.length} tipp.`} A diák egyenként kéri őket, ebben a sorrendben; a szövegük csak
        a megnyitás után kerül ki a szerverről.
      </p>
      <MutationError error={reorderHints.error} />

      <ol className="space-y-3">
        {items.map((hint, index) => (
          <HintRow
            key={hint.id}
            hint={hint}
            index={index}
            count={items.length}
            busy={reorderHints.isPending}
            onMove={(delta) => move(index, delta)}
          />
        ))}
      </ol>

      <NewHint exerciseId={exerciseId} />
    </div>
  )
}

function HintRow({
  hint,
  index,
  count,
  busy,
  onMove,
}: {
  hint: AdminExerciseHint
  index: number
  count: number
  busy: boolean
  onMove: (delta: -1 | 1) => void
}) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const refresh = () => invalidateCatalog(queryClient)
  const update = useMutation({
    mutationFn: (body: string) => updateExerciseHint(hint.id, body),
    onSuccess: () => setEditing(false),
    onSettled: refresh,
  })
  const remove = useMutation({ mutationFn: () => deleteExerciseHint(hint.id), onSettled: refresh })
  const label = `${index + 1}. tipp`

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-950/40 p-3" data-testid="exercise-hint">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-200">{label}</span>

        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
          <button type="button" className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800" onClick={() => setEditing((open) => !open)}>
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

      <MutationError error={update.error ?? remove.error} fields={editing ? HINT_FIELDS : []} />

      {editing ? (
        <HintForm initial={hint.body} busy={update.isPending} error={mezoHibak(update.error).body} submitLabel="Mentés" onSubmit={(body) => update.mutate(body)} />
      ) : (
        <pre className="mt-3 max-h-40 overflow-auto rounded border border-slate-800 bg-slate-950 p-2 font-mono text-xs whitespace-pre-wrap text-slate-300">
          {hint.body}
        </pre>
      )}
    </li>
  )
}

function NewHint({ exerciseId }: { exerciseId: number }) {
  const queryClient = useQueryClient()
  // A key-váltás üríti az űrlapot sikeres felvétel után.
  const [formKey, setFormKey] = useState(0)
  const create = useMutation({
    mutationFn: (body: string) => createExerciseHint(exerciseId, body),
    onSuccess: () => setFormKey((key) => key + 1),
    onSettled: () => invalidateCatalog(queryClient),
  })

  return (
    <div className="rounded-lg border border-dashed border-slate-700 p-3">
      <h3 className="text-sm font-medium text-slate-200">Új tipp</h3>
      <MutationError error={create.error} fields={HINT_FIELDS} />
      <HintForm
        key={formKey}
        initial=""
        busy={create.isPending}
        error={mezoHibak(create.error).body}
        submitLabel="Tipp hozzáadása"
        onSubmit={(body) => create.mutate(body)}
      />
    </div>
  )
}

function HintForm({
  initial,
  busy,
  error,
  submitLabel,
  onSubmit,
}: {
  initial: string
  busy: boolean
  error?: string
  submitLabel: string
  onSubmit: (body: string) => void
}) {
  const [body, setBody] = useState(initial)

  function submit(e: FormEvent) {
    e.preventDefault()
    onSubmit(body)
  }

  return (
    <form onSubmit={submit} noValidate className="mt-3 grid gap-3">
      <TextAreaField label="Tipp szövege (Markdown)" rows={4} mono value={body} onChange={(e) => setBody(e.target.value)} error={error} />
      <div>
        <SubmitButton busy={busy} fullWidth={false}>
          {busy ? 'Mentés…' : submitLabel}
        </SubmitButton>
      </div>
    </form>
  )
}
