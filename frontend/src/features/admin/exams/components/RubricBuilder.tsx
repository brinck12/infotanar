import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { httpStatus, mezoHibak } from '../../../../shared/api/errors'
import { Badge } from '../../../../shared/ui/Badge'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { ChoiceGroup, Field, RadioField, SelectField, TextAreaField } from '../../../../shared/ui/Form'
import { Panel } from '../../../../shared/ui/Panel'
import { EmptyState, LoadError, Skeleton } from '../../../../shared/ui/States'
import { Table, Td, Th, Tr } from '../../../../shared/ui/Table'
import { CardTitle } from '../../../../shared/ui/Text'
import { IconButton } from '../../catalog/components/ChildList'
import { MutationError } from '../../catalog/components/QueryState'
import { adminExamKeys, createRubricItem, deleteRubricItem, reorderRubricItems, rubricQuery, type RubricItemPayload } from '../api'

/** A vizsgálat típusai fájlfajtánként (FRONTEND.md 9.). */
const CHECK_TYPES = [
  { value: 'page_setup', label: 'Oldalbeállítás' },
  { value: 'character_format', label: 'Karakterformázás' },
  { value: 'paragraph_format', label: 'Bekezdés' },
  { value: 'style', label: 'Stílus' },
  { value: 'document_table', label: 'Táblázat a dokumentumban' },
  { value: 'image', label: 'Kép' },
  { value: 'section', label: 'Szakasz és hasáb' },
  { value: 'tab_stop', label: 'Tabulátor' },
  { value: 'cell_value', label: 'Cellaérték' },
  { value: 'cell_formula', label: 'Képlet' },
  { value: 'number_format', label: 'Számformátum' },
  { value: 'sort_order', label: 'Rendezés' },
  { value: 'chart', label: 'Diagram' },
  { value: 'print_area', label: 'Nyomtatási terület' },
  { value: 'slide', label: 'Dia (méret, háttér, áttűnés)' },
  { value: 'animation', label: 'Animáció' },
  { value: 'web', label: 'Weboldal (HTML, CSS)' },
  { value: 'manual', label: 'Összevetés a mintával' },
] as const

const EMPTY: RubricItemPayload = { label: '', group: '', check_type: 'character_format', property: '', expected: '', points: 1, mode: 'auto', hint: null }
const FIELDS = ['label', 'group', 'check_type', 'property', 'expected', 'points', 'mode', 'hint'] as const

/**
 * Értékelőlap-szerkesztő a fájlalapú feladatokhoz: a vizsga pontjai tételenként,
 * mindegyiknél mit vizsgálunk, mennyit ér, és automatikus vagy kézi-e.
 */
