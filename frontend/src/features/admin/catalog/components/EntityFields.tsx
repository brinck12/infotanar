import { Field, SubmitButton } from '../../../../shared/ui/Form'

/** A katalóguselemek közös első sora: cím és URL-azonosító. */
export function TitleSlugFields({
  title,
  slug,
  errors,
  onTitle,
  onSlug,
}: {
  title: string
  slug: string
  errors: Record<string, string | undefined>
  onTitle: (value: string) => void
  onSlug: (value: string) => void
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Cím" value={title} onChange={(e) => onTitle(e.target.value)} error={errors.title} />
      <Field label="URL-azonosító" value={slug} onChange={(e) => onSlug(e.target.value)} error={errors.slug} />
    </div>
  )
}

/** Az adatlap mentés gombja. */
export function SaveRow({ busy }: { busy: boolean }) {
  return (
    <div>
      <SubmitButton busy={busy} fullWidth={false}>
        {busy ? 'Mentés…' : 'Mentés'}
      </SubmitButton>
    </div>
  )
}
