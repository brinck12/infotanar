import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { httpStatus } from '../../../shared/api/errors'
import { EXAM_PARTS } from '../../../shared/domain/exam'
import { Banner } from '../../../shared/ui/Banner'
import { ButtonLink, ExternalButtonLink } from '../../../shared/ui/Button'
import { FilterChips, type FilterOption } from '../../../shared/ui/FilterChips'
import { LoadError } from '../../../shared/ui/States'
import { Lead, PageTitle, SectionTitle } from '../../../shared/ui/Text'
import type { Level } from '../../../types'
import { examsQuery, type ExamSummary } from '../api'
import { ExamCard } from '../components/ExamCard'
import { PracticeSets } from '../components/PracticeSets'
import { OFFICIAL_PAPERS } from '../officialPapers'

type LevelFilter = Level | ''

const LEVELS: ReadonlyArray<FilterOption<LevelFilter>> = [
  { value: '', label: 'Mind' },
  { value: 'kozep', label: 'Középszint' },
  { value: 'emelt', label: 'Emelt szint' },
]

function iconOf(exam: ExamSummary, key: string) {
  return EXAM_PARTS[exam.level].find((part) => part.key === key)?.icon ?? 'file'
}

function statusOf(exam: ExamSummary): { text: string; action: string } {
  const attempt = exam.attempt
  if (!attempt) return { text: 'Még nem kezdted el', action: 'Megnyitás' }
  if (attempt.state === 'in_progress') {
    const done = attempt.completed_parts.length
    return { text: done > 0 ? `Folyamatban, ${done} rész kész` : 'Folyamatban', action: 'Folytatás' }
  }
  return { text: attempt.score === null ? 'Beadva, értékelés alatt' : `Kész: ${attempt.score} / ${attempt.max_score} pont`, action: 'Újra' }
}

/** Érettségi gyakorlás: a teljes feladatsorok szintenként, és ha vannak, az időmérős vizsgák. */
export function ExamList() {
  const [level, setLevel] = useState<LevelFilter>('')
  const exams = useQuery(examsQuery())
  // Amíg a vizsgamód nincs bekapcsolva a szerveren, a hivatalos feladatlapokat mutatjuk.
  const unavailable = exams.isError && httpStatus(exams.error) === 404
  const visible = (exams.data ?? []).filter((exam) => !level || exam.level === level)
  const running = (exams.data ?? []).find((exam) => exam.attempt?.state === 'in_progress')
  const papers = OFFICIAL_PAPERS.filter((paper) => !level || paper.level === level)

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <PageTitle>Érettségi gyakorlás</PageTitle>
      <Lead className="mt-3 max-w-prose text-18">
        Programozási és adatbázis-feladatsorok az érettségi felépítésében és nehézségében: megoldhatod őket lépésenként, feladatonkénti visszajelzéssel,
        vagy időmérős vizsgaként. A táblázat- és dokumentumfeladatokhoz a tanulási utak leckéi adnak gyakorlást.
      </Lead>

      {running?.attempt && (
        <Banner
          kind="warn"
          title="Fut egy próbálkozásod"
          className="mt-8"
          data-testid="running-attempt"
          action={<ButtonLink to={`/vizsgak/${running.id}/fut?proba=${running.attempt.id}`}>Folytatás</ButtonLink>}
        >
          A(z) {running.title} feladatsort elkezdted, és még nem adtad be. Folytasd ott, ahol abbahagytad.
        </Banner>
      )}

      <Banner kind="info" title="Saját feladatsorok, az érettségi alapján" className="mt-8">
        A feladatsorokat mi készítjük az elmúlt évek érettségi feladatainak felépítése és nehézsége alapján, a hivatalos feladatok szövegét nem
        másoljuk. Az automatikusan nem eldönthető pontokat te jelölöd a mintával összevetve.
      </Banner>

      <div className="mt-8">
        <FilterChips label="Szint" options={LEVELS} value={level} onChange={setLevel} />
      </div>

      <div className="mt-8">
        <PracticeSets level={level} />
      </div>

      {unavailable ? (
        <section className="mt-12" aria-labelledby="hivatalos-feladatlapok">
          <SectionTitle id="hivatalos-feladatlapok">Hivatalos feladatlapok</SectionTitle>
          <Banner kind="warn" title="A beépített vizsgamód még készül" className="mt-5">
            Addig is itt találod az elmúlt vizsgaidőszakok hivatalos feladatlapjait és útmutatóit. Oldd meg időre a saját gépeden, majd
            pontozd az útmutató alapján.
          </Banner>
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {papers.map((paper) => (
              <ExamCard
                key={paper.key}
                title={paper.title}
                level={paper.level}
                minutes={paper.minutes}
                points={paper.points}
                parts={paper.parts}
                status="Hivatalos feladatlap (PDF)"
                action={
                  <>
                    <ExternalButtonLink href={paper.taskSheetUrl} target="_blank" rel="noreferrer" variant="secondary" icon="download">
                      Feladatlap
                    </ExternalButtonLink>
                    <ExternalButtonLink href={paper.guideUrl} target="_blank" rel="noreferrer" variant="text">
                      Útmutató
                    </ExternalButtonLink>
                  </>
                }
              />
            ))}
          </ul>
        </section>
      ) : exams.isError ? (
        <div className="mt-12">
          <LoadError error={exams.error} onRetry={() => void exams.refetch()} title="Nem sikerült betölteni az időmérős vizsgákat" />
        </div>
      ) : (
        visible.length > 0 && (
          <section className="mt-12" aria-labelledby="idomeros-vizsgak">
            <SectionTitle id="idomeros-vizsgak">Időmérős vizsgák</SectionTitle>
            <ul className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((exam) => {
                const status = statusOf(exam)
                return (
                  <ExamCard
                    key={exam.id}
                    title={exam.title}
                    level={exam.level}
                    minutes={exam.minutes}
                    points={exam.points}
                    parts={exam.parts.map((part) => ({ key: part.key, name: part.name, points: part.points, icon: iconOf(exam, part.key) }))}
                    status={status.text}
                    action={
                      <ButtonLink
                        to={exam.attempt?.state === 'in_progress' ? `/vizsgak/${exam.id}/fut?proba=${exam.attempt.id}` : `/vizsgak/${exam.id}`}
                        variant={exam.attempt?.state === 'in_progress' ? 'primary' : 'secondary'}
                      >
                        {status.action}
                      </ButtonLink>
                    }
                  />
                )
              })}
            </ul>
          </section>
        )
      )}
    </main>
  )
}
