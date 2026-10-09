import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { hibaUzenet } from '../../../shared/api/errors'
import { LEVEL_LABEL } from '../../../shared/domain/labels'
import { Badge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { Dropzone, FileChip, type DropzoneState } from '../../../shared/ui/Dropzone'
import { formatBytes } from '../../../shared/ui/format'
import { Icon, StateIcon } from '../../../shared/ui/Icon'
import { LogoMark } from '../../../shared/ui/Logo'
import { Modal } from '../../../shared/ui/Modal'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { Prose } from '../../../shared/ui/Prose'
import { LoadError } from '../../../shared/ui/States'
import { attemptQuery, examKeys, examQuery, submitAttempt, uploadPartFile, type ExamAttempt, type ExamDetail, type ExamPartDetail } from '../api'

/** `óó:pp:mm` */
function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const two = (value: number) => String(value).padStart(2, '0')
  return `${two(Math.floor(seconds / 3600))}:${two(Math.floor((seconds % 3600) / 60))}:${two(seconds % 60)}`
}

const timeOf = (iso: string) => new Date(iso).getTime()

/** A futó vizsga: saját fejléc időmérővel, bal oldalt a részek, egyszerre egy rész látszik. */
export function ExamRunner() {
  const examId = Number(useParams<{ id: string }>().id)
  const [params] = useSearchParams()
  const attemptId = Number(params.get('proba'))
  const valid = Number.isInteger(examId) && examId > 0 && Number.isInteger(attemptId) && attemptId > 0
  const exam = useQuery({ ...examQuery(examId), enabled: valid })
  const attempt = useQuery({ ...attemptQuery(attemptId), enabled: valid })

  if (!valid) return <Navigate to="/vizsgak" replace />
  if (exam.isError || attempt.isError) {
    return (
      <main className="mx-auto w-full max-w-form px-4 py-12 md:px-6">
        <LoadError error={exam.error ?? attempt.error} onRetry={() => void Promise.all([exam.refetch(), attempt.refetch()])} />
      </main>
    )
  }
  if (!exam.data || !attempt.data) return <PageLoader label="Vizsga betöltése…" />
  if (attempt.data.state !== 'in_progress') return <Navigate to={`/vizsgak/${examId}/eredmeny?proba=${attemptId}`} replace />

  return <Runner exam={exam.data} attempt={attempt.data} />
}

