import { LANGUAGE_LABEL } from '../../../../shared/domain/labels'
import { formatMemoryLimit, formatTimeLimit } from '../../../../shared/domain/limits'
import { Field } from '../../../../shared/ui/Form'
import type { LanguageOption } from '../api'

/** A backend `ExecutionLimits` határai (ExerciseRequest); a szerver is ellenőrzi. */
const TIME_LIMIT_MS = { min: 100, max: 10_000, step: 100 } as const
const MEMORY_LIMIT_KB = { min: 16_000, max: 512_000, step: 1_000 } as const

const factor = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 })

export interface LimitValues {
  time_limit_ms: number | null
  memory_limit_kb: number | null
}

interface Props {
  value: LimitValues
  onChange: (value: LimitValues) => void
  /** A feladat engedélyezett nyelvei: innen jönnek az alapértelmezések és az időszorzók. */
  languages: LanguageOption[]
  errors: { time_limit_ms?: string; memory_limit_kb?: string }
}

/**
 * A feladat saját idő- és memóriakorlátja (#151). Mindkét mező elhagyható:
 * üresen az alapértelmezés érvényes, amit a mező helyőrzője és az alatta lévő sor mutat.
 */
export function ExecutionLimitFields({ value, onChange, languages, errors }: Props) {
  const first = languages[0]
  // Az alapérték a nyelvi szorzó nélkül: amit ide beírnak, arra a szorzó még rákerül.
  const baseTimeMs = first ? Math.round(first.default_limits.time_limit_ms / first.time_factor) : undefined
  const scaled = languages.filter((language) => language.time_factor !== 1)

  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Időkorlát (ms)"
          type="number"
          inputMode="numeric"
          {...TIME_LIMIT_MS}
          placeholder={baseTimeMs === undefined ? undefined : String(baseTimeMs)}
          value={value.time_limit_ms ?? ''}
          onChange={(e) => onChange({ ...value, time_limit_ms: optionalNumber(e.target.value) })}
          error={errors.time_limit_ms}
          hint="100 és 10 000 ms között. Üresen az alapértelmezés érvényes."
        />
        <Field
          label="Memóriakorlát (KB)"
          type="number"
          inputMode="numeric"
          {...MEMORY_LIMIT_KB}
          placeholder={first ? String(first.default_limits.memory_limit_kb) : undefined}
          value={value.memory_limit_kb ?? ''}
          onChange={(e) => onChange({ ...value, memory_limit_kb: optionalNumber(e.target.value) })}
          error={errors.memory_limit_kb}
          hint="16 000 és 512 000 KB között. Üresen az alapértelmezés érvényes."
        />
      </div>

      {languages.length > 0 && (
        <p className="text-sm text-slate-400" data-testid="default-limits">
          Alapértelmezés:{' '}
          {languages
            .map((language) => `${LANGUAGE_LABEL[language.key]} – ${formatTimeLimit(language.default_limits.time_limit_ms)}, ${formatMemoryLimit(language.default_limits.memory_limit_kb)}`)
            .join(' · ')}
        </p>
      )}

      {scaled.length > 0 && (
        <p className="text-sm text-slate-400">
          Az itt megadott időkorlát nyelvenként szorzóval érvényes:{' '}
          {scaled.map((language) => `${LANGUAGE_LABEL[language.key]} ×${factor.format(language.time_factor)}`).join(', ')}.
        </p>
      )}
    </div>
  )
}

/** Üres mező = nincs saját korlát. */
function optionalNumber(input: string): number | null {
  return input.trim() === '' ? null : Number(input)
}
