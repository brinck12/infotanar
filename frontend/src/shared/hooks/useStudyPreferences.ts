import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { httpStatus } from '../api/errors'
import { userKeyOf } from '../domain/lastTask'
import {
  DEFAULT_PREFERENCES,
  forgetStoredPreferences,
  isStudyPreferences,
  preferencesKey,
  readStoredPreferences,
  type StudyPreferences,
} from '../domain/preferences'
import { usePersistentState } from './usePersistentState'
import { useAuth } from '../../features/auth/context'
import { preferenceKeys, preferencesQuery, savePreferences } from '../api/preferences'

export interface StudyPreferencesState {
  preferences: StudyPreferences
  /** Amíg nem tudjuk, ki a néző, vagy belépve a szerver válasza még nem jött meg. */
  loading: boolean
  /** Igaz, ha a mentés a fiókhoz kerül; hamis, ha csak ebben a böngészőben marad. */
  storedOnServer: boolean
  /** A szerver válasza hibás (nem 404): ilyenkor nem mutatunk és nem mentünk semmit, mert felülírhatnánk a mentett célokat. */
  loadError: unknown
  retry: () => void
  /** Elmenti a célokat. Belépve a szerver hibájával elutasít (a 404 kivételével). */
  save: (value: StudyPreferences) => Promise<void>
}

/**
 * A tanuló céljai. Belépve a szerver az igazság (ha még sosem mentett, az
 * alapérték); vendégnél a böngésző. Ha a végpont nincs kint (404), belépve is
 * a böngészőbeli példány él, ahogy korábban.
 *
 * Egyszeri átköltöztetés: ha a szerveren még nincs mentés, de ebben a
 * böngészőben van, felküldjük, és siker után töröljük a helyi példányt.
 */
export function useStudyPreferences(): StudyPreferencesState {
  const { user, loading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const signedIn = user !== null
  const userKey = userKeyOf(user)
  const [local, saveLocal] = usePersistentState(preferencesKey(userKey), DEFAULT_PREFERENCES, isStudyPreferences)
  const server = useQuery({ ...preferencesQuery(), enabled: signedIn, retry: (count, error) => httpStatus(error) !== 404 && count < 2 })
  const unavailable = httpStatus(server.error) === 404
  const neverSaved = signedIn && server.isSuccess && server.data === null
  const migrated = useRef<string | null>(null)

  useEffect(() => {
    if (!neverSaved || migrated.current === userKey) return
    const stored = readStoredPreferences(userKey)
    if (stored === null) return

    migrated.current = userKey
    void savePreferences(stored).then(
      (saved) => {
        // Ha közben a tanuló maga mentett, az ő értéke marad.
        queryClient.setQueryData<StudyPreferences | null>(preferenceKeys.mine(), (current) => current ?? saved)
        forgetStoredPreferences(userKey)
      },
      () => {
        // Nem sikerült: a helyi példány megmarad, és a következő mentés viszi fel.
      },
    )
  }, [neverSaved, userKey, queryClient])

  const save = useCallback(
    async (value: StudyPreferences) => {
      if (!signedIn || unavailable) {
        saveLocal(value)
        return
      }

      try {
        const saved = await savePreferences(value)
        queryClient.setQueryData<StudyPreferences | null>(preferenceKeys.mine(), saved)
        forgetStoredPreferences(userKey)
      } catch (error) {
        // A végpont még nincs kint: marad a böngésző, ahogy eddig.
        if (httpStatus(error) !== 404) throw error
        saveLocal(value)
      }
    },
    [signedIn, unavailable, saveLocal, queryClient, userKey],
  )

  return {
    preferences: signedIn && server.data ? server.data : local,
    loading: authLoading || (signedIn && server.isPending),
    storedOnServer: signedIn && !unavailable,
    loadError: signedIn && server.isError && !unavailable ? server.error : null,
    retry: () => void server.refetch(),
    save,
  }
}
