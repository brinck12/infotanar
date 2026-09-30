import { useState, type FormEvent } from 'react'
import { Field, SubmitButton } from '../../../../shared/ui/Form'
import { slugify } from '../slug'

interface Props {
  titleLabel: string
  submitLabel: string
  busy: boolean
  errors: Record<string, string>
  onCreate: (values: { title: string; slug: string }) => void
}

/**
 * Új elem gyors létrehozása címmel; az URL-azonosító a címből képződik, amíg
 * kézzel nem írják át. A részletek utána az elem saját oldalán szerkeszthetők.
 */
export function QuickCreate({ titleLabel, submitLabel, busy, errors, onCreate }: Props) {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    onCreate({ title: title.trim(), slug: slug.trim() })
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" aria-label={submitLabel}>
      <Field
        label={titleLabel}
        value={title}
        required
        onChange={(e) => {
          setTitle(e.target.value)
          if (!slugTouched) setSlug(slugify(e.target.value))
        }}
        error={errors.title}
      />
      <Field
        label="URL-azonosító"
        value={slug}
        required
        onChange={(e) => {
          setSlugTouched(true)
          setSlug(e.target.value)
        }}
        error={errors.slug}
      />
      <SubmitButton busy={busy} fullWidth={false}>
        {busy ? 'Létrehozás…' : submitLabel}
      </SubmitButton>
    </form>
  )
}
