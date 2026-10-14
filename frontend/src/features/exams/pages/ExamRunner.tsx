import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { hibaUzenet, httpStatus } from '../../../shared/api/errors'
import { LEVEL_LABEL } from '../../../shared/domain/labels'
import { useFileUpload } from '../../../shared/hooks/useFileUpload'
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
import { invalidateSolveState } from '../../catalog/invalidate'
import { fileTaskKeys } from '../../filetasks/api'
import {
  attemptQuery,
  examKeys,
  examQuery,
  submitAttempt,
  uploadPartFile,
  type ExamAttempt,
  type ExamDetail,
  type ExamPartDetail,
  type ResultNavigationState,
} from '../api'

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
  // A másik lapon beadott vagy lejárt kísérlet és a szerkesztőben megoldott kódrész is a lapra visszatérve látszik.
  const attempt = useQuery({ ...attemptQuery(attemptId), enabled: valid, staleTime: 0, refetchOnWindowFocus: 'always' })

  if (!valid) return <Navigate to="/vizsgak" replace />
  // Egy fókuszra induló újratöltés hibája nem dobhatja el a már betöltött, futó vizsgát.
  if ((exam.isError && !exam.data) || (attempt.isError && !attempt.data)) {
    return (
      <main className="mx-auto w-full max-w-form px-4 py-12 md:px-6">
        <LoadError error={exam.error ?? attempt.error} onRetry={() => void Promise.all([exam.refetch(), attempt.refetch()])} />
      </main>
    )
  }
  if (!exam.data || !attempt.data) return <PageLoader label="Vizsga betöltése…" />
  if (attempt.data.state !== 'in_progress') return <Navigate to={`/vizsgak/${examId}/eredmeny?proba=${attemptId}`} replace />

  return <Runner exam={exam.data} attempt={attempt.data} fetchedAt={attempt.dataUpdatedAt} />
}

