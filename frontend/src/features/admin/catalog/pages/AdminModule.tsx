import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { mezoHibak } from '../../../../shared/api/errors'
import { moduleQuery, trackQuery, type AdminLesson, type AdminModule, type ModulePayload } from '../api'
import { AdminShell, PublishedPill, Section, StatusPill } from '../../components/AdminShell'
import { ChildList } from '../components/ChildList'
import { DescriptionField, SaveRow, TitleSlugFields } from '../components/EntityFields'
import { MutationError, QueryState } from '../components/QueryState'
import { QuickCreate } from '../components/QuickCreate'
import { SavedNote } from '../components/SavedNote'
import { useChildMutations, useSaveEntity } from '../useCatalogMutations'

export function AdminModule() {
  const id = Number(useParams().moduleId)
  const module = useQuery(moduleQuery(id))

  return <QueryState query={module}>{(data) => <ModuleEditor key={data.id} module={data} />}</QueryState>
}

function ModuleEditor({ module }: { module: AdminModule }) {
  const navigate = useNavigate()
  // Csak a morzsamenühöz; a szerkesztést nem blokkolja.
  const track = useQuery(trackQuery(module.track_id))
  const [form, setForm] = useState<Omit<ModulePayload, 'track_id'>>({
    title: module.title,
    slug: module.slug,
    description: module.description,
  })
  const save = useSaveEntity<AdminModule>('modules', module.id)
  const errors = mezoHibak(save.error)
  const lessons = useChildMutations<AdminLesson>('lessons', `/admin/modules/${module.id}/lessons/order`, (created) =>
    navigate(`/admin/tananyag/leckek/${created.id}`),
  )

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate(form)
  }

  return (
    <AdminShell
      crumbs={[
        { label: 'Admin', to: '/admin' },
        { label: 'Katalógus', to: '/admin/tananyag' },
        { label: track.data?.title ?? '…', to: `/admin/tananyag/agak/${module.track_id}` },
        { label: module.title },
      ]}
      title={module.title}
    >
      <Section title="Modul adatai" aside={<SavedNote mutation={save} />}>
        <MutationError error={save.error} fields={['title', 'slug', 'description']} />
        <form onSubmit={submit} noValidate className="grid gap-5">
          <TitleSlugFields title={form.title} slug={form.slug} errors={errors} onTitle={(title) => setForm({ ...form, title })} onSlug={(slug) => setForm({ ...form, slug })} />
          <DescriptionField value={form.description} onChange={(description) => setForm({ ...form, description })} error={errors.description} />
          <SaveRow busy={save.isPending} />
        </form>
      </Section>

      <Section title="Leckék">
        <MutationError error={lessons.deleteChild.error ?? lessons.reorderChildren.error} />
        <ChildList
          noun="lecke"
          items={(module.lessons ?? []).map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            to: `/admin/tananyag/leckek/${lesson.id}`,
            meta: (
              <>
                <StatusPill tone="info">{lesson.exercise_count ?? 0} feladat</StatusPill>
                {lesson.is_free && <StatusPill tone="free">Ingyenes</StatusPill>}
                <PublishedPill published={lesson.is_published} />
              </>
            ),
          }))}
          emptyText="Ebben a modulban még nincs lecke."
          busy={lessons.busy}
          onReorder={(ids) => lessons.reorderChildren.mutate(ids)}
          onDelete={(lessonId) => lessons.deleteChild.mutate(lessonId)}
        />
        <div className="mt-5 border-t border-grid pt-5">
          <QuickCreate
            titleLabel="Új lecke címe"
            submitLabel="Lecke létrehozása"
            mutation={lessons.createChild}
            onCreate={(values) => lessons.createChild.mutate({ ...values, module_id: module.id, is_free: false, is_published: false })}
          />
        </div>
      </Section>
    </AdminShell>
  )
}
