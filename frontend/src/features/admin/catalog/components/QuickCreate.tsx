import { useState, type FormEvent } from 'react'
import { mezoHibak } from '../../../../shared/api/errors'
import { Button } from '../../../../shared/ui/Button'
import { Field } from '../../../../shared/ui/Form'
import { slugify } from '../slug'
import { MutationError } from './QueryState'

interface Props {
  titleLabel: string
  submitLabel: string
  /** A létrehozó mutáció: ebből jön a gomb állapota és a hibák (a címé és az azonosítóé a mezők alatt). */
  mutation: { error: unknown; isPending: boolean }
  onCreate: (values: { title: string; slug: string }) => void
}

/**
 * Új elem gyors létrehozása címmel; az URL-azonosító a címből képződik, amíg
 * kézzel nem írják át. A részletek utána az elem saját oldalán szerkeszthetők.
 */
export function QuickCreate({ titleLabel, submitLabel, mutation, onCreate }: Props) {
  const errors = mezoHibak(mutation.error)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  function submit(e: FormEvent) {
    e.preventDefault()
    onCreate({ title: title.trim(), slug: slug.trim() })
  }

  return (
    <>
      <MutationError error={mutation.error} fields={['title', 'slug']} />
      <form onSubmit={submit} noValidate className="flex flex-wrap items-start gap-4" aria-label={submitLabel}>
        <Field
          className="flex-1 basis-56"
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
          className="flex-1 basis-56"
          label="URL-azonosító"
          mono
          value={slug}
          required
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          error={errors.slug}
        />
        {/* A gomb a mezők beviteli sorához igazodik (a címke magassága fölötte). */}
        <div className="pt-7.5">
          <Button type="submit" variant="secondary" icon="plus" busy={mutation.isPending} busyLabel="Létrehozás…" className="min-h-12">
            {submitLabel}
          </Button>
        </div>
      </form>
    </>
  )
}
