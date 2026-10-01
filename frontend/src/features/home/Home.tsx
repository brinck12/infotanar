import { Link, useLocation } from 'react-router-dom'
import { Alert } from '../../shared/ui/Form'

export function Home() {
  // Egyszeri értesítés egy ide irányító műveletből (pl. fióktörlés után).
  const notice = (useLocation().state as { notice?: string } | null)?.notice

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {notice && (
        <div className="mb-8">
          <Alert kind="success">{notice}</Alert>
        </div>
      )}
      <h1 className="text-3xl font-semibold text-slate-100">InfoTanár</h1>

      <p className="mt-4 text-slate-300">
        Felkészítő feladatok a magyar közép- és emelt szintű digitális kultúra érettségire.
        Válassz egy programozási feladatot, írd meg a megoldást a beépített szerkesztőben,
        futtasd le, és azonnal látod az eredményt.
      </p>

      <Link
        to="/feladatok"
        className="mt-8 inline-block rounded-lg bg-sky-700 px-5 py-2.5 font-medium text-white transition hover:bg-sky-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        Feladatok böngészése
      </Link>

      <p className="mt-10 text-sm text-slate-400">
        A megoldásaid a szerveren, elszigetelt környezetben futnak le. Jelenleg Python 3, C# és SQL
        nyelven oldhatók meg a feladatok.
      </p>
    </div>
  )
}
