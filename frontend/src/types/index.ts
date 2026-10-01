/** A backend `/api/v1` válaszaihoz tartozó típusok. */

export type Level = 'kozep' | 'emelt'

/** A `tasks.allowed_languages` mezőben és a futtatáskor használt nyelvkulcs. */
export type LanguageKey = 'python' | 'csharp' | 'sql'

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
  /** A feladathoz tartozó lecke (a videóhoz); régebbi válaszokban hiányozhat. */
  lesson?: TaskLesson
}

export interface TaskLesson {
  id: number
  title: string
  has_video: boolean
  /** A lecke oldalához vezető út (#143); régebbi válaszokban hiányozhat. */
  slug?: string
  track_slug?: string | null
}

/** Rövid életű, aláírt lejátszási URL (`GET /lessons/{id}/video`). */
export interface LessonVideo {
  url: string
  /** WebVTT felirat (#111), ha a leckéhez tartozik. */
  captions_url: string | null
  expires_at: string
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
 * A kiértékelés eredménye (backend `Verdict` enum): a PRD hat állapota és a
 * nem a megoldásnak felróható rendszerhiba.
 */
export type Verdict =
  | 'accepted'
  | 'wrong_answer'
  | 'time_limit_exceeded'
  | 'compilation_error'
  | 'runtime_error'
  | 'constraint_violation'
  | 'system_error'

/**
 * Egy teszteset eredménye. Rejtett teszteseteknél (`hidden: true`) a
 * kimeneti mezők szándékosan hiányoznak — a backend nem küldi vissza őket.
 */
export interface TestResult {
  test_case_id: number
  hidden: boolean
  passed: boolean
  /** Régebbi (vagy mockolt) válaszokban hiányozhat: ekkor a `passed`-ből következtetünk. */
  verdict?: Verdict
  verdict_label?: string
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
  verdict?: Verdict
  verdict_label?: string
  /** Kódszabály-sértések (constraint_violation), magyarul. */
  violations?: string[]
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
  /** Megerősítésre váró új cím (#135); null, ha nincs folyamatban csere. */
  pending_email: string | null
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

/** Az egyetlen előfizetési csomag (`GET /billing/plan`). */
export interface Plan {
  name: string
  price_huf: number
  period_months: number
}

export type CustomerType = 'person' | 'company'

/** Számlázási adatok (#19); a számla ezekből készül. */
export interface BillingProfile {
  customer_type: CustomerType
  name: string
  country: 'HU'
  postal_code: string
  city: string
  address_line: string
  tax_number: string | null
  updated_at: string | null
}

export type BillingProfilePayload = Omit<BillingProfile, 'country' | 'updated_at'>

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled'

export interface Subscription {
  status: SubscriptionStatus
  grants_access: boolean
  current_period_start: string | null
  current_period_end: string | null
  grace_ends_at: string | null
  cancel_at_period_end: boolean
}

/** Barion fizetőoldal indítása: ide kell átirányítani a böngészőt. */
export interface HostedCheckout {
  checkout_url: string
  payment_id: string
}

/** Egy lecke állapota a felhasználó számára (`GET /progress`). */
export type LessonProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface ProgressSummary {
  completed: number
  total: number
  percent: number
}

export interface TrackProgress extends ProgressSummary {
  id: number
  slug: string
  title: string
  lessons: Array<{ id: number; status: LessonProgressStatus }>
}

export interface ProgressReport {
  overall: ProgressSummary
  tracks: TrackProgress[]
}

/** Képzési ág szerkezete (`GET /tracks/{slug}`): modulok, leckék, feladatok. */
export interface ExerciseSummary {
  id: number
  title: string
  level: Level
  difficulty: number
  allowed_languages: LanguageKey[]
}

export interface LessonSummary {
  id: number
  slug: string
  title: string
  is_free: boolean
  /** A néző számára zárolt-e; az ok a `locked_reason`. */
  locked: boolean
  locked_reason: LockReason | null
  has_video: boolean
  exercise_count: number
  /** A néző haladása; vendégnél null. */
  status: LessonProgressStatus | null
  exercises: ExerciseSummary[]
}

export interface ModuleSummary {
  id: number
  slug: string
  title: string
  description: string | null
  lessons: LessonSummary[]
}

export interface LessonLink {
  slug: string
  title: string
}

export interface LessonExercise extends ExerciseSummary {
  /** A néző megoldotta-e; vendégnél mindig hamis. */
  solved: boolean
}

/** Egy lecke oldala (`GET /tracks/{track}/lessons/{lesson}`). */
interface LessonDetailBase {
  id: number
  slug: string
  title: string
  track: LessonLink
  module: { id: number; title: string | null }
  is_free: boolean
  has_video: boolean
  exercises: LessonExercise[]
  previous: LessonLink | null
  next: LessonLink | null
}

export interface UnlockedLessonDetail extends LessonDetailBase {
  locked: false
  /** A tananyag Markdownban; üres, ha a leckéhez még nem készült. */
  content: string
}

/** Zárolt lecke: a backend a tananyagot nem küldi el, csak az okot. */
export interface LockedLessonDetail extends LessonDetailBase {
  locked: true
  locked_reason: LockReason
  locked_message: string
}

export type LessonDetail = UnlockedLessonDetail | LockedLessonDetail

/** Egy képzési ág a listában (`GET /tracks`). */
export interface TrackSummary {
  id: number
  slug: string
  title: string
  description: string | null
  module_count: number
  lesson_count: number
  free_lesson_count: number
  /** A néző haladása; vendégnél null. */
  progress: ProgressSummary | null
}

export interface TrackDetail {
  id: number
  slug: string
  title: string
  description: string | null
  modules: ModuleSummary[]
}

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'canceled' | 'expired'

/** Egy fizetés (`GET /billing/payments`), a hozzá kiállított számlával. */
export interface PaymentSummary {
  id: string
  purpose: 'initial' | 'renewal' | 'card_change'
  status: PaymentStatus
  is_final: boolean
  amount: number
  currency: string
  paid_at: string | null
  created_at: string | null
  invoice?: { status: 'pending' | 'issued' | 'failed'; number: string | null; download_url: string | null } | null
}
