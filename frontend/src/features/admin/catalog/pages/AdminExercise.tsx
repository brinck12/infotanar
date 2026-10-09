import { useQuery } from '@tanstack/react-query'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mezoHibak } from '../../../../shared/api/errors'
import { LEVEL_LABEL } from '../../../../shared/domain/labels'
import { Badge } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { CheckboxField, Field, SelectField, Switch, TextAreaField } from '../../../../shared/ui/Form'
import { Icon } from '../../../../shared/ui/Icon'
import { Panel } from '../../../../shared/ui/Panel'
import { Prose } from '../../../../shared/ui/Prose'
import { TabPanel, Tabs } from '../../../../shared/ui/Tabs'
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
import { AdminShell } from '../../components/AdminShell'
import { RubricBuilder } from '../../exams/components/RubricBuilder'
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
const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))

type EditorTab = 'leiras' | 'tesztek' | 'szabalyok' | 'ertekelolap'

const TABS: ReadonlyArray<{ id: EditorTab; label: string }> = [
  { id: 'leiras', label: 'Leírás és kód' },
  { id: 'tesztek', label: 'Tesztesetek' },
  { id: 'szabalyok', label: 'Szabályok' },
  { id: 'ertekelolap', label: 'Értékelőlap' },
]

function ExerciseEditor({ lesson, exercise }: { lesson: AdminLesson; exercise: AdminExercise | null }) {
  const navigate = useNavigate()
  const formId = useId()
  const languages = useQuery(languagesQuery())
  const [tab, setTab] = useState<EditorTab>('leiras')
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
  // #48: közzétenni csak nyilvános tesztesettel lehet (a /run azokon fut); a backend is ellenőrzi.
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
          ? 'Közzététel előtt adj hozzá legalább egy nyilvános tesztesetet a Tesztesetek fülön.'
          : 'Új feladat csak piszkozatként menthető. A tesztesetek a létrehozás után adhatók hozzá, utána tehető közzé.',
      )
      return
    }
    setPublishError(null)
    // Csak az engedélyezett nyelvek kiinduló kódja megy el.
    const starter = Object.fromEntries(form.allowed_languages.map((l) => [l, form.starter_code[l] ?? '']))
    save.mutate({ ...form, starter_code: starter, sql_order_sensitive: form.allowed_languages.includes('sql') && form.sql_order_sensitive })
  }

  const title = exercise ? exercise.title : 'Új feladat'
  const languageError = errors.allowed_languages ?? errors['allowed_languages.0']
  const publishMessage = publishError ?? errors.is_published

  return (
    <AdminShell
      crumbs={[
        { label: 'Admin', to: '/admin' },
        { label: 'Katalógus', to: '/admin/tananyag' },
        { label: lesson.title, to: `/admin/tananyag/leckek/${lesson.id}` },
        { label: title },
      ]}
      title={title}
    >
      <Tabs label="Feladat részei" tabs={TABS} active={tab} onChange={setTab} idPrefix={formId} />

      <MutationError error={save.error} fields={EXERCISE_FIELDS} />

      <form id={formId} onSubmit={submit} noValidate>
        <TabPanel idPrefix={formId} id="leiras" active={tab === 'leiras'} className="flex flex-col gap-5">
          <Panel>
            <div className="flex flex-wrap gap-5">
              <Field className="flex-1 basis-72" label="Cím" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
              <SelectField
                className="w-44"
                label="Szint"
                options={LEVEL_OPTIONS}
                value={form.level}
                onChange={(e) => set('level', e.target.value as Level)}
                error={errors.level}
              />
              <SelectField
                className="w-32"
                label="Nehézség"
                options={DIFFICULTY_OPTIONS}
                value={String(form.difficulty)}
                onChange={(e) => set('difficulty', Number(e.target.value))}
                error={errors.difficulty}
              />
            </div>
            <fieldset className="mt-5">
              <legend className="text-15 font-semibold">Nyelvek</legend>
              <div className="mt-2.5 flex flex-wrap gap-x-7 gap-y-3">
                {(languages.data ?? []).map((language: LanguageOption) => (
                  <CheckboxField
                    key={language.key}
                    label={language.label}
                    checked={form.allowed_languages.includes(language.key)}
                    onChange={(e) => toggleLanguage(language.key, e.target.checked)}
                  />
                ))}
              </div>
              {languageError && <InlineError>{languageError}</InlineError>}
            </fieldset>
          </Panel>

          <Panel>
            <div className="flex flex-wrap gap-5">
              <TextAreaField
                className="flex-1 basis-80"
                label="Leírás (Markdown)"
                rows={12}
                mono
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                error={errors.description}
              />
              <div className="min-w-0 flex-1 basis-80">
                <p className="text-15 font-semibold">Előnézet</p>
                <div role="region" aria-label="A leírás előnézete" className="mt-1.5 min-h-40 rounded-md border border-line px-5 py-4">
                  <Prose markdown={form.description || '*(üres)*'} />
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="flex flex-col gap-5">
            {form.allowed_languages.length === 0 && <p className="text-15 text-ink-soft">Jelölj be legalább egy nyelvet a kiinduló kódhoz.</p>}
            {form.allowed_languages.map((language) => (
              <div key={language}>
                <p className="mb-2 text-15 font-semibold">
                  Kiinduló kód ({languages.data?.find((l) => l.key === language)?.label ?? language})
                </p>
                <div className="h-48 overflow-hidden rounded-md">
                  <CodeEditor
                    language={language}
                    initialValue={form.starter_code[language] ?? ''}
                    onChange={(code) => setForm((f) => ({ ...f, starter_code: { ...f.starter_code, [language]: code } }))}
                  />
                </div>
                {errors[`starter_code.${language}`] && <InlineError>{errors[`starter_code.${language}`]}</InlineError>}
              </div>
            ))}

            {form.allowed_languages.includes('sql') && (
              <CheckboxField
                label="Az SQL eredmény sorrendje számít"
                hint="Csak akkor jelöld, ha a feladat rendezést kér (ORDER BY); különben a sorok sorrendje nem számít."
                checked={form.sql_order_sensitive}
                onChange={(e) => set('sql_order_sensitive', e.target.checked)}
                error={errors.sql_order_sensitive}
              />
            )}
          </Panel>
        </TabPanel>

        <TabPanel idPrefix={formId} id="szabalyok" active={tab === 'szabalyok'}>
          <Panel>
            <ConstraintEditor
              value={form.constraints}
              onChange={(constraints) => set('constraints', constraints)}
              allowedLanguages={form.allowed_languages}
              error={errors.constraints}
            />
          </Panel>
        </TabPanel>
      </form>

      {/* A tesztesetek saját űrlapok: nem lehetnek a feladat űrlapján belül. */}
      <TabPanel idPrefix={formId} id="tesztek" active={tab === 'tesztek'}>
        {exercise ? (
          <TestCaseManager exerciseId={exercise.id} />
        ) : (
          <Banner kind="info" title="Előbb mentsd el a feladatot">
            A tesztesetek a létrehozás után adhatók hozzá.
          </Banner>
        )}
      </TabPanel>

      <TabPanel idPrefix={formId} id="ertekelolap" active={tab === 'ertekelolap'}>
        {exercise ? (
          <RubricBuilder exerciseId={exercise.id} />
        ) : (
          <Banner kind="info" title="Előbb mentsd el a feladatot">
            Az értékelőlap a létrehozás után szerkeszthető.
          </Banner>
        )}
      </TabPanel>

      <div className="flex flex-col gap-3">
        {publishMessage && <Banner kind="error">{publishMessage}</Banner>}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button type="submit" form={formId} busy={save.isPending} busyLabel="Mentés…">
            {exercise ? 'Mentés' : 'Feladat létrehozása'}
          </Button>
          <Switch label="Közzétéve" checked={form.is_published} onChange={(checked) => set('is_published', checked)} />
          <Badge kind={exercise?.is_published ? 'pub' : 'draft'}>{exercise?.is_published ? 'Közzétéve' : 'Piszkozat'}</Badge>
          <SavedNote mutation={save} />
        </div>
        <p className="text-14 leading-relaxed text-ink-soft">
          Csak közzétett feladat jelenik meg a tanulóknak, és a leckének meg a képzési ágnak is közzétettnek kell lennie.
        </p>
      </div>
    </AdminShell>
  )
}

function InlineError({ children }: { children: ReactNode }) {
  return (
    <p className="mt-1.5 flex items-start gap-1.5 text-14 leading-normal text-wrong">
      <Icon name="warn" size={16} className="mt-0.5" />
      <span>{children}</span>
    </p>
  )
}
