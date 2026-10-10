import { LEGAL_DOCUMENTS, type LegalDocumentKey } from './documents'

/**
 * Hivatkozás egy jogi dokumentumra űrlapon belülről. Új lapon nyílik, hogy a
 * félig kitöltött űrlap ne vesszen el.
 */
export function LegalLink({ to, children }: { to: LegalDocumentKey; children?: string }) {
  return (
    <a href={LEGAL_DOCUMENTS[to].path} target="_blank" rel="noopener noreferrer">
      {children ?? LEGAL_DOCUMENTS[to].title}
      <span className="sr-only"> (új lapon nyílik)</span>
    </a>
  )
}
