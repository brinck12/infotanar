import { useMemo, useState } from 'react'
import { Badge, LevelBadge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { cx } from '../../../shared/ui/cx'
import { FileChip } from '../../../shared/ui/Dropzone'
import { formatBytes, pointsLabel } from '../../../shared/ui/format'
import { Panel } from '../../../shared/ui/Panel'
import { Prose } from '../../../shared/ui/Prose'
import { RubricItem } from '../../../shared/ui/RubricItem'
import { CardTitle } from '../../../shared/ui/Text'
import type { UnlockedTaskDetail, WebTaskInfo } from '../../../types'
import { CodeEditor } from '../../workspace/components/CodeEditor'
import { previewDocument, runWebChecks } from '../checks'

/**
 * Weboldal feladat: HTML és CSS fájlok a sötét szerkesztőben, mellette világos
 * böngészőkeretben az előnézet, alatta az ellenőrzőlista. Minden a böngészőben
 * történik; az előnézet homokozóban fut, szkript nélkül.
 */
export function WebTaskWorkspace({ task, info }: { task: UnlockedTaskDetail; info: WebTaskInfo }) {
  const [files, setFiles] = useState<ReadonlyMap<string, string>>(() => new Map(info.files.map((file) => [file.name, file.content])))
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

  return (
    <main className="mx-auto flex w-full max-w-work flex-wrap items-start gap-6 px-4 py-6 md:px-6">
      <Panel as="section" pad="xl" aria-label="Feladat leírása" className="min-w-0 flex-1 basis-100 lg:max-w-form">
        <h1 className="font-serif text-32 leading-tight font-semibold tracking-tight">{task.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <LevelBadge level={task.level} />
          <Badge kind="lang">HTML és CSS</Badge>
          {info.exam_reference && <Badge kind="neutral">{info.exam_reference}</Badge>}
        </div>
        <Prose markdown={task.description} className="mt-6" />

        {task.sources && task.sources.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {task.sources.map((file) => (
              <FileChip key={file.name} name={file.name} size={formatBytes(file.size)} href={file.url} />
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
          <CardTitle>Ellenőrzés</CardTitle>
          <span className="text-15 font-semibold" aria-live="polite">
            {pointsLabel(earned, total)}
          </span>
        </div>
        <ul className="mt-2" aria-live="polite">
          {results.map((result) => (
            <RubricItem
              key={result.check.id}
              state={result.state}
              text={result.check.label}
              points={result.state === 'ok' ? result.check.points : 0}
              maxPoints={result.check.points}
              found={result.found}
              hint={result.state === 'ok' ? null : result.check.hint}
            />
          ))}
        </ul>
      </Panel>

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
            <Button icon="play" onClick={() => setSaved(files)}>
              Mentés és előnézet
            </Button>
            <span className="text-14 text-code-soft" aria-live="polite">
              {dirty ? 'Vannak nem mentett módosításaid.' : 'Az előnézet a mentett kódodat mutatja.'}
            </span>
          </div>
        </Panel>

        <Panel pad="none" as="section" aria-label="Előnézet" className="overflow-hidden">
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
