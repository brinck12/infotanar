import { queryOptions } from '@tanstack/react-query'
import { http, type Envelope } from '../../../shared/api/client'
import type { ExamPart } from '../../../shared/domain/exam'
import type { Level, TaskFile } from '../../../types'

/**
 * Gyakorló vizsgák és értékelőlapok szerkesztése. A végpontok a FRONTEND.md
 * 11. fejezetének javaslatát követik; a backend oldalon még nincsenek meg.
 */
export type RubricStatus = 'complete' | 'incomplete' | 'tests'

export interface AdminExamPart {
  id: number
  order: number
  key: ExamPart['key']
  name: string
  exercise_id: number | null
  exercise_title: string | null
  points: number
  minutes: number
  rubric_status: RubricStatus
  /** Hiányos értékelőlapnál ennyi pont nincs még lefedve. */
  missing_points: number
}

export interface AdminExam {
  id: number
  title: string
  level: Level
  minutes: number
  points: number
  is_published: boolean
  /** Engedélyezett-e a vizsgahelyzet (időzítő, automatikus beadás). */
  timed_mode: boolean
  parts: AdminExamPart[]
  files: TaskFile[]
}

export type ExamPayload = Pick<AdminExam, 'title' | 'level' | 'minutes' | 'points' | 'is_published' | 'timed_mode'>
export type ExamPartPayload = Pick<AdminExamPart, 'key' | 'name' | 'exercise_id' | 'points' | 'minutes'>

export type RubricMode = 'auto' | 'manual'

export interface RubricItem {
  id: number
  label: string
  group: string
  /** A vizsgálat típusa, pl. `character_format`, `cell_formula`. */
  check_type: string
  /** A vizsgált tulajdonság és az elvárt érték emberi olvasásra. */
  property: string
  expected: string
  points: number
  mode: RubricMode
  hint: string | null
}

export type RubricItemPayload = Omit<RubricItem, 'id'>

export const adminExamKeys = {
  all: ['admin', 'exams'] as const,
  list: () => [...adminExamKeys.all, 'list'] as const,
  detail: (id: number) => [...adminExamKeys.all, 'detail', id] as const,
  rubric: (exerciseId: number) => ['admin', 'rubric', exerciseId] as const,
}

const get = async <T,>(path: string, signal?: AbortSignal) => (await http.get<Envelope<T>>(path, { signal })).data.data

export const adminExamsQuery = () =>
  queryOptions({ queryKey: adminExamKeys.list(), queryFn: ({ signal }) => get<AdminExam[]>('/admin/exams', signal), retry: false })

export const adminExamQuery = (id: number) =>
  queryOptions({ queryKey: adminExamKeys.detail(id), queryFn: ({ signal }) => get<AdminExam>(`/admin/exams/${id}`, signal), retry: false })

export const rubricQuery = (exerciseId: number) =>
  queryOptions({
    queryKey: adminExamKeys.rubric(exerciseId),
    queryFn: ({ signal }) => get<RubricItem[]>(`/admin/exercises/${exerciseId}/rubric-items`, signal),
    retry: false,
  })

export async function createExam(payload: ExamPayload): Promise<AdminExam> {
  return (await http.post<Envelope<AdminExam>>('/admin/exams', payload)).data.data
}

export async function updateExam(id: number, payload: ExamPayload): Promise<AdminExam> {
  return (await http.put<Envelope<AdminExam>>(`/admin/exams/${id}`, payload)).data.data
}

export async function addExamPart(examId: number, payload: ExamPartPayload): Promise<AdminExam> {
  return (await http.post<Envelope<AdminExam>>(`/admin/exams/${examId}/parts`, payload)).data.data
}

export async function removeExamPart(partId: number): Promise<void> {
  await http.delete(`/admin/exam-parts/${partId}`)
}

/** A vizsga összes részének új sorrendje. */
export async function reorderExamParts(examId: number, ids: number[]): Promise<void> {
  await http.put(`/admin/exams/${examId}/parts/order`, { ids })
}

export async function createRubricItem(exerciseId: number, payload: RubricItemPayload): Promise<RubricItem> {
  return (await http.post<Envelope<RubricItem>>(`/admin/exercises/${exerciseId}/rubric-items`, payload)).data.data
}

export async function deleteRubricItem(id: number): Promise<void> {
  await http.delete(`/admin/rubric-items/${id}`)
}

export async function reorderRubricItems(exerciseId: number, ids: number[]): Promise<void> {
  await http.put(`/admin/exercises/${exerciseId}/rubric-items/order`, { ids })
}
