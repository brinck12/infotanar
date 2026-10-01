import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { formatFileSize } from '../../../../shared/domain/fileSize'
import { Field, SelectField, SubmitButton } from '../../../../shared/ui/Form'
import {
  deleteExerciseFile,
  exerciseFilesQuery,
  invalidateCatalog,
  testCasesQuery,
  uploadExerciseFile,
  type AdminExerciseFile,
  type AdminTestCase,
} from '../api'
import { MutationError } from './QueryState'

const UPLOAD_FIELDS = ['file', 'name', 'test_case_id'] as const
/** A select értéke a közös fájlokhoz; a tesztesetekhez a teszteset azonosítója. */
const SHARED = ''

/**
 * Mellékelt adatfájlok kezelése egy feladathoz (#152): feltöltés, csere (azonos
 * nevű feltöltés), törlés.
 *
 * - Közös fájlt minden teszteset megkap, és a diák letöltheti.
 * - Teszteset saját fájlja csak annál a tesztesetnél van jelen, és az azonos
 *   nevű közös fájl helyére lép; így egy rejtett teszteset más adatot kaphat.
 *   Ezt a diák soha nem látja.
 */
export function ExerciseFileManager({ exerciseId }: { exerciseId: number }) {
  const files = useQuery(exerciseFilesQuery(exerciseId))
  const testCases = useQuery(testCasesQuery(exerciseId))

  if (files.isPending || testCases.isPending) return <p className="text-sm text-slate-400">Fájlok betöltése…</p>
  if (files.isError || testCases.isError) return <MutationError error={files.error ?? testCases.error} />

  const shared = files.data.filter((file) => file.test_case_id === null)

  return (
    <div className="space-y-5" data-testid="exercise-file-manager">
      <p className="text-sm text-slate-400">
        A program a fájlokat a nevükön nyithatja meg (pl. <code>adatok.txt</code>). A közös fájlt a diák letöltheti; a teszteset saját
        fájlját soha nem látja.
      </p>

      <FileGroup title="Közös fájlok" files={shared} emptyText="Nincs közös fájl." />

      {testCases.data.map((testCase, index) => (
        <FileGroup
          key={testCase.id}
          title={`${index + 1}. teszteset saját fájljai${testCase.is_hidden ? ' (rejtett)' : ''}`}
          files={files.data.filter((file) => file.test_case_id === testCase.id)}
          hideWhenEmpty
        />
      ))}

      <UploadForm exerciseId={exerciseId} testCases={testCases.data} />
    </div>
  )
}

function FileGroup({
  title,
  files,
  emptyText,
  hideWhenEmpty = false,
}: {
  title: string
  files: AdminExerciseFile[]
  emptyText?: string
  hideWhenEmpty?: boolean
}) {
  if (hideWhenEmpty && files.length === 0) return null

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-200">{title}</h3>
      {files.length === 0 ? (
        <p className="text-sm text-slate-400">{emptyText}</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <FileRow key={file.id} file={file} />
          ))}
        </ul>
      )}
    </div>
  )
}

function FileRow({ file }: { file: AdminExerciseFile }) {
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const remove = useMutation({ mutationFn: () => deleteExerciseFile(file.id), onSettled: () => invalidateCatalog(queryClient) })

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-sm" data-testid="exercise-file">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-slate-100">{file.name}</span>
        <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
        <div className="ml-auto text-xs">
          {confirmDelete ? (
            <span role="group" aria-label={`${file.name} törlésének megerősítése`} className="flex items-center gap-1">
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
              aria-label={`${file.name} törlése`}
              onClick={() => setConfirmDelete(true)}
              className="h-7 w-7 rounded text-red-300 hover:bg-red-950"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      </div>
      <MutationError error={remove.error} />
    </li>
  )
}

function UploadForm({ exerciseId, testCases }: { exerciseId: number; testCases: AdminTestCase[] }) {
  const queryClient = useQueryClient()
  // A key-váltás üríti az űrlapot (a fájlválasztót is) sikeres feltöltés után.
  const [formKey, setFormKey] = useState(0)
  const upload = useMutation({
    mutationFn: uploadExerciseFile.bind(null, exerciseId),
    onSuccess: () => setFormKey((key) => key + 1),
    onSettled: () => invalidateCatalog(queryClient),
  })

  return (
    <div className="rounded-lg border border-dashed border-slate-700 p-3">
      <h3 className="text-sm font-medium text-slate-200">Fájl feltöltése</h3>
      <MutationError error={upload.error} fields={UPLOAD_FIELDS} />
      <UploadFields
        key={formKey}
        testCases={testCases}
        busy={upload.isPending}
        errors={mezoHibak(upload.error)}
        onSubmit={(payload) => upload.mutate(payload)}
      />
    </div>
  )
}

function UploadFields({
  testCases,
  busy,
  errors,
  onSubmit,
}: {
  testCases: AdminTestCase[]
  busy: boolean
  errors: Record<string, string>
  onSubmit: (payload: { file: File; name: string; testCaseId: number | null }) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [scope, setScope] = useState(SHARED)

  const scopeOptions = [
    { value: SHARED, label: 'Közös (minden tesztesetnél, a diák letöltheti)' },
    ...testCases.map((testCase, index) => ({
      value: String(testCase.id),
      label: `${index + 1}. teszteset saját fájlja${testCase.is_hidden ? ' (rejtett)' : ''}`,
    })),
  ]

  function submit(e: FormEvent) {
    e.preventDefault()
    if (file) onSubmit({ file, name: name.trim(), testCaseId: scope === SHARED ? null : Number(scope) })
  }

  return (
    <form onSubmit={submit} noValidate className="mt-3 grid gap-3">
      <div className="text-sm">
        <label htmlFor="exercise-file-input" className="mb-1 block text-slate-300">
          Fájl
        </label>
        <input
          id="exercise-file-input"
          type="file"
          aria-invalid={errors.file ? true : undefined}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-3 file:py-1.5 file:text-slate-100"
        />
        {errors.file && <p className="mt-1 text-red-300">{errors.file}</p>}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField label="Hová tartozik" options={scopeOptions} value={scope} onChange={(e) => setScope(e.target.value)} error={errors.test_case_id} />
        <Field
          label="Fájlnév a futtatáskor"
          hint="Elhagyva a feltöltött fájl neve lesz. Azonos névvel a régi fájl lecserélődik."
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
      </div>
      <div>
        <SubmitButton busy={busy} fullWidth={false}>
          {busy ? 'Feltöltés…' : 'Feltöltés'}
        </SubmitButton>
      </div>
    </form>
  )
}
