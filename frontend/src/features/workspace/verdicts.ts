import { formatTimeLimit } from '../../shared/domain/limits'
import type { ExecutionLimits, RunResponse, TestResult, Verdict } from '../../types'

interface VerdictMeta {
  /** Tartalék felirat, ha a backend nem küld `verdict_label`-t. */
  label: string
  /** Rövid, a következő lépésre utaló tanács a diáknak. */
  hint: string
}

/** Minden állapot ikonnal ÉS szöveggel jelenik meg, nem csak színnel (#35). */
export const VERDICT_META: Readonly<Record<Verdict, VerdictMeta>> = {
  accepted: {
    label: 'Elfogadva',
    hint: 'Minden teszt sikeres, a megoldásod helyes kimenetet ad.',
  },
  wrong_answer: {
    label: 'Hibás kimenet',
    hint: 'A program lefutott, de a kimenete eltér az elvárttól. Hasonlítsd össze a két kimenetet soronként.',
  },
  time_limit_exceeded: {
    label: 'Időkorlát túllépve',
    hint: 'A program túl sokáig futott. Keress végtelen ciklust, vagy gyorsabb megoldást.',
  },
  compilation_error: {
    label: 'Fordítási / szintaktikai hiba',
    hint: 'A kód el sem indult. A fordító üzenete megmutatja, melyik sorban van a hiba.',
  },
  runtime_error: {
    label: 'Futásidejű hiba',
    hint: 'A program futás közben hibával leállt. Nézd meg a hibakimenetet.',
  },
  constraint_violation: {
    label: 'Szabálysértés',
    hint: 'A megoldás nem tartja be a feladat kódszabályait, ezért nem futott le.',
  },
  system_error: {
    label: 'Rendszerhiba',
    hint: 'Ez nem a te hibád: a kiértékelés most nem sikerült. Próbáld újra kicsit később.',
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
