import { Link } from 'react-router-dom'

const LINK = 'inline-flex min-h-11 items-center text-15 text-ink-soft'

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-sheet">
      <div className="mx-auto flex max-w-page flex-wrap items-center justify-between gap-x-8 gap-y-3 px-4 py-7 md:px-6">
        <p className="max-w-prose text-15 leading-relaxed text-ink-soft">A megoldásaid a szerveren, elszigetelt környezetben futnak le.</p>
        <nav aria-label="Lábléc" className="flex flex-wrap gap-x-6 gap-y-2">
          <Link to="/aszf" className={LINK}>
            Általános szerződési feltételek
          </Link>
          <Link to="/adatkezeles" className={LINK}>
            Adatkezelési tájékoztató
          </Link>
          <Link to="/aszf#kapcsolat" className={LINK}>
            Kapcsolat
          </Link>
        </nav>
      </div>
    </footer>
  )
}
