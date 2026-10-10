import { Icon } from '../../../shared/ui/Icon'
import type { SqlTaskInfo } from '../../../types'

/** SQL feladat: az adatbázis táblái a kulcsokkal, és a mentendő lekérdezések neve. */
export function SqlSchemaPanel({ info }: { info: SqlTaskInfo }) {
  return (
    <div className="mt-8" data-testid="sql-schema">
      <h2 className="font-serif text-19 leading-snug font-semibold">Adatbázis: {info.database}</h2>
      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-4">
        {info.tables.map((table) => (
          <div key={table.name} className="min-w-36">
            <p className="flex items-center gap-2 font-mono text-15 font-medium">
              <Icon name="db" size={18} className="text-ink-soft" />
              {table.name}
            </p>
            <ul className="mt-1.5 flex flex-col gap-1 pl-6.5 font-mono text-14">
              {table.columns.map((column) => (
                <li key={column.name}>
                  {column.name}
                  {column.primary && <span className="font-sans text-13 text-ink-soft"> (kulcs)</span>}
                  {column.references && <span className="font-sans text-13 text-ink-soft"> → {column.references}</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {info.subtasks.length > 0 && (
        <>
          <h2 className="mt-8 font-serif text-19 leading-snug font-semibold">Részfeladatok</h2>
          <ul className="mt-2">
            {info.subtasks.map((subtask) => (
              <li key={subtask.query_name} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-t border-grid py-2.5">
                <span className="min-w-0 flex-1 basis-56 text-16">{subtask.label}</span>
                <span className="text-14 text-ink-soft">
                  mentsd így: <span className="font-mono text-ink">{subtask.query_name}</span>, {subtask.points} pont
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 text-14 leading-relaxed text-ink-soft">A sorok sorrendje csak akkor számít, ha a feladat rendezést kér.</p>
    </div>
  )
}
