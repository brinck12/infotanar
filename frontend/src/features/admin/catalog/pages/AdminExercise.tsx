import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate, useParams } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import { mezoHibak } from '../../../../shared/api/errors'
import { LEVEL_LABEL } from '../../../../shared/domain/labels'
import { CheckboxField, Field, SelectField, SubmitButton, TextAreaField } from '../../../../shared/ui/Form'
import type { LanguageKey, Level } from '../../../../types'
import { CodeEditor } from '../../../workspace/components/CodeEditor'
import {
  exerciseQuery,
  languagesQuery,
  lessonQuery,
  testCasesQuery,
  type AdminExercise,
  type AdminLesson,
  type ExercisePayload,
  type LanguageOption,
} from '../api'
import { HistoryLink } from '../../audit/components/HistoryLink'
import { AdminShell, Section } from '../../components/AdminShell'
import { ConstraintEditor } from '../components/ConstraintEditor'
import { MutationError, QueryState } from '../components/QueryState'
import { TestCaseManager } from '../components/TestCaseManager'
import { SavedNote } from '../components/SavedNote'
import { useSaveEntity } from '../useCatalogMutations'

/** Meglévő feladat szerkesztése. */
export function AdminExercise() {
  const id = Number(useParams().exerciseId)
  const exercise = useQuery(exerciseQuery(id))

  return (
    <QueryState query={exercise}>
      {(data) => <LessonContext lessonId={data.lesson_id}>{(lesson) => <ExerciseEditor key={data.id} lesson={lesson} exercise={data} />}</LessonContext>}
    </QueryState>
  )
}

/** Új feladat egy leckéhez. */
export function AdminNewExercise() {
  const lessonId = Number(useParams().lessonId)

  return <LessonContext lessonId={lessonId}>{(lesson) => <ExerciseEditor lesson={lesson} exercise={null} />}</LessonContext>
}

function LessonContext({ lessonId, children }: { lessonId: number; children: (lesson: AdminLesson) => ReactNode }) {
  const lesson = useQuery(lessonQuery(lessonId))
  return <QueryState query={lesson}>{children}</QueryState>
}

/** Az űrlapon megjelenített mezőhibák; minden más a szakasz tetején. */
const EXERCISE_FIELDS = ['title', 'description', 'level', 'difficulty', 'allowed_languages', 'allowed_languages.0', 'is_published', 'sql_order_sensitive', 'constraints', 'starter_code.python', 'starter_code.csharp', 'starter_code.sql'] as const

