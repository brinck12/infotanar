import type { RubricState } from '../../../shared/ui/RubricItem'
import type { SheetPracticeInfo } from '../../../types'
import { display, ERROR, evaluateCell, expandRange, functionsOf, isFormula, parseCell, referencesOf, shiftFormula, type Cells } from './formula'

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

/** A cella képlete hibaértéket ad (#NÉV?, #ÉRTÉK! stb.); a beírt, `#`-tel kezdődő szöveg nem hiba. */
export function errorOf(cells: Cells, name: string): string | null {
  if (!isFormula(cells[name])) return null
  const value = display(evaluateCell(cells, name))
  return value.startsWith('#') ? value : null
}

/** Segítség a leggyakoribb hibaértékekhez: magyar függvénynevek és pontosvessző. */
export function errorHint(error: string): string | null {
  if (error === ERROR.name) {
    return 'Magyar beállításnál magyar a függvények neve (például HA, SZUM, ÁTLAG), és a paramétereket pontosvessző választja el, nem vessző. Ellenőrizd a cellahivatkozásokat is.'
  }
  if (error === ERROR.value) {
    return 'Nézd meg a paramétereket: pontosvessző válassza el őket, a tizedesjel vessző, a szöveget pedig idézőjelbe kell tenni.'
  }
  return null
}

const cellsOf = (check: Check): string[] => (check.type === 'filled_down' ? expandRange(check.range) : [check.cell])

/** Az ellenőrzőlista kiértékelése a cellák tartalmán és képletein. Hibaértéket adó cella nem kap pontot. */
export function runSheetChecks(info: SheetPracticeInfo, cells: Cells): SheetCheckResult[] {
  return info.checks.map((check) => {
    const broken = cellsOf(check).find((name) => errorOf(cells, name) !== null)
    if (broken) {
      const error = errorOf(cells, broken) ?? ''
      return {
        check,
        state: 'bad',
        found: `${broken}: ${error}`,
        hint: errorHint(error) ?? 'A képlet hibaértéket ad, ezért nem kaphat pontot. Javítsd ki.',
      }
    }
    const { passed, found, hint } = evaluate(check, cells)
    return { check, state: passed ? 'ok' : 'bad', found, hint: passed ? null : hint }
  })
}
