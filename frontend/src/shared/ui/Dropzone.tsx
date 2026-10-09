import { useId, useRef, useState, type DragEvent } from 'react'
import { Button } from './Button'
import { cx } from './cx'
import { Icon, StateIcon } from './Icon'
import { Bar } from './Progress'

export type DropzoneState =
  | { kind: 'empty' }
  | { kind: 'uploading'; name: string; percent: number }
  | { kind: 'done'; name: string; detail: string }

interface DropzoneProps {
  state: DropzoneState
  /** Elfogadott kiterjesztések ponttal, pl. `['.xlsx', '.ods']`. */
  accept: ReadonlyArray<string>
  onFile: (file: File) => void
  /** Mit töltsön fel a tanuló (a címsor): alapból „a kész fájlt”. */
  what?: string
  error?: string | null
  disabled?: boolean
}

/** Fájlfeltöltő három állapottal: üres, feltöltés közben, kész. */
export function Dropzone({ state, accept, onFile, what = 'a kész fájlt', error, disabled = false }: DropzoneProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  function pick(files: FileList | null) {
    const file = files?.[0]
    if (file) onFile(file)
    if (inputRef.current) inputRef.current.value = ''
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setOver(false)
    if (!disabled) pick(event.dataTransfer.files)
  }

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      aria-label={`Fájl kiválasztása (${accept.join(', ')})`}
      accept={accept.join(',')}
      disabled={disabled}
      className="sr-only"
      onChange={(event) => pick(event.target.files)}
    />
  )
  const open = () => inputRef.current?.click()

  if (state.kind === 'uploading') {
    return (
      <div className="rounded-md border border-line bg-sheet px-4.5 py-4" aria-live="polite">
        <div className="flex items-center gap-3">
          <Icon name="file" size={22} className="text-ink-soft" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-15 font-semibold">{state.name}</p>
            <Bar value={state.percent} label={`${Math.round(state.percent)} százalék`} className="mt-2" />
            <p className="mt-1.5 text-13 text-ink-soft">Feltöltés és ellenőrzés… {Math.round(state.percent)}%</p>
          </div>
        </div>
      </div>
    )
  }

  if (state.kind === 'done') {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-accent bg-sheet px-4.5 py-3.5">
        <StateIcon kind="ok" label="Feltöltve" />
        <div className="min-w-0 flex-1 basis-48">
          <p className="truncate text-15 font-semibold">{state.name}</p>
          <p className="mt-0.5 text-13 text-ink-soft">{state.detail}</p>
        </div>
        {input}
        <Button variant="text" onClick={open} disabled={disabled}>
          Másik fájl
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={cx(
          'flex flex-col items-center rounded-md border-2 border-dashed px-5 py-7 text-center',
          over ? 'border-accent bg-accent-soft' : 'border-muted bg-sheet',
        )}
      >
        <Icon name="upload" size={28} className="text-ink-soft" />
        <p className="mt-2.5 text-17 font-semibold">Húzd ide {what}</p>
        <p className="mt-1 mb-3.5 text-15 text-ink-soft">vagy válaszd ki a gépedről. Elfogadott: {accept.join(', ')}</p>
        {input}
        <Button variant="secondary" onClick={open} disabled={disabled}>
          Fájl kiválasztása
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-14 leading-normal text-wrong">
          <Icon name="warn" size={16} className="mt-0.5" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

interface FileChipProps {
  name: string
  size?: string
  href?: string
  onDownload?: () => void
}

/** Letölthető fájl jele: ikon, név monóban, méret. */
export function FileChip({ name, size, href, onDownload }: FileChipProps) {
  const body = (
    <>
      <Icon name="file" size={18} className="text-ink-soft" />
      <span className="font-mono text-14 text-ink">{name}</span>
      {size && <span className="text-13 text-ink-soft">{size}</span>}
      <Icon name="download" size={16} className="text-accent" />
    </>
  )
  const className = 'inline-flex min-h-11 items-center gap-2 rounded-md border border-line bg-sheet px-3 py-0 no-underline hover:bg-faint'

  if (href) {
    return (
      <a href={href} download className={className} aria-label={`${name} letöltése`}>
        {body}
      </a>
    )
  }

  return (
    <button type="button" onClick={onDownload} className={className} aria-label={`${name} letöltése`}>
      {body}
    </button>
  )
}
