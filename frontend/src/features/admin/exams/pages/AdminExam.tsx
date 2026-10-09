import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mezoHibak } from '../../../../shared/api/errors'
import { EXAM_PARTS } from '../../../../shared/domain/exam'
import { LEVEL_LABEL } from '../../../../shared/domain/labels'
import { Badge, type BadgeKind } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { FileChip } from '../../../../shared/ui/Dropzone'
import { formatBytes } from '../../../../shared/ui/format'
import { Field, SelectField, Switch } from '../../../../shared/ui/Form'
import { Table, Td, Th, Tr } from '../../../../shared/ui/Table'
import type { Level } from '../../../../types'
import { IconButton } from '../../catalog/components/ChildList'
import { MutationError, QueryState } from '../../catalog/components/QueryState'
import { SavedNote } from '../../catalog/components/SavedNote'
import { AdminShell, Section } from '../../components/AdminShell'
import {
  addExamPart,
  adminExamKeys,
  adminExamQuery,
  removeExamPart,
  reorderExamParts,
  updateExam,
  type AdminExam as Exam,
  type ExamPartPayload,
  type ExamPayload,
  type RubricStatus,
} from '../api'

const LEVEL_OPTIONS = (Object.keys(LEVEL_LABEL) as Level[]).map((level) => ({ value: level, label: LEVEL_LABEL[level] }))

const STATUS: Readonly<Record<RubricStatus, { kind: BadgeKind; label: string }>> = {
  complete: { kind: 'ok', label: 'Értékelőlap kész' },
  incomplete: { kind: 'bad', label: 'Értékelőlap hiányos' },
  tests: { kind: 'ok', label: 'Tesztesetek kész' },
}

/** Gyakorló vizsga szerkesztése: adatok, a részek sorrendben, fájlok. Hiányos értékelőlappal nem tehető közzé. */
export function AdminExam() {
  const id = Number(useParams().examId)
  const exam = useQuery(adminExamQuery(id))

  return <QueryState query={exam}>{(data) => <ExamEditor key={data.id} exam={data} />}</QueryState>
}

