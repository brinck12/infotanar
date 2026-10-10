import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { httpStatus } from '../../../../shared/api/errors'
import { LEVEL_LABEL } from '../../../../shared/domain/labels'
import { Badge, LevelBadge } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { EmptyState, LoadError, Skeleton } from '../../../../shared/ui/States'
import { Table, Td, Th, Tr } from '../../../../shared/ui/Table'
import { MutationError } from '../../catalog/components/QueryState'
import { AdminShell } from '../../components/AdminShell'
import { adminExamKeys, adminExamsQuery, createExam } from '../api'

/** Gyakorló vizsgák listája az adminban; innen nyílik a szerkesztő. */
export function AdminExams() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const exams = useQuery(adminExamsQuery())
  const create = useMutation({
    mutationFn: () => createExam({ title: 'Új gyakorló vizsga', level: 'kozep', minutes: 180, points: 100, is_published: false, timed_mode: true }),
    onSuccess: async (exam) => {
      await queryClient.invalidateQueries({ queryKey: adminExamKeys.all })
      navigate(`/admin/vizsgak/${exam.id}`)
    },
  })
  const unavailable = exams.isError && httpStatus(exams.error) === 404

  return (
    <AdminShell
      crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Gyakorló vizsgák' }]}
      title="Gyakorló vizsgák"
      actions={
        !unavailable && (
          <Button icon="plus" busy={create.isPending} busyLabel="Létrehozás…" onClick={() => create.mutate()}>
            Új vizsga
          </Button>
        )
      }
    >
      <MutationError error={create.error} />
      {exams.isPending ? (
        <Skeleton lines={4} />
      ) : unavailable ? (
        <Banner kind="warn" title="A vizsgamód a szerveren még nincs bekapcsolva">
          A gyakorló vizsgák szerkesztéséhez a vizsga-végpontok kellenek. Amint elkészülnek, itt jelenik meg a lista.
        </Banner>
      ) : exams.isError ? (
        <LoadError error={exams.error} onRetry={() => void exams.refetch()} />
      ) : exams.data.length === 0 ? (
        <EmptyState title="Még nincs gyakorló vizsga">Hozd létre az elsőt, majd rendeld hozzá a részeket és a feladatokat.</EmptyState>
      ) : (
        <Table caption="Gyakorló vizsgák">
          <thead>
            <tr>
              <Th>Megnevezés</Th>
              <Th>Szint</Th>
              <Th align="right">Perc</Th>
              <Th align="right">Pont</Th>
              <Th>Állapot</Th>
            </tr>
          </thead>
          <tbody>
            {exams.data.map((exam) => {
              const incomplete = exam.parts.filter((part) => part.rubric_status === 'incomplete').length
              return (
                <Tr key={exam.id}>
                  <Td>
                    <Link to={`/admin/vizsgak/${exam.id}`} className="inline-flex min-h-8 items-center font-semibold text-ink">
                      {exam.title}, {LEVEL_LABEL[exam.level].toLowerCase()}
                    </Link>
                  </Td>
                  <Td>
                    <LevelBadge level={exam.level} />
                  </Td>
                  <Td align="right">{exam.minutes}</Td>
                  <Td align="right">{exam.points}</Td>
                  <Td>
                    <span className="flex flex-wrap gap-1.5">
                      <Badge kind={exam.is_published ? 'pub' : 'draft'}>{exam.is_published ? 'Közzétéve' : 'Piszkozat'}</Badge>
                      {incomplete > 0 && <Badge kind="bad">{incomplete} hiányos értékelőlap</Badge>}
                    </span>
                  </Td>
                </Tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </AdminShell>
  )
}
