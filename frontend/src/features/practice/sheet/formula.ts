/**
 * Kis táblázatkezelő-motor a böngészős gyakorlóhoz: magyar függvénynevek,
 * pontosvesszővel elválasztott paraméterek és tizedesvessző, ahogy a
 * vizsgagépek magyar beállítású programjaiban.
 */
export type CellValue = number | string | boolean
export type Cells = Readonly<Record<string, string>>

export const ERROR = { value: '#ÉRTÉK!', name: '#NÉV?', ref: '#HIV!', div: '#ZÉRÓOSZTÓ!', cycle: '#KÖRKÖRÖS!' } as const

class FormulaError extends Error {}

const COLUMNS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function columnName(index: number): string {
  return COLUMNS[index] ?? '?'
}

export function cellName(column: number, row: number): string {
  return `${columnName(column)}${row + 1}`
}

/** `B3` → `{ column: 1, row: 2 }`; érvénytelen címnél `null`. A `$` jeleket figyelmen kívül hagyja. */
export function parseCell(name: string): { column: number; row: number } | null {
  const match = /^\$?([A-Z])\$?(\d+)$/.exec(name.toUpperCase())
  if (!match?.[1] || !match[2]) return null
  return { column: COLUMNS.indexOf(match[1]), row: Number(match[2]) - 1 }
}

/** A tartomány celláinak címe sorfolytonosan, pl. `D2:D4` → `['D2', 'D3', 'D4']`. */
export function expandRange(range: string): string[] {
  const [from, to] = range.split(':')
  const start = parseCell(from ?? '')
  const end = parseCell(to ?? from ?? '')
  if (!start || !end) return []
  const names: string[] = []
  for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
    for (let column = Math.min(start.column, end.column); column <= Math.max(start.column, end.column); column++) {
      names.push(cellName(column, row))
    }
  }
  return names
}

export function isFormula(raw: string | undefined): boolean {
  return raw !== undefined && raw.trim().startsWith('=')
}

type Token =
  | { type: 'number'; value: number }
  | { type: 'string'; value: string }
  | { type: 'name'; value: string }
  | { type: 'op'; value: string }

function tokenize(source: string): Token[] {
  const tokens: Token[] = []
  // Szám tizedesvesszővel, szöveg idézőjelben, név vagy cellacím, műveleti jel.
  const pattern = /\s*(?:(\d+(?:,\d+)?)|"((?:[^"]|"")*)"|(\$?[A-Za-zÁÉÍÓÖŐÚÜŰáéíóöőúüű.]+\$?\d*)|(<=|>=|<>|[-+*/&=<>();:]))/gy
  let position = 0
  while (position < source.length) {
    pattern.lastIndex = position
    const match = pattern.exec(source)
    if (!match) {
      if (source.slice(position).trim() === '') break
      throw new FormulaError(ERROR.value)
    }
    if (match[1] !== undefined) tokens.push({ type: 'number', value: Number(match[1].replace(',', '.')) })
    else if (match[2] !== undefined) tokens.push({ type: 'string', value: match[2].replace(/""/g, '"') })
    else if (match[3] !== undefined) tokens.push({ type: 'name', value: match[3].toUpperCase() })
    else if (match[4] !== undefined) tokens.push({ type: 'op', value: match[4] })
    position = pattern.lastIndex
  }
  return tokens
}

function toNumber(value: CellValue): number {
  if (typeof value === 'number') return value
  if (typeof value === 'boolean') return value ? 1 : 0
  if (value.trim() === '') return 0
  const parsed = Number(value.replace(',', '.'))
  if (Number.isNaN(parsed)) throw new FormulaError(ERROR.value)
  return parsed
}

function compare(left: CellValue, right: CellValue): number {
  if (typeof left === 'string' || typeof right === 'string') return String(left).localeCompare(String(right), 'hu', { sensitivity: 'accent' })
  return toNumber(left) - toNumber(right)
}

/** A DARABTELI feltétele: `">=14"`, `"<>0"`, vagy pontos egyezés. */
function matchesCriterion(value: CellValue, criterion: CellValue): boolean {
  const text = String(criterion)
  const match = /^(<=|>=|<>|<|>|=)(.*)$/.exec(text)
  if (!match?.[1]) return compare(value, criterion) === 0 && String(value) !== ''
  const operand = match[2] ?? ''
  const numeric = operand.trim() !== '' && !Number.isNaN(Number(operand.replace(',', '.')))
  if (numeric && typeof value === 'string' && value.trim() === '') return false
  const difference = compare(numeric ? toNumberOrText(value) : String(value), numeric ? Number(operand.replace(',', '.')) : operand)
  return { '<=': difference <= 0, '>=': difference >= 0, '<>': difference !== 0, '<': difference < 0, '>': difference > 0, '=': difference === 0 }[match[1]] ?? false
}

