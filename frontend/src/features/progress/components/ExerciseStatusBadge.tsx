import type { ExerciseStatus } from '../../../types'

const META: Readonly<Record<ExerciseStatus, { label: string; style: string }>> = {
  solved: { label: 'Megoldva', style: 'border-emerald-800 bg-emerald-950 text-emerald-300' },
  attempted: { label: 'Megpróbáltad', style: 'border-amber-800 bg-amber-950 text-amber-300' },
}

/**
 * A néző saját állapota egy feladatnál (#146): ikon + szöveg, nem csak szín.
 * Amihez még nem nyúlt, annál nincs jelvény.
 */
export function ExerciseStatusBadge({ status }: { status: ExerciseStatus }) {
  const meta = META[status]

  return (
    <span
      data-testid="exercise-status"
      data-status={status}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs whitespace-nowrap ${meta.style}`}
    >
      <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3.5 w-3.5">
        {status === 'solved' ? (
          <path d="m3.5 8.5 3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <>
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth={1.5} />
            <path d="M8 1.5a6.5 6.5 0 0 1 0 13Z" fill="currentColor" />
          </>
        )}
      </svg>
      {meta.label}
    </span>
  )
}
