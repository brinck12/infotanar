import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getTask, hibaUzenet, runCode, submitCode } from '../api/client'
import { CodeEditor } from '../components/CodeEditor'
import { ResultPanel } from '../components/ResultPanel'
import type { LanguageKey, RunResponse, TaskDetail } from '../types'

const LANGUAGE_LABEL: Record<LanguageKey, string> = {
  python: 'Python 3',
  csharp: 'C#',
}

export function TaskSolve() {
  const { id } = useParams<{ id: string }>()
  const taskId = Number(id)

  const [task, setTask] = useState<TaskDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [language, setLanguage] = useState<LanguageKey>('python')
  const [code, setCode] = useState('')

  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RunResponse | null>(null)
  const [runError, setRunError] = useState<string | null>(null)
  const [mode, setMode] = useState<'run' | 'submit'>('run')

  // Az érvénytelen azonosító render közben eldönthető, nem kell hozzá effekt.
  const invalidId = !Number.isFinite(taskId)

  useEffect(() => {
    if (invalidId) return

    let aborted = false

    getTask(taskId)
      .then((data) => {
        if (aborted) return
        setTask(data)

        const first = data.allowed_languages[0] ?? 'python'
        setLanguage(first)
        setCode(data.starter_code?.[first] ?? '')
      })
      .catch((err) => {
        if (!aborted) setLoadError(hibaUzenet(err))
      })

    return () => {
      aborted = true
    }
  }, [taskId, invalidId])

  /** Nyelvváltáskor a megfelelő kiinduló kódot töltjük be. */
  const changeLanguage = useCallback(
    (next: LanguageKey) => {
      setLanguage(next)
      setCode(task?.starter_code?.[next] ?? '')
      setResult(null)
      setRunError(null)
    },
    [task]
  )

  async function execute(kind: 'run' | 'submit') {
    if (!task) return

    setMode(kind)
    setRunning(true)
    setResult(null)
    setRunError(null)

    const payload = { task_id: task.id, language, source_code: code }

    try {
      const response = kind === 'run' ? await runCode(payload) : await submitCode(payload)
      setResult(response)
    } catch (err) {
      setRunError(hibaUzenet(err))
    } finally {
      setRunning(false)
    }
  }

  const hiba = invalidId ? 'Érvénytelen feladatazonosító.' : loadError

  if (hiba) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <p
          role="alert"
          data-testid="task-load-error"
          className="rounded-lg border border-red-900 bg-red-950/60 p-4 text-red-200"
        >
          {hiba}
        </p>
        <Link to="/feladatok" className="mt-4 inline-block text-sky-400 hover:underline">
          Vissza a feladatokhoz
        </Link>
      </div>
    )
  }

  if (!task) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-slate-400">Feladat betöltése…</div>
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link to="/feladatok" className="text-sm text-sky-400 hover:underline">
        ← Vissza a feladatokhoz
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-slate-100">{task.title}</h1>
      <p className="mt-1 text-sm text-slate-400">
        {task.topic.name} · {task.level === 'emelt' ? 'Emelt szint' : 'Középszint'}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Bal oszlop: feladatleírás */}
        <section aria-label="Feladat leírása" className="space-y-4">
          <div className="prose-invert max-w-none rounded-lg border border-slate-800 bg-slate-900 p-5 text-slate-200 [&_code]:rounded [&_code]:bg-slate-950 [&_code]:px-1 [&_h2]:mt-0 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:font-medium [&_li]:ml-4 [&_li]:list-disc [&_p]:my-2">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{task.description}</ReactMarkdown>
          </div>

          {task.example_test_cases.length > 0 && (
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-200">Nyilvános tesztesetek</h2>
              <ul className="space-y-3">
                {task.example_test_cases.map((tc, i) => (
                  <li key={tc.id} className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                        {i + 1}. bemenet
                      </p>
                      <pre className="rounded border border-slate-800 bg-slate-950 p-2 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                        {tc.stdin || '(üres)'}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">
                        Elvárt kimenet
                      </p>
                      <pre className="rounded border border-slate-800 bg-slate-950 p-2 font-mono text-xs text-slate-300 whitespace-pre-wrap">
                        {tc.expected_stdout || '(üres)'}
                      </pre>
                    </div>
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

        {/* Jobb oszlop: szerkesztő és eredmény */}
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

          <div className="h-[420px]">
            <CodeEditor language={language} value={code} onChange={setCode} readOnly={running} />
          </div>

          <ResultPanel loading={running} error={runError} result={result} mode={mode} />
        </section>
      </div>
    </div>
  )
}
