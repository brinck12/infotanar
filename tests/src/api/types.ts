/**
 * A backend `/api/v1` szerzodesenek tipusai. A frontend/src/types/index.ts
 * tukre: ha a szerzodes valtozik, mindkettot frissiteni kell. Az API
 * kliens, a mockok es az adatbuilderek is ezeket hasznaljak, igy a
 * tesztadatok nem tudnak csendben eltavolodni a valodi valaszoktol.
 */

export type Level = 'kozep' | 'emelt'

/** A `tasks.allowed_languages` mezőben és a futtatáskor használt nyelvkulcs. */
export type LanguageKey = 'python' | 'csharp'

export interface Topic {
  id: number
  name: string
  slug: string
  task_count: number
}

export interface TaskTopic {
  id: number
  name: string
  slug: string
}

/** Lista-nézet: leírás nélkül. */
export interface TaskListItem {
  id: number
  title: string
  level: Level
  difficulty: number
  allowed_languages: LanguageKey[]
  topic: TaskTopic
}

export interface ExampleTestCase {
  id: number
  stdin: string
  expected_stdout: string
}

/** Részletes nézet: teljes leírással és a nem rejtett tesztesetekkel. */
export interface TaskDetail {
  id: number
  title: string
  description: string
  level: Level
  difficulty: number
  allowed_languages: LanguageKey[]
  starter_code: Partial<Record<LanguageKey, string>>
  topic: TaskTopic
  example_test_cases: ExampleTestCase[]
  hidden_test_case_count: number
}

export type RunStatus = 'passed' | 'failed' | 'error'

/**
 * Egy teszteset eredménye. Rejtett teszteseteknél (`hidden: true`) a
 * kimeneti mezők szándékosan hiányoznak — a backend nem küldi vissza őket.
 */
export interface TestResult {
  test_case_id: number
  hidden: boolean
  passed: boolean
  time: number | null
  exit_code: number | null
  judge_status: string
  stdin?: string
  stdout?: string
  expected?: string
  stderr?: string
  compile_output?: string
  error?: string
}

export interface RunResponse {
  status: RunStatus
  results: TestResult[]
  message?: string
}

export interface SubmissionResponse extends RunResponse {
  submission_id: number
}

export interface RunRequest {
  task_id: number
  language: LanguageKey
  source_code: string
}

/** Laravel validációs hibaválasz (HTTP 422). */
export interface ValidationErrorResponse {
  message: string
  errors: Record<string, string[]>
}

export interface DataEnvelope<T> {
  data: T
}

export type UserRole = 'student' | 'admin'

export interface RegisterRequest {
  name: string
  email: string
  password: string
  password_confirmation: string
}

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  email_verified_at: string | null
}

export interface LoginRequest {
  email: string
  password: string
  device_name?: string
}

export interface LoginResponse {
  token: string
  token_type: 'Bearer'
  expires_at: string | null
  user: User
}

export interface MessageResponse {
  message: string
}

export interface HealthResponse {
  ok: boolean
}

export interface TaskListQuery {
  topic?: string
  level?: Level
}
