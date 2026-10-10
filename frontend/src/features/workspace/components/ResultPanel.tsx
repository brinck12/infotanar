import { Badge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { StateIcon } from '../../../shared/ui/Icon'
import { OutputBlock, ResultRow } from '../../../shared/ui/ResultRow'
import { Skeleton } from '../../../shared/ui/States'
import type { ExecutionLimits, RunResponse, TestResult } from '../../../types'
import { runVerdict, testVerdict, VERDICT_META, verdictHint } from '../verdicts'

interface Props {
  loading: boolean
  error: string | null
  result: RunResponse | null
  /** Beadásnál a rejtett teszteseteket is jelezzük. */
  mode: 'run' | 'submit'
  /** Beadáskor ennyi további rejtett teszt fut le; futtatás után erre figyelmeztetünk. */
  hiddenCount?: number
  /** A futtatásra érvényes korlátok: időtúllépésnél a tanács megnevezi a korlátot. */
  limits?: ExecutionLimits
}

export function ResultPanel({ loading, error, result, mode, hiddenCount = 0, limits }: Props) {
  if (loading) {
    return (
      <div>
        <p className="text-18 font-bold">Futtatás folyamatban…</p>
        <Skeleton lines={2} label="Futtatás folyamatban…" className="mt-4" />
      </div>
    )
  }

  if (error) {
    return (
      <Banner kind="error" title="A futtatás nem sikerült" data-testid="result-error">
        {error}
      </Banner>
    )
  }

  if (!result) {
    return (
      <div>
        <p className="text-18 font-bold">Még nem futtattál kódot.</p>
        <p className="mt-1 text-15 text-ink-soft">
          A <strong className="text-ink">Futtatás</strong> a nyilvános teszteseteken próbálja ki a kódot, és nem ment semmit. A{' '}
          <strong className="text-ink">Beadás</strong> minden teszten lefut, és elmenti az eredményt.
        </p>
      </div>
    )
  }

  const passedCount = result.results.filter((r) => r.passed).length
  const total = result.results.length
  const verdict = runVerdict(result)
  const meta = VERDICT_META[verdict]
  const accepted = verdict === 'accepted'
  const hasHidden = result.results.some((r) => r.hidden)

  return (
    <div>
      <div data-testid="result-summary" data-status={result.status} data-verdict={verdict} role="status">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-18 font-bold">
          <StateIcon kind={accepted ? 'ok' : 'bad'} label={accepted ? 'Sikeres' : 'Sikertelen'} />
          {total > 0 ? `${passedCount} / ${total} teszteset sikeres` : (result.verdict_label ?? meta.label)}
          {total > 0 && <Badge kind={accepted ? 'ok' : 'bad'}>{result.verdict_label ?? meta.label}</Badge>}
        </p>
        <p className="mt-1 text-15 leading-relaxed text-ink-soft">
          {verdictHint(verdict, limits)}
          {mode === 'submit' && total > 0 && ' A rejtett teszteseteket is beleszámolva.'}
          {mode === 'run' && accepted && hiddenCount > 0 && ` Beadáskor további ${hiddenCount} rejtett teszteset is lefut.`}
        </p>
        {result.message && <p className="mt-1 text-15 leading-relaxed">{result.message}</p>}
        {result.violations && result.violations.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-6 text-15" data-testid="result-violations">
            {result.violations.map((violation) => (
              <li key={violation}>{violation}</li>
            ))}
          </ul>
        )}
      </div>

      {result.subtasks && result.subtasks.length > 0 && (
        <section aria-label="Részfeladatok" className="mt-4" data-testid="result-subtasks">
          <p className="text-15 font-bold">
            Részfeladatok: {result.subtasks.reduce((sum, item) => sum + item.points, 0)} /{' '}
            {result.subtasks.reduce((sum, item) => sum + item.max_points, 0)} pont
          </p>
          <ul className="mt-1">
            {result.subtasks.map((subtask) => (
              <li key={subtask.label} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grid py-2.5">
                <StateIcon kind={subtask.passed ? 'ok' : 'bad'} label={subtask.passed ? 'Sikeres' : 'Sikertelen'} />
                <span className="min-w-0 flex-1 text-15 font-semibold">{subtask.label}</span>
                <Badge kind={subtask.passed ? 'ok' : 'bad'}>
                  {subtask.points} / {subtask.max_points} pont
                </Badge>
                {subtask.note && <p className="basis-full pl-8 text-14 leading-normal text-ink-soft">{subtask.note}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {total > 0 && (
        <ul className="mt-4">
          {result.results.map((testResult, index) => (
            <TestResultRow key={testResult.test_case_id} index={index} result={testResult} />
          ))}
        </ul>
      )}

      {hasHidden && (
        <p className="mt-4 text-15 leading-relaxed text-ink-soft">
          Rejtett tesztesetnél csak az eredményt látod, a bemenetet nem. A nyilvános tesztesetek adataiból viszont kideríthető, mi
          hiányzik.
        </p>
      )}
    </div>
  )
}

function TestResultRow({ index, result }: { index: number; result: TestResult }) {
  const verdict = testVerdict(result)
  const label = result.verdict_label ?? VERDICT_META[verdict].label

  // Rejtett tesztesetnél a backend nem küld futási részleteket és kimenetet (csak az eredményt).
  const outputs = !result.hidden && (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <OutputBlock label="Bemenet" value={result.stdin} />
      <OutputBlock label="Elvárt kimenet" value={result.expected} />
      <OutputBlock label="A te kimeneted" value={result.stdout} wrong={!result.passed} />
      {result.stderr ? <OutputBlock label="Hibakimenet" value={result.stderr} wrong /> : null}
      {result.compile_output ? <OutputBlock label="Fordítási üzenet" value={result.compile_output} wrong /> : null}
    </div>
  )

  return (
    <ResultRow
      passed={result.passed}
      name={`${index + 1}. teszteset`}
      verdict={label}
      hidden={result.hidden}
      data-verdict={verdict}
      meta={!result.hidden && <RunMetrics time={result.time} exitCode={result.exit_code} />}
    >
      {result.error && <p className="mt-2 text-15 text-wrong">{result.error}</p>}
      {outputs &&
        (result.passed ? (
          <details className="mt-1.5">
            <summary className="inline-flex min-h-11 items-center text-14 text-ink-soft underline underline-offset-4">
              Bemenet és kimenet
            </summary>
            {outputs}
          </details>
        ) : (
          outputs
        ))}
    </ResultRow>
  )
}

const seconds = new Intl.NumberFormat('hu-HU', { minimumFractionDigits: 3, maximumFractionDigits: 3 })

/** Futási idő és kilépési kód (#36); a nem nulla kilépési kód kiemelve. */
function RunMetrics({ time, exitCode }: { time: number | null; exitCode: number | null }) {
  if (time === null && exitCode === null) return null

  return (
    <span className="flex items-center gap-3 font-mono text-13 text-ink-soft" data-testid="run-metrics">
      {time !== null && (
        <span title="Futási idő" data-testid="run-time">
          <span className="sr-only">Futási idő: </span>
          {seconds.format(time)} s
        </span>
      )}
      {exitCode !== null && (
        <span
          title="Kilépési kód"
          data-testid="exit-code"
          className={exitCode === 0 ? '' : 'rounded-sm bg-wrong-soft px-1.5 font-medium text-wrong'}
        >
          <span className="sr-only">Kilépési kód: </span>exit {exitCode}
        </span>
      )}
    </span>
  )
}
