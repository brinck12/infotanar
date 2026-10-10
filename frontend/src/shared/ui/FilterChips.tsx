import { cx } from './cx'

export interface FilterOption<T extends string> {
  value: T
  label: string
}

interface FilterChipsProps<T extends string> {
  /** A csoport neve: látható címke és a képernyőolvasónak szóló név is. */
  label: string
  options: ReadonlyArray<FilterOption<T>>
  value: T
  onChange: (value: T) => void
}

/** Szűrőcsoport benyomható gombokkal; a kiválasztott sötét kitöltést kap. */
export function FilterChips<T extends string>({ label, options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-15 font-semibold">{label}</span>
      {options.map((option) => {
        const pressed = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option.value)}
            className={cx(
              'min-h-11 rounded-md border px-4 text-15 font-semibold',
              pressed ? 'border-ink bg-ink text-sheet' : 'border-muted bg-sheet text-ink hover:bg-note',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
