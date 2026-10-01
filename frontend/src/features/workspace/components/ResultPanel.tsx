import type { RunResponse, TestResult } from '../../../types'
import { runVerdict, testVerdict, VERDICT_META, type VerdictTone } from '../verdicts'
import { VerdictIcon } from './VerdictIcon'

const TONE_CARD: Readonly<Record<VerdictTone, string>> = {
  success: 'border-emerald-800 bg-emerald-950/50 text-emerald-200',
  danger: 'border-red-900 bg-red-950/50 text-red-200',
  warning: 'border-amber-800 bg-amber-950/50 text-amber-200',
  compile: 'border-fuchsia-900 bg-fuchsia-950/40 text-fuchsia-200',
  runtime: 'border-orange-900 bg-orange-950/50 text-orange-200',
  rule: 'border-indigo-800 bg-indigo-950/50 text-indigo-200',
  neutral: 'border-slate-700 bg-slate-900 text-slate-200',
}

const TONE_CHIP: Readonly<Record<VerdictTone, string>> = {
  success: 'border-emerald-800 text-emerald-300',
  danger: 'border-red-800 text-red-300',
  warning: 'border-amber-800 text-amber-300',
  compile: 'border-fuchsia-800 text-fuchsia-300',
  runtime: 'border-orange-800 text-orange-300',
  rule: 'border-indigo-700 text-indigo-300',
  neutral: 'border-slate-700 text-slate-300',
}

interface Props {
  loading: boolean
  error: string | null
  result: RunResponse | null
  /** Beadásnál a rejtett teszteseteket is jelezzük. */
  mode: 'run' | 'submit'
}

export function ResultPanel({ loading, error, result, mode }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400"
          aria-hidden="true"
        />
        Futtatás folyamatban…
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" data-testid="result-error" className="rounded-lg border border-red-900 bg-red-950/60 p-4 text-sm text-red-200">
        {error}
      </div>
    )
  }

  if (!result) {
    return (
      <div className="rounded-lg border border-dashed border-slate-800 p-4 text-sm text-slate-400">
        Még nem futtattál kódot. Nyomd meg a <strong className="text-slate-300">Futtatás</strong> gombot.
      </div>
    )
  }

  const passedCount = result.results.filter((r) => r.passed).length
  const total = result.results.length
  const verdict = runVerdict(result)
  const meta = VERDICT_META[verdict]

  return (
    <div className="space-y-3">
      <div
        data-testid="result-summary"
        data-status={result.status}
        data-verdict={verdict}
        role="status"
        className={`rounded-lg border p-4 ${TONE_CARD[meta.tone]}`}
      >
        <p className="flex items-center gap-2 font-semibold">
          <VerdictIcon verdict={verdict} />
          {result.verdict_label ?? meta.label}
        </p>
        <p className="mt-1 text-sm opacity-90">{meta.hint}</p>
        {result.violations && result.violations.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" data-testid="result-violations">
            {result.violations.map((violation) => (
              <li key={violation}>{violation}</li>
            ))}
          </ul>
        )}
        {total > 0 && (
          <p className="mt-2 text-sm opacity-80">
            {passedCount} / {total} teszteset sikeres
            {mode === 'submit' ? ' (a rejtett teszteseteket is beleértve)' : ''}
          </p>
        )}
      </div>

      <ul className="space-y-2">
        {result.results.map((testResult, index) => (
          <TestResultRow key={testResult.test_case_id} index={index} result={testResult} />
        ))}
      </ul>
    </div>
  )
}

function TestResultRow({ index, result }: { index: number; result: TestResult }) {
  const verdict = testVerdict(result)
  const meta = VERDICT_META[verdict]

  return (
    <li
      data-testid="test-result"
      data-passed={result.passed}
      data-verdict={verdict}
      className={[
        'rounded-lg border p-3 text-sm',
        result.passed ? 'border-emerald-900 bg-emerald-950/30' : 'border-red-900 bg-red-950/30',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={result.passed ? 'font-semibold text-emerald-300' : 'font-semibold text-red-300'}>
          {result.passed ? 'SIKERES' : 'HIBÁS'}
        </span>
        <span className="text-slate-300">{index + 1}. teszteset</span>
        {result.hidden && (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-400">rejtett</span>
        )}
        {!result.passed && (
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${TONE_CHIP[meta.tone]}`}>
            <VerdictIcon verdict={verdict} className="h-3.5 w-3.5" />
            {result.verdict_label ?? meta.label}
          </span>
        )}
        {result.time !== null && <span className="text-xs text-slate-400">{result.time} s</span>}
      </div>

      {result.error && <p className="mt-2 text-red-300">{result.error}</p>}

      {/* Rejtett teszteseteknél a backend nem küld kimenetet. */}
      {!result.hidden && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <OutputBlock label="Bemenet" value={result.stdin} />
          <OutputBlock label="Elvárt kimenet" value={result.expected} />
          <OutputBlock label="A te kimeneted" value={result.stdout} highlight={!result.passed} />
          {result.stderr ? <OutputBlock label="Hibakimenet" value={result.stderr} highlight /> : null}
          {result.compile_output ? (
            <OutputBlock label="Fordítási üzenet" value={result.compile_output} highlight />
          ) : null}
        </div>
      )}
    </li>
  )
}

function OutputBlock({
  label,
  value,
  highlight = false,
}: {
  label: string
  value?: string
  highlight?: boolean
}) {
  return (
    <div>
      <p className="mb-1 text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <pre
        className={[
          'max-h-40 overflow-auto rounded border p-2 font-mono text-xs whitespace-pre-wrap',
          highlight ? 'border-red-900 bg-slate-950 text-red-200' : 'border-slate-800 bg-slate-950 text-slate-300',
        ].join(' ')}
      >
        {value === undefined || value === '' ? '(üres)' : value}
      </pre>
    </div>
  )
}
