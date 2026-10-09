import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
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
      <ButtonLink to={`/feladatok/${submission.data.exercise_id}`} variant="secondary" className="mt-6">
        Javított fájl feltöltése
      </ButtonLink>
    </main>
  )
}
