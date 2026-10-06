import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../shared/api/client'
import type { Level, TaskDetail, TaskListItem, Topic, TrackDetail, TrackSummary } from '../../types'

export interface TaskFilter {
  topic?: string
  level?: Level
  /** Csak a még meg nem oldott feladatok; vendégnél a backend figyelmen kívül hagyja. */
  status?: 'unsolved'
}

export const catalogKeys = {
  all: ['catalog'] as const,
  topics: () => [...catalogKeys.all, 'topics'] as const,
  /** Minden szűrt feladatlista: a néző állapotát is tartalmazzák, ezért beadás után frissülnek. */
  taskLists: () => [...catalogKeys.all, 'tasks'] as const,
  tasks: (filter: TaskFilter) => [...catalogKeys.taskLists(), filter] as const,
  task: (id: number) => [...catalogKeys.all, 'task', id] as const,
  /** A képzési ágak listája és egy-egy ág; a néző haladását is tartalmazzák. */
  tracks: () => [...catalogKeys.all, 'tracks'] as const,
  track: (slug: string) => [...catalogKeys.tracks(), slug] as const,
}

export const tracksQuery = () =>
  queryOptions({
    queryKey: catalogKeys.tracks(),
    queryFn: async ({ signal }) => (await http.get<Envelope<TrackSummary[]>>('/tracks', { signal })).data.data,
  })

/** Egy képzési ág szerkezete: modulok, leckék (zárolás, haladás), feladatok. */
export const trackQuery = (slug: string) =>
  queryOptions({
    queryKey: catalogKeys.track(slug),
    queryFn: async ({ signal }) => (await http.get<Envelope<TrackDetail>>(`/tracks/${encodeURIComponent(slug)}`, { signal })).data.data,
  })

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
