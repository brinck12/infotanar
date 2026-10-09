import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { mezoHibak } from '../../../../shared/api/errors'
import { tracksQuery, type AdminTrack } from '../api'
import { AdminShell, Section, StatusPill } from '../../components/AdminShell'
import { ChildList } from '../components/ChildList'
import { MutationError, QueryState } from '../components/QueryState'
import { QuickCreate } from '../components/QuickCreate'
import { useChildMutations } from '../useCatalogMutations'

/** Admin tananyag-kezelés (#47): a képzési ágak listája. */
export function AdminCatalog() {
  const navigate = useNavigate()
  const tracks = useQuery(tracksQuery())
  const { createChild, deleteChild, reorderChildren, busy } = useChildMutations<AdminTrack>('tracks', '/admin/tracks/order', (created) =>
    navigate(`/admin/tananyag/agak/${created.id}`),
  )
  const createErrors = mezoHibak(createChild.error)

  return (
    <QueryState query={tracks}>
      {(data) => (
        <AdminShell crumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Katalógus' }]} title="Katalógus">
          <Section title="Képzési ágak">
            <MutationError error={deleteChild.error ?? reorderChildren.error} />
            <ChildList
              noun="képzési ág"
              items={data.map((track) => ({
                id: track.id,
                title: track.title,
                to: `/admin/tananyag/agak/${track.id}`,
                meta: (
                  <>
                    <StatusPill tone="info">{track.module_count ?? 0} modul</StatusPill>
                    <StatusPill tone={track.is_published ? 'published' : 'draft'}>{track.is_published ? 'Közzétéve' : 'Piszkozat'}</StatusPill>
                  </>
                ),
              }))}
              emptyText="Még nincs képzési ág."
              busy={busy}
              onReorder={(ids) => reorderChildren.mutate(ids)}
              onDelete={(id) => deleteChild.mutate(id)}
            />
          </Section>

          <Section title="Új képzési ág">
            <MutationError error={createChild.error} fields={['title', 'slug']} />
            <QuickCreate
              titleLabel="Cím"
              submitLabel="Létrehozás"
              busy={createChild.isPending}
              errors={createErrors}
              onCreate={(values) => createChild.mutate({ ...values, is_published: false })}
            />
          </Section>
        </AdminShell>
      )}
    </QueryState>
  )
}
