import type { ReactNode } from 'react'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { CheckboxField, Field, SelectField, TextAreaField } from '../../../../shared/ui/Form'
import { Panel } from '../../../../shared/ui/Panel'
import { CardTitle } from '../../../../shared/ui/Text'
import type { ExerciseKind } from '../../../../types'
import { IconButton } from './ChildList'
import type { ComparisonMode } from '../api'
import { isJsonKind, isUploadExerciseKind, UPLOAD_EXTENSIONS } from '../kinds'
import { newRowKey, sampleText, type SubtaskRow, type TypeData, type UploadFields } from '../typeData'

interface TypeDataEditorProps {
  kind: ExerciseKind
  value: TypeData
  onChange: (value: TypeData) => void
  /** A mentés mezőhibái; a `spec…` és `comparison…` kulcsok ide tartoznak. */
  errors: Record<string, string>
  /** A JSON szövegének hibája mentéskor. */
  jsonError: string | null
}

const COMPARISON_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: 'Alapértelmezett (soronkénti egyezés)' },
  { value: 'exact', label: 'Pontos egyezés' },
  { value: 'tokens', label: 'Szavankénti egyezés (a szóközök nem számítanak)' },
  { value: 'numeric', label: 'Számok egyezése megadott tűréssel' },
]

/** Azok a hibák, amelyek a `spec` (vagy a `comparison`) valamelyik részére vonatkoznak. */
function errorsUnder(errors: Record<string, string>, prefix: string): string[] {
  return Object.entries(errors)
    .filter(([key]) => key === prefix || key.startsWith(`${prefix}.`))
    .map(([, message]) => message)
}

/** A „Típus-adatok” fül: a feladat típusától függő űrlap. */
export function TypeDataEditor({ kind, value, onChange, errors, jsonError }: TypeDataEditorProps) {
  if (isUploadExerciseKind(kind)) return <UploadForm kind={kind} value={value} onChange={onChange} errors={errors} />
  if (isJsonKind(kind)) return <JsonForm kind={kind} value={value} onChange={onChange} errors={errors} jsonError={jsonError} />
  return <CodeForm value={value} onChange={onChange} errors={errors} />
}

type FormProps = Pick<TypeDataEditorProps, 'value' | 'onChange' | 'errors'>

