/** Ennyi arány (a pontok 80 százaléka) kell ahhoz, hogy egy fájlfeladat vagy vizsga megoldottnak számítson. */
export const SOLVED_THRESHOLD = 0.8

export interface SolvedVerdict {
  solved: boolean
  /** Egy mondat arról, megoldottnak számít-e, és miért. */
  sentence: string
}

/** A „megoldva / nem” mondat a megszerzett és a maximális pontból. */
export function solvedVerdict(score: number, max: number, subject: string): SolvedVerdict {
  const percent = max > 0 ? Math.floor((score / max) * 100) : 0
  const needed = Math.round(SOLVED_THRESHOLD * 100)
  const solved = max > 0 && score / max >= SOLVED_THRESHOLD
  return {
    solved,
    sentence: solved
      ? `${subject} megoldottnak számít: a pontok ${percent} százalékát megszerezted, a határ ${needed} százalék.`
      : `${subject} még nem számít megoldottnak: ${percent} százalékot értél el, ${needed} százalék kell hozzá.`,
  }
}
