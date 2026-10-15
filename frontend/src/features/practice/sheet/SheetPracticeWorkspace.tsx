import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { usePersistentState } from '../../../shared/hooks/usePersistentState'
import { Badge, LevelBadge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import { Prose } from '../../../shared/ui/Prose'
import { RubricItem } from '../../../shared/ui/RubricItem'
import { SheetGrid } from '../../../shared/ui/SheetGrid'
import { CardTitle } from '../../../shared/ui/Text'
import type { SheetPracticeInfo, UnlockedTaskDetail } from '../../../types'
import { useAuth } from '../../auth/context'
import { errorHint, errorOf, runSheetChecks } from './checks'
import { cellName, display, evaluateCell, parseCell, shiftFormula, type Cells } from './formula'

function isCells(value: unknown): value is Cells {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every((cell) => typeof cell === 'string')
}

/**
 * Böngészős táblázatos gyakorló: kis munkalap képletsávval és élő
 * ellenőrzőlistával, telepített program nélkül. Rövid leckegyakorlatokhoz
 * való; a vizsgafeladatok a tanuló saját programjában készülnek.
 */
export function SheetPracticeWorkspace({ task, info }: { task: UnlockedTaskDetail; info: SheetPracticeInfo }) {
  const inputId = useId()
  const { user } = useAuth()
  // A munkalap piszkozata a böngészőben marad (felhasználónként és feladatonként), újratöltés után is.
  const [cells, setCells] = usePersistentState<Cells>(`infotanar.sheet.v1.${user?.id ?? 'guest'}.${task.id}`, info.cells, isCells)
  const [history, setHistory] = useState<Cells[]>([])
  const [selected, setSelected] = useState('A1')
  const [draft, setDraft] = useState(cells['A1'] ?? '')
  const [editing, setEditing] = useState(false)
  const editingRef = useRef(false)

  const results = useMemo(() => runSheetChecks(info, cells), [info, cells])
  const selectedError = errorOf(cells, selected)
  const errorMessage = selectedError ? { error: selectedError, hint: errorHint(selectedError) } : null
  const done = results.filter((result) => result.state === 'ok').length

  function select(cell: string) {
    setSelected(cell)
    setDraft(cells[cell] ?? '')
  }

  function startEdit(initial?: string) {
    editingRef.current = true
    setEditing(true)
    setDraft(initial ?? cells[selected] ?? '')
  }

  function cancelEdit() {
    editingRef.current = false
    setEditing(false)
    setDraft(cells[selected] ?? '')
  }

  /** Cellán belüli szerkesztés vége: Enter lefelé, Tab jobbra lép, a fókuszvesztés helyben marad. */
  function commitEdit(move: 'down' | 'right' | 'none') {
    if (!editingRef.current) return
    editingRef.current = false
    setEditing(false)
    const next = (cells[selected] ?? '') !== draft ? { ...cells, [selected]: draft } : cells
    if (next !== cells) apply(next)
    const place = parseCell(selected)
    if (!place || move === 'none') return
    const column = move === 'right' ? Math.min(info.columns - 1, place.column + 1) : place.column
    const row = move === 'down' ? Math.min(info.rows - 1, place.row + 1) : place.row
    const name = cellName(column, row)
    setSelected(name)
    setDraft(next[name] ?? '')
  }

  function apply(next: Cells) {
    setHistory((past) => [...past, cells])
    setCells(next)
  }

  function commit(e: FormEvent) {
    e.preventDefault()
    if ((cells[selected] ?? '') !== draft) apply({ ...cells, [selected]: draft })
    // Enter után a következő sorra lépünk, ahogy a táblázatkezelőkben.
    const place = parseCell(selected)
    if (place && place.row + 1 < info.rows) {
      setSelected(cellName(place.column, place.row + 1))
      setDraft(cells[cellName(place.column, place.row + 1)] ?? '')
    }
  }

  /** A kijelölt cella tartalmát lemásolja az alatta lévő cellákba, amíg a bal oldali oszlopban adat van. */
  function fillDown() {
    const place = parseCell(selected)
    const source = cells[selected] ?? ''
    if (!place || source === '') return
    const next = { ...cells }
    for (let row = place.row + 1; row < info.rows; row++) {
      const neighbour = place.column > 0 ? (cells[cellName(place.column - 1, row)] ?? '') : ''
      if (neighbour === '') break
      next[cellName(place.column, row)] = shiftFormula(source, 0, row - place.row)
    }
    apply(next)
  }

  function undo() {
    const previous = history[history.length - 1]
    if (!previous) return
    setHistory((past) => past.slice(0, -1))
    setCells(previous)
    setDraft(previous[selected] ?? '')
  }

  function reset() {
    editingRef.current = false
    setEditing(false)
    setCells(info.cells)
    setHistory([])
    setDraft(info.cells[selected] ?? '')
  }

  return (
    <main className="mx-auto flex w-full max-w-work flex-wrap items-start gap-6 px-4 py-6 md:px-6">
      <Panel as="section" pad="xl" aria-label="Feladat leírása" className="min-w-0 flex-1 basis-100 lg:max-w-form">
        <h1 className="font-serif text-32 leading-tight font-semibold tracking-tight">{task.title}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <LevelBadge level={task.level} />
          <Badge kind="lang">Böngészős gyakorló</Badge>
        </div>
        <Prose markdown={task.description} className="mt-6" />

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
          <CardTitle>Ellenőrzőlista</CardTitle>
          <span className="text-15 font-semibold">
            {done} / {results.length} kész
          </span>
        </div>
        <ul className="mt-2" aria-live="polite">
          {results.map((result) => (
            <RubricItem
              key={result.check.id}
              state={result.state}
              text={result.check.label}
              points={result.state === 'ok' ? 1 : 0}
              maxPoints={1}
              found={result.found}
              hint={result.hint}
            />
          ))}
        </ul>

        <Banner kind="info" title="Tipp" className="mt-6">
          A vizsgán magyar beállítású a program: a paramétereket pontosvessző választja el, a tizedesjel vessző. Például:{' '}
          <code>=HA(C2&gt;=14; "Átlépte"; "Rendben")</code>
        </Banner>
      </Panel>

      <Panel kind="work" pad="lg" as="section" aria-label="Munkalap" className="min-w-0 flex-1 basis-120">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" icon="chevron-down" onClick={fillDown}>
            Kitöltés lefelé
          </Button>
          <Button variant="secondary" icon="undo" disabled={history.length === 0} onClick={undo}>
            Visszavonás
          </Button>
          <span className="flex-auto" />
          <Button variant="text" onClick={reset}>
            Visszaállítás
          </Button>
        </div>

        <form onSubmit={commit} className="mt-4 flex items-stretch overflow-hidden rounded-md border border-muted">
          <span className="flex w-14 flex-none items-center justify-center border-r border-line bg-headrow font-mono text-14 font-medium" aria-hidden="true">
            {selected}
          </span>
          <label htmlFor={inputId} className="flex flex-none items-center border-r border-line px-3 font-serif text-15 text-ink-soft italic">
            <span aria-hidden="true">fx</span>
            <span className="sr-only">A(z) {selected} cella tartalma</span>
          </label>
          <input
            id={inputId}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            className="min-h-11 min-w-0 flex-1 bg-sheet px-3 font-mono text-14"
          />
          <button type="submit" className="min-h-11 flex-none border-l border-line bg-sheet px-4 text-15 font-semibold hover:bg-note">
            Beírás
          </button>
        </form>

        <div className="mt-4">
          <SheetGrid
            label="Munka1 munkalap"
            columns={info.columns}
            rows={info.rows}
            selected={selected}
            onSelect={select}
            valueOf={(cell) => display(evaluateCell(cells, cell))}
            editor={{ active: editing, value: draft, onStart: startEdit, onChange: setDraft, onCommit: commitEdit, onCancel: cancelEdit }}
          />
        </div>
        {errorMessage && (
          <Banner kind="warn" title={`${selected}: ${errorMessage.error}`} className="mt-4" data-testid="sheet-error-hint">
            {errorMessage.hint ?? 'A képlet hibaértéket ad, ezért az ellenőrzés nem fogadja el. Javítsd ki a képletet.'}
          </Banner>
        )}
        <p className="mt-2 inline-block rounded-b-md border border-t-0 border-line bg-sheet px-4 py-1.5 text-14 font-semibold">Munka1</p>

        <p className="mt-4 text-14 leading-relaxed text-ink-soft">
          Kattints egy cellára, és kezdj el gépelni: az Enter lefelé, a Tab jobbra lép, az Esc elveti a módosítást. Dupla kattintással vagy F2-vel a meglévő tartalmat szerkesztheted, a képletsáv is használható. A munkád ebben a böngészőben megmarad. Az ellenőrzés a cellák tartalmát és képleteit nézi, és
          magától frissül.
        </p>
      </Panel>
    </main>
  )
}
