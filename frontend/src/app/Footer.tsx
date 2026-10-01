import { Link } from 'react-router-dom'
import { LEGAL_DOCUMENTS } from '../features/legal/documents'

const linkClass =
  'rounded-sm py-2 text-slate-400 transition hover:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400'

/** Az oldal lábléce (#132): minden oldalról elérhetők a jogi dokumentumok. */
export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-4 text-sm">
        <p className="text-slate-400">© {new Date().getFullYear()} InfoTanár</p>
        <nav aria-label="Jogi információk" className="flex flex-wrap gap-x-6">
          {Object.values(LEGAL_DOCUMENTS).map((legal) => (
            <Link key={legal.path} to={legal.path} className={linkClass}>
              {legal.shortTitle}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  )
}
