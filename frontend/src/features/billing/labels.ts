import type { PaymentSummary } from '../../types'

/** A fizetés típusa és állapota magyarul; a saját előzmények és az admin nézet is ezt használja. */
export const PAYMENT_PURPOSE_LABEL: Record<PaymentSummary['purpose'], string> = {
  initial: 'Előfizetés',
  renewal: 'Havi megújítás',
  card_change: 'Kártyacsere',
}

export const PAYMENT_STATUS_LABEL: Record<PaymentSummary['status'], string> = {
  pending: 'Folyamatban',
  succeeded: 'Sikeres',
  failed: 'Sikertelen',
  canceled: 'Megszakítva',
  expired: 'Lejárt',
}
