import { useQuery } from '@tanstack/react-query'
import { Alert } from '../../../shared/ui/Form'
import { Markdown } from '../../../shared/ui/Markdown'
import { PageLoader } from '../../../shared/ui/PageLoader'
import { LEGAL_DOCUMENTS, PLACEHOLDER_MARKER, type LegalDocumentKey } from '../documents'

const dateFormat = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'long' })

/** Egy jogi dokumentum oldala (#132): cím, verzió és hatály, majd a Markdown szöveg. */
function LegalPage({ which }: { which: LegalDocumentKey }) {
  const legal = LEGAL_DOCUMENTS[which]
  const content = useQuery({ queryKey: ['legal', which], queryFn: legal.load, staleTime: Infinity })

  return (
    <article className="mx-auto max-w-[70ch] px-4 py-12">
      <title>{`${legal.title} – InfoTanár`}</title>

      <h1 className="text-3xl font-semibold text-balance text-slate-100">{legal.title}</h1>
      <p className="mt-2 text-sm text-slate-400">
        Hatályos: <time dateTime={legal.effectiveFrom}>{dateFormat.format(new Date(legal.effectiveFrom))}</time>
        {' · '}Verzió: {legal.version}
      </p>

      <div className="mt-8">
        {content.isPending && <PageLoader />}
        {content.isError && <Alert kind="error">A dokumentumot nem sikerült betölteni. Próbáld újra az oldal frissítésével.</Alert>}
        {content.isSuccess && (
          <>
            {content.data.includes(PLACEHOLDER_MARKER) && (
              <div className="mb-8">
                <Alert kind="info">Ez a dokumentum még vázlat, nem a végleges, hatályos szöveg.</Alert>
              </div>
            )}
            <Markdown>{content.data.replace(PLACEHOLDER_MARKER, '')}</Markdown>
          </>
        )}
      </div>
    </article>
  )
}

export const Terms = () => <LegalPage which="terms" />
export const Privacy = () => <LegalPage which="privacy" />
export const Imprint = () => <LegalPage which="imprint" />
