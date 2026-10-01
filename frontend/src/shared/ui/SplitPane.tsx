import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'

interface Props {
  first: ReactNode
  second: ReactNode
  /** Az első panel aránya (0–1). */
  ratio: number
  onRatioChange: (ratio: number) => void
  /** A billentyűzettel/dupla kattintással visszaállítható alapérték. */
  defaultRatio?: number
  /**
   * A panelek elrendezése: `horizontal` egymás mellett (az elválasztó függőleges, ez az
   * alapértelmezett), `vertical` egymás alatt (az elválasztó vízszintes). A `vertical`
   * a szülőtől határozott magasságot vár.
   */
  orientation?: 'horizontal' | 'vertical'
  /** Egyik panel sem lehet ennél kisebb (px), bármilyen mérettől. Alapérték: egymás mellett 320/420, egymás alatt 160/120. */
  minFirstPx?: number
  minSecondPx?: number
  /** A leválasztó elérhető neve (képernyőolvasó). */
  label: string
  /** A leválasztó `data-testid`-je; több elválasztónál egyediek kellenek. */
  handleTestId?: string
}

const HANDLE_PX = 12
const KEY_STEP = 0.02

const DEFAULT_MIN = {
  horizontal: { first: 320, second: 420 },
  vertical: { first: 160, second: 120 },
} as const

interface Point {
  x: number
  y: number
}

/**
 * Két panel, közöttük húzható elválasztóval (#29, #156). Az arány folyamatosan
 * követi a húzást (rAF-fel ritkítva), a mentés (onRatioChange) csak az
 * elengedéskor történik. A CSS grid `minmax` garantálja, hogy egyik panel
 * sem nyomódik használhatatlanra, akkor sem, ha a mentett arány egy
 * nagyobb képernyőről származik. Billentyűzettel is állítható.
 */
export function SplitPane({
  first,
  second,
  ratio,
  onRatioChange,
  defaultRatio = 0.5,
  orientation = 'horizontal',
  minFirstPx,
  minSecondPx,
  label,
  handleTestId = 'split-pane-handle',
}: Props) {
  const vertical = orientation === 'vertical'
  const minFirst = minFirstPx ?? DEFAULT_MIN[orientation].first
  const minSecond = minSecondPx ?? DEFAULT_MIN[orientation].second

  const containerRef = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)
  const [dragRatio, setDragRatio] = useState<number | null>(null)
  const live = dragRatio ?? ratio

  const clamp = useCallback(
    (value: number): number => {
      const rect = containerRef.current?.getBoundingClientRect()
      const size = (vertical ? rect?.height : rect?.width) ?? 0
      if (size <= minFirst + minSecond + HANDLE_PX) return 0.5
      const min = minFirst / size
      const max = 1 - (minSecond + HANDLE_PX) / size
      return Math.min(max, Math.max(min, value))
    },
    [vertical, minFirst, minSecond],
  )

  const ratioAt = useCallback(
    ({ x, y }: Point): number => {
      const rect = containerRef.current?.getBoundingClientRect()
      const size = (vertical ? rect?.height : rect?.width) ?? 0
      if (!rect || size <= 0) return ratio
      return clamp((vertical ? y - rect.top : x - rect.left) / size)
    },
    [vertical, clamp, ratio],
  )

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
  }, [])

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragRatio(ratioAt({ x: e.clientX, y: e.clientY }))
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragRatio === null) return
    const point = { x: e.clientX, y: e.clientY }
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => setDragRatio(ratioAt(point)))
  }

  function finishDrag(e: PointerEvent<HTMLDivElement>) {
    if (dragRatio === null) return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    onRatioChange(ratioAt({ x: e.clientX, y: e.clientY }))
    setDragRatio(null)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const [decrease, increase] = vertical ? ['ArrowUp', 'ArrowDown'] : ['ArrowLeft', 'ArrowRight']
    const next = {
      [decrease]: live - KEY_STEP,
      [increase]: live + KEY_STEP,
      Home: 0,
      End: 1,
      Enter: defaultRatio,
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    onRatioChange(clamp(next))
  }

  const percent = Math.round(live * 100)
  // Százszoros fr-értékek: ha az egyik panel a minimumán áll, a másik rugalmas
  // tényezője 1 alá eshetne, és akkor a CSS grid nem osztaná ki a teljes helyet.
  const track = `minmax(${minFirst}px, ${live * 100}fr) ${HANDLE_PX}px minmax(${minSecond}px, ${(1 - live) * 100}fr)`
  const dragging = dragRatio !== null

  return (
    <div
      ref={containerRef}
      className={`grid ${vertical ? 'h-full' : 'items-start'} ${dragging ? `${vertical ? 'cursor-row-resize' : 'cursor-col-resize'} select-none` : ''}`}
      style={vertical ? { gridTemplateRows: track } : { gridTemplateColumns: track }}
      data-testid="split-pane"
    >
      <div className="min-h-0 min-w-0">{first}</div>

      <div
        role="separator"
        // A függőleges elválasztó egymás melletti paneleket választ el, a vízszintes egymás alattiakat.
        aria-orientation={vertical ? 'horizontal' : 'vertical'}
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
        data-testid={handleTestId}
        className={`group flex touch-none focus:outline-none ${
          vertical ? 'cursor-row-resize items-center self-stretch' : 'cursor-col-resize justify-center self-stretch'
        }`}
      >
        <span
          className={`rounded-full transition-colors group-hover:bg-sky-500 group-focus-visible:bg-sky-400 ${
            vertical ? 'h-0.5 w-full' : 'h-full w-0.5'
          } ${dragging ? 'bg-sky-400' : 'bg-slate-800'}`}
        />
      </div>

      <div className="min-h-0 min-w-0">{second}</div>
    </div>
  )
}
