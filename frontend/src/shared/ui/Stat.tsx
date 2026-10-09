import type { ReactNode } from 'react'
import { Panel } from './Panel'

/** Egy szám címkével és megjegyzéssel (haladás, admin áttekintés). */
export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
  return (
    <Panel pad="md">
      <p className="text-15 text-ink-soft">{label}</p>
      <p className="mt-1.5 font-serif text-34 leading-tight font-semibold">{value}</p>
      {note && <p className="mt-1 text-14 text-ink-soft">{note}</p>}
    </Panel>
  )
}
