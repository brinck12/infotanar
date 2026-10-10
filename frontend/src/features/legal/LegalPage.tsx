import { useQuery } from '@tanstack/react-query'
import { Banner } from '../../shared/ui/Banner'
import { headingsOf } from '../../shared/ui/headings'
import { Prose } from '../../shared/ui/Prose'
import { LoadError, Skeleton } from '../../shared/ui/States'
import { PageTitle } from '../../shared/ui/Text'
import { LEGAL_DOCUMENTS, PLACEHOLDER_MARKER, type LegalDocumentKey } from './documents'

const dateFormat = new Intl.DateTimeFormat('hu-HU', { dateStyle: 'long' })

/**
 * Egy jogi dokumentum oldala (#132): cím, verzió és hatály, tartalomjegyzék,
 * majd a Markdown szöveg. A szöveg a `content/*.md` fájlokból töltődik be.
 */
function LegalPage({ which }: { which: LegalDocumentKey }) {
  const legal = LEGAL_DOCUMENTS[which]
  const content = useQuery({ queryKey: ['legal', which], queryFn: legal.load, staleTime: Infinity })
  const markdown = content.data?.replace(PLACEHOLDER_MARKER, '') ?? ''
  const headings = headingsOf(markdown)

  return (
    <main className="mx-auto w-full max-w-page flex-1 px-4 pt-8 pb-24 md:px-6">
      <title>{`${legal.title} – InfoTanár`}</title>

      {content.data?.includes(PLACEHOLDER_MARKER) && (
        <Banner kind="warn" title="Ez a dokumentum még vázlat" data-testid="legal-placeholder">
          Nem a végleges, hatályos szöveg. A jóváhagyott változat a szolgáltatás indulása előtt kerül ide.
        </Banner>
      )}

      <div className="mt-8 flex flex-wrap items-start gap-x-12 gap-y-8">
        {headings.length > 0 && (
          <nav aria-label="Tartalom" className="w-full md:sticky md:top-6 md:w-60 md:flex-none">
            <p className="text-15 font-bold">Tartalom</p>
            <ol className="mt-2">
              {headings.map((heading) => (
                <li key={heading.id}>
                  <a href={`#${heading.id}`} className="inline-flex min-h-11 items-center text-15 text-ink">
                    {heading.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <article className="min-w-0 flex-1 basis-96">
          <PageTitle>{legal.title}</PageTitle>
          <p className="mt-3 text-15 text-ink-soft">
            Hatályos: <time dateTime={legal.effectiveFrom}>{dateFormat.format(new Date(legal.effectiveFrom))}</time>
            {' · '}Verzió: {legal.version}
          </p>

          <div className="mt-8">
            {content.isPending && <Skeleton lines={6} label="Dokumentum betöltése…" />}
            {content.isError && (
              <LoadError error={content.error} onRetry={() => void content.refetch()} title="Nem sikerült betölteni a dokumentumot" />
            )}
            {content.isSuccess && <Prose markdown={markdown} anchors />}
          </div>
        </article>
      </div>
    </main>
  )
}

export const TermsOfService = () => <LegalPage which="terms" />
export const PrivacyPolicy = () => <LegalPage which="privacy" />
export const Imprint = () => <LegalPage which="imprint" />
