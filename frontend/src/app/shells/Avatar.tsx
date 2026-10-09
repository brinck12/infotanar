import { cx } from '../../shared/ui/cx'

/** A név kezdőbetűje zöld körben; profilkép nincs. */
export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex flex-none items-center justify-center rounded-full bg-accent-soft font-bold text-accent',
        small ? 'size-8 text-14' : 'size-9 text-15',
      )}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
