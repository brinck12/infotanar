import { useMutation } from '@tanstack/react-query'
import { Badge } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { Icon } from '../../../../shared/ui/Icon'
import { Panel } from '../../../../shared/ui/Panel'
import { CardTitle } from '../../../../shared/ui/Text'
import type { LanguageKey } from '../../../../types'
import { CodeEditor } from '../../../workspace/components/CodeEditor'
import { verifyExercise, type ExerciseVerification, type LanguageOption, type VerificationRun } from '../api'
import { MutationError } from './QueryState'

interface Props {
  /** `null`: a feladat még nincs elmentve, az ellenőrzés nem érhető el. */
  exerciseId: number | null
  /** Az engedélyezett nyelvek; mindegyikhez egy szerkesztő. */
  languages: LanguageKey[]
  options: LanguageOption[]
  value: Partial<Record<LanguageKey, string>>
  onChange: (language: LanguageKey, code: string) => void
  /** A szerkesztő tartalma eltér a mentettől: az ellenőrzés a mentett állapotot futtatja. */
  unsaved: boolean
  errors: Record<string, string>
}

/** Mintamegoldás nyelvenként, és a feladat kipróbálása rajta (minden teszteset, a rejtettek is). */
export function SampleSolutionEditor({ exerciseId, languages, options, value, onChange, unsaved, errors }: Props) {
  const verify = useMutation({ mutationFn: (id: number) => verifyExercise(id) })
  const labelOf = (language: LanguageKey) => options.find((option) => option.key === language)?.label ?? language

  return (
    <div className="flex flex-col gap-5">
      <Panel className="flex flex-col gap-5">
        <div>
          <CardTitle as="h2">Mintamegoldás</CardTitle>
          <p className="mt-1.5 text-15 leading-relaxed text-ink-soft">
            Egy működő megoldás nyelvenként. Közzétenni csak mintamegoldással lehet, és az ellenőrzés ezen futtatja le a nyilvános és a rejtett teszteseteket is. A diák sosem látja.
          </p>
        </div>
        {languages.length === 0 && <p className="text-15 text-ink-soft">Jelölj be legalább egy nyelvet a Leírás és kód fülön.</p>}
        {languages.map((language) => (
          <div key={language}>
            <p className="mb-2 text-15 font-semibold">Mintamegoldás ({labelOf(language)})</p>
            <div className="h-64 overflow-hidden rounded-md">
              <CodeEditor language={language} initialValue={value[language] ?? ''} onChange={(code) => onChange(language, code)} />
            </div>
          </div>
        ))}
        {errors.sample_solutions && <p className="text-14 leading-normal text-wrong">{errors.sample_solutions}</p>}
      </Panel>

      <Panel as="section" aria-labelledby="mintamegoldas-ellenorzes" className="flex flex-col gap-4">
        <CardTitle id="mintamegoldas-ellenorzes" as="h2">
          Ellenőrzés
        </CardTitle>
        {exerciseId === null ? (
          <Banner kind="info" title="Előbb mentsd el a feladatot">
            Az ellenőrzés a mentett feladaton fut, ezért a létrehozás után érhető el.
          </Banner>
        ) : (
          <>
            {unsaved && (
              <Banner kind="warn" title="Mentetlen változtatás">
                Az ellenőrzés a legutóbb mentett mintamegoldást futtatja. Előbb mentsd el a feladatot.
              </Banner>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="secondary" busy={verify.isPending} busyLabel="Ellenőrzés fut…" onClick={() => verify.mutate(exerciseId)}>
                Ellenőrzés (minden teszteset)
              </Button>
              <p className="text-14 leading-relaxed text-ink-soft">Nem tárol semmit, és beadás sem keletkezik.</p>
            </div>
            <MutationError error={verify.error} />
            {verify.data && <VerificationResult result={verify.data} labelOf={labelOf} />}
          </>
        )}
      </Panel>
    </div>
  )
}

const OUTCOME: Record<ExerciseVerification['status'], { kind: 'success' | 'error' | 'info'; title: string }> = {
  passed: { kind: 'success', title: 'Minden teszteset sikeres' },
  failed: { kind: 'error', title: 'Az ellenőrzés hibát talált' },
  skipped: { kind: 'info', title: 'Ezt a típust a szerver nem ellenőrzi' },
}

function VerificationResult({ result, labelOf }: { result: ExerciseVerification; labelOf: (language: LanguageKey) => string }) {
  const outcome = OUTCOME[result.status]

  return (
    <div data-testid="verify-result" className="flex flex-col gap-4">
      <Banner kind={outcome.kind} title={outcome.title}>
        {result.message}
      </Banner>
      {result.runs.map((run) => (
        <RunResult key={run.language} run={run} label={labelOf(run.language)} />
      ))}
    </div>
  )
}

function RunResult({ run, label }: { run: VerificationRun; label: string }) {
  return (
    <section aria-label={`${label} eredmény`} className="rounded-md border border-line px-4.5 py-3.5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-16 font-bold">{label}</p>
        <Badge kind={run.passed ? 'ok' : 'bad'}>{run.passed ? 'Sikeres' : run.verdict_label || 'Sikertelen'}</Badge>
        <p className="text-14 text-ink-soft">
          {run.score} / {run.max_score} pont
        </p>
      </div>
      <ul aria-label={`${label} tesztesetei`} className="mt-3 flex flex-col gap-2.5">
        {run.tests.map((test, index) => (
          <li key={test.test_case_id ?? index} className="text-15 leading-relaxed">
            <div className="flex flex-wrap items-center gap-2.5">
              <Icon name={test.passed ? 'check' : 'warn'} size={16} className={test.passed ? 'text-accent' : 'text-wrong'} />
              <span className="font-semibold">{index + 1}. teszteset</span>
              {test.hidden && <Badge kind="hidden">Rejtett</Badge>}
              <Badge kind={test.passed ? 'ok' : 'bad'}>{test.passed ? 'Sikeres' : 'Sikertelen'}</Badge>
              {!test.passed && test.verdict_label && <span className="text-ink-soft">{test.verdict_label}</span>}
            </div>
            {/* Rejtett tesztesetnél csak a siker és az ítélet látszik, a szerver sem ad többet. */}
            {!test.hidden && !test.passed && test.message && (
              <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap rounded-sm bg-headrow px-3 py-2 text-inline">{test.message}</pre>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
