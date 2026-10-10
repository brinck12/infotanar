import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { ChoiceGroup, Field, RadioField, SubmitButton } from '../../../shared/ui/Form'
import { Icon } from '../../../shared/ui/Icon'
import type { BillingProfile, BillingProfilePayload, CustomerType } from '../../../types'
import { POSTAL_CODE_PATTERN } from '../format'

interface Props {
  initial: BillingProfile | null
  errors: Record<string, string>
  busy: boolean
  onSubmit: (payload: BillingProfilePayload) => void
  /** Saját beküldő gomb felirata; ha nincs, a gomb az űrlapon kívül áll (`form={formId}`). */
  submitLabel?: ReactNode
  busyLabel?: ReactNode
  formId?: string
}

const CUSTOMER_TYPES: ReadonlyArray<{ value: CustomerType; label: string }> = [
  { value: 'person', label: 'Magánszemély' },
  { value: 'company', label: 'Cég vagy egyéni vállalkozó' },
]

function fromProfile(profile: BillingProfile | null): BillingProfilePayload {
  return {
    customer_type: profile?.customer_type ?? 'person',
    name: profile?.name ?? '',
    postal_code: profile?.postal_code ?? '',
    city: profile?.city ?? '',
    address_line: profile?.address_line ?? '',
    tax_number: profile?.tax_number ?? null,
  }
}

/** A számlához szükséges adatok (#19). A formátumot a backend ellenőrzi véglegesen. */
export function BillingProfileForm({ initial, errors, busy, onSubmit, submitLabel, busyLabel, formId }: Props) {
  const [form, setForm] = useState<BillingProfilePayload>(() => fromProfile(initial))
  const isCompany = form.customer_type === 'company'

  const set = (field: 'name' | 'postal_code' | 'city' | 'address_line') => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  function submit(e: FormEvent) {
    e.preventDefault()
    // Magánszemélynél adószám nem küldhető (a backend elutasítaná).
    onSubmit({ ...form, tax_number: isCompany ? form.tax_number : null })
  }

  return (
    <form id={formId} onSubmit={submit} className="flex flex-col gap-5" noValidate aria-label="Számlázási adatok">
      <div>
        <ChoiceGroup legend="Ki a vevő?">
          {CUSTOMER_TYPES.map((type) => (
            <RadioField
              key={type.value}
              name="customer_type"
              value={type.value}
              label={type.label}
              checked={form.customer_type === type.value}
              onChange={() => setForm((f) => ({ ...f, customer_type: type.value }))}
            />
          ))}
        </ChoiceGroup>
        {errors.customer_type && (
          <p role="alert" className="mt-1.5 flex items-start gap-1.5 text-14 leading-normal text-wrong">
            <Icon name="warn" size={16} className="mt-0.5" />
            {errors.customer_type}
          </p>
        )}
      </div>

      <Field
        label={isCompany ? 'Cég neve' : 'Név'}
        autoComplete={isCompany ? 'organization' : 'name'}
        required
        value={form.name}
        onChange={set('name')}
        error={errors.name}
      />

      {isCompany && (
        <Field
          label="Adószám"
          required
          inputMode="numeric"
          value={form.tax_number ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tax_number: e.target.value }))}
          error={errors.tax_number}
          hint="Formátum: 12345678-1-42"
        />
      )}

      <div className="flex flex-wrap gap-5">
        <Field
          className="w-36"
          label="Irányítószám"
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={4}
          pattern={POSTAL_CODE_PATTERN}
          required
          value={form.postal_code}
          onChange={set('postal_code')}
          error={errors.postal_code}
        />
        <Field
          className="flex-1 basis-48"
          label="Település"
          autoComplete="address-level2"
          required
          value={form.city}
          onChange={set('city')}
          error={errors.city}
        />
      </div>

      <Field
        label="Utca, házszám"
        autoComplete="street-address"
        required
        value={form.address_line}
        onChange={set('address_line')}
        error={errors.address_line}
        hint="Számlázás jelenleg csak magyarországi címre lehetséges."
      />

      {submitLabel && (
        <div>
          <SubmitButton busy={busy} busyLabel={busyLabel} fullWidth={false}>
            {submitLabel}
          </SubmitButton>
        </div>
      )}
    </form>
  )
}
