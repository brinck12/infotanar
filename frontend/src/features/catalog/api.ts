import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { Level, TaskDetail, TaskListItem, Topic, TrackDetail, TrackSummary } from '../../types'

export interface TaskFilter {
  topic?: string
  level?: Level
}

export const catalogKeys = {
  all: ['catalog'] as const,
  topics: () => [...catalogKeys.all, 'topics'] as const,
  tasks: (filter: TaskFilter) => [...catalogKeys.all, 'tasks', filter] as const,
  task: (id: number) => [...catalogKeys.all, 'task', id] as const,
}

export const topicsQuery = () =>
  queryOptions({
    queryKey: catalogKeys.topics(),
    queryFn: async ({ signal }) => (await http.get<Envelope<Topic[]>>('/topics', { signal })).data.data,
  })

export const tasksQuery = (filter: TaskFilter) =>
  queryOptions({
    queryKey: catalogKeys.tasks(filter),
    queryFn: async ({ signal }) =>
      (await http.get<Envelope<TaskListItem[]>>('/tasks', { params: filter, signal })).data.data,
  })

export const taskQuery = (id: number) =>
  queryOptions({
    queryKey: catalogKeys.task(id),
    queryFn: async ({ signal }) => (await http.get<Envelope<TaskDetail>>(`/tasks/${id}`, { signal })).data.data,
  })

export const tracksQuery = () =>
  queryOptions({
    queryKey: [...catalogKeys.all, 'tracks'] as const,
    queryFn: async ({ signal }) => (await http.get<Envelope<TrackSummary[]>>('/tracks', { signal })).data.data,
    staleTime: 5 * 60_000,
  })

/** A katalógus szerkezete ritkán változik; a leckecímekhez és a feladat-linkekhez kell. */
export const trackQuery = (slug: string) =>
  queryOptions({
    queryKey: [...catalogKeys.all, 'track', slug] as const,
    queryFn: async ({ signal }) => (await http.get<Envelope<TrackDetail>>(`/tracks/${encodeURIComponent(slug)}`, { signal })).data.data,
    staleTime: 5 * 60_000,
  })
