import { useState } from 'react'
import { Badge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { Bar } from '../../../shared/ui/Progress'
import { RubricItem } from '../../../shared/ui/RubricItem'
import { Skeleton } from '../../../shared/ui/States'
import { CardTitle } from '../../../shared/ui/Text'
import type { FileSubmission } from '../api'
import { ManualMarksModal } from './ManualMarksModal'

/**
 * Egy fájlbeadás eredménye: pontszám, csoportonkénti összesítés és az
 * értékelőlap tételenként (mit találtunk, mennyi a pont, mit javíts).
 */
export function SubmissionResult({ submission }: { submission: FileSubmission }) {
  const [marking, setMarking] = useState(false)

  if (submission.status === 'processing') {
    return (
      <div aria-live="polite">
        <p className="text-18 font-bold">Ellenőrizzük a fájlodat…</p>
        <Skeleton lines={3} label="Ellenőrzés folyamatban…" className="mt-4" />
      </div>
    )
  }

  if (submission.status === 'failed') {
    return (
      <Banner kind="error" title="Nem sikerült feldolgozni a fájlt">
        {submission.error ?? 'A fájl sérült, vagy nem a kért formátumban van.'} Mentsd el újra a program saját formátumában, és töltsd fel még
        egyszer.
      </Banner>
    )
  }

  const pendingManual = submission.items.filter((item) => item.state === 'manual' && item.manual_mark === null)
  const hasManual = submission.items.some((item) => item.state === 'manual' || item.manual_mark !== null)

  return (
    <div aria-live="polite" data-testid="submission-result">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-15 text-ink-soft">Eredmény</p>
          <p className="font-serif text-36 leading-tight font-semibold tracking-tight">
            {submission.score} / {submission.max_score} pont
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge kind="neutral">{submission.attempt}. próbálkozás</Badge>
          {submission.previous_score !== null && <p className="text-14 text-ink-soft">Az előző: {submission.previous_score} pont</p>}
        </div>
      </div>

      {submission.groups.length > 0 && (
        <ul className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {submission.groups.map((group) => {
            const share = group.max_score > 0 ? Math.round((group.score / group.max_score) * 100) : 0
            return (
              <li key={group.name}>
                <div className="flex items-baseline justify-between gap-3 text-15">
                  <span className="font-semibold">{group.name}</span>
                  <span className="whitespace-nowrap text-ink-soft">
                    {group.score} / {group.max_score}
                  </span>
                </div>
                <Bar value={group.score} max={group.max_score} label={`${share} százalék`} className="mt-1.5" />
              </li>
            )
          })}
        </ul>
      )}

      {pendingManual.length > 0 && (
        <Banner
          kind="info"
          title={`${pendingManual.reduce((sum, item) => sum + item.max_points, 0)} pont kézi ellenőrzésre vár`}
          className="mt-5"
          action={
            <Button variant="secondary" icon="eye" onClick={() => setMarking(true)}>
              Kézi pontok jelölése
            </Button>
          }
        >
          Ezeket a mintával összevetve te döntöd el. Az összeg a jelölés után frissül.
        </Banner>
      )}

      <CardTitle as="h3" className="mt-6">
        Értékelőlap
      </CardTitle>
      <ul className="mt-2">
        {submission.items.map((item) => (
          <RubricItem
            key={item.rubric_item_id}
            state={item.manual_mark === null ? item.state : item.manual_mark ? 'ok' : 'bad'}
            text={item.label}
            points={item.points}
            maxPoints={item.max_points}
            found={item.found}
            hint={item.state === 'ok' ? null : item.hint}
          />
        ))}
      </ul>

      {submission.facts.length > 0 && (
        <>
          <CardTitle as="h3" className="mt-6">
            Amit a fájlban találtunk
          </CardTitle>
          <dl className="mt-2">
            {submission.facts.map((fact) => (
              <div key={fact.label} className="flex flex-wrap justify-between gap-x-6 gap-y-0.5 border-t border-grid py-2 text-15">
                <dt className="text-ink-soft">{fact.label}</dt>
                <dd className="font-mono text-14">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}

      {hasManual && pendingManual.length === 0 && (
        <Button variant="text" onClick={() => setMarking(true)} className="mt-4">
          Kézi pontok módosítása
        </Button>
      )}

      <p className="mt-5 text-14 leading-relaxed text-ink-soft">
        Az automatikus ellenőrzés a fájl tartalmát vizsgálja. A formázás vizuális részeit te nézd át a mintán.
      </p>

      {marking && <ManualMarksModal submission={submission} open onClose={() => setMarking(false)} />}
    </div>
  )
}
