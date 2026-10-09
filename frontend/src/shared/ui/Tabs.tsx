import { useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cx } from './cx'

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
}

interface TabsProps<T extends string> {
  /** A fülsor neve a képernyőolvasónak. */
  label: string
  tabs: ReadonlyArray<TabItem<T>>
  active: T
  onChange: (id: T) => void
  /** A fülek és a panelek azonosítójának közös előtagja. */
  idPrefix: string
  className?: string
}

/** Fülsor: nyilakkal bejárható, az aktív fül fehér, alul 3 px zöld vonallal. */
export function Tabs<T extends string>({ label, tabs, active, onChange, idPrefix, className }: TabsProps<T>) {
  const refs = useRef(new Map<T, HTMLButtonElement>())

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const target =
      event.key === 'Home' ? tabs[0] : event.key === 'End' ? tabs[tabs.length - 1] : step ? tabs[(index + step + tabs.length) % tabs.length] : undefined
    if (!target) return
    event.preventDefault()
    onChange(target.id)
    refs.current.get(target.id)?.focus()
  }

  return (
    <div role="tablist" aria-label={label} className={cx('flex flex-wrap gap-2 border-b border-line', className)}>
      {tabs.map((tab, index) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) refs.current.set(tab.id, node)
              else refs.current.delete(tab.id)
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cx(
              'min-h-12 px-5 text-16 text-ink',
              selected
                ? '-mb-px rounded-t-md border border-b-3 border-line border-b-accent bg-sheet font-bold'
                : 'rounded-t-md font-semibold hover:bg-note',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

interface TabPanelProps {
  idPrefix: string
  id: string
  active: boolean
  children: ReactNode
  className?: string
}

export function TabPanel({ idPrefix, id, active, children, className }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-panel-${id}`}
      aria-labelledby={`${idPrefix}-tab-${id}`}
      hidden={!active}
      tabIndex={0}
      className={className}
    >
      {active && children}
    </div>
  )
}
