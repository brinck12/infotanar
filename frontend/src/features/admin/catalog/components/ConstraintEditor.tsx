import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Banner } from '../../../../shared/ui/Banner'
import { Button } from '../../../../shared/ui/Button'
import { CheckboxField, Field, SelectField } from '../../../../shared/ui/Form'
import { Icon } from '../../../../shared/ui/Icon'
import { Skeleton } from '../../../../shared/ui/States'
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

const KIND_OPTIONS = [
  { value: 'builtin', label: 'beépített függvény' },
  { value: 'method', label: 'metódus' },
] as const

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

  if (options.isPending) return <Skeleton lines={3} label="Szabályok betöltése…" />
  if (options.isError) return <Banner kind="error">A szabálylista nem tölthető be. Töltsd újra az oldalt.</Banner>

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
      setCustomError('Érvénytelen név. Betűvel vagy aláhúzással kezdődjön, és csak betűt, számot, aláhúzást tartalmazzon.')
      return
    }
    const rule = `${customKind}:${name}`
    if (!value.forbid.includes(rule)) onChange({ ...value, forbid: [...value.forbid, rule] })
    setCustomName('')
    setCustomError(null)
  }

  return (
    <div className="flex flex-col gap-6" data-testid="constraint-editor">
      {hasRules && unenforced.length > 0 && (
        <Banner kind="warn" title="Nem minden nyelvre vonatkozik">
          A szabályokat csak ezekre a nyelvekre ellenőrizzük: {enforced.join(', ')}. A(z) {unenforced.join(', ')} megoldásokra nem
          vonatkoznak.
        </Banner>
      )}

      <fieldset>
        <legend className="text-15 font-semibold">Kötelező szerkezet</legend>
        <div className="mt-2.5 flex flex-wrap gap-x-7 gap-y-3">
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
        <legend className="text-15 font-semibold">Tiltott beépített függvények és metódusok</legend>
        <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
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
        <p className="text-15 font-semibold">Egyedi tiltás</p>
        {custom.length > 0 && (
          <ul className="mt-2.5 flex flex-wrap gap-2" aria-label="Egyedi tiltások">
            {custom.map((rule) => (
              <li key={rule} className="flex items-center gap-1 rounded-md border border-muted bg-sheet pl-3 font-mono text-14">
                {rule}
                <button
                  type="button"
                  aria-label={`${rule} tiltás eltávolítása`}
                  onClick={() => toggle('forbid', rule, false)}
                  className="inline-flex size-11 items-center justify-center rounded-md text-wrong hover:bg-wrong-soft"
                >
                  <Icon name="x" size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2.5 flex flex-wrap items-start gap-4">
          <SelectField
            className="w-56"
            label="Tiltás típusa"
            options={KIND_OPTIONS}
            value={customKind}
            onChange={(e) => setCustomKind(e.target.value === 'method' ? 'method' : 'builtin')}
          />
          <Field
            className="w-56"
            label="Függvény vagy metódus neve"
            mono
            value={customName}
            error={customError ?? undefined}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              // Enter ne küldje el a teljes feladat-űrlapot.
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustom()
              }
            }}
          />
          <div className="pt-7.5">
            <Button variant="secondary" icon="plus" onClick={addCustom} className="min-h-12">
              Hozzáadás
            </Button>
          </div>
        </div>
      </div>

      {error && <Banner kind="error">{error}</Banner>}
      <p className="text-14 leading-relaxed text-ink-soft">A szabályok a feladat mentése után a következő beadástól érvényesek.</p>
    </div>
  )
}
