import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { tokenStore } from '../../../shared/api/tokenStore'
import { Dialog } from '../../../shared/ui/Dialog'
import { Alert, Field } from '../../../shared/ui/Form'
import { useAuth } from '../../auth/context'
import * as accountApi from '../api'
import { AccountSection } from './AccountSection'

/** A törlés utáni értesítés a kezdőlapon jelenik meg (lásd Home). */
export const ACCOUNT_DELETED_NOTICE = 'A fiókodat töröltük.'

/**
 * Fiók törlése (#134). Visszafordíthatatlan, ezért megerősítő ablak mondja el
 * a következményeket, és a szerver a jelenlegi jelszót is kéri.
 */
export function DeleteAccount() {
  const { refresh } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')

  const remove = useMutation({
    mutationFn: accountApi.deleteMyAccount,
    onSuccess: async () => {
      // A szerver már visszavonta a tokent; a kliens állapotát is kijelentkezettre állítjuk.
      tokenStore.set(null)
      await refresh()
      navigate('/', { replace: true, state: { notice: ACCOUNT_DELETED_NOTICE } })
    },
  })

  const passwordError = mezoHibak(remove.error).password
  const generalError = remove.isError && !passwordError ? hibaUzenet(remove.error) : null

  function close() {
    setOpen(false)
    setPassword('')
    remove.reset()
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    remove.mutate(password)
  }

  return (
    <AccountSection title="Fiók törlése" danger>
      <p>A fiókod és a tanulási előrehaladásod véglegesen törlődik. Ez nem vonható vissza.</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-red-800 px-4 py-2 font-medium text-red-200 transition hover:bg-red-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        Fiók törlése…
      </button>

      <Dialog open={open} onClose={close} title="Biztosan törlöd a fiókodat?">
        <form onSubmit={submit} noValidate className="space-y-4 text-sm text-slate-300">
          <ul className="list-disc space-y-1 pl-5">
            <li>Az élő előfizetésed megszűnik, további terhelés nem lesz.</li>
            <li>A teljesített leckéid törlődnek, a beadott megoldásaid névtelenné válnak.</li>
            <li>A kiállított számlákat a jogszabály szerint meg kell őriznünk.</li>
            <li>A törlés nem vonható vissza.</li>
          </ul>

          {generalError && <Alert kind="error">{generalError}</Alert>}

          <Field
            label="A megerősítéshez add meg a jelszavad"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={passwordError}
          />

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={close}
              className="rounded-lg border border-slate-700 px-4 py-2 font-medium text-slate-100 transition hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
            >
              Mégsem
            </button>
            <button
              type="submit"
              disabled={remove.isPending}
              className="rounded-lg bg-red-700 px-4 py-2 font-medium text-white transition hover:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:cursor-wait disabled:opacity-60"
            >
              {remove.isPending ? 'Törlés…' : 'Fiók végleges törlése'}
            </button>
          </div>
        </form>
      </Dialog>
    </AccountSection>
  )
}
