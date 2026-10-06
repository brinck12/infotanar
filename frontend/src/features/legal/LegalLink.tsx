import { LEGAL_DOCUMENTS, type LegalDocumentKey } from './documents'

/**
 * Hivatkozás egy jogi dokumentumra űrlapon belülről. Új lapon nyílik, hogy a
 * félig kitöltött űrlap ne vesszen el.
 */
export function LegalLink({ to, children }: { to: LegalDocumentKey; children?: string }) {
  return (
    <a
      href={LEGAL_DOCUMENTS[to].path}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-sm text-sky-400 underline underline-offset-2 hover:text-sky-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
    >
      {children ?? LEGAL_DOCUMENTS[to].title}
      <span className="sr-only"> (új lapon nyílik)</span>
    </a>
  )
}
