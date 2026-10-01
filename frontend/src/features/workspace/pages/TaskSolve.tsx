import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link, useParams } from 'react-router-dom'
import remarkGfm from 'remark-gfm'
import { hibaUzenet, zarolasOka } from '../../../shared/api/errors'
import { LANGUAGE_LABEL, LEVEL_LABEL } from '../../../shared/domain/labels'
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery'
import { usePersistentState } from '../../../shared/hooks/usePersistentState'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { SplitPane } from '../../../shared/ui/SplitPane'
import type { LanguageKey, RunRequest, RunResponse, SubmissionResponse, TaskDetail, UnlockedTaskDetail } from '../../../types'
import { useAuth } from '../../auth/context'
import { catalogKeys, taskQuery } from '../../catalog/api'
import { lessonPath } from '../../lesson/api'
import { LessonTheory } from '../../lesson/components/LessonTheory'
import { progressKeys } from '../../progress/api'
import { runCode, submitCode } from '../api'
import { CodeEditor, type EditorReplacement } from '../components/CodeEditor'
import { LessonVideo } from '../components/LessonVideo'
import { NextStep } from '../components/NextStep'
import { Paywall } from '../components/Paywall'
import { ResetCodeButton } from '../components/ResetCodeButton'
import { ResultPanel } from '../components/ResultPanel'
import { TaskStepper } from '../components/TaskStepper'
import { WorkspaceTabs, type WorkspaceView } from '../components/WorkspaceTabs'
import { useCodeDraft } from '../useCodeDraft'

type Mode = 'run' | 'submit'

/** Ettől a szélességtől (Tailwind `lg`) egymás mellett, húzható elválasztóval; alatta fülek. */
const WIDE_LAYOUT = '(min-width: 1024px)'
const DEFAULT_SPLIT = 0.5

/** Csak a beadás válaszában van `submission_id`. */
function isSubmission(response: RunResponse): response is SubmissionResponse {
  return 'submission_id' in response
}

function isSplitRatio(value: unknown): value is number {
  return typeof value === 'number' && value > 0.05 && value < 0.95
}

export function TaskSolve() {
  const { id } = useParams<{ id: string }>()
  const { user, loading: authLoading } = useAuth()
  const taskId = Number(id)
  const validId = Number.isInteger(taskId) && taskId > 0

  const task = useQuery({ ...taskQuery(taskId), enabled: validId })

  if (!validId || task.isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p
          role="alert"
          data-testid="task-load-error"
          className="rounded-lg border border-red-900 bg-red-950/60 p-4 text-red-200"
        >
          {validId ? hibaUzenet(task.error) : 'Érvénytelen feladatazonosító.'}
        </p>
        <Link to="/feladatok" className="mt-4 inline-block text-sky-400 hover:underline">
          Vissza a feladatokhoz
        </Link>
      </div>
    )
  }

  // A piszkozat felhasználóhoz kötött: a munkaterület csak az auth-állapot ismeretében indul.
  if (task.isPending || authLoading) return <PageLoader label="Feladat betöltése…" />

  if (task.data.locked) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <TaskHeader task={task.data} />
        <div className="mt-6">
          <Paywall reason={task.data.locked_reason} message={task.data.locked_message} />
        </div>
      </div>
    )
  }

  // A key miatt másik feladatra lépve vagy felhasználóváltáskor (kijelentkezés)
  // a szerkesztő tisztán újraindul, és a piszkozat nem kerül át másik fiókhoz.
  return <Workspace key={`${task.data.id}:${user?.id ?? 'guest'}`} task={task.data} />
}

/** A feladat leckéjének oldala; régebbi válaszban (slug nélkül) nincs. */
function lessonOf(task: TaskDetail): { trackSlug: string; lessonSlug: string; title: string } | null {
  const lesson = task.lesson

  return lesson?.slug && lesson.track_slug ? { trackSlug: lesson.track_slug, lessonSlug: lesson.slug, title: lesson.title } : null
}

