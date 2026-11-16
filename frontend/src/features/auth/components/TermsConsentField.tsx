import { CheckboxField } from '../../../shared/ui/Form'
import { LegalLink } from '../../legal/LegalLink'

/** A fiók létrehozásához kötelező elfogadás: ugyanaz a szöveg a regisztrációnál és a Google-os fiókfelvételnél. */
export function TermsConsentField({ checked, onChange, error }: { checked: boolean; onChange: (checked: boolean) => void; error?: string }) {
  return (
    <CheckboxField
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      required
      error={error}
      label={
        <>
          Elfogadom az <LegalLink to="terms">általános szerződési feltételeket</LegalLink>, és megismertem az{' '}
          <LegalLink to="privacy">adatkezelési tájékoztatót</LegalLink>.
        </>
      }
    />
  )
}
