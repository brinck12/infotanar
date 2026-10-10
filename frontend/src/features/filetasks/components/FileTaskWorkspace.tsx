import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { hibaUzenet, zarolasOka } from '../../../shared/api/errors'
import { Badge, LevelBadge } from '../../../shared/ui/Badge'
import { Dropzone, FileChip, type DropzoneState } from '../../../shared/ui/Dropzone'
import { formatBytes } from '../../../shared/ui/format'
import { Panel } from '../../../shared/ui/Panel'
import { Prose } from '../../../shared/ui/Prose'
import { CardTitle } from '../../../shared/ui/Text'
import type { UnlockedTaskDetail } from '../../../types'
import { catalogKeys } from '../../catalog/api'
import { progressKeys } from '../../progress/api'
import { fileTaskKeys, submissionsQuery, uploadSubmission } from '../api'
import { SubmissionResult } from './SubmissionResult'

const timeOfDay = new Intl.DateTimeFormat('hu-HU', { hour: '2-digit', minute: '2-digit' })

/**
 * Fájlalapú feladat (táblázat, szöveg, bemutató, grafika): a tanuló a saját
 * programjában dolgozik, feltölti az eredményt, a szerver pedig az értékelőlap
 * tételei szerint pontozza.
 */
export function FileTaskWorkspace({ task }: { task: UnlockedTaskDetail }) {
  const queryClient = useQueryClient()
  const info = task.file_task
  const attempts = useQuery(submissionsQuery(task.id))
  const [progress, setProgress] = useState<{ name: string; percent: number } | null>(null)

  const upload = useMutation({
    mutationFn: (file: File) => uploadSubmission(task.id, file, (percent) => setProgress({ name: file.name, percent })),
    onMutate: (file) => setProgress({ name: file.name, percent: 0 }),
    onSuccess: (submission) => {
      queryClient.setQueryData(fileTaskKeys.one(submission.id), submission)
      void queryClient.invalidateQueries({ queryKey: fileTaskKeys.forExercise(task.id) })
      void queryClient.invalidateQueries({ queryKey: progressKeys.all })
    },
    // Menet közben megszűnt a hozzáférés: a feladat újratöltve a zárolt nézetre vált.
    onError: (error) => {
      if (zarolasOka(error)) void queryClient.invalidateQueries({ queryKey: catalogKeys.task(task.id) })
    },
    onSettled: () => setProgress(null),
  })

  const latest = upload.data ?? attempts.data?.[0] ?? null
  const accepted = info?.accepted_extensions ?? []
  const software = info?.software ?? []

  const state: DropzoneState = progress
    ? { kind: 'uploading', name: progress.name, percent: progress.percent }
    : latest
      ? {
          kind: 'done',
          name: latest.file.name,
          detail: `${formatBytes(latest.file.size)}, feltöltve ${timeOfDay.format(new Date(latest.file.uploaded_at))}`,
        }
      : { kind: 'empty' }

  return (
    <main className="mx-auto flex w-full max-w-work flex-wrap items-start gap-6 px-4 py-6 md:px-6">
      <Panel as="section" pad="xl" aria-label="Feladat leírása" className="min-w-0 flex-1 basis-100 md:max-w-auth lg:max-w-form">
        <h1 className="font-serif text-32 leading-tight font-semibold tracking-tight">{task.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <LevelBadge level={task.level} />
          {software.map((name) => (
            <Badge key={name} kind="lang">
              {name}
            </Badge>
          ))}
          {info?.exam_reference && <Badge kind="neutral">{info.exam_reference}</Badge>}
        </div>

        <Prose markdown={task.description} className="mt-6" />

        {info && info.sources.length > 0 && (
          <>
            <CardTitle className="mt-8">{info.sources.length === 1 ? 'Forrásfájl' : 'Forrásfájlok'}</CardTitle>
            <div className="mt-3 flex flex-wrap gap-3">
              {info.sources.map((file) => (
                <FileChip key={file.name} name={file.name} size={formatBytes(file.size)} href={file.url} />
              ))}
            </div>
          </>
        )}

        {info && info.steps.length > 0 && (
          <>
            <CardTitle className="mt-8">Teendők</CardTitle>
            <ol className="mt-3 flex list-decimal flex-col gap-2 pl-6 font-serif text-18 leading-loose">
              {info.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </>
        )}

        {info?.sample_image_url && (
          <>
            <CardTitle className="mt-8">Minta</CardTitle>
            <img src={info.sample_image_url} alt="A kész munka mintája" className="mt-3 w-full rounded-sm border border-line" />
          </>
        )}
      </Panel>

      <div className="flex min-w-0 flex-1 basis-120 flex-col gap-6">
        <Panel kind="work" pad="xl" as="section" aria-label="Beadás">
          <ol className="flex flex-col gap-6">
            <Step number={1} title="Dolgozz a saját programodban">
              {software.length > 0 ? `${software.join(' vagy ')} programban. ` : ''}
              {info?.deliverable ? (
                <>
                  Mentsd <strong className="font-mono text-ink">{info.deliverable}</strong> néven a program saját formátumában
                  {accepted.length > 0 ? ` (${accepted.join(' vagy ')})` : ''}.
                </>
              ) : (
                'Mentsd a program saját formátumában.'
              )}
            </Step>
            <Step number={2} title="Töltsd fel a kész fájlt">
              <div className="mt-3">
                <Dropzone
                  state={state}
                  accept={accepted}
                  onFile={(file) => upload.mutate(file)}
                  error={upload.isError && !zarolasOka(upload.error) ? hibaUzenet(upload.error) : null}
                />
              </div>
            </Step>
          </ol>
        </Panel>

        {latest && (
          <Panel pad="xl" as="section" aria-label="Eredmény">
            <SubmissionResult submission={latest} />
          </Panel>
        )}
      </div>
    </main>
  )
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="inline-flex size-8 flex-none items-center justify-center rounded-sm bg-ink text-15 font-bold text-sheet">{number}</span>
      <div className="min-w-0 flex-1">
        <p className="font-serif text-20 leading-snug font-semibold">{title}</p>
        <div className="mt-1 text-16 leading-relaxed text-ink-soft">{children}</div>
      </div>
    </li>
  )
}
