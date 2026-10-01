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
import type { LanguageKey, RunRequest, TaskDetail, UnlockedTaskDetail } from '../../../types'
import { useAuth } from '../../auth/context'
import { catalogKeys, taskQuery } from '../../catalog/api'
import { progressKeys } from '../../progress/api'
import { runCode, submitCode } from '../api'
import { CodeEditor, type EditorReplacement } from '../components/CodeEditor'
import { EditorPreferencesMenu } from '../components/EditorPreferencesMenu'
import { LessonVideo } from '../components/LessonVideo'
import { Paywall } from '../components/Paywall'
import { ResetCodeButton } from '../components/ResetCodeButton'
import { ResultPanel } from '../components/ResultPanel'
import { WorkspaceTabs, type WorkspaceView } from '../components/WorkspaceTabs'
import { useCodeDraft } from '../useCodeDraft'
import { useEditorPreferences } from '../editorPreferences'
import { RUN_SHORTCUT, SUBMIT_SHORTCUT, useWorkspaceShortcuts } from '../shortcuts'

type Mode = 'run' | 'submit'

/** Ettől a szélességtől (Tailwind `lg`) egymás mellett, húzható elválasztóval; alatta fülek. */
const WIDE_LAYOUT = '(min-width: 1024px)'
const DEFAULT_SPLIT = 0.5
/** A szerkesztő az oszlop magasságának ekkora részét kapja, a többi az eredményé. */
const DEFAULT_EDITOR_SPLIT = 0.65

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

function TaskHeader({ task }: { task: TaskDetail }) {
  return (
    <>
      <Link to="/feladatok" className="text-sm text-sky-400 hover:underline">
        ← Vissza a feladatokhoz
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-slate-100">{task.title}</h1>
      <p className="mt-1 text-sm text-slate-400">
        {task.topic.name} · {LEVEL_LABEL[task.level]}
      </p>
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
  // A szerkesztő és az eredmény közötti vízszintes elválasztó aránya, és a szerkesztő beállításai (#156).
  const [editorSplit, setEditorSplit] = usePersistentState(
    `infotanar.workspace.editorSplit.${user?.id ?? 'guest'}`,
    DEFAULT_EDITOR_SPLIT,
    isSplitRatio,
  )
  const [preferences, setPreferences] = useEditorPreferences(userKey)

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
    const nextCode = switchLanguage(next)
    setReplacement((r) => ({ value: nextCode, seq: r.seq + 1, undoable: false }))
    execution.reset()
  }

  const running = execution.isPending

  /** A gomb és a gyorsbillentyű is ezt hívja; futás közben nem indul új (#156). */
  function execute(kind: Mode) {
    if (running) return
    setMode(kind)
    execution.mutate({ kind, payload: { task_id: task.id, language, source_code: code } })
  }

  useWorkspaceShortcuts({ run: () => execute('run'), submit: () => execute('submit') })

  const description = (
    <section aria-label="Feladat leírása" className="space-y-4">
      {task.lesson && <LessonVideo lesson={task.lesson} />}

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
    // A szakasz a képernyő magasságához igazodik (4K-n is kitölti), a szerkesztő és az eredmény
    // közötti elválasztóval osztható meg; az eredmény a saját panelében görget.
    <section aria-label="Megoldás" className="flex h-[calc(100dvh-13rem)] min-h-[42rem] flex-col gap-4">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
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

        <div className="ml-auto flex items-center gap-2">
          <EditorPreferencesMenu preferences={preferences} onChange={setPreferences} />
          <button
            type="button"
            onClick={() => execute('run')}
            disabled={running}
            title={`Futtatás (${RUN_SHORTCUT.label})`}
            aria-keyshortcuts={RUN_SHORTCUT.aria}
            className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-100 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Futtatás
          </button>
          <button
            type="button"
            onClick={() => execute('submit')}
            disabled={running}
            title={`Beadás (${SUBMIT_SHORTCUT.label})`}
            aria-keyshortcuts={SUBMIT_SHORTCUT.aria}
            className="rounded-lg bg-sky-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Beadás
          </button>
        </div>
      </div>

      {restored && code !== starterCode && (
        <p className="shrink-0 text-xs text-slate-400" data-testid="draft-restored">
          A legutóbb szerkesztett kódodat töltöttük vissza ebből a böngészőből.
        </p>
      )}

      <div className="min-h-0 flex-1">
        <SplitPane
          orientation="vertical"
          label="A szerkesztő és az eredmény közötti elválasztó"
          handleTestId="editor-split-handle"
          ratio={editorSplit}
          onRatioChange={setEditorSplit}
          defaultRatio={DEFAULT_EDITOR_SPLIT}
          first={
            <CodeEditor
              language={language}
              initialValue={code}
              onChange={setCode}
              replace={replacement}
              readOnly={running}
              preferences={preferences}
              onRun={() => execute('run')}
              onSubmit={() => execute('submit')}
            />
          }
          second={
            // Görgethető panel: billentyűzettel is elérhetőnek kell lennie (WCAG 2.1.1, axe: scrollable-region-focusable).
            // A lint-szabály (nem interaktív elemen tabIndex) ezzel ütközik, ezért itt, indokkal, kikapcsoljuk.
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            <div role="region" aria-label="Eredmény" tabIndex={0} className="h-full overflow-auto focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none">
              <ResultPanel
                loading={running}
                error={execution.isError ? hibaUzenet(execution.error) : null}
                result={execution.data ?? null}
                mode={mode}
              />
            </div>
          }
        />
      </div>
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
            first={description}
            second={solution}
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
