import { useEffect, useMemo, useState } from 'react'
import type { ExamAttempt } from './api'

/** `óó:pp:mm` */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const two = (value: number) => String(value).padStart(2, '0')
  return `${two(Math.floor(seconds / 3600))}:${two(Math.floor((seconds % 3600) / 60))}:${two(seconds % 60)}`
}

const timeOf = (iso: string) => new Date(iso).getTime()

export interface AttemptClock {
  /** Vizsgahelyzetben a hátralévő másodperc a szerver órája szerint; gyakorlásnál `null`. */
  remaining: number | null
  /** A kezdés óta eltelt másodperc. */
  elapsed: number
  expired: boolean
}

/**
 * A próbálkozás órája. A szerver órája és a gépé eltérhet: a válasz pillanatában
 * mért különbséggel igazítjuk a gép óráját, így a számláló a szerver szerint jár.
 */
export function useAttemptClock(attempt: ExamAttempt, fetchedAt: number): AttemptClock {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const offset = useMemo(() => {
    const difference = timeOf(attempt.server_time) - fetchedAt
    return Number.isFinite(difference) ? difference : 0
  }, [attempt.server_time, fetchedAt])
  const serverNow = now + offset

  const remaining = attempt.deadline ? (timeOf(attempt.deadline) - serverNow) / 1000 : null
  const elapsed = (serverNow - timeOf(attempt.started_at)) / 1000
  return { remaining, elapsed, expired: remaining !== null && remaining <= 0 }
}