function TaskHeader({ task }: { task: TaskDetail }) {
  const lesson = lessonOf(task)

  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div>
        {lesson ? (
          <Link to={lessonPath(lesson.trackSlug, lesson.lessonSlug)} className="text-sm text-sky-400 hover:underline">
            ← Vissza a leckéhez: {lesson.title}
          </Link>
        ) : (
          <Link to="/feladatok" className="text-sm text-sky-400 hover:underline">
            ← Vissza a feladatokhoz
          </Link>
        )}
        <h1 className="mt-3 text-2xl font-semibold text-slate-100">{task.title}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {task.topic.name} · {LEVEL_LABEL[task.level]}
        </p>
      </div>
      {task.navigation && <TaskStepper navigation={task.navigation} />}
    </div>
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
    // Egy beadás (akár sikertelen) a feladat és a lecke állapotát is változtathatja:
    // a haladás oldal, a tananyag-nézet és a feladatlisták is ebből frissülnek.
    onSuccess: (_, { kind }) => {
      if (kind !== 'submit') return

      void queryClient.invalidateQueries({ queryKey: progressKeys.all })
      void queryClient.invalidateQueries({ queryKey: catalogKeys.tracks() })
      void queryClient.invalidateQueries({ queryKey: catalogKeys.taskLists() })
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
    const nextCode = switchLanguage(next)
    setReplacement((r) => ({ value: nextCode, seq: r.seq + 1, undoable: false }))
    execution.reset()
  }

  function execute(kind: Mode) {
    setMode(kind)
    execution.mutate({ kind, payload: { task_id: task.id, language, source_code: code } })
  }

  const running = execution.isPending
  const lesson = lessonOf(task)
  // A sima futtatás nem számít megoldásnak, csak az elfogadott beadás.
  const accepted = execution.data && isSubmission(execution.data) && execution.data.status === 'passed' ? execution.data : null

  const description = (
    <section aria-label="Feladat leírása" className="space-y-4">
      {task.lesson && <LessonVideo lesson={task.lesson} />}
      {lesson && <LessonTheory trackSlug={lesson.trackSlug} lessonSlug={lesson.lessonSlug} />}

      <div className="prose-invert max-w-none rounded-lg border border-slate-800 bg-slate-900 p-5 text-slate-200 [&_code]:rounded [&_code]:bg-slate-950 [&_code]:px-1 [&_h2]:mt-0 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-medium [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description}</ReactMarkdown>
      </div>

      {task.example_test_cases.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-200">Nyilvános tesztesetek</h2>
          <ul className="space-y-3">
            {task.example_test_cases.map((tc, i) => (
              <li key={tc.id} className="grid gap-2 sm:grid-cols-2">
                <ExampleBlock label={`${i + 1}. bemenet`} value={tc.stdin} />
                <ExampleBlock label="Elvárt kimenet" value={tc.expected_stdout} />
              </li>
            ))}
          </ul>
          {task.hidden_test_case_count > 0 && (
            <p className="mt-3 text-xs text-slate-400">
              Beadáskor további {task.hidden_test_case_count} rejtett teszteset is lefut.
            </p>
          )}
        </div>
      )}
    </section>
  )

  const solution = (
    <section aria-label="Megoldás" className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          <span className="mr-2 text-slate-400">Nyelv:</span>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value as LanguageKey)}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-slate-100"
          >
            {task.allowed_languages.map((l) => (
              <option key={l} value={l}>
                {LANGUAGE_LABEL[l]}
              </option>
            ))}
          </select>
        </label>

        <ResetCodeButton dirty={code !== starterCode} disabled={running} onReset={resetCode} />

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => execute('run')}
            disabled={running}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Futtatás
          </button>
          <button
            type="button"
            onClick={() => execute('submit')}
            disabled={running}
            className="rounded-lg bg-sky-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Beadás
          </button>
        </div>
      </div>

      {restored && code !== starterCode && (
        <p className="text-xs text-slate-400" data-testid="draft-restored">
          A legutóbb szerkesztett kódodat töltöttük vissza ebből a böngészőből.
        </p>
      )}

      <div className="h-[420px]">
        <CodeEditor language={language} initialValue={code} onChange={setCode} replace={replacement} readOnly={running} />
      </div>

      {accepted && <NextStep task={task} lessonCompleted={accepted.lesson_completed === true} />}

      <ResultPanel
        loading={running}
        error={execution.isError ? hibaUzenet(execution.error) : null}
        result={execution.data ?? null}
        mode={mode}
      />
    </section>
  )

  return (
    // Széles kijelzőn (akár 4K) a munkaterület szélesebb, mint a szöveges oldalak.
    <div className="mx-auto max-w-screen-2xl px-4 py-8">
      <TaskHeader task={task} />

      <div className="mt-6">
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
      </div>
    </div>
  )
}

function ExampleBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <pre className="rounded border border-slate-800 bg-slate-950 p-2 font-mono text-xs whitespace-pre-wrap text-slate-300">
        {value || '(üres)'}
      </pre>
    </div>
  )
}