const LEVEL_OPTIONS = (Object.keys(LEVEL_LABEL) as Level[]).map((level) => ({ value: level, label: LEVEL_LABEL[level] }))
const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} ${'★'.repeat(n)}` }))

function ExerciseEditor({ lesson, exercise }: { lesson: AdminLesson; exercise: AdminExercise | null }) {
  const navigate = useNavigate()
  const languages = useQuery(languagesQuery())
  const [preview, setPreview] = useState(false)
  const [form, setForm] = useState<ExercisePayload>(() => ({
    lesson_id: lesson.id,
    title: exercise?.title ?? '',
    description: exercise?.description ?? '',
    level: exercise?.level ?? 'kozep',
    difficulty: exercise?.difficulty ?? 1,
    allowed_languages: exercise?.allowed_languages ?? ['python'],
    starter_code: exercise?.starter_code ?? {},
    constraints: exercise?.constraints ?? { require: [], forbid: [] },
    sql_order_sensitive: exercise?.sql_order_sensitive ?? false,
    is_published: exercise?.is_published ?? false,
  }))
  const save = useSaveEntity<AdminExercise>('exercises', exercise?.id ?? null, (saved) => {
    if (!exercise) navigate(`/admin/tananyag/feladatok/${saved.id}`, { replace: true })
  })
  const errors = mezoHibak(save.error)
  const set = <K extends keyof ExercisePayload>(key: K, value: ExercisePayload[K]) => setForm((f) => ({ ...f, [key]: value }))
  // #48: publikálni csak nyilvános tesztesettel lehet (a /run azokon fut); a backend is ellenőrzi.
  const testCases = useQuery({ ...testCasesQuery(exercise?.id ?? 0), enabled: exercise !== null })
  const visibleTestCases = testCases.data?.filter((tc) => !tc.is_hidden).length ?? 0
  const [publishError, setPublishError] = useState<string | null>(null)

  function toggleLanguage(language: LanguageKey, on: boolean) {
    setForm((f) => ({
      ...f,
      allowed_languages: on ? [...f.allowed_languages, language] : f.allowed_languages.filter((l) => l !== language),
    }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (form.is_published && visibleTestCases === 0) {
      setPublishError(
        exercise
          ? 'Publikálás előtt adj hozzá legalább egy nyilvános tesztesetet (lent, a Tesztesetek résznél).'
          : 'Új feladat csak vázlatként menthető: a tesztesetek a létrehozás után adhatók hozzá, utána publikálható.',
      )
      return
    }
    setPublishError(null)
    // Csak az engedélyezett nyelvek kiinduló kódja megy el.
    const starter = Object.fromEntries(form.allowed_languages.map((l) => [l, form.starter_code[l] ?? '']))
    save.mutate({ ...form, starter_code: starter, sql_order_sensitive: form.allowed_languages.includes('sql') && form.sql_order_sensitive })
  }

  const title = exercise ? exercise.title : 'Új feladat'

  return (
    <AdminShell
      crumbs={[
        { label: 'Admin' },
        { label: 'Tananyag', to: '/admin/tananyag' },
        { label: lesson.title, to: `/admin/tananyag/leckek/${lesson.id}` },
        { label: title },
      ]}
      title={title}
      actions={exercise ? <HistoryLink subjectType="exercise" subjectId={exercise.id} /> : undefined}
    >
      <form onSubmit={submit} noValidate className="space-y-8">
        <Section title="Feladat" aside={<SavedNote mutation={save} />}>
          <MutationError error={save.error} fields={EXERCISE_FIELDS} />
          <div className="grid gap-4">
            <Field label="Cím" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Szint"
                options={LEVEL_OPTIONS}
                value={form.level}
                onChange={(e) => set('level', e.target.value as Level)}
                error={errors.level}
              />
              <SelectField
                label="Nehézség"
                options={DIFFICULTY_OPTIONS}
                value={String(form.difficulty)}
                onChange={(e) => set('difficulty', Number(e.target.value))}
                error={errors.difficulty}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-end">
                <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs text-sky-400 hover:underline" aria-pressed={preview}>
                  {preview ? 'Vissza a szerkesztéshez' : 'Előnézet'}
                </button>
              </div>
              {preview ? (
                <div aria-label="A leírás előnézete" role="region" className="prose-invert min-h-40 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-200 [&_code]:rounded [&_code]:bg-slate-950 [&_code]:px-1 [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.description || '*(üres)*'}</ReactMarkdown>
                </div>
              ) : (
                <TextAreaField
                  label="Leírás (Markdown)"
                  rows={10}
                  mono
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  error={errors.description}
                />
              )}
            </div>

            <CheckboxField
              label="Publikált"
              hint="Csak publikált feladat jelenik meg a diákoknak (a leckének és a képzési ágnak is publikáltnak kell lennie)."
              checked={form.is_published}
              onChange={(e) => set('is_published', e.target.checked)}
              error={publishError ?? errors.is_published}
            />
          </div>
        </Section>

        <Section title="Nyelvek és kiinduló kód">
          <fieldset className="text-sm">
            <legend className="mb-2 text-slate-300">Engedélyezett nyelvek</legend>
            <div className="flex flex-wrap gap-4">
              {(languages.data ?? []).map((language: LanguageOption) => (
                <CheckboxField
                  key={language.key}
                  label={language.label}
                  checked={form.allowed_languages.includes(language.key)}
                  onChange={(e) => toggleLanguage(language.key, e.target.checked)}
                />
              ))}
            </div>
            {(errors.allowed_languages ?? errors['allowed_languages.0']) && (
              <p className="mt-1 text-red-300">{errors.allowed_languages ?? errors['allowed_languages.0']}</p>
            )}
          </fieldset>

          <div className="mt-5 space-y-5">
            {form.allowed_languages.map((language) => (
              <div key={language}>
                <p className="mb-1 text-sm text-slate-300">
                  Kiinduló kód – {languages.data?.find((l) => l.key === language)?.label ?? language}
                </p>
                <div className="h-48">
                  <CodeEditor
                    language={language}
                    initialValue={form.starter_code[language] ?? ''}
                    onChange={(code) => setForm((f) => ({ ...f, starter_code: { ...f.starter_code, [language]: code } }))}
                  />
                </div>
                {errors[`starter_code.${language}`] && <p className="mt-1 text-sm text-red-300">{errors[`starter_code.${language}`]}</p>}
              </div>
            ))}
          </div>

          {form.allowed_languages.includes('sql') && (
            <div className="mt-5">
              <CheckboxField
                label="Az SQL eredmény sorrendje számít"
                hint="Csak akkor jelöld, ha a feladat ORDER BY-t kér; különben a sorok sorrendje nem számít."
                checked={form.sql_order_sensitive}
                onChange={(e) => set('sql_order_sensitive', e.target.checked)}
                error={errors.sql_order_sensitive}
              />
            </div>
          )}
        </Section>

        <Section title="Kódszabályok">
          <ConstraintEditor
            value={form.constraints}
            onChange={(constraints) => set('constraints', constraints)}
            allowedLanguages={form.allowed_languages}
            error={errors.constraints}
          />
        </Section>

        <div className="flex items-center gap-3">
          <SubmitButton busy={save.isPending} fullWidth={false}>
            {save.isPending ? 'Mentés…' : exercise ? 'Mentés' : 'Feladat létrehozása'}
          </SubmitButton>
          <SavedNote mutation={save} />
        </div>
      </form>

      {/* Külön űrlapok: nem lehetnek a feladat űrlapján belül. */}
      {exercise && (
        <Section title="Tesztesetek">
          <TestCaseManager exerciseId={exercise.id} />
        </Section>
      )}
    </AdminShell>
  )
}
