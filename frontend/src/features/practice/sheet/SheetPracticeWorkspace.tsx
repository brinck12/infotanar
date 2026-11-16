import { useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { userKeyOf, userStorageKey } from '../../../shared/domain/userStorage'
import { isStringRecord, usePersistentState } from '../../../shared/hooks/usePersistentState'
import { Badge } from '../../../shared/ui/Badge'
import { Banner } from '../../../shared/ui/Banner'
import { Button } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import { SheetGrid } from '../../../shared/ui/SheetGrid'
import { TaskBrief } from '../../../shared/ui/TaskBrief'
import type { SheetPracticeInfo, UnlockedTaskDetail } from '../../../types'
import { useAuth } from '../../auth/context'
import { runSheetChecks } from './checks'
import { cellName, display, evaluateCell, parseCell, shiftFormula, type Cells } from './formula'

/**
 * Böngészős táblázatos gyakorló: kis munkalap képletsávval és élő
 * ellenőrzőlistával, telepített program nélkül. Rövid leckegyakorlatokhoz
 * való; a vizsgafeladatok a tanuló saját programjában készülnek.
 */
export function SheetPracticeWorkspace({ task, info }: { task: UnlockedTaskDetail; info: SheetPracticeInfo }) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  // A munka a böngészőben megmarad (felhasználónként és feladatonként), újratöltés után is.
  const [cells, setCells] = usePersistentState<Cells>(userStorageKey('practice', userKeyOf(user), 'sheet', task.id), info.cells, isStringRecord)
  const [history, setHistory] = useState<Cells[]>([])
  const [selected, setSelected] = useState('A1')
  const [draft, setDraft] = useState(cells['A1'] ?? '')

  const results = useMemo(() => runSheetChecks(info, cells), [info, cells])
  const done = results.filter((result) => result.state === 'ok').length

  function select(cell: string) {
    setSelected(cell)
    setDraft(cells[cell] ?? '')
  }

  /** Közvetlen szerkesztés: a cellára gépelt karakter a képletsávba kerül, ott folytatódik a beírás. */
  function edit(cell: string, text: string | null) {
    setSelected(cell)
    setDraft(text ?? cells[cell] ?? '')
    inputRef.current?.focus()
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
    if (place && place.row + 1 < info.rows) select(cellName(place.column, place.row + 1))
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
    setCells(info.cells)
    setHistory([])
    setDraft(info.cells[selected] ?? '')
  }

  return (
    <main className="mx-auto flex w-full max-w-work flex-wrap items-start gap-6 px-4 py-6 md:px-6">
      <TaskBrief
        task={task}
        badges={<Badge kind="lang">Böngészős gyakorló</Badge>}
        checklistTitle="Ellenőrzőlista"
        score={`${done} / ${results.length} kész`}
        checks={results.map((result) => ({ id: result.check.id, state: result.state, text: result.check.label, points: result.state === 'ok' ? 1 : 0, maxPoints: 1, found: result.found, hint: result.hint }))}
        footer={
          <Banner kind="info" title="Tipp" className="mt-6">
            A vizsgán magyar beállítású a program: a paramétereket pontosvessző választja el, a tizedesjel vessző. Például:{' '}
            <code>=HA(C2&gt;=14; "Átlépte"; "Rendben")</code>
          </Banner>
        }
      />

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
            ref={inputRef}
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
            onEdit={edit}
            valueOf={(cell) => display(evaluateCell(cells, cell))}
          />
        </div>
        <p className="mt-2 inline-block rounded-b-md border border-t-0 border-line bg-sheet px-4 py-1.5 text-14 font-semibold">Munka1</p>

        <p className="mt-4 text-14 leading-relaxed text-ink-soft">
          Jelölj ki egy cellát, és kezdj el gépelni (vagy nyomj F2-t), vagy írd a tartalmát a képletsávba, és nyomj Entert. Az ellenőrzés a cellák tartalmát és képleteit nézi, és
          magától frissül.
        </p>
      </Panel>
    </main>
  )
}
