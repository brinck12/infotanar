import { useAuth } from '../../auth/context'
import { DataExport } from '../components/DataExport'
import { DeleteAccount } from '../components/DeleteAccount'
import { ProfileSummary } from '../components/ProfileSummary'
import { SubscriptionSummary } from '../components/SubscriptionSummary'

/** Fiókom (#134): saját adatok, előfizetés, adatletöltés és fióktörlés egy helyen. */
export function Account() {
  const { user } = useAuth()

  // A RequireAuth őrzi az útvonalat; kijelentkezés közben egy pillanatra lehet null.
  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <title>Fiókom – InfoTanár</title>
      <h1 className="text-2xl font-semibold text-slate-100">Fiókom</h1>

      <ProfileSummary user={user} />
      <SubscriptionSummary />
      <DataExport />
      <DeleteAccount />
    </div>
  )
}
