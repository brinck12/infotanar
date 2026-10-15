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
import { CardTitle } from '../../../../shared/ui/Text'
import type { ExerciseKind, LanguageKey, Level } from '../../../../types'
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
import { AttachmentManager } from '../components/AttachmentManager'
import { ConstraintEditor } from '../components/ConstraintEditor'
import { ExecutionLimitFields } from '../components/ExecutionLimitFields'
import { MutationError, QueryState } from '../components/QueryState'
import { SampleSolutionEditor } from '../components/SampleSolutionEditor'
import { TestCaseManager } from '../components/TestCaseManager'
import { TypeDataEditor } from '../components/TypeDataEditor'
import { SavedNote } from '../components/SavedNote'
import { isEditorKind, isUploadExerciseKind, KIND_OPTIONS } from '../kinds'
import { buildTypeData, initialTypeData, type TypeData } from '../typeData'
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
const EXERCISE_FIELDS = ['kind', 'title', 'description', 'level', 'difficulty', 'allowed_languages', 'allowed_languages.0', 'is_published', 'sql_order_sensitive', 'time_limit_ms', 'memory_limit_kb', 'constraints', 'starter_code.python', 'starter_code.csharp', 'starter_code.sql', 'sample_solutions', 'is_hidden'] as const

const LEVEL_OPTIONS = (Object.keys(LEVEL_LABEL) as Level[]).map((level) => ({ value: level, label: LEVEL_LABEL[level] }))
const DIFFICULTY_OPTIONS = [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: String(n) }))

type EditorTab = 'leiras' | 'tipus' | 'tesztek' | 'mintamegoldas' | 'szabalyok' | 'ertekelolap' | 'fajlok'

/** A fülek a feladat típusától függnek: a tesztesetek és szabályok a szerkesztős, az értékelőlap a feltöltős típusoké. */
function tabsFor(kind: ExerciseKind): ReadonlyArray<{ id: EditorTab; label: string }> {
  const tabs: Array<{ id: EditorTab; label: string }> = [
    { id: 'leiras', label: isEditorKind(kind) ? 'Leírás és kód' : 'Leírás' },
    { id: 'tipus', label: 'Típus-adatok' },
  ]
  if (isEditorKind(kind)) tabs.push({ id: 'tesztek', label: 'Tesztesetek' }, { id: 'mintamegoldas', label: 'Mintamegoldás' }, { id: 'szabalyok', label: 'Szabályok' })
  if (isUploadExerciseKind(kind)) tabs.push({ id: 'ertekelolap', label: 'Értékelőlap' })
  tabs.push({ id: 'fajlok', label: 'Fájlok' })
  return tabs
}

