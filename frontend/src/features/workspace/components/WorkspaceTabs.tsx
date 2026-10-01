import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'

export type WorkspaceView = 'task' | 'code'

interface Props {
  view: WorkspaceView
  onViewChange: (view: WorkspaceView) => void
  task: ReactNode
  code: ReactNode
  /** Ha van friss eredmény, a Kód fülön jelezzük (pl. a Feladat fülről nézve). */
  codeBadge?: string | null
}

const TABS: ReadonlyArray<{ view: WorkspaceView; label: string }> = [
  { view: 'task', label: 'Feladat' },
  { view: 'code', label: 'Kód' },
]

/**
 * Keskeny (tablet) nézet (#30): a leírás és a szerkesztő két fülön. Mindkét
 * panel végig mountolva marad (csak rejtjük), így a kód és a Monaco állapota
 * fülváltáskor nem vész el. WAI-ARIA tabs minta: nyilakkal is váltható.
 */
export function WorkspaceTabs({ view, onViewChange, task, code, codeBadge }: Props) {
  const baseId = useId()
  const tabRefs = useRef<Record<WorkspaceView, HTMLButtonElement | null>>({ task: null, code: null })

  // A fókuszban lévő fülhöz képest lépünk (automatikus aktiválás).
  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>, from: WorkspaceView) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const index = TABS.findIndex((t) => t.view === from)
    const nextIndex =
      e.key === 'Home' ? 0 : e.key === 'End' ? TABS.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
    const next = TABS[nextIndex]?.view ?? from
    onViewChange(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label="Munkaterület nézet"
        className="sticky top-0 z-10 -mx-4 mb-4 flex border-b border-slate-800 bg-slate-950/95 px-4 backdrop-blur"
      >
        {TABS.map((tab) => {
          const selected = tab.view === view
          return (
            <button
              key={tab.view}
              ref={(el) => {
                tabRefs.current[tab.view] = el
              }}
              type="button"
              role="tab"
              id={`${baseId}-${tab.view}-tab`}
              aria-selected={selected}
              aria-controls={`${baseId}-${tab.view}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onViewChange(tab.view)}
              onKeyDown={(e) => onKeyDown(e, tab.view)}
              data-testid={`workspace-tab-${tab.view}`}
              className={`-mb-px flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition focus:outline-none focus-visible:bg-slate-900 sm:flex-none ${
                selected ? 'border-sky-400 text-slate-100' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.view === 'code' && codeBadge && !selected && (
                <span className="rounded-full bg-sky-900 px-2 py-0.5 text-xs text-sky-200">{codeBadge}</span>
              )}
            </button>
          )
        })}
      </div>

      <div id={`${baseId}-task-panel`} role="tabpanel" aria-labelledby={`${baseId}-task-tab`} hidden={view !== 'task'}>
        {task}
      </div>
      <div id={`${baseId}-code-panel`} role="tabpanel" aria-labelledby={`${baseId}-code-tab`} hidden={view !== 'code'}>
        {code}
      </div>
    </div>
  )
}
