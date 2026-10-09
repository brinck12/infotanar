import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { saveBlob } from '../../../shared/api/download'
import { hibaUzenet, zarolasOka } from '../../../shared/api/errors'
import { LANGUAGE_LABEL } from '../../../shared/domain/labels'
import { rememberLastTask } from '../../../shared/domain/lastTask'
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery'
import { usePersistentState } from '../../../shared/hooks/usePersistentState'
import { Badge, LevelBadge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { FileChip } from '../../../shared/ui/Dropzone'
import { formatBytes } from '../../../shared/ui/format'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { Prose } from '../../../shared/ui/Prose'
import { useCrumbs } from '../../../shared/ui/shell'
import { SplitPane } from '../../../shared/ui/SplitPane'
import type { LanguageKey, RunRequest, TaskDetail, UnlockedTaskDetail } from '../../../types'
import { useAuth } from '../../auth/context'
import { catalogKeys, taskQuery } from '../../catalog/api'
import { isUploadKind } from '../../filetasks/api'
import { FileTaskWorkspace } from '../../filetasks/components/FileTaskWorkspace'
import { DocPracticeWorkspace } from '../../practice/doc/DocPracticeWorkspace'
import { SheetPracticeWorkspace } from '../../practice/sheet/SheetPracticeWorkspace'
import { progressKeys } from '../../progress/api'
import { WebTaskWorkspace } from '../../webtasks/components/WebTaskWorkspace'
import { runCode, submitCode } from '../api'
import { CodeEditor, type EditorReplacement } from '../components/CodeEditor'
import { LessonVideo } from '../components/LessonVideo'
import { Paywall } from '../components/Paywall'
import { ResetCodeButton } from '../components/ResetCodeButton'
import { ResultPanel } from '../components/ResultPanel'
import { SqlSchemaPanel } from '../components/SqlSchemaPanel'
import { WorkspaceTabs, type WorkspaceView } from '../components/WorkspaceTabs'
import { useCodeDraft } from '../useCodeDraft'

type Mode = 'run' | 'submit'

/** Ettől a szélességtől egymás mellett, húzható elválasztóval; alatta fülek. */
const WIDE_LAYOUT = '(min-width: 1024px)'
const DEFAULT_SPLIT = 0.42

function isSplitRatio(value: unknown): value is number {
  return typeof value === 'number' && value > 0.05 && value < 0.95
}

export function TaskSolve() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const taskId = Number(id)
  const validId = Number.isInteger(taskId) && taskId > 0

  const task = useQuery({ ...taskQuery(taskId), enabled: validId })

  useCrumbs(
    task.data
      ? [{ label: 'Feladatok', to: '/feladatok' }, { label: task.data.topic.name, to: `/feladatok?temakor=${task.data.topic.slug}` }, { label: task.data.title }]
      : [{ label: 'Feladatok', to: '/feladatok' }],
  )

  if (!validId || task.isError) {
    return (
      <main className="mx-auto w-full max-w-form px-4 py-12 md:px-6">
        <Banner
          kind="error"
          title="Nem sikerült megnyitni a feladatot"
          data-testid="task-load-error"
          action={
            <ButtonLink to="/feladatok" variant="secondary">
              Vissza a feladatokhoz
            </ButtonLink>
          }
        >
          {validId ? hibaUzenet(task.error) : 'Érvénytelen feladatazonosító.'}
        </Banner>
      </main>
    )
  }

  // A piszkozat felhasználóhoz kötött: a munkaterület csak az auth-állapot ismeretében indul.
  if (task.isPending || authLoading) return <PageLoader label="Feladat betöltése…" />

  if (task.data.locked) {
    return (
      <main className="mx-auto w-full max-w-account px-4 py-8 md:px-6">
        <TaskHeading task={task.data} />
        <div className="mt-6">
          <Paywall reason={task.data.locked_reason} message={task.data.locked_message} />
        </div>
      </main>
    )
  }

  // Fájlalapú feladat (táblázat, szöveg, bemutató): saját programban készül, feltöltve pontozzuk.
  if (isUploadKind(task.data.kind)) return <FileTaskWorkspace key={`${task.data.id}:${user?.id ?? 'guest'}`} task={task.data} />

  // A böngészőben megoldható változatok: weboldal, táblázatos és szöveges gyakorló.
  if (task.data.web_task) return <WebTaskWorkspace key={task.data.id} task={task.data} info={task.data.web_task} />
  if (task.data.sheet_practice) return <SheetPracticeWorkspace key={task.data.id} task={task.data} info={task.data.sheet_practice} />
  if (task.data.doc_practice) return <DocPracticeWorkspace key={task.data.id} task={task.data} info={task.data.doc_practice} />

  // A key miatt másik feladatra lépve vagy felhasználóváltáskor (kijelentkezés)
  // a szerkesztő tisztán újraindul, és a piszkozat nem kerül át másik fiókhoz.
  return <Workspace key={`${task.data.id}:${user?.id ?? 'guest'}`} task={task.data} />
}

