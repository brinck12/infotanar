import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { hibaUzenet, httpStatus, zarolasOka } from '../../../shared/api/errors'
import { EXAM_PARTS } from '../../../shared/domain/exam'
import { LEVEL_LABEL } from '../../../shared/domain/labels'
import { Banner } from '../../../shared/ui/Banner'
import { Breadcrumb } from '../../../shared/ui/Breadcrumb'
import { Button, ButtonLink } from '../../../shared/ui/Button'
import { FileChip } from '../../../shared/ui/Dropzone'
import { formatBytes } from '../../../shared/ui/format'
import { CheckboxField, ChoiceGroup, RadioField } from '../../../shared/ui/Form'
import { Icon } from '../../../shared/ui/Icon'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { Panel } from '../../../shared/ui/Panel'
import { EmptyState, LoadError } from '../../../shared/ui/States'
import { CardTitle, PageTitle } from '../../../shared/ui/Text'
import type { LockReason } from '../../../types'
import { useAuth } from '../../auth/context'
import { attemptQuery, examQuery, startAttempt, type ExamDetail, type ExamMode } from '../api'

const CHECKLIST = [
  { label: 'Megnyitottam a programjaimat: táblázatkezelő, szövegszerkesztő, bemutatókészítő, képszerkesztő és egy programozási környezet.' },
  { label: 'Letöltöttem a forrásfájlokat (egy zip), és kicsomagoltam egy külön mappába.' },
  { label: 'Magyar nyelvű beállítás: tizedesvessző, pontosvessző listaelválasztó.', hint: 'A vizsgagépeken is így van beállítva.' },
] as const

/** Vizsga indítása: mód választása, ellenőrzőlista, a részek és a forrásfájlok. */
export function ExamStart() {
  const id = Number(useParams<{ id: string }>().id)
  const exam = useQuery({ ...examQuery(id), enabled: Number.isInteger(id) && id > 0 })

  if (exam.isPending) return <PageLoader label="Feladatsor betöltése…" />
  if (exam.isError) {
    return (
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-12 md:px-6">
        {httpStatus(exam.error) === 404 ? (
          <EmptyState title="Ez a feladatsor nem érhető el" action={<ButtonLink to="/vizsgak">Összes gyakorló vizsga</ButtonLink>}>
            Lehet, hogy még nincs közzétéve. A listában megtalálod az elérhető feladatsorokat.
          </EmptyState>
        ) : (
          <LoadError error={exam.error} onRetry={() => void exam.refetch()} />
        )}
      </main>
    )
  }

  return <StartForm exam={exam.data} />
}

const LOCK_ACTION: Readonly<Record<LockReason, { to: string; label: string }>> = {
  login_required: { to: '/bejelentkezes', label: 'Belépés' },
  email_unverified: { to: '/fiok', label: 'E-mail-cím megerősítése' },
  subscription_required: { to: '/elofizetes', label: 'Prémium előfizetés' },
}

const MODE_LABEL: Readonly<Record<ExamMode, string>> = { exam: 'vizsgahelyzet', practice: 'gyakorlás időkorlát nélkül' }

/**
 * A zárolt vizsga felismerése betöltéskor: a backend a nem hozzáférőnek üres
 * leírást ad a részekhez (a szerkezet látszik, a tartalom nem).
 */
function isLocked(exam: ExamDetail): boolean {
  if (exam.locked !== undefined) return exam.locked
  return exam.parts.length > 0 &&exam.parts.every((part) => part.description === '')
}

/** Zárolt vizsga: a lépés a vizsgára szabott szöveggel, még az Indítás előtt. */
function ExamLock({ reason }: { reason: LockReason }) {
  const action = LOCK_ACTION[reason]
  const text: Readonly<Record<LockReason, string>> = {
    login_required: 'A gyakorló vizsgák feladatait és forrásfájljait belépés után éred el.',
    email_unverified: 'A gyakorló vizsga indításához előbb erősítsd meg az e-mail-címedet. A feladatsor leírását és a forrásfájlokat ezután látod.',
    subscription_required: 'Ez a gyakorló feladatsor Prémium előfizetéshez kötött. Előfizetés után indíthatod el, és megkapod a forrásfájlokat is.',
  }
  return (
    <Banner kind="warn" title="A feladatsor zárolva van" className="mt-6" action={<ButtonLink to={action.to}>{action.label}</ButtonLink>} data-testid="exam-lock">
      {text[reason]}
    </Banner>
  )
}

/** Az indítás elutasítása: zárolásnál a következő lépéssel, egyébként csak az üzenettel. */
function StartDenied({ error }: { error: unknown }) {
  const lock = zarolasOka(error)
  if (!lock) {
    return (
      <Banner kind="error" className="mt-4">
        {hibaUzenet(error)}
      </Banner>
    )
  }

  const action = LOCK_ACTION[lock.reason]
  return (
    <Banner kind="warn" className="mt-4" action={<ButtonLink to={action.to}>{action.label}</ButtonLink>}>
      {lock.message}
    </Banner>
  )
}

