import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { hibaUzenet } from '../../../../shared/api/errors'
import { CheckboxField, Field, SelectField, TextAreaField } from '../../../../shared/ui/Form'
import { checkComparison, type ComparisonMode, type ComparisonSettings } from '../api'

interface Props {
  value: ComparisonSettings
  onChange: (value: ComparisonSettings) => void
  /** A backend mezőhibái a `comparison.*` kulcsokra, kulcsonként az első üzenet. */
  errors: Record<string, string>
}

/** Módonként egy mondat: mit jelent az összevetés, hogy a szerző ne találgasson. */
const MODES: ReadonlyArray<{ value: ComparisonMode; label: string; explanation: string }> = [
  {
    value: 'exact',
    label: 'Pontos (soronként)',
    explanation: 'Soronkénti egyezés; a sorvégi szóközöket és a záró üres sorokat nem számítjuk.',
  },
  {
    value: 'tokens',
    label: 'Elemenként (szóközök nem számítanak)',
    explanation: 'A kimenetet szóközök mentén elemekre bontjuk; a szóközök és a sortörések száma nem számít.',
  },
  {
    value: 'numeric',
    label: 'Számok tűréssel',
    explanation: 'Mint az elemenkénti, de a számokat (ponttal vagy vesszővel, pl. 3,50 és 3.5) tűréssel hasonlítjuk össze.',
  },
]

/** A beviteli mezőből szám (üresen vagy hibásan 0): a backend a tűrés alsó határát úgyis ellenőrzi. */
const toNumber = (text: string): number => {
  const parsed = Number(text.replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Kimenet-összevetés (#155): hogyan hasonlítsa a rendszer a program kimenetét az
 * elvárthoz. Az alapértelmezett a korábbi, soronkénti pontos összevetés, ezért a
 * meglévő feladatok viselkedése nem változik. Alatta egy "Kipróbálom" doboz.
 */
export function ComparisonEditor({ value, onChange, errors }: Props) {
  const set = <K extends keyof ComparisonSettings>(key: K, next: ComparisonSettings[K]) => onChange({ ...value, [key]: next })
  const mode = MODES.find((candidate) => candidate.value === value.mode) ?? MODES[0]

  return (
    <div className="space-y-4" data-testid="comparison-editor">
      <div>
        <SelectField
          label="Összevetés módja"
          options={MODES.map(({ value: modeValue, label }) => ({ value: modeValue, label }))}
          value={value.mode}
          onChange={(e) => set('mode', e.target.value as ComparisonMode)}
          error={errors['comparison.mode']}
        />
        <p className="mt-1 text-xs text-slate-400" data-testid="comparison-explanation">
          {mode?.explanation}
        </p>
      </div>

      {value.mode === 'numeric' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Abszolút tűrés"
            type="number"
            min={0}
            step="any"
            value={String(value.abs_tol)}
            onChange={(e) => set('abs_tol', toNumber(e.target.value))}
            error={errors['comparison.abs_tol']}
          />
          <Field
            label="Relatív tűrés (0–1, pl. 0,01 = 1%)"
            type="number"
            min={0}
            max={1}
            step="any"
            value={String(value.rel_tol)}
            onChange={(e) => set('rel_tol', toNumber(e.target.value))}
            error={errors['comparison.rel_tol']}
          />
          <p className="text-xs text-slate-400 sm:col-span-2">
            Két szám egyezik, ha a különbségük legfeljebb az abszolút tűrés, vagy a nagyobb abszolút érték relatív tűrésszerese. Mindkettő 0:
            az értéküknek kell egyeznie (3,50 és 3.5 ugyanaz).
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <CheckboxField
          label="Kis- és nagybetű nem számít"
          checked={value.case_insensitive}
          onChange={(e) => set('case_insensitive', e.target.checked)}
          error={errors['comparison.case_insensitive']}
        />
        {value.mode === 'exact' && (
          <CheckboxField
            label="Az üres sorok nem számítanak"
            checked={value.ignore_blank_lines}
            onChange={(e) => set('ignore_blank_lines', e.target.checked)}
            error={errors['comparison.ignore_blank_lines']}
          />
        )}
      </div>

      <ComparisonTryout settings={value} />
    </div>
  )
}

/** "Kipróbálom": a (még el nem mentett) beállításokkal megmutatja, egyezne-e a két kimenet. */
function ComparisonTryout({ settings }: { settings: ComparisonSettings }) {
  const [expected, setExpected] = useState('')
  const [actual, setActual] = useState('')
  const check = useMutation({ mutationFn: () => checkComparison({ comparison: settings, expected, actual }) })

  return (
    <div className="rounded-lg border border-dashed border-slate-700 p-3" data-testid="comparison-tryout">
      <h3 className="text-sm font-medium text-slate-200">Kipróbálom</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TextAreaField label="Elvárt kimenet" rows={3} mono value={expected} onChange={(e) => setExpected(e.target.value)} />
        <TextAreaField label="A diák kimenete" rows={3} mono value={actual} onChange={(e) => setActual(e.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={check.isPending}
          onClick={() => check.mutate()}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-60"
        >
          Összevetés
        </button>
        <div role="status" data-testid="comparison-result" className="text-sm">
          {check.isError && <span className="text-red-300">{hibaUzenet(check.error)}</span>}
          {check.isSuccess && check.data.matches && <span className="text-emerald-300">Egyezik ✓</span>}
          {check.isSuccess && !check.data.matches && (
            <span className="text-amber-200">Nem egyezik{check.data.difference ? `: ${check.data.difference}` : '.'}</span>
          )}
        </div>
      </div>
    </div>
  )
}
