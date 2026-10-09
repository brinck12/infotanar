import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { hibaUzenet, mezoHibak } from '../../../shared/api/errors'
import { Banner } from '../../../shared/ui/Banner'
import { Panel } from '../../../shared/ui/Panel'
import { LoadError, Skeleton } from '../../../shared/ui/States'
import { SectionTitle } from '../../../shared/ui/Text'
import { useToast } from '../../../shared/ui/useToast'
import * as billingApi from '../api'
import { billingKeys } from '../api'
import { BillingProfileForm } from '../components/BillingProfileForm'

/** Számlázási adatok szerkesztése a fiókban; az új számlák ezekkel készülnek. */
export function AccountBilling() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const profile = useQuery({ queryKey: billingKeys.profile, queryFn: ({ signal }) => billingApi.profile(signal) })
  const save = useMutation({
    mutationFn: billingApi.saveProfile,
    onSuccess: (saved) => {
      queryClient.setQueryData(billingKeys.profile, saved)
      toast.show('A számlázási adatokat elmentettük.')
    },
  })
  const fieldErrors = mezoHibak(save.error)

  if (profile.isError) return <LoadError error={profile.error} onRetry={() => void profile.refetch()} />
  if (!profile.isSuccess) return <Skeleton lines={6} />

  return (
    <Panel as="section" pad="xl" aria-labelledby="billing-data" className="max-w-form">
      <SectionTitle id="billing-data" className="text-24">
        Számlázási adatok
      </SectionTitle>
      <p className="mt-2 mb-6 text-16 leading-relaxed text-ink-soft">Ezek kerülnek az új számlákra. A kiállított számlák nem változnak.</p>
      {save.isError && Object.keys(fieldErrors).length === 0 && (
        <Banner kind="error" className="mb-5">
          {hibaUzenet(save.error)}
        </Banner>
      )}
      <BillingProfileForm
        initial={profile.data}
        errors={fieldErrors}
        busy={save.isPending}
        submitLabel="Mentés"
        busyLabel="Mentés…"
        onSubmit={(payload) => save.mutate(payload)}
      />
    </Panel>
  )
}
