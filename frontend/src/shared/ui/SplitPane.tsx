import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'

interface Props {
  left: ReactNode
  right: ReactNode
  /** A bal panel aránya (0–1). */
  ratio: number
  onRatioChange: (ratio: number) => void
  /** A billentyűzettel/dupla kattintással visszaállítható alapérték. */
  defaultRatio?: number
  /** Egyik panel sem lehet ennél keskenyebb (px), bármilyen szélességnél. */
  minLeftPx?: number
  minRightPx?: number
  /** A leválasztó elérhető neve (képernyőolvasó). */
  label: string
}

const HANDLE_PX = 24
const KEY_STEP = 0.02

/**
 * Két panel, közöttük húzható elválasztóval (#29). Az arány folyamatosan
 * követi a húzást (rAF-fel ritkítva), a mentés (onRatioChange) csak az
 * elengedéskor történik. A CSS grid `minmax` garantálja, hogy egyik panel
 * sem nyomódik használhatatlanra, akkor sem, ha a mentett arány egy
 * szélesebb képernyőről származik. Billentyűzettel is állítható.
 */
export function SplitPane({
  left,
  right,
  ratio,
  onRatioChange,
  defaultRatio = 0.5,
  minLeftPx = 320,
  minRightPx = 420,
  label,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const [dragRatio, setDragRatio] = useState<number | null>(null)
  const live = dragRatio ?? ratio

  const clamp = useCallback(
    (value: number): number => {
      const width = containerRef.current?.getBoundingClientRect().width ?? 0
      if (width <= minLeftPx + minRightPx + HANDLE_PX) return 0.5
      const min = minLeftPx / width
      const max = 1 - (minRightPx + HANDLE_PX) / width
      return Math.min(max, Math.max(min, value))
    },
    [minLeftPx, minRightPx],
  )

  const ratioAt = useCallback(
    (clientX: number): number => {
      const rect = containerRef.current?.getBoundingClientRect()
      return rect && rect.width > 0 ? clamp((clientX - rect.left) / rect.width) : ratio
    },
    [clamp, ratio],
  )

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
  }, [])

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragRatio(ratioAt(e.clientX))
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragRatio === null) return
    const x = e.clientX
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setDragRatio(ratioAt(x)))
  }

  function finishDrag(e: PointerEvent<HTMLDivElement>) {
    if (dragRatio === null) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    onRatioChange(ratioAt(e.clientX))
    setDragRatio(null)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const next = {
      ArrowLeft: live - KEY_STEP,
      ArrowRight: live + KEY_STEP,
      Home: 0,
      End: 1,
      Enter: defaultRatio,
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onRatioChange(clamp(next))
  }

  const percent = Math.round(live * 100)

  return (
    <div
      ref={containerRef}
      className={`grid items-start ${dragRatio !== null ? 'cursor-col-resize select-none' : ''}`}
      style={{
        // Százszoros fr-értékek: ha az egyik panel a minimumán áll, a másik rugalmas
        // tényezője 1 alá eshetne, és akkor a CSS grid nem osztaná ki a teljes helyet.
        gridTemplateColumns: `minmax(${minLeftPx}px, ${live * 100}fr) ${HANDLE_PX}px minmax(${minRightPx}px, ${(1 - live) * 100}fr)`,
      }}
      data-testid="split-pane"
    >
      <div className="min-w-0">{left}</div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        tabIndex={0}
        title="Húzd a panelek átméretezéséhez (dupla kattintás: alaphelyzet)"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        onDoubleClick={() => onRatioChange(clamp(defaultRatio))}
        onKeyDown={onKeyDown}
        data-testid="split-pane-handle"
        className="group flex cursor-col-resize touch-none justify-center self-stretch rounded-full"
      >
        <span
          className={`h-full w-0.5 rounded-full group-hover:bg-accent group-focus-visible:bg-accent ${dragRatio !== null ? 'bg-accent' : 'bg-line'}`}
        />
      </div>

      <div className="min-w-0">{right}</div>
    </div>
  )
}
