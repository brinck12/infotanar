import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { httpStatus } from '../../shared/api/errors'
import { userKeyOf } from '../../shared/domain/lastTask'
import { usePersistentState } from '../../shared/hooks/usePersistentState'
import { useToast } from '../../shared/ui/useToast'
import { useAuth } from '../auth/context'
import { oralKeys, oralPracticeQuery, recordOralAttempt, saveOralPractice, type OralPracticeInput, type OralPracticeRow } from './api'
import { EMPTY_PRACTICE, forgetStoredPractice, isOralPractice, practiceKey, readPractice, readStoredPractice, type OralPractice } from './practice'
import { ORAL_TOPICS } from './topics'

/** Ennyi nyugalom után megy fel a jegyzet és az önértékelés (a végpont 60/perc). */
const SAVE_DELAY_MS = 800

function upsertRow(queryClient: QueryClient, row: OralPracticeRow) {
  queryClient.setQueryData<OralPracticeRow[]>(oralKeys.practice(), (rows = []) =>
    rows.some((item) => item.topic === row.topic) ? rows.map((item) => (item.topic === row.topic ? row : item)) : [...rows, row],
  )
}

export interface OralPracticesState {
  /** Belépve a szerver válasza még nem jött meg. */
  loading: boolean
  /** Igaz, ha a gyakorlás a fiókhoz kerül; hamis, ha csak ebben a böngészőben marad. */
  storedOnServer: boolean
  rowOf: (slug: string) => OralPracticeRow | undefined
  attemptsOf: (slug: string) => number
}

/**
 * Az összes szóbeli téma gyakorlási állapota. Belépve a szerver az igazság;
 * vendégnél, és amíg a végpont nincs kint (404), a böngésző.
 *
 * Egyszeri átköltöztetés: ahol a szerveren még nincs sor, de ebben a
 * böngészőben van mentés, felküldjük (a gyakorlások számával együtt), és
 * siker után töröljük a helyi példányt.
 */
export function useOralPractices(): OralPracticesState {
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const signedIn = user !== null
  const userKey = userKeyOf(user)
  const server = useQuery({ ...oralPracticeQuery(), enabled: signedIn, retry: (count, error) => httpStatus(error) !== 404 && count < 2 })
  const unavailable = httpStatus(server.error) === 404
  const rows = server.data
  const started = useRef(new Set<string>())

  useEffect(() => {
    if (!rows) return
    for (const topic of ORAL_TOPICS) {
      const marker = `${userKey}:${topic.slug}`
      if (started.current.has(marker) || rows.some((row) => row.topic === topic.slug)) continue
      const stored = readStoredPractice(userKey, topic.slug)
      if (stored === null) continue

      started.current.add(marker)
      void (async () => {
        const attempts = Array.from({ length: stored.attempts })
        const row = await attempts.reduce<Promise<OralPracticeRow>>(
          (previous) => previous.then(() => recordOralAttempt(topic.slug)),
          saveOralPractice(topic.slug, { checked: stored.checked, notes: stored.notes, scores: stored.scores }),
        )
        upsertRow(queryClient, row)
        forgetStoredPractice(userKey, topic.slug)
      })().catch(() => {
        // Nem sikerült: a helyi példány megmarad, és a következő mentés viszi fel.
      })
    }
  }, [rows, userKey, queryClient])

  const storedOnServer = signedIn && !unavailable
  const rowOf = useCallback((slug: string) => rows?.find((row) => row.topic === slug), [rows])
  const attemptsOf = useCallback(
    (slug: string) => (storedOnServer ? (rowOf(slug)?.attempts ?? readPractice(userKey, slug).attempts) : readPractice(userKey, slug).attempts),
    [storedOnServer, rowOf, userKey],
  )

  return { loading: authLoading || (signedIn && server.isPending), storedOnServer, rowOf, attemptsOf }
}

export interface OralTopicPracticeState {
  loading: boolean
  practice: OralPractice
  storedOnServer: boolean
  /** A jegyzet, a kipipált pontok vagy az önértékelés változása; a mentés késleltetve megy. */
  update: (patch: Partial<OralPracticeInput>) => void
  /** Egy gyakorlás vége: a számláló nő. */
  recordAttempt: () => Promise<void>
}

/** Egy téma gyakorlása: belépve a szerveren, vendégnél (vagy 404-nél) a böngészőben. */
export function useOralTopicPractice(slug: string): OralTopicPracticeState {
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const userKey = userKeyOf(user)
  const { loading, storedOnServer, rowOf } = useOralPractices()
  const [local, saveLocal] = usePersistentState<OralPractice>(practiceKey(userKey, slug), EMPTY_PRACTICE, isOralPractice)
  const [draft, setDraft] = useState<OralPracticeInput | null>(null)
  const timer = useRef<number | null>(null)
  const pending = useRef<OralPracticeInput | null>(null)

  const row = rowOf(slug)
  const stored = readStoredPractice(userKey, slug)
  const base: OralPractice = row ?? stored ?? EMPTY_PRACTICE
  const practice: OralPractice = storedOnServer
    ? { checked: draft?.checked ?? base.checked, notes: draft?.notes ?? base.notes, scores: draft?.scores ?? base.scores, attempts: base.attempts }
    : local

  const flush = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
    const input = pending.current
    pending.current = null
    if (input === null) return
    saveOralPractice(slug, input).then(
      (saved) => upsertRow(queryClient, saved),
      (error: unknown) => {
        if (httpStatus(error) === 404) return
        toast.show('Nem sikerült elmenteni a gyakorlásodat. Próbáld újra egy kicsit később.', 'error')
      },
    )
  }, [slug, queryClient, toast])

  // Oldalelhagyáskor a még el nem küldött változás is felmegy.
  useEffect(() => flush, [flush])

  const update = (patch: Partial<OralPracticeInput>) => {
    if (!storedOnServer) {
      saveLocal({ ...local, ...patch })
      return
    }
    const next: OralPracticeInput = { checked: practice.checked, notes: practice.notes, scores: practice.scores, ...patch }
    setDraft(next)
    pending.current = next
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(flush, SAVE_DELAY_MS)
  }

  const recordAttempt = async () => {
    if (!storedOnServer) {
      saveLocal({ ...local, attempts: local.attempts + 1 })
      return
    }
    flush()
    try {
      upsertRow(queryClient, await recordOralAttempt(slug))
    } catch (error) {
      if (httpStatus(error) !== 404) {
        toast.show('A gyakorlást nem sikerült rögzíteni. Próbáld újra egy kicsit később.', 'error')
        return
      }
      saveLocal({ ...local, attempts: local.attempts + 1 })
    }
  }

  return { loading, practice, storedOnServer, update, recordAttempt }
}
