import { useId, type ReactNode } from 'react'

/** Egy blokk a fiókoldalon: cím és tartalom, a többi oldal kártyáival egyező keretben. */
export function AccountSection({ title, danger = false, children }: { title: string; danger?: boolean; children: ReactNode }) {
  const titleId = useId()

  return (
    <section
      aria-labelledby={titleId}
      className={`rounded-lg border bg-slate-900 p-5 ${danger ? 'border-red-900' : 'border-slate-800'}`}
    >
      <h2 id={titleId} className="text-lg font-semibold text-slate-100">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm text-slate-300">{children}</div>
    </section>
  )
}
