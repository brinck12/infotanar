/**
 * A tipusos feladat reszletei (GET tasks/{id}): kind, file_task, sql_task, web_task, sheet_practice, doc_practice, sources.
 *
 * A fajl gazdaja a WP1 csomag. A frontend megfelelo tipusainak tukre
 * (frontend/src/types/index.ts es a features api.ts fajljai); a ../types.ts
 * ujraexportalja, igy `import type { ... } from '../types'` formaban is elerheto.
 */
import type { TaskDetail } from '../types'

export type ExerciseKind = 'code' | 'sql' | 'sheet_upload' | 'sheet_browser' | 'doc_upload' | 'doc_browser' | 'web' | 'visual_upload'

/** Letoltheto forrasfajl egy feladathoz; az `url` alairt, lejaro, teljes URL. */
export interface TaskFile {
  name: string
  size: number
  url: string
}

export interface FileTaskInfo {
  steps: string[]
  sources: TaskFile[]
  deliverable: string | null
  accepted_extensions: string[]
  software: string[]
  sample_image_url: string | null
  exam_reference: string | null
  exam_points: number | null
}

export interface SqlTaskInfo {
  database: string
  tables: { name: string; columns: { name: string; primary?: boolean; references?: string | null }[] }[]
  subtasks: { label: string; query_name: string; points: number }[]
}

export type WebCheck = { id: number; label: string; points: number; hint?: string | null } & (
  | { type: 'title'; value: string }
  | { type: 'element_count'; file?: string; selector: string; count: number }
  | { type: 'css_declaration'; property: string; pattern: string }
  | { type: 'css_selector'; selector: string }
  | { type: 'link'; file?: string; href: string }
)

export interface WebTaskInfo {
  files: { name: string; language: 'html' | 'css'; content: string }[]
  checks: WebCheck[]
  exam_reference: string | null
}

export type SheetPracticeCheck = { id: number; label: string } & (
  | { type: 'has_formula'; cell: string }
  | { type: 'uses_function'; cell: string; function: string }
  | { type: 'references'; cell: string; reference: string }
  | { type: 'value'; cell: string; expected: string }
  | { type: 'filled_down'; range: string }
)

export interface SheetPracticeInfo {
  columns: number
  rows: number
  cells: Record<string, string>
  checks: SheetPracticeCheck[]
}

export type DocPracticeCheck = { id: number; label: string; paragraph: number } & (
  | { type: 'align'; value: 'left' | 'center' | 'right' | 'justify' }
  | { type: 'font_size'; value: number }
  | { type: 'bold' }
  | { type: 'italic' }
  | { type: 'underline' }
  | { type: 'line_spacing'; value: number }
)

export interface DocPracticeInfo {
  paragraphs: string[]
  checks: DocPracticeCheck[]
}

/**
 * A feladat reszletes nezete a fajtafuggo mezokkel. Feloldott feladatnal a
 * `kind` es a fajtahoz tartozo egyetlen mezo erkezik; zaroltnal egyik sem.
 */
export interface TypedTaskDetail extends Omit<TaskDetail, 'description' | 'starter_code' | 'example_test_cases'> {
  locked: boolean
  locked_reason: 'login_required' | 'email_unverified' | 'subscription_required' | null
  kind?: ExerciseKind
  description?: string
  starter_code?: TaskDetail['starter_code']
  example_test_cases?: TaskDetail['example_test_cases']
  file_task?: FileTaskInfo
  sql_task?: SqlTaskInfo
  web_task?: WebTaskInfo
  sheet_practice?: SheetPracticeInfo
  doc_practice?: DocPracticeInfo
  /** Kod- es SQL-feladat letoltheto forrasfajljai. */
  sources?: TaskFile[]
}
