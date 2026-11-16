import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mezoHibak } from '../../../../shared/api/errors'
import { CheckboxField } from '../../../../shared/ui/Form'
import { trackQuery, type AdminModule, type AdminTrack, type TrackPayload } from '../api'
import { AdminShell, Section, StatusPill } from '../../components/AdminShell'
import { ChildList } from '../components/ChildList'
import { DescriptionField, SaveRow, TitleSlugFields } from '../components/EntityFields'
import { MutationError, QueryState } from '../components/QueryState'
import { QuickCreate } from '../components/QuickCreate'
import { SavedNote } from '../components/SavedNote'
import { useChildMutations, useSaveEntity } from '../useCatalogMutations'

export function AdminTrack() {
  const id = Number(useParams().trackId)
  const track = useQuery(trackQuery(id))

  return <QueryState query={track}>{(data) => <TrackEditor key={data.id} track={data} />}</QueryState>
}

function TrackEditor({ track }: { track: AdminTrack }) {
  const navigate = useNavigate()
  const [form, setForm] = useState<TrackPayload>({
    title: track.title,
    slug: track.slug,
    description: track.description,
    is_published: track.is_published,
  })
  const save = useSaveEntity<AdminTrack>('tracks', track.id)
  const errors = mezoHibak(save.error)
  const modules = useChildMutations<AdminModule>('modules', `/admin/tracks/${track.id}/modules/order`, (created) =>
    navigate(`/admin/tananyag/modulok/${created.id}`),
  )

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate(form)
  }

  return (
    <AdminShell crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Katalógus', to: '/admin/tananyag' }, { label: track.title }]} title={track.title}>
      <Section title="A tanulási út adatai" aside={<SavedNote mutation={save} />}>
        <MutationError error={save.error} fields={['title', 'slug', 'description', 'is_published']} />
        <form onSubmit={submit} noValidate className="grid gap-5">
          <TitleSlugFields title={form.title} slug={form.slug} errors={errors} onTitle={(title) => setForm({ ...form, title })} onSlug={(slug) => setForm({ ...form, slug })} />
          <DescriptionField value={form.description} onChange={(description) => setForm({ ...form, description })} error={errors.description} />
          <CheckboxField
            label="Közzétéve"
            hint="Csak közzétett tanulási út jelenik meg a tanulóknak."
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            error={errors.is_published}
          />
          <SaveRow busy={save.isPending} />
        </form>
      </Section>

      <Section title="Szakaszok">
        <MutationError error={modules.deleteChild.error ?? modules.reorderChildren.error} />
        <ChildList
          noun="szakasz"
          items={(track.modules ?? []).map((module) => ({
            id: module.id,
            title: module.title,
            to: `/admin/tananyag/modulok/${module.id}`,
            meta: <StatusPill tone="info">{module.lesson_count ?? 0} lecke</StatusPill>,
          }))}
          emptyText="Ebben a tanulási úton még nincs szakasz."
          busy={modules.busy}
          onReorder={(ids) => modules.reorderChildren.mutate(ids)}
          onDelete={(moduleId) => modules.deleteChild.mutate(moduleId)}
        />
        <div className="mt-5 border-t border-grid pt-5">
          <QuickCreate
            titleLabel="Új szakasz címe"
            submitLabel="Szakasz létrehozása"
            mutation={modules.createChild}
            onCreate={(values) => modules.createChild.mutate({ ...values, track_id: track.id })}
          />
        </div>
      </Section>
    </AdminShell>
  )
}
