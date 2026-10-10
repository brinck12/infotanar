import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { hibaUzenet, httpStatus } from '../../../shared/api/errors'
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
import { examQuery, startAttempt, type ExamDetail, type ExamMode } from '../api'

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

function StartForm({ exam }: { exam: ExamDetail }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<ExamMode>('exam')
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
          {start.isError && (
            <Banner kind="error" className="mt-4">
              {hibaUzenet(start.error)}
            </Banner>
          )}
          <Button size="lg" icon="play" fullWidth busy={start.isPending} busyLabel="Indítás…" onClick={() => start.mutate()} className="mt-5">
            Indítás
          </Button>
          <p className="mt-3 text-14 leading-relaxed text-ink-soft">
            Az indítás után a számláló fut. Megszakadt kapcsolat esetén ott folytathatod, ahol abbahagytad.
          </p>
        </Panel>
      </div>
    </main>
  )
}
