import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { hibaUzenet } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { Modal } from '../../../shared/ui/Modal'
import { fileTaskKeys, saveManualMarks, type FileSubmission } from '../api'

interface Props {
  submission: FileSubmission
  open: boolean
  onClose: () => void
}

/**
 * Kézi ellenőrzés: amit a program nem tud eldönteni, azt a tanuló jelöli a
 * mintával összevetve, ahogy a vizsgán a javító tanár tenné. Semmi nem megy
 * tanári sorba; a pontszám a mentés után azonnal frissül.
 */
export function ManualMarksModal({ submission, open, onClose }: Props) {
  const queryClient = useQueryClient()
  const manual = submission.items.filter((item) => item.state === 'manual' || item.manual_mark !== null)
  const [marks, setMarks] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(manual.flatMap((item) => (item.manual_mark === null ? [] : [[item.rubric_item_id, item.manual_mark]]))),
  )
  const save = useMutation({
    mutationFn: () => saveManualMarks(submission.id, marks),
    onSuccess: (updated) => {
      queryClient.setQueryData(fileTaskKeys.one(updated.id), updated)
      void queryClient.invalidateQueries({ queryKey: fileTaskKeys.forExercise(updated.exercise_id) })
      onClose()
    },
  })

  const total = manual.reduce((sum, item) => sum + item.max_points, 0)
  const earned = manual.reduce((sum, item) => sum + (marks[item.rubric_item_id] ? item.max_points : 0), 0)

  return (
    <Modal
      open={open}
      size="lg"
      title="Kézi ellenőrzés"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Később
          </Button>
          <Button busy={save.isPending} busyLabel="Mentés…" onClick={() => save.mutate()}>
            Pontok mentése
          </Button>
        </>
      }
    >
      <p className="text-ink-soft">
        Ezeket az elemeket a program nem tudja eldönteni. Hasonlítsd össze a munkád a mintával, és jelöld őszintén. A pontot te adod meg
        magadnak, ahogy a vizsgán a javító tanár tenné.
      </p>

      {(submission.sample_url || submission.preview_url) && (
        <div className="mt-4 flex flex-wrap gap-4">
          {submission.sample_url && <Preview label="Minta" src={submission.sample_url} alt="A feladat mintája" />}
          {submission.preview_url && <Preview label="A te munkád" src={submission.preview_url} alt="A feltöltött munkád előnézete" />}
        </div>
      )}

      <ul className="mt-4">
        {manual.map((item) => (
          <li key={item.rubric_item_id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-grid py-3">
            <div className="min-w-0 flex-1 basis-64">
              <p className="text-16 font-semibold">{item.label}</p>
              <p className="mt-0.5 text-14 leading-normal text-ink-soft">
                {item.hint ? `${item.hint} ` : ''}
                {item.max_points} pont.
              </p>
            </div>
            <div role="group" aria-label={item.label} className="inline-flex overflow-hidden rounded-md border border-ink">
              {[true, false].map((value, index) => {
                const pressed = marks[item.rubric_item_id] === value
                return (
                  <button
                    key={String(value)}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => setMarks((current) => ({ ...current, [item.rubric_item_id]: value }))}
                    className={cx(
                      'min-h-11 px-4 text-15 font-semibold',
                      index > 0 && 'border-l border-ink',
                      pressed ? 'bg-ink text-sheet' : 'bg-sheet text-ink hover:bg-note',
                    )}
                  >
                    {value ? 'Megvan' : 'Nincs meg'}
                  </button>
                )
              })}
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-16 font-bold" aria-live="polite">
        Eddig: {earned} pont a {total} kézi pontból
      </p>
      {save.isError && (
        <Banner kind="error" className="mt-4">
          {hibaUzenet(save.error)}
        </Banner>
      )}
    </Modal>
  )
}

function Preview({ label, src, alt }: { label: string; src: string; alt: string }) {
  return (
    <figure className="min-w-0 flex-1 basis-56">
      <figcaption className="mb-1.5 text-14 font-semibold text-ink-soft">{label}</figcaption>
      <img src={src} alt={alt} className="w-full rounded-sm border border-line" />
    </figure>
  )
}