function ErrorList({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null
  return (
    <Banner kind="error" className="mb-4">
      {messages.join(' ')}
    </Banner>
  )
}

function UploadForm({ kind, value, onChange, errors }: FormProps & { kind: ExerciseKind }) {
  const allowed = UPLOAD_EXTENSIONS[kind as keyof typeof UPLOAD_EXTENSIONS] ?? []
  const set = <K extends keyof UploadFields>(key: K, next: UploadFields[K]) => onChange({ ...value, upload: { ...value.upload, [key]: next } })
  const toggle = (extension: string, on: boolean) =>
    set('accepted_extensions', on ? [...value.upload.accepted_extensions, extension] : value.upload.accepted_extensions.filter((item) => item !== extension))
  const shown = ['spec.steps', 'spec.deliverable', 'spec.accepted_extensions', 'spec.software', 'spec.exam_reference', 'spec.exam_points', 'spec.raw_points']
  const other = Object.entries(errors)
    .filter(([key]) => (key === 'spec' || key.startsWith('spec.')) && !shown.some((s) => key === s || key.startsWith(`${s}.`)))
    .map(([, message]) => message)

  return (
    <Panel className="flex flex-col gap-5">
      <ErrorList messages={other} />
      <TextAreaField
        label="Teendők (soronként egy lépés)"
        hint="A feladatlap lépései sorrendben. A tanuló számozott listaként látja."
        rows={7}
        value={value.upload.steps}
        onChange={(e) => set('steps', e.target.value)}
        error={errorsUnder(errors, 'spec.steps').join(' ') || undefined}
      />
      <div className="flex flex-wrap gap-5">
        <Field
          className="w-60"
          label="Beadandó fájl neve"
          hint="Kiterjesztés nélkül, pl. hyrox."
          mono
          value={value.upload.deliverable}
          onChange={(e) => set('deliverable', e.target.value)}
          error={errors['spec.deliverable']}
        />
        <Field
          className="flex-1 basis-72"
          label="Használható programok"
          hint="Vesszővel elválasztva, pl. Excel, LibreOffice Calc."
          value={value.upload.software}
          onChange={(e) => set('software', e.target.value)}
          error={errorsUnder(errors, 'spec.software').join(' ') || undefined}
        />
      </div>
      <fieldset>
        <legend className="text-15 font-semibold">Elfogadott kiterjesztések</legend>
        <div className="mt-2.5 flex flex-wrap gap-x-7 gap-y-3">
          {allowed.map((extension) => (
            <CheckboxField
              key={extension}
              label={extension}
              checked={value.upload.accepted_extensions.includes(extension)}
              onChange={(e) => toggle(extension, e.target.checked)}
            />
          ))}
        </div>
        <p className="mt-2 text-14 leading-relaxed text-ink-soft">Legalább egyet jelölj be: csak ilyen fájlt adhat be a tanuló.</p>
        {errorsUnder(errors, 'spec.accepted_extensions').length > 0 && (
          <p role="alert" className="mt-1.5 text-14 leading-normal text-wrong">
            {errorsUnder(errors, 'spec.accepted_extensions').join(' ')}
          </p>
        )}
      </fieldset>
      <div className="flex flex-wrap gap-5">
        <Field
          className="flex-1 basis-72"
          label="Vizsgahivatkozás"
          hint="Honnan származik, pl. 2026. május, 3. feladat."
          value={value.upload.exam_reference}
          onChange={(e) => set('exam_reference', e.target.value)}
          error={errors['spec.exam_reference']}
        />
        <Field
          className="w-40"
          label="Vizsgapont"
          type="number"
          min={1}
          hint="A hivatalos pontszám."
          value={value.upload.exam_points}
          onChange={(e) => set('exam_points', e.target.value)}
          error={errors['spec.exam_points']}
        />
        <Field
          className="w-40"
          label="Nyers pont"
          type="number"
          min={1}
          hint="Az átszámítás előtti maximum; a diák nem látja."
          value={value.upload.raw_points}
          onChange={(e) => set('raw_points', e.target.value)}
          error={errors['spec.raw_points']}
        />
      </div>
    </Panel>
  )
}

function JsonForm({ kind, value, onChange, errors, jsonError }: FormProps & { kind: ExerciseKind; jsonError: string | null }) {
  const messages = [...(jsonError ? [jsonError] : []), ...errorsUnder(errors, 'spec')]
  const sample = sampleText(kind)

  return (
    <Panel className="flex flex-col gap-4">
      <CardTitle as="h2">Típus-adatok (JSON)</CardTitle>
      <p className="max-w-prose text-15 leading-relaxed text-ink-soft">
        A feladat adatai JSON-ként szerkeszthetők. A szerver mentéskor ellenőrzi a szerkezetet, a hibát a szövegmező alatt látod. Üres szöveg
        törli az adatokat, a piszkozat így is menthető.
      </p>
      <TextAreaField
        label="A feladat adatai (JSON)"
        rows={18}
        mono
        spellCheck={false}
        value={value.specText}
        onChange={(e) => onChange({ ...value, specText: e.target.value })}
        error={messages.length > 0 ? messages.join(' ') : undefined}
      />
      {sample && (
        <div>
          <Button variant="secondary" onClick={() => onChange({ ...value, specText: sample })} disabled={value.specText.trim() !== ''}>
            Minta beillesztése
          </Button>
          {value.specText.trim() !== '' && <p className="mt-2 text-14 text-ink-soft">A minta csak üres mezőbe illeszthető be.</p>}
        </div>
      )}
    </Panel>
  )
}

function CodeForm({ value, onChange, errors }: FormProps) {
  const setRow = (index: number, patch: Partial<SubtaskRow>) =>
    onChange({ ...value, subtasks: value.subtasks.map((row, i) => (i === index ? { ...row, ...patch } : row)) })
  const nextNumber = value.subtasks.reduce((max, row) => Math.max(max, Number(row.number) || 0), 0) + 1
  const comparison = value.comparison
  const setComparison = (patch: Partial<NonNullable<typeof comparison>>) =>
    onChange({
      ...value,
      comparison: { mode: 'exact', case_insensitive: false, ignore_accents: false, ignore_blank_lines: false, abs_tol: null, rel_tol: null, ...comparison, ...patch },
    })
  const subtaskErrors = errorsUnder(errors, 'spec')
  const comparisonErrors = errorsUnder(errors, 'comparison')

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-4">
        <CardTitle as="h2">Részfeladatok</CardTitle>
        <p className="max-w-prose text-15 leading-relaxed text-ink-soft">
          Ha a program a kimenetben számozva írja ki a feladatokat (pl. „3. feladat”), itt megadhatod a részfeladatok sorszámát, címét és
          pontját. Nem kötelező.
        </p>
        <ErrorList messages={subtaskErrors} />
        {value.subtasks.length === 0 ? (
          <p className="text-15 text-ink-soft">Még nincs részfeladat.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {value.subtasks.map((row, index) => (
              <li key={row.key} className="flex flex-wrap items-start gap-4 border-t border-grid pt-4">
                <Field
                  className="w-28"
                  label={`${index + 1}. sor: sorszám`}
                  type="number"
                  min={1}
                  value={row.number}
                  onChange={(e) => setRow(index, { number: e.target.value })}
                />
                <Field className="flex-1 basis-64" label={`${index + 1}. sor: megnevezés`} value={row.label} onChange={(e) => setRow(index, { label: e.target.value })} />
                <Field
                  className="w-28"
                  label={`${index + 1}. sor: pont`}
                  type="number"
                  min={1}
                  value={row.points}
                  onChange={(e) => setRow(index, { points: e.target.value })}
                />
                <div className="pt-7.5">
                  <IconButton
                    icon="trash"
                    label={`${index + 1}. részfeladat törlése`}
                    disabled={false}
                    danger
                    onClick={() => onChange({ ...value, subtasks: value.subtasks.filter((_, i) => i !== index) })}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div>
          <Button
            variant="secondary"
            icon="plus"
            onClick={() => onChange({ ...value, subtasks: [...value.subtasks, { key: newRowKey(), number: String(nextNumber), label: '', points: '1' }] })}
          >
            Részfeladat hozzáadása
          </Button>
        </div>
      </Panel>

      <Panel className="flex flex-col gap-4">
        <CardTitle as="h2">Kimenet összevetése</CardTitle>
        <p className="max-w-prose text-15 leading-relaxed text-ink-soft">
          Azt állítja be, mennyire szigorúan veti össze a rendszer a program kimenetét a várt kimenettel.
        </p>
        <ErrorList messages={comparisonErrors} />
        <SelectField
          className="w-full max-w-lg"
          label="Az összevetés módja"
          options={COMPARISON_OPTIONS}
          value={comparison?.mode ?? ''}
          onChange={(e) => {
            const mode = e.target.value
            if (mode === '') onChange({ ...value, comparison: null })
            else setComparison({ mode: mode as ComparisonMode })
          }}
        />
        {comparison && (
          <>
            <ComparisonFlags>
              <CheckboxField label="A kis- és nagybetű nem számít" checked={comparison.case_insensitive} onChange={(e) => setComparison({ case_insensitive: e.target.checked })} />
              <CheckboxField label="Az ékezetek nem számítanak" checked={comparison.ignore_accents} onChange={(e) => setComparison({ ignore_accents: e.target.checked })} />
              <CheckboxField label="Az üres sorok nem számítanak" checked={comparison.ignore_blank_lines} onChange={(e) => setComparison({ ignore_blank_lines: e.target.checked })} />
            </ComparisonFlags>
            {comparison.mode === 'numeric' && (
              <div className="flex flex-wrap gap-5">
                <Field
                  className="w-52"
                  label="Abszolút tűrés"
                  type="number"
                  min={0}
                  max={1000}
                  step="any"
                  hint="Ennyi eltérést még elfogadunk."
                  value={comparison.abs_tol ?? ''}
                  onChange={(e) => setComparison({ abs_tol: e.target.value === '' ? null : Number(e.target.value) })}
                />
                <Field
                  className="w-52"
                  label="Relatív tűrés"
                  type="number"
                  min={0}
                  max={1}
                  step="any"
                  hint="0 és 1 között, pl. 0,01 az egy százalék."
                  value={comparison.rel_tol ?? ''}
                  onChange={(e) => setComparison({ rel_tol: e.target.value === '' ? null : Number(e.target.value) })}
                />
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  )
}

function ComparisonFlags({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-x-7 gap-y-3">{children}</div>
}
