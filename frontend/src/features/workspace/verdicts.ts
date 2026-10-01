import type { CustomRunResult, RunResponse, RunResultItem, TestResult, Verdict } from '../../types'

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
  completed: {
    label: 'Lefutott',
    hint: 'A program lefutott a megadott bemenettel. Ez nem tesztelés: lent látod, mit írt ki.',
    tone: 'neutral',
  },
  system_error: {
    label: 'Rendszerhiba',
    hint: 'Ez nem a te hibád: a kiértékelés most nem sikerült. Próbáld újra kicsit később.',
    tone: 'neutral',
  },
}

/** Mockolt vagy régebbi válaszoknál a verdict hiányozhat: a státuszból következtetünk. */
export function runVerdict(result: RunResponse): Verdict {
  if (result.verdict) return result.verdict
  return result.status === 'passed' ? 'accepted' : result.status === 'failed' ? 'wrong_answer' : 'system_error'
}

export const isCustomRunResult = (item: RunResultItem): item is CustomRunResult => item.kind === 'custom'

export const isTestResult = (item: RunResultItem): item is TestResult => item.kind !== 'custom'

export function testVerdict(result: TestResult): Verdict {
  return result.verdict ?? (result.passed ? 'accepted' : result.error ? 'system_error' : 'wrong_answer')
}
