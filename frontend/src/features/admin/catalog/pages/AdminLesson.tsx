import { useQuery } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { mezoHibak } from '../../../../shared/api/errors'
import { LEVEL_LABEL } from '../../../../shared/domain/labels'
import { CheckboxField, Field, SubmitButton, TextAreaField } from '../../../../shared/ui/Form'
import { lessonQuery, moduleQuery, trackQuery, type AdminExercise, type AdminLesson, type LessonPayload } from '../api'
import { AdminShell, Section, StatusPill } from '../components/AdminShell'
import { ChildList } from '../components/ChildList'
import { MutationError, QueryState } from '../components/QueryState'
import { SavedNote } from '../components/SavedNote'
import { useChildMutations, useSaveEntity } from '../useCatalogMutations'

export function AdminLesson() {
  const id = Number(useParams().lessonId)
  const lesson = useQuery(lessonQuery(id))

  return <QueryState query={lesson}>{(data) => <LessonEditor key={data.id} lesson={data} />}</QueryState>
}

type LessonForm = Omit<LessonPayload, 'module_id'>

function LessonEditor({ lesson }: { lesson: AdminLesson }) {
  const module = useQuery(moduleQuery(lesson.module_id))
  const track = useQuery({ ...trackQuery(module.data?.track_id ?? 0), enabled: module.data !== undefined })
  const [form, setForm] = useState<LessonForm>({
    title: lesson.title,
    slug: lesson.slug,
    content: lesson.content,
    video_path: lesson.video_path,
    is_free: lesson.is_free,
    is_published: lesson.is_published,
  })
  const save = useSaveEntity<AdminLesson>('lessons', lesson.id)
  const errors = mezoHibak(save.error)
  const exercises = useChildMutations<AdminExercise>('exercises', `/admin/lessons/${lesson.id}/exercises/order`, () => undefined)
  const set = <K extends keyof LessonForm>(key: K, value: LessonForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate({ ...form, video_path: form.video_path?.trim() || null })
  }

  return (
    <AdminShell
      crumbs={[
        { label: 'Admin' },
        { label: 'Tananyag', to: '/admin/tananyag' },
        { label: track.data?.title ?? '…', to: module.data ? `/admin/tananyag/agak/${module.data.track_id}` : undefined },
        { label: module.data?.title ?? '…', to: `/admin/tananyag/modulok/${lesson.module_id}` },
        { label: lesson.title },
      ]}
      title={lesson.title}
    >
      <Section title="Lecke adatai" aside={<SavedNote mutation={save} />}>
        <MutationError error={save.error} fields={['title', 'slug', 'content', 'video_path', 'is_free', 'is_published']} />
        <form onSubmit={submit} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Cím" value={form.title} onChange={(e) => set('title', e.target.value)} error={errors.title} />
            <Field label="URL-azonosító" value={form.slug} onChange={(e) => set('slug', e.target.value)} error={errors.slug} />
          </div>
          <TextAreaField
            label="Tananyag (Markdown)"
            rows={8}
            mono
            value={form.content ?? ''}
            onChange={(e) => set('content', e.target.value || null)}
            error={errors.content}
          />
          <Field
            label="Videó elérési útja"
            placeholder="pl. python/ciklusok.mp4"
            hint="Relatív útvonal a privát videótárolóban. Üresen hagyva a leckének nincs videója."
            value={form.video_path ?? ''}
            onChange={(e) => set('video_path', e.target.value)}
            error={errors.video_path}
          />
          <div className="flex flex-wrap gap-6">
            <CheckboxField
              label="Ingyenes lecke"
              hint="Előfizetés nélkül is elérhető."
              checked={form.is_free}
              onChange={(e) => set('is_free', e.target.checked)}
              error={errors.is_free}
            />
            <CheckboxField
              label="Publikált"
              hint="Csak publikált lecke jelenik meg a diákoknak."
              checked={form.is_published}
              onChange={(e) => set('is_published', e.target.checked)}
              error={errors.is_published}
            />
          </div>
          <div>
            <SubmitButton busy={save.isPending} fullWidth={false}>
              {save.isPending ? 'Mentés…' : 'Mentés'}
            </SubmitButton>
          </div>
        </form>
      </Section>

      <Section
        title="Feladatok"
        aside={
          <Link
            to={`/admin/tananyag/leckek/${lesson.id}/uj-feladat`}
            className="rounded-lg bg-sky-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-600"
          >
            Új feladat
          </Link>
        }
      >
        <MutationError error={exercises.deleteChild.error ?? exercises.reorderChildren.error} />
        <ChildList
          noun="feladat"
          items={(lesson.exercises ?? []).map((exercise) => ({
            id: exercise.id,
            title: exercise.title,
            to: `/admin/tananyag/feladatok/${exercise.id}`,
            meta: (
              <>
                <StatusPill tone="info">{LEVEL_LABEL[exercise.level]}</StatusPill>
                <StatusPill tone="info">{exercise.test_case_count ?? 0} teszteset</StatusPill>
                <StatusPill tone={exercise.is_published ? 'published' : 'draft'}>{exercise.is_published ? 'Publikált' : 'Vázlat'}</StatusPill>
              </>
            ),
          }))}
          emptyText="Ehhez a leckéhez még nincs feladat."
          busy={exercises.busy}
          onReorder={(ids) => exercises.reorderChildren.mutate(ids)}
          onDelete={(exerciseId) => exercises.deleteChild.mutate(exerciseId)}
        />
      </Section>
    </AdminShell>
  )
}
