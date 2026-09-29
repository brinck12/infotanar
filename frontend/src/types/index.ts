/** A backend `/api/v1` válaszaihoz tartozó típusok. */

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

export type Role = 'student' | 'admin'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: Role
  email_verified_at: string | null
}

export interface LoginResponse {
  token: string
  token_type: 'Bearer'
  expires_at: string | null
  user: AuthUser
}

/** Laravel validációs hibaválasz (HTTP 422). */
export interface ValidationErrorResponse {
  message: string
  errors: Record<string, string[]>
}
