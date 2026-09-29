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
  /** Ingyenes lecke része-e (freemium). */
  is_free?: boolean
  /** A jelenlegi néző számára zárolt-e (fizetős, jogosultság nélkül). */
  locked?: boolean
}

/** Miért zárolt egy fizetős feladat a néző számára (a backend `AccessDenial` enumja). */
export type LockReason = 'login_required' | 'email_unverified' | 'subscription_required'

export interface ExampleTestCase {
  id: number
  stdin: string
  expected_stdout: string
}

/** Részletes nézet: teljes leírással és a nem rejtett tesztesetekkel. */
interface TaskDetailBase {
  id: number
  title: string
  level: Level
  difficulty: number
  allowed_languages: LanguageKey[]
  topic: TaskTopic
  is_free?: boolean
  hidden_test_case_count: number
}

/** Hozzáférhető feladat: teljes leírással és a nem rejtett tesztesetekkel. */
export interface UnlockedTaskDetail extends TaskDetailBase {
  locked?: false
  description: string
  starter_code: Partial<Record<LanguageKey, string>>
  example_test_cases: ExampleTestCase[]
}

/** Zárolt (fizetős) feladat: a backend a tartalmat nem küldi el, csak az okot. */
export interface LockedTaskDetail extends TaskDetailBase {
  locked: true
  locked_reason: LockReason
  locked_message: string
}

export type TaskDetail = UnlockedTaskDetail | LockedTaskDetail

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

/** A futtatás/beadás 401/403 válasza zárolt feladatnál. */
export interface LockedErrorResponse {
  message: string
  reason: LockReason
}

/** Laravel validációs hibaválasz (HTTP 422). */
export interface ValidationErrorResponse {
  message: string
  errors: Record<string, string[]>
}
