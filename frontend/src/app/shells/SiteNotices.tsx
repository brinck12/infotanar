import { useSyncExternalStore } from 'react'
import { usePersistentState } from '../../shared/hooks/usePersistentState'
import { Banner } from '../../shared/ui/Banner'
import { Button } from '../../shared/ui/Button'

function subscribeOnline(onChange: () => void): () => void {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** Kapcsolat nélkül jelezzük, hogy a kód a böngészőben megmarad, és mi a teendő. */
export function OfflineNotice() {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true)

  if (online) return null

  return (
    <div className="mx-auto w-full max-w-page px-4 pt-3 md:px-6">
      <Banner kind="warn" title="Nincs internetkapcsolat" data-testid="offline-notice">
        A kódod a böngészőben elmentve marad. Amint visszajön a kapcsolat, folytathatod.
      </Banner>
    </div>
  )
}

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

/** Egyszeri tájékoztatás arról, mit tárol az oldal a böngészőben; a nyugtázás megmarad. */
export function StorageNotice() {
  const [seen, setSeen] = usePersistentState('infotanar.storageNotice.v1', false, isBoolean)

  if (seen) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 md:px-6" data-testid="storage-notice">
      <div className="mx-auto max-w-account shadow-modal">
        <Banner
          kind="warn"
          title="Sütik és tárolt adatok"
          action={
            <Button variant="secondary" onClick={() => setSeen(true)}>
              Rendben
            </Button>
          }
        >
          Csak a belépéshez és a munkád megőrzéséhez szükséges adatokat tároljuk a böngésződben. Követő vagy hirdetési sütit nem használunk.
        </Banner>
      </div>
    </div>
  )
}
