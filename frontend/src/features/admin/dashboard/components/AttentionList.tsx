import { Link } from 'react-router-dom'
import type { DashboardMetrics } from '../api'

interface Item {
  key: string
  text: string
  to?: string
}

/** Ami figyelmet kér: elakadt számlák, régóta függő fizetések, sikertelen jobok, megoldhatatlannak tűnő feladatok. */
export function AttentionList({ attention }: { attention: DashboardMetrics['attention'] }) {
  const items: Item[] = [
    ...(attention.failed_invoices > 0
      ? [{ key: 'invoices', text: `${attention.failed_invoices} elakadt számla`, to: '/admin/szamlak' }]
      : []),
    ...(attention.stale_payments > 0 ? [{ key: 'payments', text: `${attention.stale_payments} régóta függő fizetés (több mint egy napja)` }] : []),
    ...(attention.failed_jobs > 0 ? [{ key: 'jobs', text: `${attention.failed_jobs} sikertelen háttérfeladat (failed_jobs)` }] : []),
    ...attention.unsolved_exercises.map((exercise) => ({
      key: `exercise-${exercise.id}`,
      text: `„${exercise.title}”: ${exercise.attempts} beadás, egy sem elfogadott`,
      to: `/admin/tananyag/feladatok/${exercise.id}`,
    })),
  ]

  if (items.length === 0) return <p className="text-sm text-emerald-300">Minden rendben: nincs figyelmet kérő elem.</p>

  return (
    <ul className="space-y-2 text-sm" data-testid="attention-list">
      {items.map((item) => (
        <li key={item.key} className="flex items-start gap-2 text-slate-200">
          <span aria-hidden="true" className="mt-0.5 text-amber-300">
            ⚠
          </span>
          {item.to ? (
            <Link to={item.to} className="text-sky-300 hover:underline">
              {item.text}
            </Link>
          ) : (
            <span>{item.text}</span>
          )}
        </li>
      ))}
    </ul>
  )
}
