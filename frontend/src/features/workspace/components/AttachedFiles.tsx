import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { hibaUzenet } from '../../../shared/api/errors'
import { formatFileSize } from '../../../shared/domain/fileSize'
import type { TaskFile } from '../../../types'
import { downloadTaskFile, taskFilePreviewQuery } from '../api'

/**
 * A feladathoz mellékelt adatfájlok (érettségi-stílusú feladatoknál a program
 * ezeket nyitja meg név szerint). Letöltés és az első sorok előnézete.
 */
export function AttachedFiles({ taskId, files }: { taskId: number; files: TaskFile[] }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-5" data-testid="attached-files">
      <h2 className="mb-1 text-sm font-semibold text-slate-200">Mellékelt fájlok</h2>
      <p className="mb-3 text-xs text-slate-400">
        A program ezeket a fájlokat a saját nevükön nyithatja meg: futtatáskor ugyanabban a mappában lesznek, mint a megoldásod.
      </p>
      <ul className="space-y-3">
        {files.map((file) => (
          <AttachedFile key={file.name} taskId={taskId} file={file} />
        ))}
      </ul>
    </div>
  )
}

function AttachedFile({ taskId, file }: { taskId: number; file: TaskFile }) {
  const [previewing, setPreviewing] = useState(false)
  const download = useMutation({ mutationFn: () => downloadTaskFile(taskId, file.name) })

  return (
    <li data-testid="attached-file">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-mono text-slate-100">{file.name}</span>
        <span className="text-xs text-slate-400">{formatFileSize(file.size)}</span>
        <div className="ml-auto flex gap-2 text-xs">
          <button
            type="button"
            aria-pressed={previewing}
            onClick={() => setPreviewing((open) => !open)}
            className="rounded px-2 py-1 text-sky-300 hover:bg-slate-800"
          >
            {previewing ? 'Előnézet elrejtése' : 'Előnézet'}
          </button>
          <button
            type="button"
            disabled={download.isPending}
            onClick={() => download.mutate()}
            className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100 hover:bg-slate-700 disabled:opacity-50"
          >
            Letöltés
          </button>
        </div>
      </div>

      {download.isError && (
        <p role="alert" className="mt-1 text-xs text-red-300">
          {hibaUzenet(download.error)}
        </p>
      )}
      {previewing && <FilePreviewBlock taskId={taskId} name={file.name} />}
    </li>
  )
}

function FilePreviewBlock({ taskId, name }: { taskId: number; name: string }) {
  // A tartalmat csak nyitáskor kérjük le, így a feladat betöltése nem függ a fájlok méretétől.
  const preview = useQuery(taskFilePreviewQuery(taskId, name))

  if (preview.isPending) return <p className="mt-2 text-xs text-slate-400">Betöltés…</p>
  if (preview.isError) {
    return (
      <p role="alert" className="mt-2 text-xs text-red-300">
        {hibaUzenet(preview.error)}
      </p>
    )
  }
  if (preview.data === null) {
    return <p className="mt-2 text-xs text-slate-400">Ez a fájl nem UTF-8 szöveg, ezért nincs előnézete. Töltsd le a megnyitásához.</p>
  }

  return (
    <>
      <pre
        aria-label={`${name} első sorai`}
        className="mt-2 max-h-56 overflow-auto rounded border border-slate-800 bg-slate-950 p-2 font-mono text-xs whitespace-pre text-slate-300"
      >
        {preview.data.text || '(üres)'}
      </pre>
      {preview.data.truncated && <p className="mt-1 text-xs text-slate-400">Csak az első sorok láthatók; a teljes fájl letölthető.</p>}
    </>
  )
}