function toNumberOrText(value: CellValue): CellValue {
  if (typeof value !== 'string') return value
  const parsed = Number(value.replace(',', '.'))
  return value.trim() !== '' && !Number.isNaN(parsed) ? parsed : value
}

const numbersOf = (values: CellValue[]): number[] => values.filter((value): value is number => typeof value === 'number')

type Evaluated = CellValue | CellValue[]

const FUNCTIONS: Readonly<Record<string, (args: Evaluated[]) => CellValue>> = {
  SZUM: (args) => numbersOf(args.flat()).reduce((sum, value) => sum + value, 0),
  ÁTLAG: (args) => {
    const numbers = numbersOf(args.flat())
    if (numbers.length === 0) throw new FormulaError(ERROR.div)
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length
  },
  MIN: (args) => Math.min(...numbersOf(args.flat())),
  MAX: (args) => Math.max(...numbersOf(args.flat())),
  DARAB: (args) => numbersOf(args.flat()).length,
  DARABTELI: (args) => {
    const [range, criterion] = args
    if (!Array.isArray(range) || criterion === undefined || Array.isArray(criterion)) throw new FormulaError(ERROR.value)
    return range.filter((value) => matchesCriterion(value, criterion)).length
  },
  HA: (args) => {
    const [condition, whenTrue, whenFalse] = args
    if (condition === undefined || Array.isArray(condition)) throw new FormulaError(ERROR.value)
    const chosen = toNumber(condition) !== 0 ? whenTrue : (whenFalse ?? false)
    if (chosen === undefined || Array.isArray(chosen)) throw new FormulaError(ERROR.value)
    return chosen
  },
  ÉS: (args) => args.flat().every((value) => toNumber(value) !== 0),
  VAGY: (args) => args.flat().some((value) => toNumber(value) !== 0),
  KEREKÍTÉS: (args) => round(args),
  'KEREK.FEL': (args) => round(args, Math.ceil),
  'KEREK.LE': (args) => round(args, Math.floor),
}

function round(args: Evaluated[], method: (value: number) => number = Math.round): number {
  const [value, digits] = args
  if (value === undefined || Array.isArray(value) || Array.isArray(digits)) throw new FormulaError(ERROR.value)
  const factor = 10 ** toNumber(digits ?? 0)
  return method(toNumber(value) * factor) / factor
}

/** A képletekben használható függvények neve (a súgóhoz és az ellenőrzéshez). */
export const FUNCTION_NAMES: ReadonlyArray<string> = Object.keys(FUNCTIONS)

class Parser {
  private position = 0
  private readonly tokens: Token[]
  private readonly read: (name: string) => CellValue

  constructor(tokens: Token[], read: (name: string) => CellValue) {
    this.tokens = tokens
    this.read = read
  }

  parse(): CellValue {
    const value = this.comparison()
    if (this.position < this.tokens.length || Array.isArray(value)) throw new FormulaError(ERROR.value)
    return value
  }

  private peek(value?: string): Token | undefined {
    const token = this.tokens[this.position]
    return value === undefined || (token?.type === 'op' && token.value === value) ? token : undefined
  }

  private take(value: string): boolean {
    if (!this.peek(value)) return false
    this.position++
    return true
  }

  private scalar(value: Evaluated): CellValue {
    if (Array.isArray(value)) throw new FormulaError(ERROR.value)
    return value
  }

  private comparison(): Evaluated {
    let left = this.concatenation()
    for (;;) {
      const token = this.tokens[this.position]
      if (token?.type !== 'op' || !['=', '<>', '<', '>', '<=', '>='].includes(token.value)) return left
      this.position++
      const difference = compare(this.scalar(left), this.scalar(this.concatenation()))
      left = { '=': difference === 0, '<>': difference !== 0, '<': difference < 0, '>': difference > 0, '<=': difference <= 0, '>=': difference >= 0 }[token.value] ?? false
    }
  }

  private concatenation(): Evaluated {
    let left = this.sum()
    while (this.take('&')) left = `${display(this.scalar(left))}${display(this.scalar(this.sum()))}`
    return left
  }

  private sum(): Evaluated {
    let left = this.product()
    for (;;) {
      if (this.take('+')) left = toNumber(this.scalar(left)) + toNumber(this.scalar(this.product()))
      else if (this.take('-')) left = toNumber(this.scalar(left)) - toNumber(this.scalar(this.product()))
      else return left
    }
  }

  private product(): Evaluated {
    let left = this.unary()
    for (;;) {
      if (this.take('*')) left = toNumber(this.scalar(left)) * toNumber(this.scalar(this.unary()))
      else if (this.take('/')) {
        const divisor = toNumber(this.scalar(this.unary()))
        if (divisor === 0) throw new FormulaError(ERROR.div)
        left = toNumber(this.scalar(left)) / divisor
      } else return left
    }
  }