function Runner({ exam, attempt }: { exam: ExamDetail; attempt: ExamAttempt }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())
  const [currentId, setCurrentId] = useState(() => exam.parts[0]?.id ?? 0)
  const [confirming, setConfirming] = useState(false)
  const autoSubmitted = useRef(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const submit = useMutation({
    mutationFn: () => submitAttempt(attempt.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: examKeys.all })
      navigate(`/vizsgak/${exam.id}/eredmeny?proba=${attempt.id}`, { replace: true })
    },
  })

  // Vizsgahelyzetben a szerver szerinti határidő számít; gyakorlásnál az eltelt időt mérjük.
  const remaining = attempt.deadline ? (timeOf(attempt.deadline) - now) / 1000 : null
  const elapsed = (now - timeOf(attempt.started_at)) / 1000
  const expired = remaining !== null && remaining <= 0

  // Az idő lejártakor egyszer, magától beadjuk (a szerver is lezárja a határidőnél).
  useEffect(() => {
    if (!expired || autoSubmitted.current) return
    autoSubmitted.current = true
    submit.mutate()
  }, [expired, submit])

  const uploadedOf = (partId: number) => attempt.submissions.find((item) => item.part_id === partId && item.file_name !== null)
  const current = exam.parts.find((part) => part.id === currentId) ?? exam.parts[0]
  const emptyParts = exam.parts.filter((part) => !uploadedOf(part.id))
  const name = `${exam.title}, ${LEVEL_LABEL[exam.level].toLowerCase()}`

  return (
    <>
      <header className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-sheet px-4 py-3.5 md:px-6">
        <Link to="/" aria-label="InfoTanár kezdőlap" className="inline-flex min-h-11 items-center py-0">
          <LogoMark className="size-6" />
        </Link>
        <div className="min-w-0 flex-1 basis-60">
          <p className="text-17 font-bold">{name}</p>
          <p className="mt-0.5 text-14 text-ink-soft">
            {attempt.mode === 'exam' ? 'Vizsgahelyzet, a számláló nem állítható meg' : 'Gyakorlás időkorlát nélkül, az idő csak mérve van'}
          </p>
        </div>
        <div
          role="timer"
          aria-label={remaining === null ? 'Eltelt idő' : 'Hátralévő idő'}
          className={cx('inline-flex items-center gap-2.5 rounded-md border-strong bg-sheet px-4 py-2', expired ? 'border-wrong' : 'border-ink')}
        >
          <Icon name="clock" />
          <span className="font-mono text-22 font-medium">{formatDuration(remaining ?? elapsed)}</span>
          <span className="text-13 text-ink-soft">{remaining === null ? 'eltelt' : 'hátra'}</span>
        </div>
        <Button onClick={() => setConfirming(true)} disabled={submit.isPending}>
          Beadás
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-work flex-1 flex-wrap items-start gap-8 px-4 py-6 md:px-6">
        <aside className="flex w-full flex-col gap-5 md:w-72 md:flex-none">
          <Panel pad="sm" as="nav" aria-label="Részek">
            <p className="mb-2 text-15 font-bold">Részek</p>
            <ol>
              {exam.parts.map((part) => {
                const isCurrent = part.id === current?.id
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      aria-current={isCurrent ? 'step' : undefined}
                      onClick={() => setCurrentId(part.id)}
                      className={cx('flex min-h-12 w-full items-center gap-3 rounded-md px-3.5 text-left text-15', isCurrent ? 'bg-note font-bold' : 'hover:bg-faint')}
                    >
                      <StateIcon kind={uploadedOf(part.id) ? 'ok' : 'empty'} label={uploadedOf(part.id) ? 'Feltöltve' : 'Nincs feltöltve'} />
                      <span className="min-w-0 flex-1">
                        {part.order}. {part.name}
                      </span>
                      <span className="text-13 font-normal whitespace-nowrap text-ink-soft">{part.points} pont</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </Panel>
          <p className="text-14 leading-relaxed text-ink-soft">
            Kérdésed van a feladat értelmezéséről? A vizsgán erre nincs lehetőség, itt sincs. Dolgozz a leírás alapján.
          </p>
        </aside>

        {current && <PartView key={current.id} part={current} attempt={attempt} uploaded={uploadedOf(current.id)?.file_name ?? null} />}
      </main>

      <Modal
        open={confirming}
        title="Beadod a feladatsort?"
        onClose={() => setConfirming(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Vissza a feladatokhoz
            </Button>
            <Button busy={submit.isPending} busyLabel="Beadás…" onClick={() => submit.mutate()}>
              Beadás
            </Button>
          </>
        }
      >
        <p>Beadás után nem módosíthatod a megoldásokat, és az időmérő megáll.</p>
        <ul className="mt-4">
          {exam.parts.map((part) => {
            const file = uploadedOf(part.id)?.file_name
            return (
              <li key={part.id} className="flex items-center gap-3 border-t border-grid py-2.5 text-15">
                <StateIcon kind={file ? 'ok' : 'empty'} label={file ? 'Feltöltve' : 'Üres'} />
                <span className="min-w-0 flex-1">
                  {part.order}. {part.name}
                </span>
                <span className={cx('font-mono text-14', !file && 'text-ink-soft')}>{file ?? 'nincs fájl'}</span>
              </li>
            )
          })}
        </ul>
        {emptyParts.length > 0 && (
          <Banner kind="warn" title={`${emptyParts.length} rész üres`} className="mt-4">
            Ha most beadod, ezekre 0 pontot kapsz.
            {remaining !== null && remaining > 0 && ` Visszamehetsz, még ${formatDuration(remaining)} időd van.`}
          </Banner>
        )}
        {submit.isError && (
          <Banner kind="error" className="mt-4">
            {hibaUzenet(submit.error)}
          </Banner>
        )}
      </Modal>
    </>
  )
}

function PartView({ part, attempt, uploaded }: { part: ExamPartDetail; attempt: ExamAttempt; uploaded: string | null }) {
  const queryClient = useQueryClient()
  const [progress, setProgress] = useState<{ name: string; percent: number } | null>(null)
  const upload = useMutation({
    mutationFn: (file: File) => uploadPartFile(attempt.id, part.id, file, (percent) => setProgress({ name: file.name, percent })),
    onMutate: (file) => setProgress({ name: file.name, percent: 0 }),
    onSuccess: (updated) => queryClient.setQueryData(examKeys.attempt(attempt.id), updated),
    onSettled: () => setProgress(null),
  })

  const state: DropzoneState = progress
    ? { kind: 'uploading', name: progress.name, percent: progress.percent }
    : uploaded
      ? { kind: 'done', name: uploaded, detail: 'Feltöltve. Beadásig lecserélheted.' }
      : { kind: 'empty' }

  return (
    <Panel kind="work" pad="xl" as="section" aria-labelledby="resz-cim" className="min-w-0 flex-1 basis-120">
      <h1 id="resz-cim" className="font-serif text-28 leading-snug font-semibold tracking-tight">
        {part.order}. {part.name}
      </h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge kind="neutral">{part.points} pont</Badge>
        <Badge kind="neutral">ajánlott idő: {part.minutes} perc</Badge>
        {part.software && <Badge kind="lang">{part.software}</Badge>}
      </div>

      <Prose markdown={part.description} className="mt-5" />

      {part.sources.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-3">
          {part.sources.map((file) => (
            <FileChip key={file.name} name={file.name} size={formatBytes(file.size)} href={file.url} />
          ))}
        </div>
      )}

      {part.steps.length > 0 && (
        <ol className="mt-5 flex max-w-prose list-decimal flex-col gap-2 pl-6 font-serif text-18 leading-loose">
          {part.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}

      <div className="mt-6 max-w-form">
        {part.exercise_id !== null ? (
          <Banner
            kind="info"
            title="Ezt a részt a beépített szerkesztőben oldod meg"
            action={
              <ButtonLink to={`/feladatok/${part.exercise_id}`} target="_blank" variant="secondary" icon="code">
                Szerkesztő megnyitása új lapon
              </ButtonLink>
            }
          >
            A beadott megoldásod a vizsga értékelésébe is beszámít.
          </Banner>
        ) : (
          <>
            {part.deliverable && (
              <p className="mb-3 text-15">
                Beadandó fájl: <span className="font-mono font-medium">{part.deliverable}</span>
              </p>
            )}
            <Dropzone
              state={state}
              accept={part.accepted_extensions}
              onFile={(file) => upload.mutate(file)}
              error={upload.isError ? hibaUzenet(upload.error) : null}
            />
          </>
        )}
      </div>

      <Banner kind="info" className="mt-6">
        Az értékelést a beadás után kapod meg, az összes résszel együtt. Addig is tölthetsz fel új verziót.
      </Banner>
    </Panel>
  )
}
