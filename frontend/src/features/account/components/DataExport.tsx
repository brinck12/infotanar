import { useMutation } from '@tanstack/react-query'
import { hibaUzenet, httpStatus } from '../../../shared/api/errors'
import * as accountApi from '../api'
import { AccountSection } from './AccountSection'

/** A fájlként kért válasz hibaüzenete nem olvasható ki, ezért a gyakori esetet (óránkénti limit) itt nevezzük meg. */
function exportError(error: unknown): string {
  return httpStatus(error) === 429
    ? 'Óránként legfeljebb néhány letöltés kérhető. Próbáld újra később.'
    : hibaUzenet(error)
}

/** A rólam tárolt adatok letöltése (#134): a szerver egy JSON fájlt ad. */
export function DataExport() {
  const download = useMutation({ mutationFn: accountApi.downloadMyData })

  return (
    <AccountSection title="Adataim letöltése">
      <p>
        Egy fájlban letöltheted mindazt, amit rólad tárolunk: a fiókod adatait, a beadott megoldásaidat, a teljesített
        leckéidet, a fizetéseidet és a számláid adatait.
      </p>
      <button
        type="button"
        onClick={() => download.mutate()}
        disabled={download.isPending}
        className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-100 transition hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-wait disabled:opacity-60"
      >
        {download.isPending ? 'Előkészítés…' : 'Adataim letöltése'}
      </button>
      <div role="status">
        {download.isSuccess && <p className="text-emerald-300">A letöltés elindult.</p>}
        {download.isError && <p className="text-red-300">{exportError(download.error)}</p>}
      </div>
    </AccountSection>
  )
}
