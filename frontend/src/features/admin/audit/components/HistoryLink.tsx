import { Link } from 'react-router-dom'
import { historyPath } from '../api'

/** "Előzmények": a napló az adott elemre szűrve (ki, mikor, mit módosított rajta). */
export function HistoryLink({ subjectType, subjectId }: { subjectType: string; subjectId: number }) {
  return (
    <Link to={historyPath(subjectType, subjectId)} className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-800">
      Előzmények
    </Link>
  )
}
