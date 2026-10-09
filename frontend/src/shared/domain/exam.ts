import type { Level } from '../../types'
import { env } from '../config/env'
import type { IconName } from '../ui/Icon'

/** Az írásbeli (gyakorlati) vizsga egy része a hivatalos követelmények szerint. */
export interface ExamPart {
  key: 'szoveg' | 'vizualis' | 'tablazat' | 'adatbazis' | 'programozas' | 'dokumentum'
  name: string
  points: number
  minutes: number
  icon: IconName
}

/** Középszint: 180 perc, 100 pont. Emelt szint: 240 perc, 120 pont (és 30 pontos szóbeli). */
export const EXAM_PARTS: Readonly<Record<Level, ReadonlyArray<ExamPart>>> = {
  kozep: [
    { key: 'szoveg', name: 'Szövegszerkesztés', points: 25, minutes: 45, icon: 'doc' },
    { key: 'vizualis', name: 'Vizuális elemek', points: 20, minutes: 35, icon: 'slides' },
    { key: 'tablazat', name: 'Táblázatkezelés', points: 25, minutes: 40, icon: 'sheet' },
    { key: 'adatbazis', name: 'Adatbázis-kezelés', points: 15, minutes: 30, icon: 'db' },
    { key: 'programozas', name: 'Algoritmizálás és programozás', points: 15, minutes: 30, icon: 'code' },
  ],
  emelt: [
    { key: 'dokumentum', name: 'Dokumentumkészítés vagy táblázatkezelés', points: 35, minutes: 70, icon: 'doc' },
    { key: 'adatbazis', name: 'Adatbázis-kezelés', points: 35, minutes: 70, icon: 'db' },
    { key: 'programozas', name: 'Algoritmizálás és programozás', points: 50, minutes: 100, icon: 'code' },
  ],
}

export const EXAM_TOTAL: Readonly<Record<Level, { points: number; minutes: number }>> = {
  kozep: { points: 100, minutes: 180 },
  emelt: { points: 120, minutes: 240 },
}

/** A hat tanulási út ikonja a képzési ág slugja alapján; ismeretlen ágnál könyv. */
export function trackIcon(slug: string): IconName {
  if (/prog|python|csharp|algo/.test(slug)) return 'code'
  if (/adatb|sql/.test(slug)) return 'db'
  if (/tabl|excel|calc/.test(slug)) return 'sheet'
  if (/szoveg|word|dokument/.test(slug)) return 'doc'
  if (/graf|bemutat|vizual|prezent/.test(slug)) return 'slides'
  if (/web|html/.test(slug)) return 'globe'
  if (/szobeli/.test(slug)) return 'mic'
  return 'book'
}

/** Hány nap van még az írásbeli érettségiig (legalább 0). */
export function daysUntilExam(now: number = Date.now()): number {
  const exam = new Date(`${env.examDate}T08:00:00`).getTime()
  return Math.max(0, Math.ceil((exam - now) / 86_400_000))
}

/** Heti két feladattal ennyi jön össze a vizsgáig. */
export function tasksUntilExam(days: number): number {
  return Math.floor(days / 7) * 2
}