function ExerciseEditor({ lesson, exercise }: { lesson: AdminLesson; exercise: AdminExercise | null }) {
  const navigate = useNavigate()
  const formId = useId()
  const languages = useQuery(languagesQuery())
  const [tab, setTab] = useState<EditorTab>('leiras')
  const [form, setForm] = useState<ExercisePayload>(() => ({
    lesson_id: lesson.id,
    kind: exercise?.kind ?? 'code',
    title: exercise?.title ?? '',
    description: exercise?.description ?? '',
    level: exercise?.level ?? 'kozep',
    difficulty: exercise?.difficulty ?? 1,
    allowed_languages: exercise?.allowed_languages ?? ['python'],
    starter_code: exercise?.starter_code ?? {},
    sample_solutions: exercise?.sample_solutions ?? {},
    constraints: exercise?.constraints ?? { require: [], forbid: [] },
    spec: exercise?.spec ?? null,
    comparison: exercise?.comparison ?? null,
    sql_order_sensitive: exercise?.sql_order_sensitive ?? false,
    time_limit_ms: exercise?.time_limit_ms ?? null,
    memory_limit_kb: exercise?.memory_limit_kb ?? null,
    is_published: exercise?.is_published ?? false,
  }))
  const [typeData, setTypeData] = useState<TypeData>(() => initialTypeData(exercise))
  const [jsonError, setJsonError] = useState<string | null>(null)
  const save = useSaveEntity<AdminExercise>('exercises', exercise?.id ?? null, (saved) => {
    if (!exercise) navigate(`/admin/tananyag/feladatok/${saved.id}`, { replace: true })
    // A szerver normalizál (pl. ellenőrzési azonosítókat ad): a szerkesztő a mentett alakot mutatja.
    else if (saved.kind === form.kind) setTypeData(initialTypeData(saved))
  })
  const errors = mezoHibak(save.error)
  const hasStudentData = (exercise?.submission_count ?? 0) > 0
  const editorKind = isEditorKind(form.kind)
  const tabs = tabsFor(form.kind)
  const typeErrorKeys = Object.keys(errors).filter((key) => key === 'spec' || key.startsWith('spec.') || key === 'comparison' || key.startsWith('comparison.'))
  const shownFields = [...EXERCISE_FIELDS, ...typeErrorKeys]
  const set = <K extends keyof ExercisePayload>(key: K, value: ExercisePayload[K]) => setForm((f) => ({ ...f, [key]: value }))
  // #48: közzétenni csak nyilvános tesztesettel lehet (a /run azokon fut); a backend is ellenőrzi.
  const testCases = useQuery({ ...testCasesQuery(exercise?.id ?? 0), enabled: exercise !== null })
  const visibleTestCases = testCases.data?.filter((tc) => !tc.is_hidden).length ?? 0
  // Amíg a tesztesetek töltődnek (vagy nem jöttek meg), nem tudjuk, van-e nyilvános: akkor a szerver dönt.
  const knownWithoutVisibleTestCases = (exercise === null || testCases.isSuccess) && visibleTestCases === 0
  const [publishError, setPublishError] = useState<string | null>(null)
  const hasSampleSolution = form.allowed_languages.some((l) => (form.sample_solutions[l] ?? '').trim() !== '')
  // Az ellenőrzés a szerveren mentett állapotot futtatja: eltérésnél előbb menteni kell.
  const solutionsUnsaved = form.allowed_languages.some((l) => (form.sample_solutions[l] ?? '').trim() !== (exercise?.sample_solutions[l] ?? '').trim())

  /** Típusváltáskor a régi típus adata nem maradhat: a nyelvek és a típus-adatok az új típushoz igazodnak. */
  function changeKind(kind: ExerciseKind) {
    setForm((f) => ({
      ...f,
      kind,
      allowed_languages: kind === 'sql' ? ['sql'] : kind === 'code' ? (f.allowed_languages.filter((l) => l !== 'sql').length > 0 ? f.allowed_languages.filter((l) => l !== 'sql') : ['python']) : [],
    }))
    setTypeData(kind === exercise?.kind ? initialTypeData(exercise) : initialTypeData(null, kind))
    setJsonError(null)
    if (tab === 'tesztek' || tab === 'mintamegoldas' || tab === 'szabalyok' || tab === 'ertekelolap') setTab('tipus')
  }

  function toggleLanguage(language: LanguageKey, on: boolean) {
    setForm((f) => ({
      ...f,
      allowed_languages: on ? [...f.allowed_languages, language] : f.allowed_languages.filter((l) => l !== language),
    }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (form.is_published && editorKind && knownWithoutVisibleTestCases) {
      setPublishError(
        exercise
          ? 'Közzététel előtt adj hozzá legalább egy nyilvános tesztesetet a Tesztesetek fülön.'
          : 'Új feladat csak piszkozatként menthető. A tesztesetek a létrehozás után adhatók hozzá, utána tehető közzé.',
      )
      return
    }
    if (form.is_published && editorKind && !hasSampleSolution) {
      setPublishError('Közzététel előtt adj meg mintamegoldást legalább egy engedélyezett nyelven a Mintamegoldás fülön.')
      return
    }
    setPublishError(null)
    const built = buildTypeData(form.kind, typeData)
    setJsonError(built.jsonError)
    if (built.jsonError) {
      setTab('tipus')
      return
    }
    // Csak az engedélyezett nyelvek kiinduló kódja megy el; nem szerkesztős típusnál egyik sem.
    const chosen = editorKind ? form.allowed_languages : []
    const starter = Object.fromEntries(chosen.map((l) => [l, form.starter_code[l] ?? '']))
    const samples = Object.fromEntries(chosen.flatMap((l) => ((form.sample_solutions[l] ?? '').trim() !== '' ? [[l, form.sample_solutions[l] ?? '']] : [])))
    save.mutate({
      ...form,
      allowed_languages: chosen,
      starter_code: starter,
      sample_solutions: editorKind ? samples : {},
      spec: built.spec,
      comparison: built.comparison,
      sql_order_sensitive: chosen.includes('sql') && form.sql_order_sensitive,
    })
  }

  const title = exercise ? exercise.title : 'Új feladat'
  const languageError = errors.allowed_languages ?? errors['allowed_languages.0']
  // A közzétételi kapu hibája (mintamegoldás, nyilvános teszteset, értékelőlap) a kapcsoló mellett jelenik meg.
  const publishMessage = publishError ?? errors.is_published ?? errors.is_hidden
  const publishFix = editorKind ? (!hasSampleSolution ? 'mintamegoldas' : knownWithoutVisibleTestCases ? 'tesztek' : null) : null

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
      <Tabs label="Feladat részei" tabs={tabs} active={tab} onChange={setTab} idPrefix={formId} />

      <MutationError error={save.error} fields={shownFields} />
      {typeErrorKeys.length > 0 && tab !== 'tipus' && (
        <Banner
          kind="error"
          title="A Típus-adatok fülön hiba van"
          action={
            <Button variant="secondary" onClick={() => setTab('tipus')}>
              Megnyitás
            </Button>
          }
        >
          A feladat típusához tartozó adatokat a szerver nem fogadta el. Nyisd meg a fület, ott a hibák a mezők alatt vannak.
        </Banner>
      )}

      <form id={formId} onSubmit={submit} noValidate>
        <TabPanel idPrefix={formId} id="leiras" active={tab === 'leiras'} className="flex flex-col gap-5">
          <Panel>
            <div className="flex flex-wrap gap-5">
              <SelectField
                className="w-full basis-96 sm:w-auto"
                label="Típus"
                options={KIND_OPTIONS}
                value={form.kind}
                disabled={hasStudentData}
                onChange={(e) => changeKind(e.target.value as ExerciseKind)}
                hint={
                  hasStudentData
                    ? 'A típus már nem módosítható, mert diákok dolgoztak a feladattal.'
                    : 'A típus dönti el, milyen munkafelületet kap a tanuló és mit adsz meg hozzá.'
                }
                error={errors.kind}
              />
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
            {editorKind && form.kind === 'sql' && <p className="mt-5 text-15 text-ink-soft">Az SQL feladat nyelve mindig az SQL.</p>}
            {editorKind && form.kind === 'code' && (
            <fieldset className="mt-5">
              <legend className="text-15 font-semibold">Nyelvek</legend>
              <div className="mt-2.5 flex flex-wrap gap-x-7 gap-y-3">
                {(languages.data ?? []).filter((language) => language.key !== 'sql' || form.allowed_languages.includes('sql')).map((language: LanguageOption) => (
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
            )}
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

          {editorKind && (
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
          )}

          {editorKind && (
          <Panel as="section" aria-labelledby={`${formId}-korlatok`}>
            <CardTitle id={`${formId}-korlatok`} as="h2">
              Futtatási korlátok
            </CardTitle>
            <div className="mt-4">
              <ExecutionLimitFields
                value={{ time_limit_ms: form.time_limit_ms, memory_limit_kb: form.memory_limit_kb }}
                onChange={(limits) => setForm((f) => ({ ...f, ...limits }))}
                languages={(languages.data ?? []).filter((language) => form.allowed_languages.includes(language.key))}
                errors={errors}
              />
            </div>
          </Panel>
          )}
        </TabPanel>

        <TabPanel idPrefix={formId} id="tipus" active={tab === 'tipus'}>
          <TypeDataEditor kind={form.kind} value={typeData} onChange={setTypeData} errors={errors} jsonError={jsonError} />
        </TabPanel>

        <TabPanel idPrefix={formId} id="mintamegoldas" active={tab === 'mintamegoldas'}>
          <SampleSolutionEditor
            exerciseId={exercise?.id ?? null}
            languages={form.allowed_languages}
            options={languages.data ?? []}
            value={form.sample_solutions}
            onChange={(language, code) => setForm((f) => ({ ...f, sample_solutions: { ...f.sample_solutions, [language]: code } }))}
            unsaved={solutionsUnsaved}
            errors={errors}
          />
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

      <TabPanel idPrefix={formId} id="fajlok" active={tab === 'fajlok'}>
        {exercise ? (
          <AttachmentManager exerciseId={exercise.id} kind={form.kind} />
        ) : (
          <Banner kind="info" title="Előbb mentsd el a feladatot">
            A fájlok a létrehozás után tölthetők fel.
          </Banner>
        )}
      </TabPanel>

      <div className="flex flex-col gap-3">
        {publishMessage && (
          <Banner
            kind="error"
            title="A feladat nem tehető közzé"
            data-testid="publish-error"
            action={
              publishFix ? (
                <Button variant="secondary" onClick={() => setTab(publishFix)}>
                  {publishFix === 'mintamegoldas' ? 'Mintamegoldás megnyitása' : 'Tesztesetek megnyitása'}
                </Button>
              ) : undefined
            }
          >
            {publishMessage}
          </Banner>
        )}
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