  private unary(): Evaluated {
    if (this.take('-')) return -toNumber(this.scalar(this.unary()))
    if (this.take('+')) return toNumber(this.scalar(this.unary()))
    return this.primary()
  }

  private primary(): Evaluated {
    const token = this.tokens[this.position++]
    if (!token) throw new FormulaError(ERROR.value)
    if (token.type === 'number' || token.type === 'string') return token.value
    if (token.type === 'op') {
      if (token.value !== '(') throw new FormulaError(ERROR.value)
      const value = this.comparison()
      if (!this.take(')')) throw new FormulaError(ERROR.value)
      return value
    }

    if (this.take('(')) {
      const fn = FUNCTIONS[token.value]
      if (!fn) throw new FormulaError(ERROR.name)
      const args: Evaluated[] = []
      if (!this.take(')')) {
        do args.push(this.comparison())
        while (this.take(';'))
        if (!this.take(')')) throw new FormulaError(ERROR.value)
      }
      return fn(args)
    }

    if (token.value === 'IGAZ') return true
    if (token.value === 'HAMIS') return false
    if (!parseCell(token.value)) throw new FormulaError(ERROR.name)
    if (this.take(':')) {
      const end = this.tokens[this.position++]
      if (end?.type !== 'name' || !parseCell(end.value)) throw new FormulaError(ERROR.ref)
      return expandRange(`${token.value}:${end.value}`).map((name) => this.read(name))
    }
    return this.read(token.value.replace(/\$/g, ''))
  }
}

/** Egy cella értéke: a képletet kiszámolja, a beírt számot számként adja vissza. */
export function evaluateCell(cells: Cells, name: string, visiting: ReadonlySet<string> = new Set()): CellValue {
  const raw = (cells[name] ?? '').trim()
  if (!raw.startsWith('=')) return toNumberOrText(raw)
  if (visiting.has(name)) return ERROR.cycle

  try {
    const next = new Set(visiting).add(name)
    return new Parser(tokenize(raw.slice(1)), (reference) => {
      const value = evaluateCell(cells, reference.replace(/\$/g, ''), next)
      if (typeof value === 'string' && value.startsWith('#')) throw new FormulaError(value)
      return value
    }).parse()
  } catch (error) {
    return error instanceof FormulaError ? error.message : ERROR.value
  }
}

const numberFormat = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 6, useGrouping: false })

/** Megjelenítés magyar szokás szerint: tizedesvessző, IGAZ és HAMIS. */
export function display(value: CellValue): string {
  if (typeof value === 'number') return Number.isFinite(value) ? numberFormat.format(value) : ERROR.value
  if (typeof value === 'boolean') return value ? 'IGAZ' : 'HAMIS'
  return value
}

/** A képlet cellahivatkozásai `$` nélkül, nagybetűvel; a tartományok két vége külön. */
export function referencesOf(raw: string): string[] {
  if (!isFormula(raw)) return []
  return [...raw.replace(/"[^"]*"/g, '').toUpperCase().matchAll(/\$?[A-Z]\$?\d+/g)].map((match) => match[0].replace(/\$/g, ''))
}

/** A képletben meghívott függvények neve. */
export function functionsOf(raw: string): string[] {
  if (!isFormula(raw)) return []
  return [...raw.replace(/"[^"]*"/g, '').toUpperCase().matchAll(/([A-ZÁÉÍÓÖŐÚÜŰ.]+)\s*\(/g)].flatMap((match) => (match[1] ? [match[1]] : []))
}

/**
 * Képlet másolása másik cellába: a relatív hivatkozások a sor- és
 * oszlopeltolással mozdulnak, a `$` jellel rögzítettek a helyükön maradnak.
 */
export function shiftFormula(raw: string, columnDelta: number, rowDelta: number): string {
  if (!isFormula(raw)) return raw
  // Az idézőjeles szövegek érintetlenek maradnak.
  return raw
    .split(/("[^"]*")/)
    .map((part, index) =>
      index % 2 === 1
        ? part
        : part.replace(/(\$?)([A-Za-z])(\$?)(\d+)(?![\w(])/g, (whole, columnFixed: string, column: string, rowFixed: string, row: string) => {
            const columnIndex = COLUMNS.indexOf(column.toUpperCase()) + (columnFixed ? 0 : columnDelta)
            const rowNumber = Number(row) + (rowFixed ? 0 : rowDelta)
            if (columnIndex < 0 || columnIndex >= COLUMNS.length || rowNumber < 1) return whole
            return `${columnFixed}${columnName(columnIndex)}${rowFixed}${rowNumber}`
          }),
    )
    .join('')
}
