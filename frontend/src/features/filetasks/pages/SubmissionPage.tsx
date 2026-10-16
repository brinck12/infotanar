import { useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { httpStatus } from '../../../shared/api/errors'
import { Breadcrumb } from '../../../shared/ui/Breadcrumb'
import { ButtonLink } from '../../../shared/ui/Button'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { LoadError } from '../../../shared/ui/States'
import { PageTitle } from '../../../shared/ui/Text'
import { NotFound } from '../../system/NotFound'
import { submissionQuery } from '../api'
import { SubmissionResult } from '../components/SubmissionResult'

/** Egy korábbi fájlbeadás értékelőlapja (pl. a vizsgaeredményből megnyitva). */
export function SubmissionPage() {
  const id = Number(useParams<{ id: string }>().id)
  const [params] = useSearchParams()
  const examId = Number(params.get('vizsga'))
  const attemptId = Number(params.get('proba'))
  // A vizsgaeredményből nyitva visszaviszünk oda.
  const fromExam = Number.isInteger(examId) && examId > 0 && Number.isInteger(attemptId) && attemptId > 0
  const submission = useQuery({ ...submissionQuery(id), enabled: Number.isInteger(id) && id > 0 })

  if (submission.isPending) return <PageLoader label="Értékelőlap betöltése…" />
  if (submission.isError) {
    if (httpStatus(submission.error) === 404) return <NotFound />
    return (
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-12 md:px-6">
        <LoadError error={submission.error} onRetry={() => void submission.refetch()} />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-account flex-1 px-4 pt-8 pb-24 md:px-6">
      <Breadcrumb items={[{ label: 'Feladatok', to: '/feladatok' }, { label: submission.data.exercise_title }]} />
      <PageTitle size="compact" className="mt-4">
        {submission.data.exercise_title}
      </PageTitle>
      <Panel pad="xl" className="mt-6">
        <SubmissionResult submission={submission.data} />
      </Panel>
      <div className="mt-6 flex flex-wrap gap-3">
        {fromExam && (
          <ButtonLink to={`/vizsgak/${examId}/eredmeny?proba=${attemptId}`} icon="chevron-left">
            Vissza az eredményhez
          </ButtonLink>
        )}
        <ButtonLink to={`/feladatok/${submission.data.exercise_id}`} variant="secondary">
          Javított fájl feltöltése
        </ButtonLink>
      </div>
    </main>
  )
}
