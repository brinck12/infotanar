import { useState } from 'react'
import { LEGAL_VERSIONS } from '../legal/documents'
import type { SignupConsentPayload } from './api'
import { useRegistrationMode } from './useRegistrationMode'

/**
 * Az új fiók nyitásának közös állapota (jelszavas regisztráció és Google): az elfogadás, és zárt
 * bétában a meghívókód. A küldött adat mindig a megjelenített dokumentumverziókat rögzíti (#133).
 */
export function useSignupConsent(initialInviteCode = '') {
  const { mode, pending: modePending } = useRegistrationMode()
  const [accepted, setAccepted] = useState(false)
  const [inviteCode, setInviteCode] = useState(initialInviteCode)
  const inviteOnly = mode === 'invite'

  function payload(): SignupConsentPayload {
    return {
      accept_terms: accepted,
      terms_version: LEGAL_VERSIONS.terms,
      privacy_version: LEGAL_VERSIONS.privacy,
      ...(inviteOnly ? { invite_code: inviteCode.trim() } : {}),
    }
  }

  return { inviteOnly, modePending, accepted, setAccepted, inviteCode, setInviteCode, payload }
}
