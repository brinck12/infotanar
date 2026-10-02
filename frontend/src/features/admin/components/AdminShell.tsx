import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

export interface Crumb {
  label: string
  to?: string
}

const ADMIN_SECTIONS = [
  { to: '/admin/tananyag', label: 'Tananyag' },
  { to: '/admin/felhasznalok', label: 'Felhasználók' },
  { to: '/admin/szamlak', label: 'Számlák' },
  { to: '/admin/naplo', label: 'Napló' },
] as const

/** Admin oldalkeret: morzsamenü, cím és a tartalom. */
export function AdminShell({ crumbs, title, actions, children }: { crumbs: Crumb[]; title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <nav aria-label="Admin menü" className="mb-4 flex gap-1 border-b border-slate-800 text-sm">
        {ADMIN_SECTIONS.map((section) => (
          <NavLink
            key={section.to}
            to={section.to}
            className={({ isActive }) =>
              `-mb-px border-b-2 px-3 py-2 transition ${isActive ? 'border-sky-400 text-slate-100' : 'border-transparent text-slate-400 hover:text-slate-200'}`
            }
          >
            {section.label}
          </NavLink>
        ))}
      </nav>
      <nav aria-label="Morzsamenü" className="text-sm text-slate-400">
        <ol className="flex flex-wrap items-center gap-1">
          {crumbs.map((crumb, i) => (
            <li key={`${crumb.label}|${crumb.to ?? ''}`} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true">/</span>}
              {crumb.to ? (
                <Link to={crumb.to} className="hover:text-slate-200 hover:underline">
                  {crumb.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-slate-300">
                  {crumb.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-100">{title}</h1>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      <div className="mt-6 space-y-8">{children}</div>
    </div>
  )
}

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-base font-semibold text-slate-100">{title}</h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

export function StatusPill({ tone, children }: { tone: 'published' | 'draft' | 'free' | 'info'; children: ReactNode }) {
  const style = {
    published: 'bg-emerald-950 text-emerald-300',
    draft: 'bg-slate-800 text-slate-400',
    free: 'bg-sky-950 text-sky-300',
    info: 'bg-slate-800 text-slate-300',
  }[tone]

  return <span className={`rounded px-2 py-0.5 text-xs ${style}`}>{children}</span>
}
