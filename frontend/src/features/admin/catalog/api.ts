import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { http, type Envelope } from '../../../shared/api/client'
import type { ExecutionLimits, LanguageKey, Level } from '../../../types'

/** Az admin katalógus-API (#45) típusai: a publikálatlan elemeket is tartalmazzák. */
export interface AdminTrack {
  id: number
  slug: string
  title: string
  description: string | null
  position: number
  is_published: boolean
  module_count?: number
  modules?: AdminModule[]
  updated_at: string | null
}

export interface AdminModule {
  id: number
  track_id: number
  slug: string
  title: string
  description: string | null
  position: number
  lesson_count?: number
  lessons?: AdminLesson[]
}

export interface AdminLesson {
  id: number
  module_id: number
  slug: string
  title: string
  content: string | null
  video_path: string | null
  /** WebVTT felirat (#111) a videóhoz. */
  captions_path: string | null
  position: number
  is_free: boolean
  is_published: boolean
  exercise_count?: number
  exercises?: AdminExercise[]
}

export interface AdminExercise {
  id: number
  lesson_id: number
  position: number
  title: string
  description: string
  level: Level
  difficulty: number
  allowed_languages: LanguageKey[]
  starter_code: Partial<Record<LanguageKey, string>>
  constraints: ConstraintSet
  sql_order_sensitive: boolean
  /** Saját időkorlát (ms); `null` = az alapértelmezés érvényes. */
  time_limit_ms: number | null
  /** Saját memóriakorlát (KB); `null` = az alapértelmezés érvényes. */
  memory_limit_kb: number | null
  is_published: boolean
  test_case_count?: number
  submission_count?: number
}

export interface AdminTestCase {
  id: number
  exercise_id: number
  order: number
  stdin: string
  expected_stdout: string
  is_hidden: boolean
  updated_at: string | null
}

export type TestCasePayload = Pick<AdminTestCase, 'stdin' | 'expected_stdout' | 'is_hidden'>

/** Statikus kódszabályok (#42): kötelező szerkezetek és tiltott hívások (`builtin:<név>` / `method:<név>`). */
export interface ConstraintSet {
  require: string[]
  forbid: string[]
}

export interface ConstraintOptions {
  require: Array<{ value: string; label: string }>
  forbid: Array<{ value: string; kind: 'builtin' | 'method'; label: string }>
  /** Ezekre a nyelvekre fut elemzés (SQL-re nincs). */
  enforced_languages: LanguageKey[]
}

export interface LanguageOption {
  key: LanguageKey
  label: string
  monaco: string
  /** A saját korlát nélküli feladatokra érvényes értékek ezen a nyelven (az idő már a szorzóval). */
  default_limits: ExecutionLimits
  /** Ennyivel szorzódik az időkorlát ezen a nyelven (a feladat saját korlátja is). */
  time_factor: number
}

export type TrackPayload = Pick<AdminTrack, 'slug' | 'title' | 'description' | 'is_published'>
export type ModulePayload = Pick<AdminModule, 'track_id' | 'slug' | 'title' | 'description'>
export type LessonPayload = Pick<AdminLesson, 'module_id' | 'slug' | 'title' | 'content' | 'video_path' | 'captions_path' | 'is_free' | 'is_published'>
export type ExercisePayload = Pick<
  AdminExercise,
  | 'lesson_id'
  | 'title'
  | 'description'
  | 'level'
  | 'difficulty'
  | 'allowed_languages'
  | 'starter_code'
  | 'constraints'
  | 'sql_order_sensitive'
  | 'time_limit_ms'
  | 'memory_limit_kb'
  | 'is_published'
>

export const adminCatalogKeys = {
  all: ['admin', 'catalog'] as const,
  tracks: () => [...adminCatalogKeys.all, 'tracks'] as const,
  track: (id: number) => [...adminCatalogKeys.all, 'track', id] as const,
  module: (id: number) => [...adminCatalogKeys.all, 'module', id] as const,
  lesson: (id: number) => [...adminCatalogKeys.all, 'lesson', id] as const,
  exercise: (id: number) => [...adminCatalogKeys.all, 'exercise', id] as const,
  testCases: (exerciseId: number) => [...adminCatalogKeys.all, 'exercise', exerciseId, 'test-cases'] as const,
  languages: ['catalog', 'languages'] as const,
}

