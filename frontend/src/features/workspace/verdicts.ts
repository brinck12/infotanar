import { formatTimeLimit } from '../../shared/domain/limits'
import type { ExecutionLimits, RunResponse, TestResult, Verdict } from '../../types'

export type VerdictTone = 'success' | 'danger' | 'warning' | 'compile' | 'runtime' | 'rule' | 'neutral'

interface VerdictMeta {
  /** Tartalék felirat, ha a backend nem küld `verdict_label`-t. */
  label: string
  /** Rövid, a következő lépésre utaló tanács a diáknak. */
  hint: string
  tone: VerdictTone
}

/** Minden állapot saját színnel, ikonnal ÉS szöveggel (nem csak színnel) jelenik meg (#35). */
export const VERDICT_META: Readonly<Record<Verdict, VerdictMeta>> = {
  accepted: {
    label: 'Elfogadva',
    hint: 'Minden teszt sikeres, a megoldásod helyes kimenetet ad.',
    tone: 'success',
  },
  wrong_answer: {
    label: 'Hibás kimenet',
    hint: 'A program lefutott, de a kimenete eltér az elvárttól. Hasonlítsd össze a két kimenetet soronként.',
    tone: 'danger',
  },
  time_limit_exceeded: {
    label: 'Időkorlát túllépve',
    hint: 'A program túl sokáig futott. Keress végtelen ciklust, vagy gyorsabb megoldást.',
    tone: 'warning',
  },
  compilation_error: {
    label: 'Fordítási / szintaktikai hiba',
    hint: 'A kód el sem indult. A fordító üzenete megmutatja, melyik sorban van a hiba.',
    tone: 'compile',
  },
  runtime_error: {
    label: 'Futásidejű hiba',
    hint: 'A program futás közben hibával leállt. Nézd meg a hibakimenetet.',
    tone: 'runtime',
  },
  constraint_violation: {
    label: 'Szabálysértés',
    hint: 'A megoldás nem tartja be a feladat kódszabályait, ezért nem futott le.',
    tone: 'rule',
  },
  system_error: {
    label: 'Rendszerhiba',
    hint: 'Ez nem a te hibád: a kiértékelés most nem sikerült. Próbáld újra kicsit később.',
    tone: 'neutral',
  },
}

/** Az állapothoz tartozó tanács; időtúllépésnél a ténylegesen érvényes korláttal, ha ismert. */
export function verdictHint(verdict: Verdict, limits?: ExecutionLimits): string {
  if (verdict === 'time_limit_exceeded' && limits) {
    return `A program túllépte az időkorlátot (${formatTimeLimit(limits.time_limit_ms)}). Keress végtelen ciklust, vagy gyorsabb megoldást.`
  }

  return VERDICT_META[verdict].hint
}

/** Mockolt vagy régebbi válaszoknál a verdict hiányozhat: a státuszból következtetünk. */
export function runVerdict(result: RunResponse): Verdict {
  if (result.verdict) return result.verdict
  return result.status === 'passed' ? 'accepted' : result.status === 'failed' ? 'wrong_answer' : 'system_error'
}

export function testVerdict(result: TestResult): Verdict {
  return result.verdict ?? (result.passed ? 'accepted' : result.error ? 'system_error' : 'wrong_answer')
}
