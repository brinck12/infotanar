import { VerifyEmailBanner } from '../../features/auth/components/VerifyEmailBanner'
import { PastDueBanner } from '../../features/billing/components/PastDueBanner'

/** A fiók állapotára figyelmeztető sávok a fejléc alatt, minden keretben ugyanúgy. */
export function AccountNotices() {
  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-3 px-4 empty:hidden md:px-6">
      <VerifyEmailBanner />
      <PastDueBanner />
    </div>
  )
}