function TaskHeading({ task }: { task: TaskDetail }) {
  return (
    <>
      <h1 className="font-serif text-32 leading-tight font-semibold tracking-tight">{task.title}</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <LevelBadge level={task.level} />
        {task.allowed_languages.map((language) => (
          <Badge key={language} kind="lang">
            {LANGUAGE_LABEL[language]}
          </Badge>
        ))}
        {task.is_free === true && <Badge kind="free">Ingyenes</Badge>}
      </div>
    </>
  )
}

function Workspace({ task }: { task: UnlockedTaskDetail }) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  // Piszkozat felhasználónként, feladatonként és nyelvenként (#33).
  const userKey = user ? `u${user.id}` : 'guest'
  const { language, code, starterCode, restored, setCode, changeLanguage: switchLanguage, resetToStarter } = useCodeDraft(
    task,
    userKey,
  )
  // A szerkesztő a saját tartalmának gazdája; a tartalomcserét (nyelvváltás,
  // visszaállítás) sorszámozott kéréssel adjuk át neki.
  const [replacement, setReplacement] = useState<EditorReplacement>({ value: code, seq: 0, undoable: false })
  const [mode, setMode] = useState<Mode>('run')
  const wide = useMediaQuery(WIDE_LAYOUT)
  // Keskeny nézetben (#30) melyik fül látszik; a leírással kezdünk.
  const [view, setView] = useState<WorkspaceView>('task')
  // Felhasználónként (ugyanazon a gépen) megőrzött panelarány (#29).
  const [split, setSplit] = usePersistentState(`infotanar.workspace.split.${user?.id ?? 'guest'}`, DEFAULT_SPLIT, isSplitRatio)

  const execution = useMutation({
    mutationFn: ({ kind, payload }: { kind: Mode; payload: RunRequest }) =>
      kind === 'run' ? runCode(payload) : submitCode(payload),
    // Menet közben lejárt/megszűnt a hozzáférés (pl. kijelentkezés másik fülön):
    // a feladatot újratöltjük, és a szülő a zárolt nézetre vált.
    onError: (error) => {
      if (zarolasOka(error)) void queryClient.invalidateQueries({ queryKey: catalogKeys.task(task.id) })
    },
    // Egy beadás (akár sikertelen) a lecke állapotát is változtathatja (#28).
    onSuccess: (_, { kind }) => {
      if (kind === 'submit') void queryClient.invalidateQueries({ queryKey: progressKeys.all })
    },
  })

  /** #32: a jelenlegi nyelv pontos kiinduló kódja; a korábbi eredmény is eltűnik. */
  function resetCode() {
    resetToStarter()
    setReplacement((r) => ({ value: starterCode, seq: r.seq + 1, undoable: true }))
    execution.reset()
  }

  /** A jelenlegi kód piszkozatként megmarad; az új nyelv saját piszkozata töltődik be. */
  function changeLanguage(next: LanguageKey) {
    if (next === language) return
    const nextCode = switchLanguage(next)
    setReplacement((r) => ({ value: nextCode, seq: r.seq + 1, undoable: false }))
    execution.reset()
  }

  function execute(kind: Mode) {
    setMode(kind)
    execution.mutate({ kind, payload: { task_id: task.id, language, source_code: code } })
  }

  const running = execution.isPending

  // Az „Itt tartottál legutóbb” sorhoz megjegyezzük a megnyitott feladatot.
  useEffect(() => {
    rememberLastTask(userKey, { id: task.id, title: task.title, topic: task.topic.name })
  }, [userKey, task.id, task.title, task.topic.name])

  const description = (
    <section aria-label="Feladat leírása" className="flex flex-col gap-4">
      <Panel pad="xl">
        <TaskHeading task={task} />
        {task.constraints && task.constraints.length > 0 && (
          <Banner kind="info" title="Kódszabályok" className="mt-6" data-testid="task-constraints">
            <ul className="list-disc pl-5">
              {task.constraints.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </Banner>
        )}
        <Prose markdown={task.description} className="mt-8" />

        {task.sql_task && <SqlSchemaPanel info={task.sql_task} />}

        {task.sources && task.sources.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-19 leading-snug font-semibold">Forrásfájlok</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              {task.sources.map((file) => (
                <FileChip key={file.name} name={file.name} size={formatBytes(file.size)} href={file.url} />
              ))}
            </div>
          </div>
        )}

        {task.example_test_cases.length > 0 && (
          <div className="mt-8">
            <h2 className="font-serif text-19 leading-snug font-semibold">Nyilvános tesztesetek</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {task.example_test_cases.map((tc, i) => (
                <li key={tc.id} className="flex flex-wrap gap-3">
                  <ExampleBlock label={`${i + 1}. bemenet`} value={tc.stdin} />
                  <ExampleBlock label="Elvárt kimenet" value={tc.expected_stdout} />
                </li>
              ))}
            </ul>
            {task.hidden_test_case_count > 0 && (
              <p className="mt-3 text-15 leading-relaxed text-ink-soft">
                Beadáskor további {task.hidden_test_case_count} rejtett teszteset is lefut.
              </p>
            )}
          </div>
        )}
      </Panel>

      {task.lesson && <LessonVideo lesson={task.lesson} />}
    </section>
  )

  const solution = (
    <section aria-label="Megoldás">
      <Panel kind="work" pad="none" className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-grid px-5 py-3">
          <LanguageSwitch languages={task.allowed_languages} value={language} onChange={changeLanguage} disabled={running} />
          <span className="flex-auto" />
          {language === 'sql' && (
            <Button variant="text" icon="download" onClick={() => saveBlob(new Blob([code], { type: 'application/sql' }), `feladat-${task.id}.sql`)}>
              Mentés .sql fájlba
            </Button>
          )}
          <ResetCodeButton dirty={code !== starterCode} disabled={running} onReset={resetCode} />
        </div>

        {restored && code !== starterCode && (
          <p className="border-b border-grid bg-note px-5 py-2 text-14 text-ink" data-testid="draft-restored">
            A legutóbb szerkesztett kódodat töltöttük vissza ebből a böngészőből.
          </p>
        )}

        <div className="h-105">
          <CodeEditor language={language} initialValue={code} onChange={setCode} replace={replacement} readOnly={running} />
        </div>

        <div className="on-dark flex flex-wrap items-center gap-3 border-t border-code-line bg-code px-5 py-3">
          <Button icon="play" onClick={() => execute('run')} disabled={running}>
            Futtatás
          </Button>
          <Button variant="dark" onClick={() => execute('submit')} disabled={running}>
            Beadás
          </Button>
        </div>

        <div aria-live="polite" className="px-5 pt-5 pb-6 md:px-6">
          <ResultPanel
            loading={running}
            error={execution.isError ? hibaUzenet(execution.error) : null}
            result={execution.data ?? null}
            mode={mode}
            hiddenCount={task.hidden_test_case_count}
          />
        </div>
      </Panel>
    </section>
  )

  return (
    <main className="mx-auto w-full max-w-work px-4 py-6 md:px-6">
      {wide ? (
        <SplitPane
          label="A feladatleírás és a szerkesztő közötti elválasztó"
          ratio={split}
          onRatioChange={setSplit}
          defaultRatio={DEFAULT_SPLIT}
          left={description}
          right={solution}
        />
      ) : (
        <WorkspaceTabs
          view={view}
          onViewChange={setView}
          task={description}
          code={solution}
          codeBadge={running ? 'fut…' : execution.isSuccess || execution.isError ? 'eredmény' : null}
        />
      )}
    </main>
  )
}

