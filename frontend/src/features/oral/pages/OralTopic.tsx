import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { userKeyOf } from '../../../shared/domain/lastTask'
import { DEFAULT_PREFERENCES, isStudyPreferences, preferencesKey } from '../../../shared/domain/preferences'
import { usePersistentState } from '../../../shared/hooks/usePersistentState'
import { Banner } from '../../../shared/ui/Banner'
import { Breadcrumb } from '../../../shared/ui/Breadcrumb'
import { Button } from '../../../shared/ui/Button'
import { CodeBlock } from '../../../shared/ui/CodeBlock'
import { cx } from '../../../shared/ui/cx'
import { CheckboxField, TextAreaField } from '../../../shared/ui/Form'
import { Icon } from '../../../shared/ui/Icon'
import { Panel } from '../../../shared/ui/Panel'
import { CardTitle, PageTitle } from '../../../shared/ui/Text'
import { useAuth } from '../../auth/context'
import { NotFound } from '../../system/NotFound'
import { EMPTY_PRACTICE, formatClock, isOralPractice, practiceKey, type OralPractice } from '../practice'
import { ORAL_MINUTES, ORAL_SCORING, ORAL_TOPICS, type OralTopic as Topic } from '../topics'

type Phase = 'idle' | 'preparation' | 'answer' | 'done'

/** Egy szóbeli tétel gyakorlása: időmérő, A) vázlat és jegyzet, B) feladat, önértékelés. */
export function OralTopic() {
  const { tema } = useParams<{ tema: string }>()
  const topic = ORAL_TOPICS.find((item) => item.slug === tema)

  if (!topic) return <NotFound />
  return <Practice key={topic.slug} topic={topic} />
}

