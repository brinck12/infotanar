import { useMutation, useQueryClient } from '@tanstack/react-query'
import { create, invalidateCatalog, remove, reorder, update } from './api'

type Resource = 'tracks' | 'modules' | 'lessons' | 'exercises'

/** Egy elem mentése (létrehozás vagy módosítás), utána a katalógus-cache frissítése. */
export function useSaveEntity<T extends { id: number }>(resource: Resource, id: number | null, onSaved?: (saved: T) => void) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: object) => (id === null ? create<T>(resource, payload) : update<T>(resource, id, payload)),
    onSuccess: async (saved) => {
      await invalidateCatalog(queryClient)
      onSaved?.(saved)
    },
  })
}

/** Egy szülő gyerekeinek létrehozása, törlése és átrendezése. */
export function useChildMutations<T extends { id: number }>(resource: Resource, reorderPath: string, onCreated: (created: T) => void) {
  const queryClient = useQueryClient()
  const refresh = () => invalidateCatalog(queryClient)

  const createChild = useMutation({
    mutationFn: (payload: object) => create<T>(resource, payload),
    onSuccess: async (created) => {
      await refresh()
      onCreated(created)
    },
  })
  const deleteChild = useMutation({ mutationFn: (id: number) => remove(resource, id), onSettled: refresh })
  const reorderChildren = useMutation({ mutationFn: (ids: number[]) => reorder(reorderPath, ids), onSettled: refresh })

  return { createChild, deleteChild, reorderChildren, busy: deleteChild.isPending || reorderChildren.isPending }
}
