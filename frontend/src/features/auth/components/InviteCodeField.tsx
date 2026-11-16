import { Field } from '../../../shared/ui/Form'

/** A zárt béta meghívókódja: ugyanaz a mező a regisztrációnál és a Google-os fiókfelvételnél. */
export function InviteCodeField({ value, onChange, error, hint }: { value: string; onChange: (value: string) => void; error?: string; hint?: string }) {
  return (
    <Field
      label="Meghívókód"
      autoComplete="off"
      autoCapitalize="characters"
      spellCheck={false}
      mono
      required
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      hint={hint}
    />
  )
}
