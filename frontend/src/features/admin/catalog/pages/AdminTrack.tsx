import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mezoHibak } from '../../../../shared/api/errors'
import { CheckboxField, Field, SubmitButton, TextAreaField } from '../../../../shared/ui/Form'
import { trackQuery, type AdminModule, type AdminTrack, type TrackPayload } from '../api'
import { AdminShell, Section, StatusPill } from '../../components/AdminShell'
import { ChildList } from '../components/ChildList'
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
  const createErrors = mezoHibak(modules.createChild.error)

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate(form)
  }

  return (
    <AdminShell crumbs={[{ label: 'Admin' }, { label: 'Tananyag', to: '/admin/tananyag' }, { label: track.title }]} title={track.title}>
      <Section title="Képzési ág adatai" aside={<SavedNote mutation={save} />}>
        <MutationError error={save.error} fields={['title', 'slug', 'description', 'is_published']} />
        <form onSubmit={submit} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cím" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} error={errors.title} />
            <Field label="URL-azonosító" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} error={errors.slug} />
          </div>
          <TextAreaField
            label="Leírás"
            rows={3}
            value={form.description ?? ''}
            onChange={(e) => setForm({ ...form, description: e.target.value || null })}
            error={errors.description}
          />
          <CheckboxField
            label="Publikált"
            hint="Csak publikált képzési ág jelenik meg a diákoknak."
            checked={form.is_published}
            onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            error={errors.is_published}
          />
          <div>
            <SubmitButton busy={save.isPending} fullWidth={false}>
              {save.isPending ? 'Mentés…' : 'Mentés'}
            </SubmitButton>
          </div>
        </form>
      </Section>

      <Section title="Modulok">
        <MutationError error={modules.deleteChild.error ?? modules.reorderChildren.error} />
        <ChildList
          noun="modul"
          items={(track.modules ?? []).map((module) => ({
            id: module.id,
            title: module.title,
            to: `/admin/tananyag/modulok/${module.id}`,
            meta: <StatusPill tone="info">{module.lesson_count ?? 0} lecke</StatusPill>,
          }))}
          emptyText="Ebben a képzési ágban még nincs modul."
          busy={modules.busy}
          onReorder={(ids) => modules.reorderChildren.mutate(ids)}
          onDelete={(moduleId) => modules.deleteChild.mutate(moduleId)}
        />
        <div className="mt-5 border-t border-slate-800 pt-4">
          <MutationError error={modules.createChild.error} fields={['title', 'slug']} />
          <QuickCreate
            titleLabel="Új modul címe"
            submitLabel="Modul létrehozása"
            busy={modules.createChild.isPending}
            errors={createErrors}
            onCreate={(values) => modules.createChild.mutate({ ...values, track_id: track.id })}
          />
        </div>
      </Section>
    </AdminShell>
  )
}
