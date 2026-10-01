import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { LANGUAGE_LABEL } from '../../../../shared/domain/labels'
import { SubmitButton, TextAreaField } from '../../../../shared/ui/Form'
import type { LanguageKey } from '../../../../types'
import { CodeEditor } from '../../../workspace/components/CodeEditor'
import {
  deleteExerciseSolution,
  exerciseSolutionsQuery,
  invalidateCatalog,
  saveExerciseSolution,
  type AdminExerciseSolution,
} from '../api'
import { SavedNote } from './SavedNote'
import { MutationError } from './QueryState'

const SOLUTION_FIELDS = ['source_code', 'explanation', 'language'] as const

/**
 * Mintamegoldások (#154): minden engedélyezett nyelvhez egy. A diák elfogadott
 * beadás után, vagy elég sikertelen beadás után megerősítéssel látja. A
 * megoldás a tesztesetek ellenőrzésére is jó lesz (#159).
 *
 * Az engedélyezett nyelvek a MENTETT feladatból jönnek: egy még el nem mentett
 * nyelvhez a szerver nem fogad megoldást.
 */
export function ExerciseSolutionEditor({ exerciseId, allowedLanguages }: { exerciseId: number; allowedLanguages: LanguageKey[] }) {
  const solutions = useQuery(exerciseSolutionsQuery(exerciseId))

  if (solutions.isPending) return <p className="text-sm text-slate-400">Mintamegoldások betöltése…</p>
  if (solutions.isError) return <MutationError error={solutions.error} />

  return (
    <div className="space-y-6" data-testid="exercise-solution-editor">
      {allowedLanguages.map((language) => (
        <SolutionForm
          key={language}
          exerciseId={exerciseId}
          language={language}
          saved={solutions.data.find((solution) => solution.language === language) ?? null}
        />
      ))}
    </div>
  )
}

function SolutionForm({ exerciseId, language, saved }: { exerciseId: number; language: LanguageKey; saved: AdminExerciseSolution | null }) {
  const queryClient = useQueryClient()
  const [sourceCode, setSourceCode] = useState(saved?.source_code ?? '')
  const [explanation, setExplanation] = useState(saved?.explanation ?? '')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const refresh = () => invalidateCatalog(queryClient)

  const save = useMutation({
    mutationFn: () => saveExerciseSolution(exerciseId, language, { source_code: sourceCode, explanation: explanation.trim() === '' ? null : explanation }),
    onSettled: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: number) => deleteExerciseSolution(id),
    onSuccess: () => {
      setSourceCode('')
      setExplanation('')
    },
    onSettled: refresh,
  })
  const errors = mezoHibak(save.error)
  const label = LANGUAGE_LABEL[language]

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate()
  }

  return (
    <form onSubmit={submit} noValidate aria-label={`Mintamegoldás – ${label}`} className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-medium text-slate-200">{label}</h3>
        <span className="text-xs text-slate-400">{saved ? 'Mentve' : 'Még nincs megoldás'}</span>
        <SavedNote mutation={save} />
      </div>

      <MutationError error={save.error ?? remove.error} fields={SOLUTION_FIELDS} />

      <div className="h-56">
        <CodeEditor language={language} initialValue={sourceCode} onChange={setSourceCode} />
      </div>
      {errors.source_code && <p className="text-sm text-red-300">{errors.source_code}</p>}

      <TextAreaField
        label="Magyarázat (Markdown, elhagyható)"
        rows={4}
        mono
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        error={errors.explanation}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton busy={save.isPending} fullWidth={false}>
          {save.isPending ? 'Mentés…' : 'Megoldás mentése'}
        </SubmitButton>

        {saved &&
          (confirmDelete ? (
            <span role="group" aria-label={`${label} megoldásának törlése`} className="flex items-center gap-1 text-sm">
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false)
                  remove.mutate(saved.id)
                }}
                className="rounded bg-red-800 px-3 py-1.5 text-white hover:bg-red-700"
              >
                Törlés
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rounded px-3 py-1.5 text-slate-300 hover:bg-slate-800">
                Mégse
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded px-3 py-1.5 text-sm text-red-300 hover:bg-red-950"
            >
              Megoldás törlése
            </button>
          ))}
      </div>
    </form>
  )
}
