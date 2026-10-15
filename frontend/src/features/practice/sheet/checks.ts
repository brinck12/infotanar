import type { RubricState } from '../../../shared/ui/RubricItem'
import type { SheetPracticeInfo } from '../../../types'
import { ERROR, display, evaluateCell, expandRange, functionsOf, isFormula, parseCell, referencesOf, shiftFormula, type Cells } from './formula'

type Check = SheetPracticeInfo['checks'][number]

export interface SheetCheckResult {
  check: Check
  state: RubricState
  found: string | null
  hint: string | null
}

const normalize = (formula: string) => formula.replace(/\s+/g, '').toUpperCase()

function evaluate(check: Check, cells: Cells): { passed: boolean; found: string | null; hint: string | null } {
  switch (check.type) {
    case 'has_formula': {
      const raw = cells[check.cell] ?? ''
      return {
        passed: isFormula(raw),
        found: raw === '' ? `${check.cell} üres` : raw,
        hint: 'A képlet egyenlőségjellel kezdődik. Beírt szöveg vagy szám nem változik, ha az adatok módosulnak.',
      }
    }
    case 'uses_function': {
      const used = functionsOf(cells[check.cell] ?? '')
      return {
        passed: used.includes(check.function.toUpperCase()),
        found: used.length > 0 ? `Használt függvény: ${used.join(', ')}` : 'Nincs függvény a képletben',
        hint: `Használd a ${check.function.toUpperCase()} függvényt.`,
      }
    }
    case 'references': {
      const references = referencesOf(cells[check.cell] ?? '')
      return {
        passed: references.includes(check.reference.toUpperCase()),
        found: references.length > 0 ? `Hivatkozások: ${references.join(', ')}` : 'A képlet nem hivatkozik cellára',
        hint: `A képlet hivatkozzon a ${check.reference.toUpperCase()} cellára, ne beírt értékkel számoljon.`,
      }
    }
    case 'value': {
      const value = display(evaluateCell(cells, check.cell))
      return { passed: value === check.expected, found: value === '' ? `${check.cell} üres` : value, hint: `A várt érték: ${check.expected}.` }
    }
    case 'filled_down': {
      const names = expandRange(check.range)
      const first = names[0]
      const origin = first ? parseCell(first) : null
      const source = first ? (cells[first] ?? '') : ''
      const empty = names.filter((name) => (cells[name] ?? '') === '')
      if (!first || !origin || !isFormula(source)) return { passed: false, found: `${first ?? check.range} cellában nincs képlet`, hint: 'Előbb írd meg a képletet az első cellában.' }
      if (empty.length > 0) {
        return { passed: false, found: `${empty.join(' és ')} üres`, hint: 'Húzd le a képletet a tartomány végéig, vagy használd a Kitöltés lefelé gombot.' }
      }
      const different = names.filter((name) => {
        const place = parseCell(name)
        return !place || normalize(cells[name] ?? '') !== normalize(shiftFormula(source, place.column - origin.column, place.row - origin.row))
      })
      return {
        passed: different.length === 0,
        found: different.length === 0 ? `${check.range}: azonos képlet minden sorban` : `Eltérő képlet: ${different.join(', ')}`,
        hint: 'A másolt képletnek minden sorban ugyanazt kell számolnia a saját sorára.',
      }
    }
  }
}

const ERROR_VALUES: ReadonlySet<string> = new Set(Object.values(ERROR))

/** A rövid magyar tipp a hibaértékhez: mit szokás elrontani. */
export function errorHint(value: string): string {
  switch (value) {
    case ERROR.name:
      return 'Ismeretlen név. A függvények magyarul vannak: SZUM, ÁTLAG, HA, DARABTELI. Az angol SUM vagy IF nem működik.'
    case ERROR.value:
      return 'A paramétereket pontosvessző választja el (nem vessző), a tizedesjel vessző. Nézd meg a zárójeleket és az idézőjeleket is.'
    case ERROR.div:
      return 'Nullával osztás. Ellenőrizd a nevezőt.'
    case ERROR.ref:
      return 'Hibás cellahivatkozás vagy tartomány.'
    default:
      return 'A képlet hibaértéket ad: javítsd, mielőtt pontot kaphatna.'
  }
}

/** A hibaérték, ha az ellenőrzött cella(k) valamelyike hibát ad; a hibás képlet nem kaphat pontot. */
function errorValueOf(check: Check, cells: Cells): { cell: string; value: string } | null {
  const names = check.type === 'filled_down' ? expandRange(check.range) : [check.cell]
  for (const cell of names) {
    const value = display(evaluateCell(cells, cell))
    if (ERROR_VALUES.has(value)) return { cell, value }
  }
  return null
}

/** Az ellenőrzőlista kiértékelése a cellák tartalmán és képletein. */
export function runSheetChecks(info: SheetPracticeInfo, cells: Cells): SheetCheckResult[] {
  return info.checks.map((check) => {
    const failure = errorValueOf(check, cells)
    if (failure) return { check, state: 'bad', found: `${failure.cell}: ${failure.value}`, hint: errorHint(failure.value) }
    const { passed, found, hint } = evaluate(check, cells)
    return { check, state: passed ? 'ok' : 'bad', found, hint: passed ? null : hint }
  })
}
