import { useEffect, useRef, useState } from 'react'
import { Badge } from '../../../shared/ui/Badge'
import { Button } from '../../../shared/ui/Button'
import { CodeBlock } from '../../../shared/ui/CodeBlock'
import { Panel } from '../../../shared/ui/Panel'
import { ResultDiff, ResultRow } from '../../../shared/ui/ResultRow'

type Phase = 'idle' | 'run' | 'submit'

const STEP_MS = 420

const code = (fixed: boolean) =>
  ['n = int(input())', 'osszeg = 0', 'for _ in range(n):', '    szam = int(input())', fixed ? '    osszeg += szam' : '    osszeg = szam', 'print(osszeg)'].join('\n')

const TESTS = [
  { name: '1. teszteset', hidden: false, input: '3, 5, 10, 15', expected: '30', got: '15', buggyPass: false },
  { name: '2. teszteset', hidden: false, input: '1, 42', expected: '42', got: '42', buggyPass: true },
  { name: '3. teszteset', hidden: true, input: '', expected: '', got: '', buggyPass: false },
  { name: '4. teszteset', hidden: true, input: '', expected: '', got: '', buggyPass: true },
] as const

/**
 * A kezdőlap élő mintája: futtatás, a hiba kijavítása, beadás rejtett
 * tesztekkel. Nem hív szervert; a sorok a felhasználó kattintására, egyenként
 * jelennek meg (csökkentett mozgásnál egyszerre).
 */
export function LiveDemo() {
  const [fixed, setFixed] = useState(false)
  const [phase, setPhase] = useState<Phase>('run')
  const [shown, setShown] = useState(2)
  const timers = useRef<number[]>([])

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current.length = 0
  }
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((timer) => window.clearTimeout(timer))
  }, [])

  function reveal(next: Exclude<Phase, 'idle'>) {
    clearTimers()
    const total = next === 'run' ? 2 : 4
    setPhase(next)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(total)
      return
    }
    setShown(0)
    for (let i = 1; i <= total; i++) timers.current.push(window.setTimeout(() => setShown(i), STEP_MS * i))
  }

  function toggleFix() {
    clearTimers()
    setFixed((value) => !value)
    setPhase('idle')
    setShown(0)
  }

  const total = phase === 'submit' ? 4 : 2
  const rows = phase === 'idle' ? [] : TESTS.slice(0, Math.min(shown, total)).map((test) => Object.assign({ pass: fixed || test.buggyPass }, test))
  const done = phase !== 'idle' && shown >= total
  const passed = rows.filter((row) => row.pass).length

  let summary = 'Még nem futtattál kódot.'
  let hint = 'Nyomd meg a Futtatás gombot.'
  if (phase !== 'idle' && !done) {
    summary = 'Futtatás folyamatban…'
    hint = ''
  } else if (done) {
    summary = `${passed} / ${total} teszteset sikeres`
    if (phase === 'run') hint = 'Beadáskor további 2 rejtett teszteset is lefut.'
    else if (passed === total) hint = 'A rejtett teszteseteket is beleszámolva. A tétel teljesítve.'
    else hint = 'A rejtett teszteseteket is beleszámolva.'
  }

  return (
    <Panel kind="work" pad="none" className="overflow-hidden" data-testid="live-demo">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-grid px-5 py-4">
        <span className="mr-1 font-serif text-18 font-semibold">Összegzés tétele</span>
        <Badge kind="kozep">Középszint</Badge>
        <Badge kind="lang">Python 3</Badge>
        <span className="flex-auto" />
        <span className="text-13 text-ink-soft">Kötelező: ciklus. Tiltott: sum().</span>
      </div>

      <CodeBlock code={code(fixed)} language="python" label="A minta kódja" />

      <div className="on-dark flex flex-wrap items-center gap-3 border-t border-code-line bg-code px-5 py-3">
        <Button icon="play" onClick={() => reveal('run')}>
          Futtatás
        </Button>
        <Button variant="dark" onClick={() => reveal('submit')}>
          Beadás
        </Button>
        <span className="flex-auto" />
        <button type="button" onClick={toggleFix} className="min-h-11 px-1 text-15 font-semibold text-code-builtin underline underline-offset-4">
          {fixed ? 'Vissza a hibás kódhoz' : 'Javítsd ki a hibát'}
        </button>
      </div>

      <div aria-live="polite" className="px-5 pt-4 pb-5">
        <p className="text-16 font-bold">{summary}</p>
        {hint && <p className="mt-1 text-14 leading-normal text-ink-soft">{hint}</p>}
        <ul className="mt-3">
          {rows.map((row) => (
            <ResultRow key={row.name} passed={row.pass} name={row.name} hidden={row.hidden} verdict={row.pass ? 'Elfogadva' : 'Hibás kimenet'}>
              {!row.pass && !row.hidden && <ResultDiff input={row.input} expected={row.expected} got={row.got} />}
            </ResultRow>
          ))}
        </ul>
      </div>
    </Panel>
  )
}
