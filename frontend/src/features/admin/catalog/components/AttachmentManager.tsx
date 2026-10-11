import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { FileChip } from '../../../../shared/ui/Dropzone'
import { formatBytes } from '../../../../shared/ui/format'
import { Field, SelectField } from '../../../../shared/ui/Form'
import { Panel } from '../../../../shared/ui/Panel'
import { EmptyState, LoadError, Skeleton } from '../../../../shared/ui/States'
import { Table, Td, Th, Tr } from '../../../../shared/ui/Table'
import { CardTitle } from '../../../../shared/ui/Text'
import { attachmentsQuery, adminCatalogKeys, deleteAttachment, testCasesQuery, uploadAttachment, type AdminAttachment, type AttachmentRole } from '../api'
import { MutationError } from './QueryState'
import { IconButton } from './ChildList'

const ROLE_LABEL: Readonly<Record<AttachmentRole, string>> = {
  source: 'Forrásfájl (a tanuló letöltheti)',
  input: 'Teszteset bemeneti fájlja (rejtett)',
  sample_image: 'Mintakép (a tanulónak)',
  sample_solution: 'Mintamegoldás (csak adminnak)',
  source_zip: 'Forrásfájlok zipben',
}

const ROLE_HINT: Readonly<Record<AttachmentRole, string>> = {
  source: 'Pl. a feladathoz adott adatfájl. A fájlnév betűből, számból, pontból, kötőjelből és aláhúzásból állhat.',
  input: 'Az azonos nevű forrásfájl helyére lép az adott tesztesetnél; a tanuló nem látja.',
  sample_image: 'A kész munka képe „Minta” néven jelenik meg a tanulónak.',
  sample_solution: 'Hibátlan megoldás az értékelőlap kipróbálásához; a tanulóhoz soha nem kerül ki.',
  source_zip: '',
}

/** Egy feladat csatolt fájljai: lista, feltöltés szereppel, törlés. Minden típusnál ugyanez. */
export function AttachmentManager({ exerciseId, editorBased }: { exerciseId: number; editorBased: boolean }) {
  const queryClient = useQueryClient()
  const attachments = useQuery(attachmentsQuery(exerciseId))
  const testCases = useQuery({ ...testCasesQuery(exerciseId), enabled: editorBased })
  const [role, setRole] = useState<AttachmentRole>('source')
  const [file, setFile] = useState<File | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [name, setName] = useState('')
  const [testCaseId, setTestCaseId] = useState('')
  const refresh = () => queryClient.invalidateQueries({ queryKey: adminCatalogKeys.attachments(exerciseId) })

  const upload = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('Nincs kiválasztott fájl.')
      return uploadAttachment(exerciseId, { file, role, testCaseId: role === 'input' ? Number(testCaseId) : null, name: name.trim() || undefined })
    },
    onSuccess: () => {
      setFile(null)
      setName('')
      setFileKey((key) => key + 1)
    },
    onSettled: refresh,
  })
  const remove = useMutation({ mutationFn: deleteAttachment, onSettled: refresh })
  const errors = mezoHibak(upload.error)

  const roles: AttachmentRole[] = editorBased ? ['source', 'input'] : ['source', 'sample_image', 'sample_solution']
  const roleOptions = roles.map((value) => ({ value, label: ROLE_LABEL[value] }))
  const testCaseOptions = [
    { value: '', label: 'Válassz tesztesetet…' },
    ...(testCases.data ?? []).map((tc) => ({ value: String(tc.id), label: `${tc.order}. teszteset${tc.is_hidden ? ' (rejtett)' : ''}` })),
  ]
  const missingFile = file === null

  function submit(e: FormEvent) {
    e.preventDefault()
    if (missingFile) return
    upload.mutate()
  }

  return (
    <div className="flex flex-col gap-5">
      <Panel>
        <CardTitle as="h2">Csatolt fájlok</CardTitle>
        <div className="mt-3">
          <MutationError error={remove.error} />
          {attachments.isPending ? (
            <Skeleton lines={3} label="Fájlok betöltése…" />
          ) : attachments.isError ? (
            <LoadError error={attachments.error} onRetry={() => void attachments.refetch()} />
          ) : attachments.data.length === 0 ? (
            <EmptyState title="Még nincs csatolt fájl">Tölts fel forrásfájlt, mintaképet vagy mintamegoldást lent.</EmptyState>
          ) : (
            <Table caption="A feladat csatolt fájljai">
              <thead>
                <tr>
                  <Th>Fájl</Th>
                  <Th>Szerep</Th>
                  <Th>Teszteset</Th>
                  <Th>
                    <span className="sr-only">Műveletek</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {attachments.data.map((item) => (
                  <Tr key={item.id}>
                    <Td>
                      <FileChip name={item.name} size={formatBytes(item.size)} href={item.url} />
                    </Td>
                    <Td>{ROLE_LABEL[item.role]}</Td>
                    <Td>{testCaseLabel(item, testCases.data)}</Td>
                    <Td>
                      <span className="flex justify-end">
                        <IconButton icon="trash" label={`${item.name} törlése`} danger disabled={remove.isPending} onClick={() => remove.mutate(item.id)} />
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
        <CardTitle as="h2">Új fájl feltöltése</CardTitle>
        <form onSubmit={submit} noValidate aria-label="Új fájl feltöltése" className="mt-4 flex flex-col gap-5">
          <MutationError error={upload.error} fields={['file', 'role', 'test_case_id', 'name']} />
          <div className="flex flex-wrap gap-5">
            <SelectField
              className="w-80"
              label="A fájl szerepe"
              options={roleOptions}
              value={role}
              onChange={(e) => setRole(e.target.value as AttachmentRole)}
              hint={ROLE_HINT[role]}
              error={errors.role}
            />
            {role === 'input' && (
              <SelectField
                className="w-64"
                label="Melyik teszteset"
                options={testCaseOptions}
                value={testCaseId}
                onChange={(e) => setTestCaseId(e.target.value)}
                error={errors.test_case_id}
              />
            )}
            <Field
              key={fileKey}
              className="flex-1 basis-72"
              label="Fájl"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              error={errors.file}
            />
            <Field
              className="w-60"
              label="Név a rendszerben"
              hint="Üresen az eredeti fájlnév marad."
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
          </div>
          {missingFile && <p className="text-14 text-ink-soft">Válassz ki egy fájlt a feltöltéshez.</p>}
          {role === 'input' && testCaseId === '' && (
            <Banner kind="info">A bemeneti fájl egy teszteset sajátja: előbb válaszd ki a tesztesetet.</Banner>
          )}
          <div>
            <Button
              type="submit"
              variant="secondary"
              icon="upload"
              busy={upload.isPending}
              busyLabel="Feltöltés…"
              disabled={missingFile || (role === 'input' && testCaseId === '')}
            >
              Fájl feltöltése
            </Button>
          </div>
        </form>
      </Panel>
    </div>
  )
}

function testCaseLabel(item: AdminAttachment, testCases: ReadonlyArray<{ id: number; order: number }> | undefined): string {
  if (item.test_case_id === null) return '–'
  const found = testCases?.find((tc) => tc.id === item.test_case_id)
  return found ? `${found.order}. teszteset` : `#${item.test_case_id}`
}