export function RubricBuilder({ exerciseId }: { exerciseId: number }) {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminExamKeys.rubric(exerciseId) })
  const items = useQuery(rubricQuery(exerciseId))
  const [form, setForm] = useState<RubricItemPayload>(EMPTY)
  const set = <K extends keyof RubricItemPayload>(key: K, value: RubricItemPayload[K]) => setForm((current) => ({ ...current, [key]: value }))
  const create = useMutation({
    mutationFn: () => createRubricItem(exerciseId, { ...form, hint: form.hint?.trim() || null }),
    onSuccess: () => setForm((current) => ({ ...EMPTY, group: current.group, check_type: current.check_type })),
    onSettled: refresh,
  })
  const remove = useMutation({ mutationFn: deleteRubricItem, onSettled: refresh })
  const reorder = useMutation({ mutationFn: (ids: number[]) => reorderRubricItems(exerciseId, ids), onSettled: refresh })
  const errors = mezoHibak(create.error)
  const busy = remove.isPending || reorder.isPending

  if (items.isPending) return <Skeleton lines={4} label="Értékelőlap betöltése…" />
  if (items.isError) {
    return httpStatus(items.error) === 404 ? (
      <Banner kind="warn" title="Az értékelőlap a szerveren még nincs bekapcsolva">
        A fájlalapú feladatok (táblázat, szöveg, bemutató) pontozásához az értékelőlap-végpontok kellenek. Kódfeladatnál a pontozást a
        tesztesetek adják, ott erre nincs szükség.
      </Banner>
    ) : (
      <LoadError error={items.error} onRetry={() => void items.refetch()} />
    )
  }

  const total = items.data.reduce((sum, item) => sum + item.points, 0)

  function move(index: number, delta: -1 | 1) {
    const ids = (items.data ?? []).map((item) => item.id)
    const [moved] = ids.splice(index, 1)
    if (moved === undefined) return
    ids.splice(index + delta, 0, moved)
    reorder.mutate(ids)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    create.mutate()
  }

  return (
    <div className="flex flex-col gap-5" data-testid="rubric-builder">
      <Panel>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <CardTitle as="h2">Értékelési pontok</CardTitle>
          <span className="text-15 text-ink-soft">Összesen {total} pont</span>
        </div>
        <div className="mt-3">
          <MutationError error={remove.error ?? reorder.error} />
          {items.data.length === 0 ? (
            <EmptyState title="Még nincs értékelési pont">Vedd fel az elsőt lent, a hivatalos útmutató pontjai szerint.</EmptyState>
          ) : (
            <Table caption="Az értékelőlap pontjai">
              <thead>
                <tr>
                  <Th>Értékelési pont</Th>
                  <Th>Csoport</Th>
                  <Th>Mit vizsgálunk</Th>
                  <Th align="right">Pont</Th>
                  <Th>Mód</Th>
                  <Th>
                    <span className="sr-only">Műveletek</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {items.data.map((item, index) => (
                  <Tr key={item.id}>
                    <Td className="font-semibold">{item.label}</Td>
                    <Td>{item.group}</Td>
                    <Td className="font-mono text-14">
                      {item.property}
                      {item.expected ? `: ${item.expected}` : ''}
                    </Td>
                    <Td align="right">{item.points}</Td>
                    <Td>{item.mode === 'manual' ? <Badge kind="manual">Kézi</Badge> : <Badge kind="neutral">Automatikus</Badge>}</Td>
                    <Td>
                      <span className="flex items-center justify-end gap-1">
                        <IconButton icon="chevron-up" label={`${item.label} feljebb`} disabled={busy || index === 0} onClick={() => move(index, -1)} />
                        <IconButton
                          icon="chevron-down"
                          label={`${item.label} lejjebb`}
                          disabled={busy || index === items.data.length - 1}
                          onClick={() => move(index, 1)}
                        />
                        <IconButton icon="trash" label={`${item.label} törlése`} disabled={busy} onClick={() => remove.mutate(item.id)} danger />
                      </span>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </Panel>

      <Panel>
        <CardTitle as="h2">Új értékelési pont</CardTitle>
        <form onSubmit={submit} noValidate className="mt-4 flex flex-col gap-5" aria-label="Új értékelési pont">
          <MutationError error={create.error} fields={FIELDS} />
          <div className="flex flex-wrap gap-5">
            <Field className="flex-1 basis-80" label="Megnevezés" value={form.label} onChange={(e) => set('label', e.target.value)} error={errors.label} />
            <Field className="w-60" label="Csoport" value={form.group} onChange={(e) => set('group', e.target.value)} error={errors.group} />
          </div>
          <div className="flex flex-wrap gap-5">
            <SelectField
              className="w-72"
              label="Mit vizsgáljunk?"
              options={CHECK_TYPES}
              value={form.check_type}
              onChange={(e) => set('check_type', e.target.value)}
              error={errors.check_type}
            />
            <Field className="w-56" label="Tulajdonság" value={form.property} onChange={(e) => set('property', e.target.value)} error={errors.property} />
            <Field
              className="flex-1 basis-56"
              label="Elvárt érték"
              value={form.expected}
              onChange={(e) => set('expected', e.target.value)}
              error={errors.expected}
            />
            <Field
              className="w-24"
              label="Pont"
              type="number"
              min={1}
              value={form.points}
              onChange={(e) => set('points', Number(e.target.value))}
              error={errors.points}
            />
          </div>
          <ChoiceGroup legend="Az ellenőrzés módja">
            <RadioField name="rubric-mode" label="Automatikus ellenőrzés" checked={form.mode === 'auto'} onChange={() => set('mode', 'auto')} />
            <RadioField
              name="rubric-mode"
              label="Kézi ellenőrzés (a tanuló jelöli)"
              checked={form.mode === 'manual'}
              onChange={() => set('mode', 'manual')}
            />
          </ChoiceGroup>
          <TextAreaField
            label="Tipp a hibás megoldáshoz"
            hint="Mondja meg, mi történt és mit tegyen a tanuló."
            rows={2}
            value={form.hint ?? ''}
            onChange={(e) => set('hint', e.target.value)}
            error={errors.hint}
          />
          <div>
            <Button type="submit" variant="secondary" icon="plus" busy={create.isPending} busyLabel="Hozzáadás…">
              Pont hozzáadása
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}