function StartForm({ exam }: { exam: ExamDetail }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  // Alapértelmezés a gyakorlás: az időzített vizsgahelyzetet a tanuló külön választja.
  const [mode, setMode] = useState<ExamMode>('practice')
  const running = exam.attempt?.state === 'in_progress' ? exam.attempt : null
  const runningAttempt = useQuery({ ...attemptQuery(running?.id ?? 0), enabled: running !== null })
  const locked = isLocked(exam)
  const lockReason: LockReason = !user ? 'login_required' : user.email_verified_at ? 'subscription_required' : 'email_unverified'
  const mismatch = running && runningAttempt.data && runningAttempt.data.mode !== mode ? runningAttempt.data.mode : null
  const [checked, setChecked] = useState<ReadonlySet<number>>(new Set())
  const start = useMutation({
    mutationFn: () => startAttempt(exam.id, mode),
    onSuccess: (attempt) => navigate(`/vizsgak/${exam.id}/fut?proba=${attempt.id}`),
  })
  const name = `${exam.title}, ${LEVEL_LABEL[exam.level].toLowerCase()}`

  const toggle = (index: number, on: boolean) =>
    setChecked((current) => {
      const next = new Set(current)
      if (on) next.add(index)
      else next.delete(index)
      return next
    })

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <Breadcrumb items={[{ label: 'Gyakorló vizsgák', to: '/vizsgak' }, { label: name }]} />
      <PageTitle className="mt-4">Készen állsz?</PageTitle>

      {locked && <ExamLock reason={lockReason} />}

      {running && (
        <Banner
          kind="info"
          title="Fut egy próbálkozásod"
          className="mt-6"
          data-testid="running-attempt"
          action={<ButtonLink to={`/vizsgak/${exam.id}/fut?proba=${running.id}`}>Folytatás</ButtonLink>}
        >
          {runningAttempt.data ? `Ez a próbálkozás ${MODE_LABEL[runningAttempt.data.mode]} módú. ` : ''}
          Új indítás helyett ezt tudod folytatni.
        </Banner>
      )}

      <div className="mt-8 flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-1 basis-120 flex-col gap-6">
          <Panel>
            <ChoiceGroup legend="Hogyan szeretnéd?">
              <RadioField
                name="mode"
                checked={mode === 'exam'}
                onChange={() => setMode('exam')}
                label={
                  <>
                    <strong className="block">Vizsgahelyzet</strong>
                    <span className="text-15 text-ink-soft">
                      {exam.minutes} perc, az idő nem állítható meg. A végén automatikus beadás. Olyan, mint az igazi.
                    </span>
                  </>
                }
              />
              <RadioField
                name="mode"
                checked={mode === 'practice'}
                onChange={() => setMode('practice')}
                label={
                  <>
                    <strong className="block">Gyakorlás időkorlát nélkül</strong>
                    <span className="text-15 text-ink-soft">Az idő csak mérve van, és a feladatsort akkor adod be, amikor elkészültél.</span>
                  </>
                }
              />
            </ChoiceGroup>
            {mismatch && (
              <p className="mt-4 text-15 font-semibold" data-testid="mode-mismatch">
                A futó próbálkozásod {MODE_LABEL[mismatch]} módú, ezért az indítás azt folytatja, nem a most választott módot.
              </p>
            )}
          </Panel>

          <Panel>
            <CardTitle as="h2">Mielőtt elindítod</CardTitle>
            <ul className="mt-3 flex flex-col gap-3">
              {CHECKLIST.map((item, index) => (
                <li key={item.label}>
                  <CheckboxField
                    label={item.label}
                    hint={'hint' in item ? item.hint : undefined}
                    checked={checked.has(index)}
                    onChange={(e) => toggle(index, e.target.checked)}
                  />
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <Panel as="aside" kind="highlight" aria-labelledby="vizsga-nev" className="w-full md:w-96 md:flex-none">
          <CardTitle id="vizsga-nev" as="h2">
            {name}
          </CardTitle>
          <p className="mt-1 text-15 text-ink-soft">Digitális kultúra, gyakorlati vizsga</p>
          <ul className="mt-4">
            {exam.parts.map((part) => (
              <li key={part.id} className="flex items-center gap-3 border-t border-grid py-2.5 text-15">
                <Icon name={EXAM_PARTS[exam.level].find((fact) => fact.key === part.key)?.icon ?? 'file'} className="text-ink-soft" />
                <span className="min-w-0 flex-1">{part.name}</span>
                <span className="whitespace-nowrap text-ink-soft">{part.minutes} perc</span>
                <span className="w-16 text-right font-semibold whitespace-nowrap">{part.points} pont</span>
              </li>
            ))}
            <li className="flex justify-between gap-3 border-t border-ink py-2.5 text-16 font-bold">
              <span>Összesen</span>
              <span>
                {exam.minutes} perc, {exam.points} pont
              </span>
            </li>
          </ul>

          {exam.source_zip && (
            <div className="mt-4">
              <FileChip name={exam.source_zip.name} size={formatBytes(exam.source_zip.size)} href={exam.source_zip.url} />
            </div>
          )}
          {start.isError && <StartDenied error={start.error} />}
          <Button
            size="lg"
            icon="play"
            fullWidth
            busy={start.isPending}
            busyLabel="Indítás…"
            disabled={locked}
            onClick={() => start.mutate()}
            className="mt-5"
          >
            {running ? 'Folytatás' : 'Indítás'}
          </Button>
          <p className="mt-3 text-14 leading-relaxed text-ink-soft">
            Az indítás után a számláló fut. Megszakadt kapcsolat esetén ott folytathatod, ahol abbahagytad.
          </p>
        </Panel>
      </div>
    </main>
  )
}
