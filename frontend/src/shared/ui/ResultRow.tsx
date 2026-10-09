import type { ReactNode } from 'react'
import { Badge } from './Badge'
import { cx } from './cx'
import { StateIcon } from './Icon'

interface ResultRowProps {
  passed: boolean
  name: string
  /** Az ítélet szövege (pl. „Elfogadva”, „Hibás kimenet”). */
  verdict: string
  /** Rejtett teszt: csak az ítélet látszik, adat soha. */
  hidden?: boolean
  /** Jobb szélre kerülő mérőszámok (futási idő, kilépési kód). */
  meta?: ReactNode
  children?: ReactNode
  'data-verdict'?: string
}

/** Egy teszteset sora: állapotjel, név, ítélet, alatta az eltérés. */
export function ResultRow({ passed, name, verdict, hidden = false, meta, children, ...rest }: ResultRowProps) {
  return (
    <li data-testid="test-result" data-passed={passed} className="flex gap-3 border-t border-grid py-3" {...rest}>
      <StateIcon kind={passed ? 'ok' : 'bad'} label={passed ? 'Sikeres' : 'Sikertelen'} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span className="text-15 font-semibold">{name}</span>
          {hidden && <Badge kind="hidden">Rejtett</Badge>}
          <Badge kind={passed ? 'ok' : 'bad'}>{verdict}</Badge>
          {meta && <span className="ml-auto">{meta}</span>}
        </div>
        {children}
      </div>
    </li>
  )
}

/** Rövid, egysoros eltérés: Bemenet, Várt, Kapott. */
export function ResultDiff({ input, expected, got }: { input?: string; expected: string; got: string }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-13 leading-normal text-ink-soft">
      {input !== undefined && (
        <span>
          Bemenet: <span className="text-ink">{input}</span>
        </span>
      )}
      <span>
        Várt: <span className="font-medium text-accent">{expected}</span>
      </span>
      <span>
        Kapott: <span className="font-medium text-wrong">{got}</span>
      </span>
    </div>
  )
}

/** Többsoros kimenet saját dobozban; a hibás kimenet piros keretet és jelölést kap. */
export function OutputBlock({ label, value, wrong = false }: { label: string; value?: string; wrong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="mb-1 text-13 font-semibold text-ink-soft">{label}</p>
      <pre
        className={cx(
          'max-h-40 overflow-auto rounded-sm border bg-headrow p-2 text-13 leading-normal whitespace-pre-wrap text-ink',
          wrong ? 'border-wrong' : 'border-line',
        )}
      >
        {value === undefined || value === '' ? '(üres)' : value}
      </pre>
    </div>
  )
}
