import { useQuery } from '@tanstack/react-query'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { EXAM_PARTS } from '../../../shared/domain/exam'
import { LEVEL_LABEL } from '../../../shared/domain/labels'
import { Banner } from '../../../shared/ui/Banner'
import { Breadcrumb } from '../../../shared/ui/Breadcrumb'
import { ButtonLink } from '../../../shared/ui/Button'
import { Icon } from '../../../shared/ui/Icon'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { Bar } from '../../../shared/ui/Progress'
import { LoadError } from '../../../shared/ui/States'
import { CardTitle, PageTitle, SectionTitle } from '../../../shared/ui/Text'
import { resultQuery, type ExamResult as Result } from '../api'

/**
 * A vizsga eredménye: összpontszám és százalék, részenként a fő hibaokkal.
 * Jegyet szándékosan nem mutatunk: a hivatalos ponthatárokat előbb az
 * Oktatási Hivatal közleményéből kell megerősíteni.
 */
export function ExamResult() {
  const examId = Number(useParams<{ id: string }>().id)
  const [params] = useSearchParams()
  const attemptId = Number(params.get('proba'))
  const valid = Number.isInteger(attemptId) && attemptId > 0
  const result = useQuery({ ...resultQuery(attemptId), enabled: valid })

  if (!valid) return <Navigate to={`/vizsgak/${examId}`} replace />
  if (result.isPending) return <PageLoader label="Eredmény betöltése…" />
  if (result.isError) {
    return (
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-12 md:px-6">
        <LoadError error={result.error} onRetry={() => void result.refetch()} title="Nem sikerült betölteni az eredményt" />
      </main>
    )
  }

  return <ResultView result={result.data} />
}

function ResultView({ result }: { result: Result }) {
  const { exam } = result
  const name = `${exam.title}, ${LEVEL_LABEL[exam.level].toLowerCase()}`
  const percent = result.max_score > 0 ? Math.floor((result.score / result.max_score) * 100) : 0

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <Breadcrumb items={[{ label: 'Gyakorló vizsgák', to: '/vizsgak' }, { label: name }]} />
      <PageTitle className="mt-4">Az eredményed</PageTitle>

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <div className="min-w-0 flex-1 basis-120">
          <Panel kind="highlight" pad="xl">
            <p className="text-15 text-ink-soft">Összesen</p>
            <p className="mt-1 font-serif text-44 leading-tight font-semibold tracking-tight">
              {result.score} / {result.max_score} pont
            </p>
            <p className="mt-1 text-18 text-ink-soft">{percent} százalék</p>
          </Panel>

          {result.pending_manual_points > 0 && (
            <Banner kind="info" title={`${result.pending_manual_points} pont kézi ellenőrzésre vár`} className="mt-6">
              A grafikai és animációs elemeknél te döntöd el a mintával összevetve, megvan-e a pont. Az értékelőlapon jelölheted, a végső
              összeg ezután frissül.
            </Banner>
          )}

          <SectionTitle className="mt-10">Részenként</SectionTitle>
          <ul className="mt-4 flex flex-col gap-4">
            {result.parts.map((part) => {
              const info = exam.parts.find((item) => item.id === part.part_id)
              const share = part.max_score > 0 ? Math.round((part.score / part.max_score) * 100) : 0
              return (
                <Panel as="li" key={part.part_id}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Icon name={EXAM_PARTS[exam.level].find((fact) => fact.key === info?.key)?.icon ?? 'file'} size={22} className="text-ink-soft" />
                    <span className="min-w-0 flex-1 font-serif text-20 font-semibold">{info?.name ?? 'Rész'}</span>
                    <span className="text-18 font-bold whitespace-nowrap">
                      {part.score} / {part.max_score}
                    </span>
                  </div>
                  <Bar value={part.score} max={part.max_score} label={`${share} százalék`} className="mt-3" />
                  {part.summary && <p className="mt-3 text-16 leading-relaxed">{part.summary}</p>}
                  {part.file_submission_id !== null && (
                    <p className="mt-1">
                      <Link to={`/beadasok/${part.file_submission_id}`} className="inline-flex min-h-11 items-center text-15">
                        Értékelőlap megnyitása
                      </Link>
                    </p>
                  )}
                </Panel>
              )
            })}
          </ul>
        </div>

        <aside className="w-full md:w-80 md:flex-none">
          <Panel>
            {result.review.length > 0 && (
              <>
                <CardTitle as="h2">Ezt érdemes átnézni</CardTitle>
                <ul className="mt-3">
                  {result.review.map((item) => (
                    <li key={item.lesson_id} className="flex items-center gap-3 border-t border-grid py-1">
                      <Icon name="play" size={18} className="text-accent" />
                      <Link to={`/leckek/${item.lesson_id}`} className="inline-flex min-h-11 min-w-0 flex-1 items-center text-15">
                        {item.title}
                      </Link>
                      <span className="text-13 text-ink-soft">{item.track}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-4 flex flex-col gap-3">
              <ButtonLink to={`/vizsgak/${exam.id}`}>Új próbálkozás</ButtonLink>
              <ButtonLink to="/vizsgak" variant="secondary">
                Összes gyakorló vizsga
              </ButtonLink>
            </div>
          </Panel>
        </aside>
      </div>
    </main>
  )
}