function Runner({ exam, attempt, fetchedAt }: { exam: ExamDetail; attempt: ExamAttempt; fetchedAt: number }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [now, setNow] = useState(() => Date.now())
  const [currentId, setCurrentId] = useState(() => exam.parts[0]?.id ?? 0)
  const [confirming, setConfirming] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [autoFailures, setAutoFailures] = useState(0)
  const submitting = useRef(false)
  const resultPath = `/vizsgak/${exam.id}/eredmeny?proba=${attempt.id}`

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  // Futó vizsgán a lap bezárása vagy újratöltése előtt rákérdez a böngésző.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const submit = useMutation({
    mutationFn: () => {
      submitting.current = true
      return submitAttempt(attempt.id)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: examKeys.all })
      void queryClient.invalidateQueries({ queryKey: fileTaskKeys.all })
      invalidateSolveState(queryClient)
      navigate(resultPath, { replace: true })
    },
    onError: (error) => {
      // 409: egy másik lapon már beadták, vagy lejárt: az eredmény a hiteles állapot.
      if (httpStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: examKeys.all })
        navigate(resultPath, { replace: true, state: { notice: 'conflict' } satisfies ResultNavigationState })
        return
      }
      setAutoFailures((count) => count + 1)
    },
    onSettled: () => {
      submitting.current = false
    },
  })
  const submitNow = submit.mutate

  // A szerver órája és a gépé eltérhet: a válasz pillanatában mért különbséggel igazítjuk a gép óráját.
  const offset = useMemo(() => {
    const difference = timeOf(attempt.server_time) - fetchedAt
    return Number.isFinite(difference) ? difference : 0
  }, [attempt.server_time, fetchedAt])
  const serverNow = now + offset

  // Vizsgahelyzetben a szerver szerinti határidő számít; gyakorlásnál az eltelt időt mérjük.
  const remaining = attempt.deadline ? (timeOf(attempt.deadline) - serverNow) / 1000 : null
  const elapsed = (serverNow - timeOf(attempt.started_at)) / 1000
  const expired = remaining !== null && remaining <= 0

  // Az idő lejártakor magától beadjuk (a szerver is lezárja a határidőnél). Hiba esetén
  // növekvő várakozással újrapróbáljuk (1, 2, 4… legfeljebb 30 mp), amíg sikerül.
  useEffect(() => {
    if (!expired) return
    const delay = autoFailures === 0 ? 0 : Math.min(30_000, 1000 * 2 ** autoFailures)
    const timer = window.setTimeout(() => {
      if (!submitting.current) submitNow()
    }, delay)
    return () => window.clearTimeout(timer)
  }, [expired, autoFailures, submitNow])

  // 10 / 5 / 1 percnél színt váltunk, és a képernyőolvasónak is bemondjuk.
  const warning = remaining === null || expired ? null : remaining <= 60 ? 1 : remaining <= 300 ? 5 : remaining <= 600 ? 10 : null

  const uploadedOf = (partId: number) => attempt.submissions.find((item) => item.part_id === partId && item.file_name !== null)
  const current = exam.parts.find((part) => part.id === currentId) ?? exam.parts[0]
  const emptyParts = exam.parts.filter((part) => !uploadedOf(part.id))
  const name = `${exam.title}, ${LEVEL_LABEL[exam.level].toLowerCase()}`

  return (
    <>
      <header className="sticky top-0 z-10 flex w-full flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-sheet px-4 py-3.5 md:px-6">
        <Link
          to="/"
          aria-label="InfoTanár kezdőlap"
          onClick={(event) => {
            event.preventDefault()
            setLeaving(true)
          }}
          className="inline-flex min-h-11 items-center py-0"
        >
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
          className={cx(
            'inline-flex items-center gap-2.5 rounded-md border-strong px-4 py-2',
            expired || warning === 1 || warning === 5 ? 'border-wrong text-wrong' : 'border-ink',
            warning === 1 || expired ? 'bg-wrong-soft' : warning === 10 ? 'bg-note' : 'bg-sheet',
          )}
        >
          <Icon name="clock" />
          <span className="font-mono text-22 font-medium">{formatDuration(remaining ?? elapsed)}</span>
          <span className="text-13 text-ink-soft">{remaining === null ? 'eltelt' : 'hátra'}</span>
        </div>
        <Button onClick={() => setConfirming(true)} disabled={submit.isPending}>
          Beadás
        </Button>
        {/* A küszöbök átlépését a képernyőolvasó is bemondja; a tartalom csak a küszöbnél változik. */}
        <p role="status" aria-live="polite" className="sr-only">
          {warning === null ? '' : `Figyelem, már csak ${warning === 1 ? 'egy percnél kevesebb' : `${warning} perc`} van hátra.`}
        </p>
      </header>

      {expired && (
        <div className="mx-auto w-full max-w-work px-4 pt-4 md:px-6">
          {submit.isError ? (
            <Banner
              kind="error"
              title="Lejárt az idő, de a beadás nem sikerült"
              action={
                <Button onClick={() => submitNow()} busy={submit.isPending} busyLabel="Beadás…">
                  Beadás
                </Button>
              }
            >
              {hibaUzenet(submit.error)} Magunktól újrapróbáljuk, de te is megnyomhatod a Beadás gombot. A feltöltött fájljaid megmaradnak.
            </Banner>
          ) : (
            <Banner kind="warn" title="Lejárt az idő">
              A vizsgát most adjuk be. Egy pillanat.
            </Banner>
          )}
        </div>
      )}

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
          {exam.source_zip && (
            <div>
              <p className="mb-2 text-15 font-bold">Forrásfájlok</p>
              <FileChip name={exam.source_zip.name} size={formatBytes(exam.source_zip.size)} href={exam.source_zip.url} />
            </div>
          )}
          <p className="text-14 leading-relaxed text-ink-soft">
            Kérdésed van a feladat értelmezéséről? A vizsgán erre nincs lehetőség, itt sincs. Dolgozz a leírás alapján.
          </p>
        </aside>

        {current && (
          <PartView
            key={current.id}
            part={current}
            attempt={attempt}
            uploaded={uploadedOf(current.id)?.file_name ?? null}
            onConflict={() => navigate(resultPath, { replace: true, state: { notice: 'conflict' } satisfies ResultNavigationState })}
          />
        )}
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
            <Button busy={submit.isPending} busyLabel="Beadás…" onClick={() => submitNow()}>
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

      <Modal
        open={leaving}
        title="Kilépsz a vizsgából?"
        onClose={() => setLeaving(false)}
        actions={
          <>
            <Button variant="secondary" onClick={() => setLeaving(false)}>
              Maradok
            </Button>
            <Button onClick={() => navigate('/')}>Kilépek</Button>
          </>
        }
      >
        <p>A vizsga időmérője kilépés után is fut. A feltöltött fájljaid megmaradnak, a vizsga listájából folytathatod.</p>
      </Modal>
    </>
  )
}

interface PartViewProps {
  part: ExamPartDetail
  attempt: ExamAttempt
  uploaded: string | null
  /** A feltöltés 409-et kapott: a vizsga már le van zárva. */
  onConflict: () => void
}

function PartView({ part, attempt, uploaded, onConflict }: PartViewProps) {
  const queryClient = useQueryClient()
  const upload = useFileUpload({
    send: (file, onProgress, signal) => uploadPartFile(attempt.id, part.id, file, onProgress, signal),
    onSuccess: (updated) => queryClient.setQueryData(examKeys.attempt(attempt.id), updated),
    onError: (error) => {
      if (httpStatus(error) === 409) {
        void queryClient.invalidateQueries({ queryKey: examKeys.all })
        onConflict()
      }
    },
  })
  const progress = upload.progress

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
              onFile={upload.start}
              error={upload.error}
              onRetry={upload.offline ? upload.retry : undefined}
              onDismiss={upload.offline ? upload.dismiss : undefined}
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
