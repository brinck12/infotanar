import { useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Field, SubmitButton } from '../../../shared/ui/Form'
import type { BillingProfile, BillingProfilePayload, CustomerType } from '../../../types'
import { POSTAL_CODE_PATTERN } from '../format'

interface Props {
  initial: BillingProfile | null
  errors: Record<string, string>
  busy: boolean
  submitLabel: ReactNode
  onSubmit: (payload: BillingProfilePayload) => void
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
export function BillingProfileForm({ initial, errors, busy, submitLabel, onSubmit }: Props) {
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
    <form onSubmit={submit} className="space-y-4" noValidate aria-label="Számlázási adatok">
      <fieldset className="text-sm">
        <legend className="mb-1 text-slate-300">Kinek szóljon a számla?</legend>
        <div className="flex flex-wrap gap-4">
          {CUSTOMER_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-2 text-slate-200">
              <input
                type="radio"
                name="customer_type"
                value={type.value}
                checked={form.customer_type === type.value}
                onChange={() => setForm((f) => ({ ...f, customer_type: type.value }))}
                className="accent-sky-600"
              />
              {type.label}
            </label>
          ))}
        </div>
        {errors.customer_type && <p className="mt-1 text-red-300">{errors.customer_type}</p>}
      </fieldset>

      <Field
        label={isCompany ? 'Cégnév' : 'Név'}
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
          placeholder="12345678-1-12"
          value={form.tax_number ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, tax_number: e.target.value }))}
          error={errors.tax_number}
        />
      )}

      <div className="grid grid-cols-[9rem_1fr] gap-3">
        <Field
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
      />

      <p className="text-xs text-slate-500">Számlázás jelenleg csak magyarországi címre lehetséges.</p>

      <SubmitButton busy={busy}>{submitLabel}</SubmitButton>
    </form>
  )
}