function Practice({ topic }: { topic: Topic }) {
  const { user } = useAuth()
  const userKey = userKeyOf(user)
  const [preferences] = usePersistentState(preferencesKey(userKey), DEFAULT_PREFERENCES, isStudyPreferences)
  const [practice, savePractice] = usePersistentState<OralPractice>(practiceKey(userKey, topic.slug), EMPTY_PRACTICE, isOralPractice)
  const [phase, setPhase] = useState<Phase>('idle')
  const [secondsLeft, setSecondsLeft] = useState(ORAL_MINUTES.preparation * 60)
  const [showSolution, setShowSolution] = useState(false)
  const answerSeconds = ORAL_MINUTES.answer[preferences.level] * 60
  const running = phase === 'preparation' || phase === 'answer'

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [running])

  function startPreparation() {
    setSecondsLeft(ORAL_MINUTES.preparation * 60)
    setPhase('preparation')
  }

  function startAnswer() {
    setSecondsLeft(answerSeconds)
    setPhase('answer')
  }

  function finish() {
    setPhase('done')
    savePractice({ ...practice, attempts: practice.attempts + 1 })
  }

  const toggleItem = (index: number, on: boolean) =>
    savePractice({ ...practice, checked: on ? [...practice.checked, index] : practice.checked.filter((item) => item !== index) })

  const timerLabel = phase === 'answer' ? 'felelet' : 'felkészülés'
  const expired = running && secondsLeft === 0
  const selfScored = ORAL_SCORING.filter((row) => row.selfAssessed)
  const selfTotal = selfScored.reduce((sum, row) => sum + (practice.scores[row.criterion] ?? 0), 0)

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <Breadcrumb items={[{ label: 'Szóbeli', to: '/szobeli' }, { label: topic.title }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <PageTitle size="compact">Szóbeli tétel</PageTitle>
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="timer"
            aria-label={phase === 'answer' ? 'Hátralévő felelési idő' : 'Hátralévő felkészülési idő'}
            className={cx('inline-flex items-center gap-2.5 rounded-md border-strong bg-sheet px-4 py-2', expired ? 'border-wrong' : 'border-ink')}
          >
            <Icon name="clock" />
            <span className="font-mono text-22 font-medium">{formatClock(secondsLeft)}</span>
            <span className="text-13 text-ink-soft">{timerLabel}</span>
          </div>
          {phase === 'idle' && (
            <Button icon="play" onClick={startPreparation}>
              Felkészülés indítása
            </Button>
          )}
          {phase === 'preparation' && (
            <Button icon="mic" onClick={startAnswer}>
              Felelet indítása
            </Button>
          )}
          {phase === 'answer' && <Button onClick={finish}>Felelet vége</Button>}
          {phase === 'done' && (
            <Button variant="secondary" icon="refresh" onClick={startPreparation}>
              Újra gyakorlom
            </Button>
          )}
        </div>
      </div>

      {expired && (
        <Banner kind="warn" title="Lejárt az idő" className="mt-6">
          {phase === 'preparation' ? 'A vizsgán most kezdődne a felelet. Indítsd el, ha kész vagy.' : 'A vizsgán itt érne véget a felelet. Zárd le, és értékeld magad.'}
        </Banner>
      )}
      {phase === 'done' && (
        <Banner kind="success" title="A gyakorlást rögzítettük" className="mt-6">
          Ez volt a(z) {practice.attempts}. alkalom ebből a témából. Most pontozd magad az önértékelésnél.
        </Banner>
      )}

      <div className="mt-8 flex flex-wrap items-start gap-6">
        <Panel as="section" className="min-w-0 flex-1 basis-96" aria-labelledby="a-resz">
          <CardTitle id="a-resz" as="h2">
            A) {topic.title}
          </CardTitle>
          <p className="mt-2 text-16 leading-relaxed text-ink-soft">
            Fejtsd ki a témát. Ha segít, használd a vázlatot. A bizottság szemléltetést is kérhet.
          </p>
          <p className="mt-5 text-15 font-bold">Vázlat (minta, nem a hivatalos tételsor)</p>
          <ul className="mt-3 flex flex-col gap-3">
            {topic.outline.map((item, index) => (
              <li key={item}>
                <CheckboxField label={item} checked={practice.checked.includes(index)} onChange={(e) => toggleItem(index, e.target.checked)} />
              </li>
            ))}
          </ul>
          <TextAreaField
            className="mt-5"
            label="Jegyzeteid"
            rows={5}
            value={practice.notes}
            onChange={(e) => savePractice({ ...practice, notes: e.target.value })}
            hint="A jegyzeted ebben a böngészőben marad meg."
          />
        </Panel>

        <div className="flex min-w-0 flex-1 basis-96 flex-col gap-6">
          <Panel as="section" aria-labelledby="b-resz">
            <CardTitle id="b-resz" as="h2">
              B) Programozási feladat
            </CardTitle>
            <p className="mt-2 text-16 leading-relaxed text-ink-soft">
              Oldd meg a feladatot a saját gépeden, internet nélkül, és készülj fel a megoldás bemutatására.
            </p>
            <p className="mt-4 max-w-prose font-serif text-18 leading-loose">{topic.task.statement}</p>
            {showSolution && (
              <div className="mt-4 overflow-hidden rounded-md">
                <CodeBlock code={topic.task.solution} language="python" label="Mintamegoldás" />
              </div>
            )}
            <Button variant="secondary" icon="eye" aria-expanded={showSolution} onClick={() => setShowSolution((value) => !value)} className="mt-4">
              {showSolution ? 'Megoldás elrejtése' : 'Egy lehetséges megoldás'}
            </Button>
          </Panel>

          <Panel as="section" aria-labelledby="onertekeles">
            <CardTitle id="onertekeles" as="h2">
              Önértékelés
            </CardTitle>
            <p className="mt-2 text-16 leading-relaxed text-ink-soft">A bizottság szempontjai szerint pontozd magad. Őszintén, a felelet után.</p>
            <ul className="mt-3">
              {selfScored.map((row) => (
                <li key={row.criterion} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-grid py-3">
                  <span className="text-16 font-semibold">
                    {row.criterion} <span className="font-normal text-ink-soft">{row.points} pontból</span>
                  </span>
                  <span role="group" aria-label={row.criterion} className="flex gap-1.5">
                    {Array.from({ length: row.points + 1 }, (_, points) => {
                      const pressed = practice.scores[row.criterion] === points
                      return (
                        <button
                          key={points}
                          type="button"
                          aria-pressed={pressed}
                          aria-label={`${row.criterion}: ${points} pont`}
                          onClick={() => savePractice({ ...practice, scores: { ...practice.scores, [row.criterion]: points } })}
                          className={cx(
                            'size-11 rounded-md border text-16 font-semibold',
                            pressed ? 'border-ink bg-ink text-sheet' : 'border-muted bg-sheet text-ink hover:bg-note',
                          )}
                        >
                          {points}
                        </button>
                      )
                    })}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-16 font-bold" aria-live="polite">
              Önértékelés: {selfTotal} / {selfScored.reduce((sum, row) => sum + row.points, 0)} pont
            </p>
          </Panel>
        </div>
      </div>
    </main>
  )
}