function ExamEditor({ exam }: { exam: Exam }) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminExamKeys.all })
  const [form, setForm] = useState<ExamPayload>({
    title: exam.title,
    level: exam.level,
    minutes: exam.minutes,
    points: exam.points,
    is_published: exam.is_published,
    timed_mode: exam.timed_mode,
  })
  const set = <K extends keyof ExamPayload>(key: K, value: ExamPayload[K]) => setForm((current) => ({ ...current, [key]: value }))
  const save = useMutation({ mutationFn: (payload: ExamPayload) => updateExam(exam.id, payload), onSuccess: refresh })
  const reorder = useMutation({ mutationFn: (ids: number[]) => reorderExamParts(exam.id, ids), onSettled: refresh })
  const remove = useMutation({ mutationFn: removeExamPart, onSettled: refresh })
  const errors = mezoHibak(save.error)
  const incomplete = exam.parts.filter((part) => part.rubric_status === 'incomplete')
  const partsBusy = reorder.isPending || remove.isPending

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate(form)
  }

  function move(index: number, delta: -1 | 1) {
    const ids = exam.parts.map((part) => part.id)
    const [moved] = ids.splice(index, 1)
    if (moved === undefined) return
    ids.splice(index + delta, 0, moved)
    reorder.mutate(ids)
  }

  return (
    <AdminShell
      crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Gyakorló vizsgák', to: '/admin/vizsgak' }, { label: exam.title }]}
      title="Gyakorló vizsga szerkesztése"
    >
      {incomplete.length > 0 && (
        <Banner kind="warn" title="Közzététel előtt">
          {incomplete.map((part) => (
            <p key={part.id}>
              A(z) {part.order}. rész értékelőlapja hiányos: hiányzik {part.missing_points} pont. A tanuló ezt a részt csak önértékeléssel tudná
              megoldani.{' '}
              {part.exercise_id !== null && <Link to={`/admin/tananyag/feladatok/${part.exercise_id}`}>Értékelőlap megnyitása</Link>}
            </p>
          ))}
        </Banner>
      )}

      <Section title="A vizsga adatai" aside={<SavedNote mutation={save} />}>
        <MutationError error={save.error} fields={['title', 'level', 'minutes', 'points', 'is_published', 'timed_mode']} />
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-5">
            <Field className="flex-1 basis-72" label="Megnevezés" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
            <SelectField
              className="w-44"
              label="Szint"
              options={LEVEL_OPTIONS}
              value={form.level}
              onChange={(e) => set('level', e.target.value as Level)}
              error={errors.level}
            />
            <Field
              className="w-40"
              label="Időtartam (perc)"
              type="number"
              min={1}
              value={form.minutes}
              onChange={(e) => set('minutes', Number(e.target.value))}
              error={errors.minutes}
            />
            <Field
              className="w-36"
              label="Összpontszám"
              type="number"
              min={1}
              value={form.points}
              onChange={(e) => set('points', Number(e.target.value))}
              error={errors.points}
            />
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-2">
            <Switch
              label="Közzétéve"
              checked={form.is_published}
              disabled={incomplete.length > 0 && !form.is_published}
              onChange={(checked) => set('is_published', checked)}
            />
            <Switch label="Vizsgahelyzet engedélyezése (időzítő)" checked={form.timed_mode} onChange={(checked) => set('timed_mode', checked)} />
          </div>
          {incomplete.length > 0 && (
            <p className="text-14 leading-relaxed text-ink-soft">Amíg egy értékelőlap hiányos, a vizsga nem tehető közzé.</p>
          )}
          <div>
            <Button type="submit" busy={save.isPending} busyLabel="Mentés…">
              Mentés
            </Button>
          </div>
        </form>
      </Section>

      <Section title="Részek">
        <MutationError error={reorder.error ?? remove.error} />
        {exam.parts.length === 0 ? (
          <p className="text-15 text-ink-soft">Ehhez a vizsgához még nincs rész.</p>
        ) : (
          <Table caption="A vizsga részei sorrendben">
            <thead>
              <tr>
                <Th>Rész</Th>
                <Th>Feladat</Th>
                <Th align="right">Pont</Th>
                <Th align="right">Perc</Th>
                <Th>Állapot</Th>
                <Th>
                  <span className="sr-only">Műveletek</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {exam.parts.map((part, index) => (
                <Tr key={part.id}>
                  <Td className="font-semibold">
                    {part.order}. {part.name}
                  </Td>
                  <Td>
                    {part.exercise_id !== null ? (
                      <Link to={`/admin/tananyag/feladatok/${part.exercise_id}`} className="inline-flex min-h-8 items-center">
                        {part.exercise_title ?? `#${part.exercise_id}`}
                      </Link>
                    ) : (
                      <span className="text-ink-soft">Nincs hozzárendelve</span>
                    )}
                  </Td>
                  <Td align="right">{part.points}</Td>
                  <Td align="right">{part.minutes}</Td>
                  <Td>
                    <Badge kind={STATUS[part.rubric_status].kind}>{STATUS[part.rubric_status].label}</Badge>
                  </Td>
                  <Td>
                    {/* Billentyűzettel is működő sorrendezés: fel és le gombok a húzás helyett. */}
                    <span className="flex items-center justify-end gap-1">
                      <IconButton icon="chevron-up" label={`${part.name} feljebb`} disabled={partsBusy || index === 0} onClick={() => move(index, -1)} />
                      <IconButton
                        icon="chevron-down"
                        label={`${part.name} lejjebb`}
                        disabled={partsBusy || index === exam.parts.length - 1}
                        onClick={() => move(index, 1)}
                      />
                      <IconButton icon="trash" label={`${part.name} eltávolítása`} disabled={partsBusy} onClick={() => remove.mutate(part.id)} danger />
                    </span>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
        <AddPart exam={exam} onAdded={refresh} />
      </Section>

      <Section title="Fájlok">
        {exam.files.length === 0 ? (
          <p className="text-15 text-ink-soft">Még nincs feltöltött fájl.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {exam.files.map((file) => (
              <FileChip key={file.name} name={file.name} size={formatBytes(file.size)} href={file.url} />
            ))}
          </div>
        )}
        <p className="mt-4 max-w-prose text-14 leading-relaxed text-ink-soft">
          A forrásfájlokat a tanuló egyetlen zipben tölti le. A hivatalos feladatlapra és útmutatóra hivatkozunk, a szerzői jogot az Oktatási
          Hivatal tartja.
        </p>
      </Section>
    </AdminShell>
  )
}

function AddPart({ exam, onAdded }: { exam: Exam; onAdded: () => unknown }) {
  const options = EXAM_PARTS[exam.level].map((part) => ({ value: part.key, label: part.name }))
  const empty = (): ExamPartPayload => {
    const first = EXAM_PARTS[exam.level][0]
    return { key: first?.key ?? 'programozas', name: first?.name ?? '', exercise_id: null, points: first?.points ?? 0, minutes: first?.minutes ?? 0 }
  }
  const [form, setForm] = useState<ExamPartPayload>(empty)
  const add = useMutation({
    mutationFn: () => addExamPart(exam.id, form),
    onSuccess: async () => {
      setForm(empty())
      await onAdded()
    },
  })
  const errors = mezoHibak(add.error)

  function choose(key: string) {
    const part = EXAM_PARTS[exam.level].find((item) => item.key === key)
    if (part) setForm((current) => ({ ...current, key: part.key, name: part.name, points: part.points, minutes: part.minutes }))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    add.mutate()
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Rész hozzáadása" className="mt-5 border-t border-grid pt-5">
      <MutationError error={add.error} fields={['key', 'name', 'exercise_id', 'points', 'minutes']} />
      <div className="flex flex-wrap items-start gap-4">
        <SelectField className="w-72" label="Vizsgarész" options={options} value={form.key} onChange={(e) => choose(e.target.value)} error={errors.key} />
        <Field
          className="w-48"
          label="Feladat azonosítója"
          type="number"
          min={1}
          hint="A katalógusbeli feladat száma."
          value={form.exercise_id ?? ''}
          onChange={(e) => setForm((current) => ({ ...current, exercise_id: e.target.value === '' ? null : Number(e.target.value) }))}
          error={errors.exercise_id}
        />
        <Field
          className="w-28"
          label="Pont"
          type="number"
          min={0}
          value={form.points}
          onChange={(e) => setForm((current) => ({ ...current, points: Number(e.target.value) }))}
          error={errors.points}
        />
        <Field
          className="w-28"
          label="Perc"
          type="number"
          min={0}
          value={form.minutes}
          onChange={(e) => setForm((current) => ({ ...current, minutes: Number(e.target.value) }))}
          error={errors.minutes}
        />
        <div className="pt-7.5">
          <Button type="submit" variant="secondary" icon="plus" busy={add.isPending} busyLabel="Hozzáadás…" className="min-h-12">
            Rész hozzáadása
          </Button>
        </div>
      </div>
    </form>
  )
}
