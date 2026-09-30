import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckboxField } from '../../../../shared/ui/Form'
import type { LanguageKey } from '../../../../types'
import { constraintOptionsQuery, type ConstraintSet } from '../api'

interface Props {
  value: ConstraintSet
  onChange: (value: ConstraintSet) => void
  allowedLanguages: LanguageKey[]
  /** A backend validációs üzenete a `constraints` mezőre. */
  error?: string
}

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

/**
 * Kódszabályok (#49) a feladat űrlapján: kötelező szerkezetek, javasolt és
 * egyedi tiltások. A feladattal együtt mentődik, és a következő beadástól
 * érvényes (a backend minden beadásnál a mentett szabályokkal ellenőriz).
 */
export function ConstraintEditor({ value, onChange, allowedLanguages, error }: Props) {
  const options = useQuery(constraintOptionsQuery())
  const [customKind, setCustomKind] = useState<'builtin' | 'method'>('builtin')
  const [customName, setCustomName] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)

  if (options.isPending) return <p className="text-sm text-slate-400">Szabályok betöltése…</p>
  if (options.isError) return <p className="text-sm text-red-300">A szabálylista nem tölthető be.</p>

  const { require, forbid, enforced_languages: enforced } = options.data
  const suggested = new Set(forbid.map((f) => f.value))
  const custom = value.forbid.filter((rule) => !suggested.has(rule))
  const unenforced = allowedLanguages.filter((l) => !enforced.includes(l))
  const hasRules = value.require.length + value.forbid.length > 0

  const toggle = (key: keyof ConstraintSet, rule: string, on: boolean) =>
    onChange({ ...value, [key]: on ? [...value[key], rule] : value[key].filter((r) => r !== rule) })

  function addCustom() {
    const name = customName.trim()
    if (!NAME_PATTERN.test(name)) {
      setCustomError('Érvénytelen név: betűvel vagy aláhúzással kezdődjön, és csak betűt, számot, aláhúzást tartalmazzon.')
      return
    }
    const rule = `${customKind}:${name}`
    if (!value.forbid.includes(rule)) onChange({ ...value, forbid: [...value.forbid, rule] })
    setCustomName('')
    setCustomError(null)
  }

  return (
    <div className="space-y-5" data-testid="constraint-editor">
      {hasRules && unenforced.length > 0 && (
        <p role="note" className="rounded-lg border border-amber-900 bg-amber-950/50 p-3 text-sm text-amber-200">
          A szabályokat csak ezekre a nyelvekre ellenőrizzük: {enforced.join(', ')}. A(z) {unenforced.join(', ')} megoldásokra nem
          vonatkoznak.
        </p>
      )}

      <fieldset>
        <legend className="mb-2 text-sm text-slate-300">Kötelező szerkezet</legend>
        <div className="flex flex-wrap gap-4">
          {require.map((option) => (
            <CheckboxField
              key={option.value}
              label={option.label}
              checked={value.require.includes(option.value)}
              onChange={(e) => toggle('require', option.value, e.target.checked)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-slate-300">Tiltott beépített függvények és metódusok</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {forbid.map((option) => (
            <CheckboxField
              key={option.value}
              label={option.label}
              checked={value.forbid.includes(option.value)}
              onChange={(e) => toggle('forbid', option.value, e.target.checked)}
            />
          ))}
        </div>
      </fieldset>

      <div>
        <p className="mb-2 text-sm text-slate-300">Egyedi tiltás</p>
        {custom.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-2" aria-label="Egyedi tiltások">
            {custom.map((rule) => (
              <li key={rule} className="flex items-center gap-1 rounded-full border border-slate-700 px-2.5 py-0.5 font-mono text-xs text-slate-200">
                {rule}
                <button
                  type="button"
                  aria-label={`${rule} tiltás eltávolítása`}
                  onClick={() => toggle('forbid', rule, false)}
                  className="ml-1 text-red-300 hover:text-red-200"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-start gap-2 text-sm">
          <select
            aria-label="Tiltás típusa"
            value={customKind}
            onChange={(e) => setCustomKind(e.target.value === 'method' ? 'method' : 'builtin')}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100"
          >
            <option value="builtin">beépített függvény</option>
            <option value="method">metódus</option>
          </select>
          <input
            aria-label="Függvény vagy metódus neve"
            aria-invalid={customError ? true : undefined}
            placeholder="pl. min"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              // Enter ne küldje el a teljes feladat-űrlapot.
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
            className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-slate-100"
          />
          <button type="button" onClick={addCustom} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-200 hover:bg-slate-800">
            Hozzáadás
          </button>
        </div>
        {customError && <p className="mt-1 text-sm text-red-300">{customError}</p>}
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}
      <p className="text-xs text-slate-500">A szabályok a feladat mentése után a következő beadástól érvényesek.</p>
    </div>
  )
}