const get = async <T>(url: string, signal?: AbortSignal): Promise<T> => (await http.get<Envelope<T>>(url, { signal })).data.data

export const tracksQuery = () =>
  queryOptions({ queryKey: adminCatalogKeys.tracks(), queryFn: ({ signal }) => get<AdminTrack[]>('/admin/tracks', signal) })

export const trackQuery = (id: number) =>
  queryOptions({ queryKey: adminCatalogKeys.track(id), queryFn: ({ signal }) => get<AdminTrack>(`/admin/tracks/${id}`, signal) })

export const moduleQuery = (id: number) =>
  queryOptions({ queryKey: adminCatalogKeys.module(id), queryFn: ({ signal }) => get<AdminModule>(`/admin/modules/${id}`, signal) })

export const lessonQuery = (id: number) =>
  queryOptions({ queryKey: adminCatalogKeys.lesson(id), queryFn: ({ signal }) => get<AdminLesson>(`/admin/lessons/${id}`, signal) })

export const exerciseQuery = (id: number) =>
  queryOptions({
    queryKey: adminCatalogKeys.exercise(id),
    queryFn: ({ signal }) => get<AdminExercise>(`/admin/exercises/${id}`, signal),
  })

export const testCasesQuery = (exerciseId: number) =>
  queryOptions({
    queryKey: adminCatalogKeys.testCases(exerciseId),
    queryFn: ({ signal }) => get<AdminTestCase[]>(`/admin/exercises/${exerciseId}/test-cases`, signal),
  })

export async function createTestCase(exerciseId: number, payload: TestCasePayload): Promise<AdminTestCase> {
  return (await http.post<Envelope<AdminTestCase>>(`/admin/exercises/${exerciseId}/test-cases`, payload)).data.data
}

export async function updateTestCase(id: number, payload: Partial<TestCasePayload>): Promise<AdminTestCase> {
  return (await http.put<Envelope<AdminTestCase>>(`/admin/test-cases/${id}`, payload)).data.data
}

export async function deleteTestCase(id: number): Promise<void> {
  await http.delete(`/admin/test-cases/${id}`)
}

export const constraintOptionsQuery = () =>
  queryOptions({
    queryKey: [...adminCatalogKeys.all, 'constraint-options'] as const,
    queryFn: ({ signal }) => get<ConstraintOptions>('/admin/constraint-options', signal),
    staleTime: 60 * 60_000,
  })

export const languagesQuery = () =>
  queryOptions({
    queryKey: adminCatalogKeys.languages,
    queryFn: ({ signal }) => get<LanguageOption[]>('/languages', signal),
    staleTime: 60 * 60_000,
  })

type Resource = 'tracks' | 'modules' | 'lessons' | 'exercises'

export async function create<T>(resource: Resource, payload: object): Promise<T> {
  return (await http.post<Envelope<T>>(`/admin/${resource}`, payload)).data.data
}

export async function update<T>(resource: Resource, id: number, payload: object): Promise<T> {
  return (await http.put<Envelope<T>>(`/admin/${resource}/${id}`, payload)).data.data
}

export async function remove(resource: Resource, id: number): Promise<void> {
  await http.delete(`/admin/${resource}/${id}`)
}

/** Egy szülő összes gyerekének új sorrendje (a backend a teljes listát várja). */
export async function reorder(path: string, ids: number[]): Promise<void> {
  await http.put(path, { ids })
}

/**
 * Szerkesztés után az admin nézetek és a diák oldali katalógus (feladatlista,
 * haladás) is frissüljön, hogy az új tartalom azonnal látszódjon.
 */
export function invalidateCatalog(queryClient: QueryClient): Promise<unknown> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: adminCatalogKeys.all }),
    queryClient.invalidateQueries({ queryKey: ['catalog'] }),
    queryClient.invalidateQueries({ queryKey: ['progress'] }),
  ])
}