interface LanguageSwitchProps {
  languages: ReadonlyArray<LanguageKey>
  value: LanguageKey
  onChange: (language: LanguageKey) => void
  disabled: boolean
}

/** Nyelvváltó kapcsolósor; egyetlen nyelvnél csak a neve látszik. */
function LanguageSwitch({ languages, value, onChange, disabled }: LanguageSwitchProps) {
  if (languages.length < 2) return <Badge kind="lang">{LANGUAGE_LABEL[value]}</Badge>

  return (
    <div role="group" aria-label="Programozási nyelv" className="inline-flex overflow-hidden rounded-md border border-ink">
      {languages.map((option, index) => (
        <button
          key={option}
          type="button"
          aria-pressed={option === value}
          disabled={disabled}
          onClick={() => onChange(option)}
          data-language={option}
          className={cx(
            'min-h-11 px-4 text-15 font-semibold',
            index > 0 && 'border-l border-ink',
            option === value ? 'bg-ink text-sheet' : 'bg-sheet text-ink hover:bg-note',
          )}
        >
          {LANGUAGE_LABEL[option]}
        </button>
      ))}
    </div>
  )
}

function ExampleBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 basis-36 overflow-hidden rounded-md border border-line">
      <p className="border-b border-line bg-headrow px-3 py-1.5 text-14 font-semibold text-ink-soft">{label}</p>
      <pre className="overflow-x-auto px-3 py-2.5 text-14 leading-relaxed whitespace-pre-wrap">{value || '(üres)'}</pre>
    </div>
  )
}
