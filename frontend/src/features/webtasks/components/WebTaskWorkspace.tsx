import { useEffect, useMemo, useState } from 'react'
import { userKeyOf, userStorageKey } from '../../../shared/domain/userStorage'
import { isStringRecord, usePersistentState } from '../../../shared/hooks/usePersistentState'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { FileChip } from '../../../shared/ui/Dropzone'
import { formatBytes, pointsLabel } from '../../../shared/ui/format'
import { Panel } from '../../../shared/ui/Panel'
import { TaskBrief } from '../../../shared/ui/TaskBrief'
import type { UnlockedTaskDetail, WebTaskInfo } from '../../../types'
import { useAuth } from '../../auth/context'
import { CodeEditor } from '../../workspace/components/CodeEditor'
import { previewDocument, runWebChecks } from '../checks'

/**
 * Weboldal feladat: HTML és CSS fájlok a sötét szerkesztőben, mellette világos
 * böngészőkeretben az előnézet, alatta az ellenőrzőlista. Minden a böngészőben
 * történik; az előnézet homokozóban fut, szkript nélkül.
 */
export function WebTaskWorkspace({ task, info }: { task: UnlockedTaskDetail; info: WebTaskInfo }) {
  const { user } = useAuth()
  // A kód a böngészőben megmarad (felhasználónként és feladatonként), újratöltés után is.
  const [stored, storeFiles] = usePersistentState<Record<string, string>>(userStorageKey('practice', userKeyOf(user), 'web', task.id), {}, isStringRecord)
  const [files, setFiles] = useState<ReadonlyMap<string, string>>(() => new Map(info.files.map((file) => [file.name, stored[file.name] ?? file.content])))
  useEffect(() => {
    storeFiles(Object.fromEntries(files))
  }, [files, storeFiles])
  const [active, setActive] = useState(info.files[0]?.name ?? '')
  // Az előnézet és az ellenőrzés a mentett állapotból dolgozik, nem minden leütésre frissül.
  const [saved, setSaved] = useState(files)

  const current = info.files.find((file) => file.name === active) ?? info.files[0]
  const htmlFiles = info.files.filter((file) => file.language === 'html')
  const previewName = current?.language === 'html' ? current.name : (htmlFiles[0]?.name ?? '')
  const results = useMemo(() => runWebChecks(info, saved), [info, saved])
  const preview = useMemo(() => previewDocument(saved, previewName), [saved, previewName])
  const earned = results.reduce((sum, result) => sum + (result.state === 'ok' ? result.check.points : 0), 0)
  const total = info.checks.reduce((sum, check) => sum + check.points, 0)
  const dirty = files !== saved
  // Mentés után a pontszám a gomb mellett is megjelenik (keskeny kijelzőn az ellenőrzőlista messze van).
  const [justSaved, setJustSaved] = useState(false)

  function save() {
    setSaved(files)
    setJustSaved(true)
  }

  function showPreview() {
    const target = document.getElementById('web-elonezet')
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    target?.focus()
  }

  return (
    <main className="mx-auto flex w-full max-w-work flex-wrap items-start gap-6 px-4 py-6 md:px-6">
      <TaskBrief
        task={task}
        badges={
          <>
            <Badge kind="lang">HTML és CSS</Badge>
            {info.exam_reference && <Badge kind="neutral">{info.exam_reference}</Badge>}
          </>
        }
        extras={
          task.sources && task.sources.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {task.sources.map((file) => (
                <FileChip key={file.name} name={file.name} size={formatBytes(file.size)} href={file.url} />
              ))}
            </div>
          )
        }
        checklistTitle="Ellenőrzés"
        score={pointsLabel(earned, total)}
        checks={results.map((result) => ({
          id: result.check.id,
          state: result.state,
          text: result.check.label,
          points: result.state === 'ok' ? result.check.points : 0,
          maxPoints: result.check.points,
          found: result.found,
          hint: result.state === 'ok' ? null : result.check.hint,
        }))}
      />

      <div className="flex min-w-0 flex-1 basis-120 flex-col gap-6">
        <Panel kind="work" pad="none" as="section" aria-label="Szerkesztő" className="overflow-hidden">
          <div role="tablist" aria-label="Fájlok" className="on-dark flex flex-wrap gap-1 bg-code-deep px-3 pt-2">
            {info.files.map((file) => {
              const selected = file.name === current?.name
              return (
                <button
                  key={file.name}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(file.name)}
                  className={cx(
                    'min-h-11 rounded-t-md px-4 font-mono text-14',
                    selected ? 'bg-code text-code-text' : 'text-code-soft hover:bg-code-hover hover:text-code-text',
                  )}
                >
                  {file.name}
                </button>
              )
            })}
          </div>
          <div className="h-90">
            {current && (
              <CodeEditor
                key={current.name}
                language={current.language}
                initialValue={files.get(current.name) ?? ''}
                onChange={(value) => setFiles((existing) => new Map(existing).set(current.name, value))}
              />
            )}
          </div>
          <div className="on-dark flex flex-wrap items-center gap-3 border-t border-code-line bg-code px-5 py-3">
            <Button icon="play" onClick={save}>
              Mentés és előnézet
            </Button>
            <span className="text-14 text-code-soft" role="status" data-testid="web-save-status">
              {dirty
                ? 'Vannak nem mentett módosításaid.'
                : justSaved
                  ? `Mentve. Az ellenőrzés: ${pointsLabel(earned, total)}.`
                  : 'Az előnézet a mentett kódodat mutatja.'}
            </span>
            {justSaved && !dirty && (
              <Button variant="dark" onClick={showPreview} className="lg:hidden">
                Előnézet megnézése
              </Button>
            )}
          </div>
        </Panel>

        <Panel pad="none" as="section" aria-label="Előnézet" id="web-elonezet" tabIndex={-1} className="overflow-hidden">
          <div className="flex items-center gap-3 border-b border-line bg-headrow px-4 py-2.5">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="size-2.5 rounded-full bg-muted" />
              <span className="size-2.5 rounded-full bg-muted" />
              <span className="size-2.5 rounded-full bg-muted" />
            </span>
            <span className="rounded-sm bg-sheet px-3 py-1 font-mono text-13 text-ink-soft">{previewName}</span>
          </div>
          <iframe title={`Előnézet: ${previewName}`} sandbox="" srcDoc={preview} className="block h-90 w-full bg-sheet" />
        </Panel>
      </div>
    </main>
  )
}
