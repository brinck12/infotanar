import { EXAM_PARTS, EXAM_TOTAL, type ExamPart } from '../../shared/domain/exam'
import type { Level } from '../../types'

/**
 * Az Oktatási Hivatal nyilvános feladatlapjai (2024 májusától). A címek a
 * hivatalos letöltőoldal mintáját követik: `fl` a feladatlap, `ut` a
 * javítási-értékelési útmutató.
 */
export interface OfficialPaper {
  key: string
  title: string
  level: Level
  minutes: number
  points: number
  parts: ReadonlyArray<ExamPart>
  taskSheetUrl: string
  guideUrl: string
}

const SESSIONS = [
  { year: 2026, month: 'maj', season: 'tavasz', label: '2026. május' },
  { year: 2025, month: 'okt', season: 'osz', label: '2025. október' },
  { year: 2025, month: 'maj', season: 'tavasz', label: '2025. május' },
  { year: 2024, month: 'okt', season: 'osz', label: '2024. október' },
  { year: 2024, month: 'maj', season: 'tavasz', label: '2024. május' },
] as const

const LEVELS: ReadonlyArray<Level> = ['kozep', 'emelt']

function paperUrl(year: number, season: string, month: string, level: Level, kind: 'fl' | 'ut'): string {
  const yy = String(year).slice(2)
  const letter = level === 'kozep' ? 'k' : 'e'
  return `https://dload-oktatas.educatio.hu/erettsegi/feladatok_${year}${season}_${level}/${letter}_digkult_${yy}${month}_${kind}.pdf`
}

export const OFFICIAL_PAPERS: ReadonlyArray<OfficialPaper> = SESSIONS.flatMap((session) =>
  LEVELS.map((level) => ({
    key: `${session.year}-${session.month}-${level}`,
    title: session.label,
    level,
    minutes: EXAM_TOTAL[level].minutes,
    points: EXAM_TOTAL[level].points,
    parts: EXAM_PARTS[level],
    taskSheetUrl: paperUrl(session.year, session.season, session.month, level, 'fl'),
    guideUrl: paperUrl(session.year, session.season, session.month, level, 'ut'),
  })),
)
