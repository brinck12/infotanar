# BACKEND.md: what the backend must still build, and how

Audience: Claude Opus agents (and humans) who implement the missing backend of InfoTanár.hu, several in parallel, with no other context. Everything an implementer needs is in this file plus the code it points at. Read `CLAUDE.md` first (architecture, commands, conventions; it is current), then section 1 here, then only the sections of your work package (section 7).

Status words used throughout: **read** = I opened the file and quoted what it says; **inferred** = a design decision or a conclusion I did not find written anywhere; **unverified** = could not be checked here (see section 10). Paths are relative to the repository root unless they start with `backend/`, `frontend/` or `tests/`. PHP code comments in this repo are Hungarian written **without accents** (ASCII), user-facing strings are Hungarian **with** accents and live in `backend/lang/hu/*.php`.

Contents

1. How to use this document, and the backend as it is today
2. Request inventory (what the frontend calls vs what exists)
3. Data model
4. Feature designs
5. Cross-cutting concerns
6. Frontend changes required
7. Execution plan (work packages)
8. Open decisions (with defaults)
9. Out of scope and risks
10. What was verified

---

## 1. How to use this document, and the backend as it is today

### 1.1 Ground rules for every implementer

- The **frontend is the contract**. `frontend/src/features/**/api.ts` and `frontend/src/types/index.ts` define request and response shapes; `FRONTEND.md` section 11 is only a proposal and differs in places (listed in section 2.5). If you believe a frontend shape is a bad API, do not silently change it: implement the frontend shape and write the objection in your final report; section 6 lists the few places where the plan deliberately changes the frontend.
- Work only in the files your package **owns** (section 7). Files marked "shared" are changed only by the package that owns the change (section 7.13). If you need a change in a file you do not own, do not make it: write the need in your final report, and the integrator makes it.
- Never edit a migration that has been released (everything under `backend/database/migrations/` today). New tables and columns are new migration files, and they are all created by package WP0.
- Pull requests are disabled in this repository (see "Workflow" in `CLAUDE.md`). Each work package is built on its own branch or worktree cut from the integration branch `fullstack/backend-platform`, committed there, and merged into the integration branch by the integrator in the order of section 7.13. Nothing is pushed to `main` until the whole integration branch passes every check. Commit messages are English; do not push.
- Done means all of: `composer lint`, `composer analyse` (Larastan level max), `php artisan docs:endpoints` (the CI step runs `docs:endpoints --check`, `.github/workflows/ci.yml:85`), the API tests of your package (section 7), and, when you touch `frontend/` or `tests/`: `npm run lint`, `npm run typecheck`, `npm run build` in `frontend/` and `npm run check` in `tests/`.
- This machine's PHP (8.2.12, Windows, XAMPP) loads **no `ext-zip`, `ext-intl` or `ext-gd`** by default; `dom`, `fileinfo`, `libxml`, `SimpleXML`, `xmlreader` are present. CI and production (PHP 8.3) install `zip` and `intl` (`.github/workflows/ci.yml:63,175,406`), not `gd`. A ready `php.ini` with `zip` and `intl` enabled exists outside the repository: set the environment variable `PHPRC` to the directory your task brief names before running `php`, `composer` or Playwright (the test web server inherits it). Do not rely on `ext-gd`.

### 1.2 The backend today (read from the code)

Request flow (`CLAUDE.md`, verified in code): `backend/routes/api.php` (prefix `v1`, name prefix `api.`, global `RejectInvalidToken`) -> thin controller in `backend/app/Http/Controllers/Api/V1/<Area>` -> FormRequest -> Action (`backend/app/Actions/<Area>`) -> models and Services (`backend/app/Services`) -> API Resource.

Catalog: `Track -> Module -> Lesson -> Exercise -> TestCase`. The v1 API still calls an exercise a "task" (`/tasks`, `/tasks/{id}`, `task_id` in `/run` and `/submissions`; the `topic` of a task is its module). Table `exercises` holds: `lesson_id, position, title, description, level (kozep|emelt), difficulty 1..5, allowed_languages json, starter_code json, constraints (cast AsConstraintSet), sql_order_sensitive, time_limit_ms, memory_limit_kb, is_published` (`backend/app/Models/Exercise.php`). `submissions` holds code submissions only (`user_id` nullable, `exercise_id`, `language`, `source_code`, `status` pending|running|passed|failed|error, `verdict`, `results` json). Progress is derived from `submissions.status = 'passed'` and from `lesson_completions` (`Services/Progress/ExerciseStatuses.php`, `LessonStatuses.php`, `Actions/Progress/RecordLessonProgress.php`, `Actions/Catalog/ListTasks.php::whereStatus`).

Access: `Services/Access/ContentAccess::denialFor(?User, Lesson): ?AccessDenial` is the single rule (free lesson -> everyone; else login, verified e-mail, premium via live subscription or `AccessGrant`; admin always). Denial reasons are the `AccessDenial` enum (`login_required`, `email_unverified`, `subscription_required`); `Exceptions/Access/PremiumContentLocked` renders `{message, reason}` with 401 for `login_required` and 403 otherwise.

Disks (`backend/config/filesystems.php`): `local` (storage/app/private), `invoices`, `lesson_videos` (private, `visibility private`), `public`, `s3`. Videos use signed URLs (`Actions/Catalog/IssueLessonVideoUrl.php`, `Http/Controllers/Api/V1/Catalog/LessonVideoController.php`, routes `signed:relative`). Production: MySQL 8, PHP-FPM 8.3, nginx (`deploy/nginx/infotanar.conf`: `client_max_body_size 1m;` line 46, `fastcgi_read_timeout 60s;`), one `queue:work`, one `schedule:work`. Tests: SQLite, `QUEUE_CONNECTION=sync`, no scheduler, `php -S` per request (`tests/config/web-servers.ts`).

Libraries (`backend/composer.json`): only `laravel/framework ^12`, `laravel/sanctum`, `laravel/tinker`; dev: faker, larastan, pail, pint, sail, collision. **No** spreadsheet, PDF, zip or image library. This plan adds none (decision 8.3).

### 1.3 Conventions an implementer must follow, with the file to copy

| Convention | Rule | Pattern file |
|---|---|---|
| `declare(strict_types=1);` | first statement of every PHP file | any |
| Action | `final readonly class`, constructor injection, one use case; `handle()` is the entry point. Catalog-style actions with several verbs (`create/update/delete/reorder`) exist, but a new use case gets its own class with `handle()` | `Actions/Execution/RunSolution.php`, `Actions/Admin/Catalog/ManageTestCase.php` |
| Atomic multi-model change | `DB::transaction`, lock the row, re-check the invariant | `Actions/Admin/Users/ChangeUserRole.php` |
| Controller | thin; takes a FormRequest, calls one Action, returns a Resource; admin user via `#[CurrentUser] User $admin` | `Http/Controllers/Api/V1/Admin/Catalog/TestCaseController.php` |
| Input | a FormRequest for **every** input, including route-only ones with no body; `$required = $this->isMethod('POST') ? 'required' : 'sometimes'` for PATCH-style updates; use `after()` for cross-field checks | `Http/Requests/Admin/Catalog/ExerciseRequest.php`, `TestCaseRequest.php` |
| Output | an API Resource for **every** response (default `{data: ...}` envelope; run results are flat via `public static $wrap = null`) | `Http/Resources/Admin/AdminTestCaseResource.php`, `Http/Resources/EvaluationResource.php` |
| Business errors | subclass of `App\Exceptions\DomainException` (`status()`, optional `errors()`), message from `lang/hu`; not reported to the error log. Access-denied-with-reason reuses `PremiumContentLocked` | `Exceptions/Catalog/PublishedExerciseNeedsVisibleTestCase.php`, `Exceptions/Access/PremiumContentLocked.php` |
| Audit | `RecordAuditEvent::handle(AuditAction::X, $actor, $subject, $metadata)`; add an enum case instead of ad-hoc logging; the subject's morph alias must be in `Relation::enforceMorphMap` | `Actions/Audit/RecordAuditEvent.php`, `Enums/AuditAction.php`, `Providers/AppServiceProvider.php::boot` |
| Authorization | `admin` route middleware (runs before route-model binding) for `/admin/*`; ownership via a Policy; **a foreign resource answers 404, not 403**, so existence does not leak | `Policies/SubmissionPolicy.php` + `Http/Controllers/Api/V1/Execution/SubmissionHistoryController::show`, `Http/Middleware/EnsureUserIsAdmin.php` |
| Rate limiting | named limiter defined in `AppServiceProvider::configureRateLimiting` (`->by(user or ip)`, `->response($tooMany)`), attached with `throttle:<name>` | `Providers/AppServiceProvider.php` |
| Signed private files | `URL::temporarySignedRoute(..., absolute: false)` + route `signed:relative`, `Cache-Control private`, `X-Content-Type-Options nosniff` | `Actions/Catalog/IssueLessonVideoUrl.php`, `LessonVideoController` |
| Account deletion | listener on `AccountDeleted` (auto-discovered: the `handle(AccountDeleted $event)` type hint is enough) | `Listeners/PurgeLearningProgressOnAccountDeletion.php`, `Actions/Account/DeleteAccount.php` |
| Export | every new per-user data goes into `ExportAccountData` | `Actions/Account/ExportAccountData.php` |
| Strings | `__('area.key')`, files in `backend/lang/hu/`; never hard-code a message | `lang/hu/catalog.php` |
| Strict models | outside production lazy loading, silent attribute discards and missing attributes throw: always `with()`/`withCount()` what a Resource reads | `AppServiceProvider::boot` |
| Static analysis | Larastan `max`: `@param`/`@return` generics, `@throws`, `@property` blocks on models, no `mixed` leaks | `Models/Exercise.php` |
| Style | Pint (`composer format`); `final` classes; no new package without a written need | `composer format` (no `pint.json`: Pint defaults) |
| Routes | every new endpoint is added in the route file of its area (section 7.1), then `php artisan docs:endpoints` is run and the regenerated `docs/api-endpoints.md` is committed (the file is generated; CI fails if stale) | `backend/app/Console/Commands/GenerateEndpointDocs.php` |
| Tests | no PHPUnit; backend behaviour is covered by the Playwright `api` project: `tests/specs/api/*.spec.ts`, typed client `tests/src/api/ApiClient.ts`, seed contract `backend/database/seeders/ApiTestSeeder.php` <-> `tests/src/data/seed.ts` (change both together) | `tests/specs/api/admin-users.spec.ts` |

JSON conventions in this API (read): snake_case keys; timestamps `toIso8601String()`; success bodies `{ "data": ... }`, lists `{ "data": [...] }`; paginated lists either `{data, meta:{current_page,last_page,total}}` (resource collections) or the raw paginator (admin users); errors `{ "message": "...", "errors": { "field": ["..."] } }`; 401/403/404/429 are rendered as `{message}` by `backend/bootstrap/app.php`.

---

## 2. Request inventory

Legend for **Status**: `OK` = exists and matches (I compared the frontend type with the Resource/Request keys; see section 10 for how deep), `DIFF` = exists but differs, `MISSING` = no backend route. **Auth**: `public` = no token needed, `user` = Bearer token, `admin`.

### 2.1 Requests the frontend makes

Auth and account (all `OK`)

| Request | Frontend function (file) | Pages | Auth |
|---|---|---|---|
| `POST /auth/register` | `register` (`features/auth/api.ts`) | Register | public |
| `POST /auth/login` | `login` | Login | public |
| `POST /auth/logout` | `logout` | account menu | user |
| `GET /auth/me` | `me` | AuthProvider | user |
| `GET /auth/verify-email/{id}/{hash}` (+`expires`,`signature`) | `verifyEmail` | VerifyEmail | signed |
| `POST /auth/email/verification-notification` | `resendVerification` | VerifyEmailBanner, RegisterDone | user |
| `POST /auth/forgot-password` | `forgotPassword` | ForgotPassword | public |
| `POST /auth/reset-password` | `resetPassword` | ResetPassword | public |
| `GET /account/export` (blob) | `downloadMyData` (`features/account/api.ts`) | AccountProfile | user |
| `DELETE /account` body `{password}` | `deleteMyAccount` | AccountProfile | user |
| `PATCH /account/profile` `{name}` | `updateName` | AccountProfile | user |
| `PUT /account/password` | `changePassword` | AccountProfile | user |
| `POST /account/email` | `requestEmailChange` | AccountProfile | user |
| `GET /account/email/confirm/{id}/{hash}` | `confirmEmailChange` | EmailChangeConfirm | signed |
| `POST /client-errors` | `reportError` (`shared/api/reportError.ts`) | ErrorBoundary, global handlers | public |

Billing (all `OK`)

| Request | Function (`features/billing/api.ts`) | Pages | Auth |
|---|---|---|---|
| `GET /billing/plan` | `plan` | Pricing, Subscribe, AccountSubscription | public |
| `GET /billing/profile`, `PUT /billing/profile` | `profile`, `saveProfile` | Subscribe, AccountBilling | user |
| `GET /billing/subscription` | `subscription` | AccountSubscription, PastDueBanner | user |
| `POST /billing/checkout` | `checkout` | Subscribe | user |
| `GET /billing/payments?page`, `GET /billing/payments/{id}` | `payments`, `payment` | AccountPayments, PaymentReturn | user |
| `POST /billing/subscription/cancel`, `/resume`, `/card` | `cancelSubscription`, `resumeSubscription`, `changeCard` | AccountSubscription | user |
| `GET /billing/payments/{id}/invoice` (blob) | `downloadInvoice` | PaymentsTable | user |

Catalog, learning, execution, progress

| Request | Function (file) | Pages | Auth | Status |
|---|---|---|---|---|
| `GET /tracks`, `GET /tracks/{slug}` | `tracksQuery`, `trackQuery` (`features/catalog/api.ts`) | LearningPath, TrackPage, TaskList (tree) | public | OK |
| `GET /tracks/{track}/lessons/{lesson}` | `lessonQuery` (`features/lesson/api.ts`) | LessonPage, LessonById | public | OK |
| `POST /lessons/{id}/complete` | `completeLesson` | CompleteLesson | user | OK |
| `GET /lessons/{id}/video` (+ signed `stream`, `captions`) | `lessonVideo` (`features/workspace/api.ts`) | LessonVideo | public | OK |
| `GET /topics` | `topicsQuery` | TaskList | public | OK |
| `GET /tasks?topic&level&status` | `tasksQuery` | TaskList | public | OK |
| `GET /tasks/{id}` | `taskQuery` | TaskSolve and the four task workspaces | public | **DIFF** (no `kind`, `file_task`, `sql_task`, `web_task`, `sheet_practice`, `doc_practice`, `sources`; `allowed_languages` cannot be empty): section 4.1 |
| `GET /languages` | `languagesQuery` (`features/admin/catalog/api.ts`) | AdminExercise | public | OK |
| `POST /run` | `runCode` | TaskSolve | public (throttle `execution`) | **DIFF** (no `subtasks`; non-code kinds not refused): section 4.2 |
| `POST /submissions` | `submitCode` | TaskSolve | public (throttle `execution`) | **DIFF** (same) |
| `GET /tasks/{id}/submissions` (cursor), `GET /submissions` (cursor), `GET /submissions/{id}` | `taskSubmissionsQuery`, `recentSubmissionsQuery`, `submissionQuery` | SubmissionHistory, RecentSubmissions | user | OK |
| `GET /progress` | `progressQuery` | ProgressDashboard | user | OK (file tasks and exam practice must be counted: 4.7) |

Admin (existing)

| Request | Function (file) | Pages | Status |
|---|---|---|---|
| `GET/POST /admin/tracks`, `GET/PUT/DELETE /admin/tracks/{id}`; the same for `modules`, `lessons`, `exercises` (create/update/remove helpers in `features/admin/catalog/api.ts`) | `tracksQuery`, `trackQuery`, `moduleQuery`, `lessonQuery`, `exerciseQuery`, `create`, `update`, `remove` | AdminCatalog, AdminTrack, AdminModule, AdminLesson, AdminExercise, AdminOverview (`/admin/tracks`) | OK for tracks/modules/lessons; **DIFF** for exercises (no `kind`, `spec`, `comparison`; `allowed_languages` min 1): 4.1 |
| `PUT /admin/tracks/order`, `/admin/tracks/{id}/modules/order`, `/admin/modules/{id}/lessons/order`, `/admin/lessons/{id}/exercises/order` | `reorder` | the catalog pages | OK |
| `GET/POST /admin/exercises/{id}/test-cases`, `PUT/DELETE /admin/test-cases/{id}`, `PUT /admin/exercises/{id}/test-cases/order` | `testCasesQuery`, `createTestCase`, `updateTestCase`, `deleteTestCase`, `reorder` | TestCaseManager | OK |
| `GET /admin/constraint-options` | `constraintOptionsQuery` | ConstraintEditor | OK |
| `GET /admin/users`, `GET /admin/users/{id}` | `usersQuery`, `userQuery` (`features/admin/users/api.ts`) | AdminUsers, AdminUserDetail, AdminOverview (4 count queries) | OK (raw paginator) |
| `GET/POST /admin/users/{id}/access-grants`, `DELETE /admin/access-grants/{id}` | `accessGrantsQuery`, `grantAccess`, `revokeAccess` | AccessGrants | OK |
| `PUT /admin/users/{id}/role`, `POST .../verification-notification`, `POST .../verify-email`, `DELETE .../tokens`, `POST .../password-reset` | `changeRole`, `resendVerification`, `verifyEmail`, `revokeTokens`, `sendPasswordReset` | UserActions | OK |
| `GET /admin/users/{id}/payments?page`, `GET .../payments/{id}/invoice` (blob) | `paymentsQuery`, `downloadInvoice` | UserPayments | OK |
| `GET /admin/invoices?page`, `PUT /admin/invoices/{id}/buyer`, `POST /admin/invoices/{id}/retry` | `attentionInvoices`, `correctBuyer`, `retryInvoice` (`features/admin/invoices/api.ts`) | AdminInvoices, AdminOverview | OK |

New features (the frontend already calls these; `MISSING` unless noted)

| Request | Function (file) | Pages | Auth | Section |
|---|---|---|---|---|
| `GET /exams` | `examsQuery` (`features/exams/api.ts`) | ExamList (404 = "not available yet") | public, optional token | 4.5 |
| `GET /exams/{id}` | `examQuery` | ExamStart, ExamRunner | user | 4.5 |
| `POST /exams/{id}/attempts` `{mode}` | `startAttempt` | ExamStart | user | 4.5 |
| `GET /exam-attempts/{id}` | `attemptQuery` | ExamRunner | user | 4.5 |
| `POST /exam-attempts/{id}/parts/{part}/file` (multipart `file`) | `uploadPartFile` | ExamRunner (PartView) | user | 4.5 |
| `POST /exam-attempts/{id}/submit` | `submitAttempt` | ExamRunner | user | 4.5 |
| `GET /exam-attempts/{id}/result` | `resultQuery` | ExamResult | user | 4.5 |
| `POST /exercises/{id}/file-submissions` (multipart `file`) | `uploadSubmission` (`features/filetasks/api.ts`) | FileTaskWorkspace | user | 4.3 |
| `GET /exercises/{id}/file-submissions` | `submissionsQuery` | FileTaskWorkspace | user | 4.3 |
| `GET /file-submissions/{id}` | `submissionQuery` | SubmissionPage (`/beadasok/:id`) | user | 4.3 |
| `PUT /file-submissions/{id}/manual` body `{marks: {"<rubric_item_id>": bool}}` | `saveManualMarks` | ManualMarksModal | user | 4.3 |
| `GET /admin/exams`, `POST /admin/exams`, `GET/PUT /admin/exams/{id}` | `adminExamsQuery`, `createExam`, `adminExamQuery`, `updateExam` (`features/admin/exams/api.ts`) | AdminExams, AdminExam | admin | 4.5 |
| `POST /admin/exams/{id}/parts`, `DELETE /admin/exam-parts/{id}`, `PUT /admin/exams/{id}/parts/order` | `addExamPart`, `removeExamPart`, `reorderExamParts` | AdminExam | admin | 4.5 |
| `GET/POST /admin/exercises/{id}/rubric-items`, `DELETE /admin/rubric-items/{id}`, `PUT /admin/exercises/{id}/rubric-items/order` | `rubricQuery`, `createRubricItem`, `deleteRubricItem`, `reorderRubricItems` | RubricBuilder (tab "Értékelőlap" of AdminExercise) | admin | 4.3 |

### 2.2 State that lives in the browser but should live on the server

| Where | What | Fate (section) |
|---|---|---|
| `shared/domain/preferences.ts`, read by `features/onboarding/pages/Onboarding.tsx`, `features/oral/pages/OralTopic.tsx` (key `infotanar.preferences.v1.<user>`) | level, exam period, language, weekly hours | server (`GET/PUT /account/preferences`, 4.6) |
| `features/oral/practice.ts`, read by `Oral.tsx`, `OralTopic.tsx` (key `infotanar.oral.v1.<user>.<slug>`) | checked outline items, notes, three self-scores, attempts count | server (`/oral/practice`, 4.6) |
| `shared/domain/lastTask.ts` (TaskList, ProgressDashboard) | last opened task | **stays local**: derivable from `GET /submissions` but not worth an endpoint |
| `features/workspace/drafts.ts`, `useCodeDraft.ts` | unsent code drafts per user and task | **stays local** (per-viewer convenience) |
| `shared/consent/consentStore.ts`, `usePersistentState` uses in `SiteNotices.tsx`, `LessonVideo.tsx` (rate), `TaskSolve.tsx` (split) | cookie decision, notice seen, video speed, pane split | **stays local** |

### 2.3 Backend routes the frontend never calls

`GET /health`, `GET /health/ready` (ops), `POST /webhooks/barion` (Barion), `GET /admin/ping`, `GET /admin/users/{user}/export` and `DELETE /admin/users/{user}` (the design shows them on the user detail page, `FRONTEND.md` section 7 `AdminFelhasznalo`, but `features/admin/users` has no call; read), `GET /admin/modules`, `GET /admin/lessons`, `GET /admin/exercises` (list endpoints; the pages read children through `GET /admin/tracks[/{id}]`), `GET /admin/test-cases/{id}`. The signed `GET /lessons/{id}/video/stream|captions` are called by the browser's `<video>` element, not by code.

### 2.4 Gaps the frontend implies beyond the 22 missing routes above (found by reading pages)

1. **Task payload** (`UnlockedTaskDetail`): `kind`, `file_task`, `sql_task`, `web_task`, `sheet_practice`, `doc_practice`, `sources` (all optional in the type, but pages branch on them: `TaskSolve.tsx` lines 120 to 125 choose the workspace from `kind` / `web_task` / `sheet_practice` / `doc_practice`).
2. **Run result `subtasks`** (`RunResponse.subtasks`, rendered by `workspace/components/ResultPanel.tsx:81`).
3. **Admin authoring has no UI for any of the new data**: `AdminExercise.tsx` edits only the legacy fields plus the rubric tab; `AdminExam.tsx` shows exam files read-only ("Még nincs feltöltött fájl", no upload control) and its create form has no exam period. Without backend upload endpoints and a small frontend addition nobody can create a file task, a source file or an exam (section 6, WP11).
4. **No polling** for `FileSubmission.status === 'processing'` (`filetasks/components/FileTaskWorkspace.tsx`, `SubmissionResult.tsx`): the backend must evaluate **synchronously** inside the upload request (4.3) unless WP10 adds polling.
5. **Exam runner programming parts** open `/feladatok/{exercise_id}` in a new tab and promise "A beadott megoldásod a vizsga értékelésébe is beszámít" (`ExamRunner.tsx`, PartView) but no request links a code submission to an attempt; the backend must infer it from time and user (4.5).
6. **Account deletion and export** do not know any of the new data (4.7).
7. The **admin overview** works today from four user-list queries (`AdminOverview.tsx`); a dedicated endpoint is an improvement, not a gap (4.8, optional).
8. **`FRONTEND.md` section 11 proposals the frontend does not use**, therefore *not* to be built unless the frontend grows a page: `/progress` readiness-per-exam-part, practice calendar, weak topics (`ProgressDashboard.tsx` reads only `overall` and `tracks`); `users.preferences.emelt choice document|spreadsheet` (`StudyPreferences` has four fields only); an exam date lookup table (the date is the Vite env `examDate`, `shared/domain/exam.ts`); `oral_topics` tables (topics, outlines and tasks are static in `features/oral/topics.ts`); MariaDB sandbox (4.2 and 9).

### 2.5 Where `FRONTEND.md` section 11 and the code disagree (code wins)

| Topic | `FRONTEND.md` | Code (used here) |
|---|---|---|
| Manual marks | `PUT /file-submissions/{id}/manual` with `{ rubric_item_id: bool }` | body is `{ marks: { "<id>": true } }` (`filetasks/api.ts:saveManualMarks`) |
| Rubric item | `group, label, check type, params JSON, points, mode, hint, order` | API fields `label, group, check_type, property, expected, points, mode, hint` (strings; `admin/exams/api.ts`); `params` is an optional backend extension (4.4) |
| `exam_points` | on the exercise | inside `file_task.exam_points` (`types/index.ts: FileTaskInfo`) |
| Exam attempt | `exam_attempts (mode, started_at, deadline, submitted_at, state)` | states `in_progress \| submitted \| evaluated`, modes `exam \| practice` (`exams/api.ts`) |
| Onboarding / oral | tables `oral_topics`, `oral_attempts`, `users.preferences` | oral topics static in the frontend; server stores per-user practice state; preferences keys are camelCase in the frontend type (`StudyPreferences`), snake_case on the wire (decision 4.6) |
| Input-files commit | the task brief names `0f7e4d5` | `0f7e4d5` is only a doc cleanup; the exercise input files work is **`00c8e59`** (with `docs/adr/0003-exercise-input-files.md`). Other SHAs from the brief are right: `122e6a4` dashboard, `38d8271` audit log, `761e580` video upload, `b718c06` custom input, `f2cec23` hints, `037e9f5` comparison modes, `234738d` editor preferences. Of these only `00c8e59` and `037e9f5` are reused (4.2); the others have no frontend and stay dropped |


---

## 3. Data model

All new migrations are created **by WP0 only**, dated `2026_10_12_1xxxxx_...` (after the last released one, `2026_10_10_090000_restore_user_id_index_on_submissions_table.php`). Use `string` columns with an app-level enum, never DB `enum` (adding a value to a MySQL enum or SQLite check needs a table rewrite; `submissions.status` already shows the problem). Every FK and index below must be declared explicitly. All timestamps are `timestamp`, UTC, written as Carbon.

### 3.1 Existing tables, in brief (read from migrations and models)

`users` (soft deletes, `role`, `pending_email`), `tracks -> modules -> lessons -> exercises -> test_cases` (positions 0..n-1 among siblings, `SiblingOrder`), `submissions` (code only), `lesson_completions`, `subscriptions`, `payments`, `invoices`, `billing_profiles`, `access_grants`, `consents`, `subscription_notices`, `audit_logs` (polymorphic subject through the morph map), `personal_access_tokens`, `cache`, `jobs`, `sessions`.

### 3.2 Changes to existing tables

**`exercises`** (extended, not replaced: a typed task is still an exercise, so ids, lessons, positions, publishing, freemium and progress keep working):

| Column | Type | Null | Default | Why |
|---|---|---|---|---|
| `kind` | `string(24)` | no | `'code'` | `ExerciseKind` enum value. Index `exercises_kind_index`. Backfill in the same migration (loop in PHP, not JSON SQL, so it is identical on MySQL and SQLite): `kind = 'sql'` where `allowed_languages` decodes to exactly `['sql']`, else `'code'` |
| `spec` | `json` | yes | `NULL` | Type-specific payload (shape per kind in 4.1). One column instead of five because each kind uses exactly one shape and the API output is assembled per kind |
| `comparison` | `json` | yes | `NULL` | Output comparison mode (4.2): `{mode: exact\|tokens\|numeric, case_insensitive, ignore_accents, ignore_blank_lines, abs_tol, rel_tol}`; `NULL` = today's line-by-line comparison. Reuses the design of commit `037e9f5` |

`allowed_languages` stays `json`; for non-code kinds it holds `[]` (the admin request relaxes `min:1`, 4.1). No existing column changes.

**`submissions`**: add `score` `unsignedSmallInteger` null, `max_score` `unsignedSmallInteger` null, `subtasks` `json` null. Written by `SubmitSolution` (4.2): `score/max_score` = subtask points when the exercise has subtasks, else passed test cases / total test cases. Old rows stay `NULL`; readers fall back to counting `results[].passed` (needed by exam scoring, 4.5). No index needed (exam scoring filters by `user_id, exercise_id`, which `submissions_user_exercise_status_index` already covers).

**`users`**: add `preferences` `json` null (4.6). It is not mass-assignable and not in `$hidden`; cast `array`.

### 3.3 New tables

**`attachments`** (files belonging to an exercise or an exam; polymorphic through the morph map `exercise` and `exam`; files live on the new private disk `exercise_files`, never in the DB)

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | bigint pk | | |
| `attachable_type` | `string(32)` | no | morph alias `exercise` or `exam`. No DB FK (polymorphic); the delete actions of exercises and exams remove attachments and files explicitly (4.1) |
| `attachable_id` | `unsignedBigInteger` | no | |
| `test_case_id` | FK `test_cases.id` | yes, `cascadeOnDelete` | only for role `input` (per-test-case replacement of a shared source file, never downloadable; design of `00c8e59` / ADR 0003) |
| `role` | `string(24)` | no | `AttachmentRole`: `source` (student-visible, downloadable; for code and sql kinds also sent to Judge0 as an input file), `input` (hidden per-test-case file), `sample_image` (the "Minta" picture of a file task), `sample_solution` (a correct solution file for rubric checking, admin only, never exposed), `source_zip` (exam: all source files as one zip) |
| `name` | `string(100)` | no | public file name. Roles `source`/`input`: `[A-Za-z0-9._-]{1,64}`, not `.`/`..`, not a Judge0 reserved name (`script.py`, `script.sql`, `Main.cs`, `compile`, `run`). Other roles: any name that passes `UploadedFileInspector::safeName` |
| `path` | `string(255)` | no | relative path on the disk: `{attachable_type}/{attachable_id}/{ulid}.{ext}`; random, never derived from `name` |
| `size` | `unsignedInteger` | no | bytes |
| `sha256` | `char(64)` | no | |
| `mime` | `string(100)` | no | sniffed with `finfo`, not the client's claim |
| `position` | `unsignedSmallInteger` | no, default 0 | display order |
| timestamps | | | |

Index `attachments_owner_index (attachable_type, attachable_id, role, position)`. Uniqueness of `(attachable, role, test_case_id, lower(name))` is enforced by the Action under `lockForUpdate` on the owner row, not by a DB unique index (NULL `test_case_id` defeats it, and MySQL's default collation is case-insensitive while SQLite's is not: compare with `mb_strtolower`).

**`rubric_items`** (the Értékelőlap of a file-task exercise)

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | bigint pk | | |
| `exercise_id` | FK `exercises.id` | no, `cascadeOnDelete` | |
| `position` | `unsignedSmallInteger` | no | 0..n-1 via `SiblingOrder` |
| `group` | `string(100)` | no, default `''` | group shown as a bar ("Betöltés és képletek"); `''` is shown as `Egyéb` |
| `label` | `string(255)` | no | shown in the sheet |
| `check_type` | `string(32)` | no | `RubricCheckType` enum (4.4) |
| `property` | `string(150)` | no, default `''` | what to inspect, grammar in 4.4 |
| `expected` | `string(500)` | no, default `''` | expected value, grammar in 4.4 |
| `points` | `unsignedSmallInteger` | no | raw points (`>= 1`) |
| `mode` | `string(8)` | no, default `'auto'` | `RubricMode`: `auto` or `manual` |
| `hint` | `string(500)` | yes | what the student should fix |
| `params` | `json` | yes | optional structured extension (importers, future UI); the current admin form never sends it |
| timestamps | | | |

Index `(exercise_id, position)`.

**`file_submissions`** (one uploaded file and its evaluation; used by practice file tasks and by exam parts)

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | bigint pk | | |
| `user_id` | FK `users.id` | yes, `nullOnDelete` | rows and files are hard-deleted on account deletion (4.7); `nullOnDelete` is only a safety net |
| `exercise_id` | FK `exercises.id` | no, `cascadeOnDelete` | deleting an exercise with file submissions is refused at app level (`CatalogItemInUse`) |
| `exam_attempt_id` | FK `exam_attempts.id` | yes, `cascadeOnDelete` | set for uploads made inside an exam; such rows are excluded from practice lists and progress |
| `exam_part_id` | FK `exam_parts.id` | yes, `nullOnDelete` | |
| `attempt` | `unsignedSmallInteger` | no, default 1 | practice: running counter per `(user, exercise)` = `max(attempt)+1`; exam rows: 1 |
| `status` | `string(12)` | no, default `'stored'` | `FileSubmissionStatus`: `stored` (exam upload waiting for the attempt to be submitted; API maps it to `processing`), `evaluated`, `failed` |
| `original_name` | `string(255)` | no | sanitised display name |
| `path` | `string(255)` | no | on disk `submission_files`: `u{user_id}/e{exercise_id}/{ulid}.{ext}` or `u{user_id}/a{attempt_id}/p{part_id}-{ulid}.{ext}` |
| `extension` | `string(8)` | no | lower-case, with the dot, e.g. `.xlsx` |
| `size` | `unsignedInteger` | no | |
| `sha256` | `char(64)` | no | |
| `score` | `unsignedSmallInteger` | no, default 0 | raw earned points (auto points + marked manual points) |
| `max_score` | `unsignedSmallInteger` | no, default 0 | rubric total at evaluation time |
| `passed` | `boolean` | no, default false | `score >= ceil(max_score * filetasks.pass_ratio)` and `max_score > 0` (decision 8.2) |
| `result` | `json` | yes | snapshot `{groups: [{name, score, max_score}], items: [{rubric_item_id, group, label, state, points, max_points, found, hint, manual_mark}], facts: [{label, value}]}`. The snapshot keeps old results readable after the rubric changes or items are deleted |
| `error` | `string(500)` | yes | Hungarian reason when `status = failed` |
| `evaluated_at` | `timestamp` | yes | |
| timestamps | | | |

Indexes: `file_submissions_user_exercise_index (user_id, exercise_id, id)`, `file_submissions_progress_index (user_id, exercise_id, exam_attempt_id, passed)` (progress union, 4.7), unique `file_submissions_attempt_part_unique (exam_attempt_id, exam_part_id)` (one upload per part; NULLs are distinct in both MySQL and SQLite, so practice rows are unaffected).

**`exams`**

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | bigint pk | | |
| `session` | `string(7)` | no | `YYYY-05` or `YYYY-10`; `ExamSummary.session`. Default in the admin create request: the current year-month if not sent (the current admin form has no field for it, section 6) |
| `title` | `string(255)` | no | e.g. `2026. május` (the frontend appends the level) |
| `level` | `string(8)` | no | `kozep` or `emelt` |
| `minutes` | `unsignedSmallInteger` | no | exam length; deadline = start + minutes in exam mode |
| `points` | `unsignedSmallInteger` | no | |
| `is_published` | `boolean` | no, default false | |
| `timed_mode` | `boolean` | no, default true | whether mode `exam` is allowed |
| timestamps | | | |

Index `exams_listing_index (is_published, session, level)`.

**`exam_parts`**

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | bigint pk | | |
| `exam_id` | FK `exams.id` | no, `cascadeOnDelete` | |
| `exercise_id` | FK `exercises.id` | yes, `nullOnDelete` | the exercise that carries the task text, sources, rubric (file parts) or tests (editor parts). Deleting an exercise that is used by a part is refused (`CatalogItemInUse`) |
| `position` | `unsignedSmallInteger` | no | 0..n-1; API `order = position + 1` |
| `key` | `string(16)` | no | `ExamPartKey`: `szoveg, vizualis, tablazat, adatbazis, programozas, dokumentum` (read: `shared/domain/exam.ts`) |
| `name` | `string(255)` | no | |
| `points` | `unsignedSmallInteger` | no | exam points this part is worth in the total |
| `minutes` | `unsignedSmallInteger` | no | recommended time only |
| timestamps | | | |

Index `(exam_id, position)`.

**`exam_attempts`**

| Column | Type | Null | Notes |
|---|---|---|---|
| `id` | bigint pk | | |
| `user_id` | FK `users.id` | no, `cascadeOnDelete` | hard-deleted by a listener on account deletion (users are only soft-deleted) |
| `exam_id` | FK `exams.id` | no, `cascadeOnDelete` | exams are never deleted through the API |
| `mode` | `string(8)` | no | `exam` or `practice` |
| `state` | `string(12)` | no, default `'in_progress'` | `in_progress`, `submitted`, `evaluated` |
| `in_progress_marker` | `boolean` | yes | `true` while `in_progress`, `NULL` otherwise. Unique `(user_id, exam_id, in_progress_marker)`: at most one open attempt per user and exam, portable to SQLite and MySQL (NULLs are distinct) |
| `started_at` | `timestamp` | no | |
| `deadline_at` | `timestamp` | yes | `started_at + exam.minutes` for mode `exam` (copied, so editing the exam later does not move a running deadline); NULL for `practice` |
| `submitted_at`, `evaluated_at` | `timestamp` | yes | |
| `last_activity_at` | `timestamp` | no | updated by upload / read; drives idle pruning of practice attempts |
| `score`, `max_score` | `unsignedSmallInteger` | yes | exam points after conversion; NULL until evaluated |
| `pending_manual_points` | `unsignedSmallInteger` | no, default 0 | |
| `result` | `json` | yes | snapshot: `[{part_id, order, score, max_score, raw_score, raw_max, summary, file_submission_id, submission_id}]` |
| timestamps | | | |

Indexes: `(state, deadline_at)` (expiry job), `(user_id, exam_id, id)` (latest attempt per exam).

**`oral_practices`**: `id`, `user_id` FK `users` `cascadeOnDelete`, `topic` `string(64)`, `checked` json (list of int, default `[]`), `notes` `text` null (max 5000 chars enforced in the request), `scores` json (object criterion -> 0..4, default `{}`), `attempts` `unsignedInteger` default 0, `last_practiced_at` timestamp null, timestamps; unique `(user_id, topic)`.

### 3.4 Morph map and audit

Add to `Relation::enforceMorphMap` (`AppServiceProvider::boot`): `exam => Exam`, `exam_part => ExamPart`, `exam_attempt => ExamAttempt`, `rubric_item => RubricItem`, `attachment => Attachment`, `file_submission => FileSubmission`. (`exercise` and `user` already exist; `oral_practice` is not an audit subject.)

New `AuditAction` cases: `AttachmentUploaded = 'attachment.uploaded'`, `AttachmentDeleted = 'attachment.deleted'`, `ExamPublished = 'exam.published'`, `ExamUnpublished = 'exam.unpublished'`. Exam, exam part and rubric item CRUD reuse `CatalogCreated/Updated/Deleted/Reordered` with the new subject types. Student actions (uploads, attempts, practice state) are not audited, like code submissions today.

### 3.5 MySQL 8 vs SQLite differences to respect

- Unique indexes with NULL columns (`exam_attempts`, `file_submissions`, `attachments`): NULLs never collide in either engine; do not rely on a DB error for "same name" checks on attachments (collation differs: MySQL ci, SQLite binary).
- `json` columns: MySQL validates JSON and normalises key order; SQLite stores text. Never rely on key order of stored JSON; read through Eloquent `array` casts. Do not use JSON path SQL in new queries (existing `whereJsonContains` in `ListTasks` is the only one).
- `lockForUpdate()` is a no-op on SQLite; the one-open-attempt rule therefore also has the unique marker column, which works on both.
- Booleans are `tinyint(1)` on MySQL; always cast. `unsignedSmallInteger` caps at 65535: points and counts fit.
- SQLite cannot drop or alter a column with an index in one step the way MySQL can: keep `down()` methods simple (drop the table, or drop the index first). Migrations run on both in CI (`.github/workflows/ci.yml` has a MySQL job, line 172).
- Text columns: file names and Hungarian text need `utf8mb4` (already the connection default). Never compare file names with `=` in SQL for uniqueness.
- Sorting: MySQL sorts Hungarian text with its collation, SQLite binary; list endpoints sort by ids/positions/dates, not by title, except where noted.


---

## 4. Feature designs

Common to every new endpoint: JSON in and out, errors as `{message, errors?}` in Hungarian, `declare(strict_types=1)`, FormRequest in, Resource out, Policy or route middleware for authorization, strict-model-safe eager loading. "Classes" lists give full paths under `backend/app/`.

### 4.1 Typed tasks, task payloads, attachments (WP1)

#### 4.1.1 `ExerciseKind`

`App\Enums\ExerciseKind` (string backed), values exactly the TypeScript union: `code, sql, sheet_upload, sheet_browser, doc_upload, doc_browser, web, visual_upload`. Helpers: `isEditorBased()` (code, sql), `isUpload()` (sheet_upload, doc_upload, visual_upload), `isBrowserOnly()` (sheet_browser, doc_browser, web), `acceptsFileSubmission()` = isUpload.

| Kind | `allowed_languages` | Student workspace (read: `TaskSolve.tsx` 120-125) | Server grading | `spec` shape | Counts for lesson completion |
|---|---|---|---|---|---|
| `code` | non-empty | Monaco + Futtatás/Beadás | `POST /run`, `/submissions` | `{subtasks?}` | yes |
| `sql` | `['sql']` | same, plus schema panel when `spec` present | same | `{database, tables, subtasks}` | yes |
| `sheet_upload`, `doc_upload`, `visual_upload` | `[]` | `FileTaskWorkspace` (picked by `isUploadKind(kind)`) | file submission + rubric (4.3) | `{steps, deliverable, accepted_extensions, software, exam_reference, exam_points, raw_points}` | yes (when `passed`) |
| `web` | `[]` | `WebTaskWorkspace` (picked by `web_task` present) | none: checks run in the browser | `{files, checks, exam_reference}` | **no** |
| `sheet_browser` | `[]` | `SheetPracticeWorkspace` (by `sheet_practice`) | none | `{columns, rows, cells, checks}` | **no** |
| `doc_browser` | `[]` | `DocPracticeWorkspace` (by `doc_practice`) | none | `{paragraphs, checks}` | **no** |

"No" means: these exercises are ignored by `RecordLessonProgress` and do not block `CompleteTheoryLesson` (a lesson whose only published exercises are browser-only is completed with the existing "Kész" button). They never get a `my_status` (the browser cannot report). This is decision 8.11; the alternative (a self-report endpoint) has no frontend caller.

#### 4.1.2 Admin exercise API changes

Files (all WP1): `Http/Requests/Admin/Catalog/ExerciseRequest.php`, `Http/Resources/Admin/AdminExerciseResource.php`, `Http/Controllers/Api/V1/Admin/Catalog/ExerciseController.php`, new `Services/Catalog/Spec/ExerciseSpec.php` (normaliser and validator rules per kind), `Casts/AsExerciseSpec.php` is **not** needed (plain `array` cast on the model, normalised in the request).

New optional request fields on `POST /admin/exercises` and `PUT|PATCH /admin/exercises/{id}` (the existing frontend payload, which sends none of them, must keep working: absent `kind` on create means `code`):

| Field | Rules |
|---|---|
| `kind` | `sometimes`, `Rule::enum(ExerciseKind::class)`. On update it may change only if the exercise has no `submissions`, no `file_submissions` and is not used by an exam part; otherwise 422 `kind`: "A feladat típusa már nem módosítható, mert diákok dolgoztak vele." (`lang/hu/catalog.php` key `kind_locked`) |
| `allowed_languages` | currently `required\|array\|min:1` on create. New: required **only** when the effective kind is `code` or `sql` (`min:1`, `sql` kind must be exactly `['sql']`); for other kinds it must be missing or `[]` and is stored as `[]`. Implement with `Rule::requiredIf` and an `after()` check using the effective kind (request value, else the route model's kind) |
| `spec` | `sometimes\|nullable\|array`. Validated by `ExerciseSpec::rules($kind)` below. `null` clears. Total JSON size <= 64 KB |
| `comparison` | `sometimes\|nullable\|array`; only for `code` kind. `mode` in `exact,tokens,numeric`; `case_insensitive`, `ignore_accents`, `ignore_blank_lines` boolean; `abs_tol` numeric 0..1000; `rel_tol` numeric 0..1 |

Publishing (`is_published = true`), enforced in `ExerciseController::store/update` next to the existing test-case rule: `code`/`sql`: at least one visible test case (existing `PublishedExerciseNeedsVisibleTestCase`). Upload kinds: `spec` present and at least one rubric item (`Exceptions/Catalog/PublishedExerciseNeedsRubric`, 422, field `is_published`: "Publikált fájlfeladatnak legalább egy értékelési pont kell."). Browser-only kinds: valid `spec` with at least one check (`PublishedExerciseNeedsSpec`, 422: "Publikált feladatnak ki kell töltenie a típusának megfelelő adatokat.").

`AdminExerciseResource` gains: `kind`, `spec` (object or `null`), `comparison` (object or `null`), `rubric_item_count` (`whenCounted('rubricItems')`), `attachments` (`whenLoaded('attachments')`): `[{id, role, name, size, test_case_id, url}]` where `url` is a signed admin URL (`AttachmentUrls::forAdmin`). `ExerciseController::index/show` must `withCount('rubricItems')` and `with('attachments')` only on `show`.

`ExerciseController::destroy`: also refuse when the exercise has file submissions or is referenced by an exam part (`CatalogItemInUse::hasStudentData()`); otherwise delete its attachments with their files before deleting the row (`Actions/Admin/Catalog/ManageAttachment::deleteAllFor`).

#### 4.1.3 `spec` validation, per kind (`ExerciseSpec`)

Unknown keys are rejected (422 on `spec`). Ids that the API must expose (`checks[].id`) are assigned by the server on write: sequential from 1 inside the spec; when an update sends an `id` it must be kept (so browser-side state keyed by check id stays stable).

- **code**: `subtasks` optional, `array|max:30` of `{number: int 1..30 unique, label: string<=200, points: int 1..50}`. Scoring in 4.2.
- **sql**: `database` string<=60 `required`; `tables` array 1..30 of `{name: string<=60, columns: array 1..60 of {name: string<=60, primary?: boolean, references?: string<=120|null}}`; `subtasks` array<=30 of `{label<=200, query_name: [A-Za-z0-9_]{1,40}, points: int 1..50}`. Informational in v1 (decision 8.5): the SQL run keeps the test-case comparison.
- **upload kinds**: `steps` array<=30 of string<=500; `deliverable` nullable `[A-Za-z0-9_-]{1,40}` (no extension); `accepted_extensions` required array 1..6 of extensions with the leading dot, each a key of `config('filetasks.extensions')` and compatible with the kind (`sheet_upload`: `.xlsx .ods`; `doc_upload`: `.docx .odt`; `visual_upload`: `.pptx .odp .svg .png`); `software` array<=6 of string<=40; `exam_reference` nullable string<=100 (e.g. "2026. május, 3. feladat"); `exam_points` nullable int 1..200; `raw_points` nullable int 1..400 (the official raw maximum before conversion; used for rubric completeness and exam conversion, never sent to students).
- **web**: `files` array 1..6 of `{name: [A-Za-z0-9._-]{1,40} ending .html or .css, language: html|css (must match the extension), content: string<=50000}`, at least one html; `checks` array 1..40 of `{id?, label<=200, points: int 1..20, hint?: string<=300|null, type: ...}` with exactly the fields of the TypeScript `WebCheck` union (`types/index.ts`): `title {value}`, `element_count {file?, selector, count}`, `css_declaration {property, pattern}`, `css_selector {selector}`, `link {file?, href}`; `exam_reference` nullable.
- **sheet_browser**: `columns` int 1..26, `rows` int 1..100, `cells` object whose keys match `^[A-Z]{1,2}[1-9][0-9]{0,2}$` and lie inside the grid, values string<=200; `checks` array 1..30 of `{id?, label<=200, type: has_formula{cell} | uses_function{cell, function: [A-ZÁÉÍÓÖŐÚÜŰ.]{2,24}} | references{cell, reference} | value{cell, expected} | filled_down{range: A1:A10}}`.
- **doc_browser**: `paragraphs` array 1..30 of string<=2000; `checks` array 1..30 of `{id?, label<=200, paragraph: int, 0-based index into `paragraphs` (read: `DocPracticeWorkspace.tsx:73`), type: align{value: left|center|right|justify} | font_size{value: int 8..72} | bold | italic | underline | line_spacing{value: number 0.5..3}}`.

#### 4.1.4 Student task payload (`GET /tasks/{task}`)

`Http/Resources/TaskResource.php` (WP1). Unlocked tasks only (a locked task still omits everything but the header, as today). Additions, matching `UnlockedTaskDetail`:

```jsonc
{ "data": {
  "id": 12, "title": "Hyrox", "level": "kozep", "difficulty": 3,
  "allowed_languages": [],            // [] for non-code kinds
  "kind": "sheet_upload",
  "description": "...markdown...",
  "starter_code": {}, "example_test_cases": [], "hidden_test_case_count": 0,
  "limits": {},                       // an EMPTY OBJECT (stdClass), not [], for non-code kinds
  "file_task": {                      // upload kinds only
    "steps": ["Töltsd be a hyrox.txt fájlt az A1 cellától."],
    "sources": [{ "name": "hyrox.txt", "size": 5120, "url": "/api/v1/attachments/31/download?expires=...&signature=..." }],
    "deliverable": "hyrox",
    "accepted_extensions": [".xlsx", ".ods"],
    "software": ["Excel", "LibreOffice Calc"],
    "sample_image_url": "/api/v1/attachments/32/download?...",   // role sample_image, or null
    "exam_reference": "2026. május, 3. feladat",
    "exam_points": 35                  // spec value, or null
  },
  "sql_task": { "database": "...", "tables": [...], "subtasks": [...] },   // kind sql with spec
  "web_task": { "files": [...], "checks": [{ "id": 1, ... }], "exam_reference": null },   // kind web
  "sheet_practice": { "columns": 6, "rows": 12, "cells": {"A1": "Szakasz"}, "checks": [...] },
  "doc_practice": { "paragraphs": [...], "checks": [...] },
  "sources": [{ "name": "adatok.txt", "size": 812, "url": "..." }],        // code and sql kinds: role=source attachments with test_case_id NULL
  "...": "unchanged fields (is_free, lesson, navigation, my_status, constraints, topic, locked...)"
}}
```

Notes: exactly one of `file_task`, `sql_task`, `web_task`, `sheet_practice`, `doc_practice` is present, chosen by `kind`; absent for `code`. `raw_points` is never serialised. `url`s are signed relative URLs valid `filetasks.url_ttl_minutes` (60), built by `Services/Files/AttachmentUrls::forStudent(Attachment): string`; `<img src>` and `<a download>` cannot carry a Bearer token, which is why they are signed. `ExerciseSummaryResource`, `TaskSummaryResource` and the list endpoints are **not** extended (the frontend types do not read `kind` there).

Resource assembly must not trigger N+1: `TaskController::show` adds `->with('attachments')` (only `source`, `sample_image` roles with `test_case_id` NULL are read). Eager-load exactly that.

#### 4.1.5 Attachments

Classes. WP0 creates the parts that WP1, WP2, WP3 and WP6 all use: `Models/Attachment.php`, `Enums/AttachmentRole.php`, `Actions/Admin/Catalog/ManageAttachment.php` (`store`, `delete`, `deleteAllFor`, with the locking and name rules of 3.3), `Services/Files/AttachmentUrls.php` (`forStudent`, `forAdmin`, `forExam`), `Services/Files/PrivateFileStore.php` (`put`, `bytes`, `stream`, `delete`). WP1 creates the HTTP layer: `Http/Controllers/Api/V1/Admin/Catalog/AttachmentController.php`, `Http/Requests/Admin/Catalog/AttachmentRequest.php`, `Http/Resources/Admin/AdminAttachmentResource.php`, `Http/Controllers/Api/V1/Catalog/AttachmentDownloadController.php`, `Exceptions/Catalog/AttachmentLimitReached.php`.

| Route | Middleware | Behaviour |
|---|---|---|
| `GET /admin/exercises/{exercise}/attachments` | admin | `{data: AdminAttachment[]}` |
| `POST /admin/exercises/{exercise}/attachments` | admin, `throttle:admin-upload` | multipart `file`, `role` (`source\|input\|sample_image\|sample_solution`), `test_case_id` (required iff `role=input`, must belong to the exercise), `name` (optional, defaults to the original name; for `source`/`input` it must match the Judge0-safe pattern). 201 `{data: AdminAttachment}`. Same `(role, test_case_id, name)` replaces the existing file (delete old file after the new one is stored) |
| `DELETE /admin/attachments/{attachment}` | admin | 204 |
| `POST /admin/exams/{exam}/attachments` | admin, `throttle:admin-upload` | same, role `source_zip` only (WP6 controller, same Action) |
| `GET /attachments/{attachment}/download` | `signed:relative` | streams the file: `Content-Disposition: attachment; filename*=UTF-8''<name>` (role `sample_image`: `inline`, only for png/jpeg/webp/svg), `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`, `Cache-Control: private, max-age=600`. 404 for roles `input` and `sample_solution` (they only ever exist for the evaluator and for admins' signed URLs, see below) |

`AdminAttachment`: `{id, role, name, size, test_case_id, url}`; admin `url` is signed for 30 minutes and allowed for every role (the signature carries `?admin=1`, checked by the download controller against role). Limits (`config/filetasks.php`): per exercise at most 5 `source` files (code/sql kinds) and per test case at most 5 `input` files, 256 KB each for Judge0-bound roles (design of `00c8e59`); `sample_image` 3 MB png/jpeg/webp/svg; `sample_solution` 10 MB, an accepted extension of the kind; `source` of upload kinds: 5 MB each, at most 10; `source_zip`: 50 MB, `.zip`, validated as a zip (`ZipArchive::open`, entry-count and size caps of 5.1). Allowed access to the *content* of `source`/`sample_image` follows the lesson rule: `AttachmentUrls::forStudent` is only called from resources that were built for an unlocked task or an exam the viewer may start, so a locked task never leaks a URL. A signed URL is a bearer capability valid 60 minutes; that matches how lesson videos behave and is accepted.

Audit: `AttachmentUploaded` / `AttachmentDeleted` with subject = the attachment (metadata `{owner, role, name}`).

Deleting the owner removes its attachments: `ManageAttachment::deleteAllFor(Model $owner)` is called by the exercise delete action (WP1) and the exam delete (not exposed; unpublish instead).

### 4.2 Code execution upgrades (WP2)

Goal: programming tasks of the real exam (emelt: data file, many numbered subtasks, partial points) work in the existing run/submit flow. The response stays the flat shape of `Http/Resources/EvaluationResource.php`.

**Files WP2 owns**: `Services/SolutionEvaluator.php`, `Services/Judge0Service.php`, `Services/Execution/*` (new: `Comparison/*`, `Files/ExecutionFileArchive.php`, `Subtasks/SubtaskScorer.php`), `Actions/Execution/RunSolution.php`, `SubmitSolution.php`, `Http/Requests/Execution/RunCodeRequest.php`, `Http/Resources/EvaluationResource.php`, `SubmissionResource.php`, `Http/Controllers/Api/V1/Execution/*`, `lang/hu/execution.php`, `config/judge0.php`, `tests/src/mocks/judge0/server.ts`.

1. **Refuse non-code tasks.** `RunCodeRequest::after`: if `exercise()->kind` is not `code`/`sql` add error on `task_id`: `execution.not_a_code_task` = "Ehhez a feladathoz nem tartozik futtatható kód." (422).
2. **Input files** (reference: `git show 00c8e59`, read). For each test case the effective file set is: shared `source` attachments (`test_case_id` NULL) overridden by that test case's `input` attachments of the same name. Zip the set and send it base64 as Judge0 `additional_files` (the program then opens `adatok.txt` from its working directory). Zip construction is cached by name+sha256 (`ExecutionFileArchive`). Load attachments once per evaluation (one query), bytes from the `exercise_files` disk. SQL kind: no files (the dataset script is the test-case stdin). The hidden-result rule is unchanged: hidden results stay allow-listed in `HiddenResultRedactor`, so a hidden input file's content can never be printed back. **Must be proven on the real Judge0 before launch** (ADR 0003, FRONTEND.md risk): a Python and a C# program opening a relative file name. The Playwright Judge0 mock may ignore `additional_files`.
3. **Comparison modes** (reference: `git show 037e9f5`, read). `comparison` JSON on the exercise selects the comparator; `NULL` keeps `SolutionEvaluator::outputMatches` unchanged. Modes: `exact` (today), `tokens` (split on whitespace, compare sequences), `numeric` (tokens; two numeric tokens are equal within `abs_tol` or `rel_tol`; accept decimal comma and point). Options `case_insensitive`, `ignore_blank_lines`, and new `ignore_accents` (fold with `Transliterator`/`iconv`-free approach: `Str::ascii` after lower-casing, because "unaccented output accepted", `FRONTEND.md` section 13). Classes `Services/Execution/Comparison/{OutputComparator,ExactComparator,TokenComparator,NumericComparator,OutputComparators,ComparisonSettings}.php`. SQL keeps `SqlResultComparator`. When a tolerant comparison fails on a *visible* test case the result may carry `difference` (the first differing token); `HiddenResultRedactor::ALLOWED` is **not** extended.
4. **Per-subtask scoring** (new). Applies to `code` exercises whose `spec.subtasks` is non-empty.
   - Split stdout and the test case's `expected_stdout` into sections at lines matching `/^\s*(\d{1,2})\s*[.)]?\s*feladat\b.*$/iu` (accent-insensitive: fold before matching, so `Feladat`, `1. feladat:` and `1.feladat` all match). The text up to the next header (or end) is that subtask's section; text before the first header is ignored.
   - For every test case that ran, subtask `n` is correct for that test case iff both outputs have a section `n` and the sections are equal under the exercise's comparator (default `numeric` tokens when `comparison` is NULL for exercises with subtasks, because the exam compares "numbers and key content").
   - Subtask `n` is correct overall iff it is correct for **every** test case that ran. Points: all or nothing per subtask (`spec.subtasks[].points`).
   - Response field `subtasks`: `[{label, points, max_points, passed, note}]` in subtask order. `note` (string|null) is "Várt: X, kapott: Y" (first 80 chars each) **only if** the deciding failing test case is visible; if any hidden test case caused the failure `note` is `null`. A compile error or system error gives every subtask `points 0`, `passed false`, `note null`. When a run is a constraint violation the response has no `subtasks`.
   - The overall `status`/`verdict` is unchanged: `passed` only when all test cases accepted **and** all subtasks full (progress and lesson completion therefore need full points; decision 8.4 keeps it simple).
   - `Run` (visible test cases only) scores subtasks over visible cases only; `Submit` over all. Same code path, different test case set.
   - Persist on `submissions`: `subtasks` (the array above without `note`), `score` = sum of points, `max_score` = sum of `max_points`; without subtasks `score` = passed tests, `max_score` = tests that ran. Add `subtasks` to `SubmissionResource` (flat response of `POST /submissions`) and nothing to `SubmissionDetailResource` (history shows verdicts only).
5. **Output files** (`vX.txt`, `tabla.html` produced by the student's program, listed in `FRONTEND.md` section 8): **not in v1** (decision 8.6). Judge0 returns stdout/stderr only; ADR 0003 sketches the epilogue-print approach and says it needs a real Judge0 to prove. Do not start it in this plan.
6. **SQL dialect**: `FRONTEND.md` wants MySQL/MariaDB semantics; the sandbox is Judge0's sqlite (`config/judge0.php` `languages.sql.match 'sql (sqlite'`). A MariaDB sandbox is new infrastructure and is **out of scope** (decision 8.5); the student sees `sql_task` metadata and the existing run behaviour.

API tests (WP2): see section 7.

### 4.3 File submissions and rubric grading (WP3, with WP4/WP5 checkers)

#### 4.3.1 Endpoints

All under `/api/v1`, controller `Http/Controllers/Api/V1/FileTasks/FileSubmissionController.php`, Policy `Policies/FileSubmissionPolicy.php` (`view`: owner or admin; `mark`: owner), Resource `Http/Resources/FileSubmissionResource.php`.

| Route | Middleware | Behaviour |
|---|---|---|
| `POST /exercises/{exercise}/file-submissions` | `auth:sanctum`, `throttle:file-submission` | multipart, field `file`. Request `UploadFileSubmissionRequest`: `file` required, `file` rule, `max` from config (KB), extension (case-insensitive) must be in the exercise's `spec.accepted_extensions` |
| `GET /exercises/{exercise}/file-submissions` | `auth:sanctum` | `{data: FileSubmission[]}`, newest first, practice rows only (`exam_attempt_id` NULL), at most 50 |
| `GET /file-submissions/{submission}` | `auth:sanctum` | one; owner or admin, else 404 |
| `PUT /file-submissions/{submission}/manual` | `auth:sanctum`, `throttle:30,1` | body `{marks: {"<rubric_item_id>": true\|false}}` |
| `GET /file-submissions/{submission}/file` | `signed:relative` | the uploaded file (only images are linked, as `preview_url`), same headers as 4.1.5 |
| `POST /admin/exercises/{exercise}/rubric-check` | admin, `throttle:admin-upload` | "try with the sample solution" (4.3.5) |

`{exercise}` is bound with `Exercise::query()->published()` semantics but a foreign/unpublished/unknown id is **404**. The exercise must be an upload kind, else 422 `NotAFileTask` ("Ehhez a feladathoz nem tölthető fel fájl. Használd a szerkesztőt."). Access: `ContentAccess::denialFor($user, $exercise->lesson)`; denial -> `PremiumContentLocked` (so a free lesson accepts uploads from any verified or unverified logged-in user, a premium lesson needs a subscription). **Reading** own submissions never requires access (like `SubmissionHistoryController`: it is the student's own work). Guests get 401 from `auth:sanctum` (uploads need an account; the run endpoints allow guests only because they store nothing for them).

#### 4.3.2 Response shape (`FileSubmission`, exact)

```jsonc
{ "data": {
  "id": 7, "exercise_id": 12, "exercise_title": "Hyrox",
  "attempt": 2, "status": "evaluated",        // processing | evaluated | failed ("stored" is mapped to "processing")
  "score": 19, "max_score": 25, "previous_score": 14,   // previous = score of the previous evaluated practice attempt of this user for this exercise, else null
  "file": { "name": "hyrox.xlsx", "size": 20480, "uploaded_at": "2026-10-12T08:30:00+00:00" },
  "groups": [{ "name": "Betöltés és képletek", "score": 9, "max_score": 12 }],
  "items": [{
    "rubric_item_id": 55, "group": "Rendezés", "label": "A táblázat idő szerint rendezett",
    "state": "ok",                // ok | bad | manual
    "points": 2, "max_points": 2,
    "found": "B2:B40 növekvő",    // string|null
    "hint": "…",                  // string|null (the frontend shows it only when state != ok)
    "manual_mark": null           // true|false once the student decided; always null for auto items
  }],
  "facts": [{ "label": "Lapméret", "value": "A4, álló" }],   // documents/slides: what the checker found; [] for others
  "preview_url": null,            // signed URL for png/svg uploads only (decision 8.12), else null
  "sample_url": "/api/v1/attachments/32/download?...",     // the exercise's sample_image or null
  "error": null                   // Hungarian reason when status = failed
} }
```

Rules the resource must follow so the frontend works unchanged (read: `SubmissionResult.tsx`, `ManualMarksModal.tsx`): for a manual item `state` stays `'manual'` even after the student marked it (the UI overrides with `manual_mark`), `points` becomes `max_points` when `manual_mark = true`, else `0`; `score` and the group scores include marked manual points; `max_score` includes all manual points. An auto item with a failing check is `bad` with `points 0`. `groups` keep the order of first appearance in the rubric. `attempt` is the counter, not the count of remaining rows. `previous_score` is `null` for the first attempt.

#### 4.3.3 Upload pipeline (synchronous)

`Actions/FileTasks/SubmitFileSolution::handle(User, Exercise, UploadedFile): FileSubmission` (WP3):

1. Authorize (above), check kind, rate limit already applied by middleware.
2. `UploadedFileInspector::inspect($file, $allowedExtensions, $category)` (WP0 service, 5.1): extension whitelist, size cap by category, finfo MIME sniff must match the extension family (zip family for OOXML/ODF, text for html/css/sql/py/cs/txt, image for png/svg), macro-enabled extensions rejected, then for zip family `ZipSafety::assertSafe` (entry count, uncompressed size, per-entry size, ratio, no absolute or `..` entry names, no `vbaProject.bin`, no ODF `Basic/` or `Scripts/` macro folders). Failures throw the 422 `DomainException`s of 5.1, field `file`. Nothing is stored yet.
3. Concurrency gate: take one of `filetasks.max_concurrent_evaluations` (4) slots of a cache-lock semaphore (`Cache::lock('filetasks.eval.<n>', 40)`, try each slot once); if none is free answer 503 `{message: "A fájlfeldolgozó most túlterhelt, próbáld újra egy perc múlva."}` (a request must never queue behind PHP-FPM workers). Release in `finally`.
4. Store the original (random name) on the `submission_files` disk, create the `file_submissions` row (`status stored`).
5. `FileEvaluator::evaluate($exercise, $storedFile)` (WP3) with a time limit `filetasks.evaluation_timeout` (25 s, `set_time_limit` + cooperative checks between rubric items). Unreadable or truncated content, XML that fails to parse, missing mandatory parts, any parser exception -> row `failed`, `error` = "A fájl sérült, vagy nem a kért formátumban van." (HTTP 201 with `status: "failed"`, **not** a 4xx: the frontend renders `error` from the body, `SubmissionResult.tsx`). The row still counts as an attempt.
6. Snapshot the result (`result` JSON), set `score`, `max_score`, `passed`, `status evaluated`, `evaluated_at`.
7. If `passed`, call `Actions/Progress/RecordLessonProgress` (existing) so the lesson completes; the response additionally never contains `lesson_completed` (the frontend invalidates progress queries itself, `FileTaskWorkspace.tsx`).
8. Prune: keep the newest `filetasks.keep_per_exercise` (10) practice rows per `(user, exercise)`; delete older rows **and files**.
9. Return 201 `FileSubmissionResource`.

Expected evaluation time is well below one second for exam-sized files; hence no queue. If this ever becomes slow, the frontend polling in WP10 makes an async variant possible without a contract change (status `processing`).

#### 4.3.4 Manual marks

`Actions/FileTasks/SaveManualMarks::handle(User, FileSubmission, array $marks): FileSubmission`. Validation (`SaveManualMarksRequest`): `marks` required, non-empty object; each key must be a `rubric_item_id` present in the submission's `result.items` with `state = manual` (else 422 on `marks`: "Ez a tétel nem jelölhető kézzel."); each value strictly boolean. Only for `status = evaluated`, and for exam rows only after the attempt is `evaluated` (`ManualMarkRefused`, 422: "A jelölés a feladatsor beadása után lehetséges."). Inside a transaction with a row lock: update `manual_mark` per item, recompute item points, group scores, `score`, `passed`; if it is an exam row call `RecomputeExamResult` (WP6 provides the interface in WP0, 4.5.6) so the attempt `score` and `pending_manual_points` follow; if `passed` flipped to true call `RecordLessonProgress`. Marks may be changed again at any time (the UI offers "Kézi pontok módosítása"). Honesty note: the student grades themself on purpose (`FRONTEND.md` section 9); nothing goes to a staff queue.

#### 4.3.5 Rubric admin API (WP3)

Classes: `Models/RubricItem.php` (WP0), `Http/Controllers/Api/V1/Admin/Catalog/RubricItemController.php`, `Http/Requests/Admin/Catalog/RubricItemRequest.php`, `Http/Resources/Admin/AdminRubricItemResource.php`, `Actions/Admin/Catalog/ManageRubricItem.php`, `Exceptions/FileTasks/UnknownRubricCheck.php`.

| Route | Behaviour |
|---|---|
| `GET /admin/exercises/{exercise}/rubric-items` | `{data: RubricItem[]}` ordered by `position`; returns `[]` for any exercise, whatever its kind (the tab is shown for every exercise in `AdminExercise.tsx`; the 404 banner in `RubricBuilder.tsx` only appears while the routes are missing) |
| `POST /admin/exercises/{exercise}/rubric-items` | 201 `{data: RubricItem}`, appended at the end |
| `PUT /admin/rubric-items/{item}` | optional, not called by the frontend today; implement (cheap) so the UI can add editing later |
| `DELETE /admin/rubric-items/{item}` | 204, positions compacted |
| `PUT /admin/exercises/{exercise}/rubric-items/order` | `{ids: int[]}` = all items exactly once (`ReorderRequest`, `SiblingOrder`), 204 |
| `POST /admin/exercises/{exercise}/rubric-check` | multipart `file` (optional): the file to test; if absent the exercise's `sample_solution` attachment is used (422 if neither). Runs `FileEvaluator` without storing and returns the `FileSubmission` shape with `id: 0`, `attempt: 1`, `status`. Lets authors verify a rubric; no frontend yet (WP11 optional button) |

`RubricItem` JSON (read: `admin/exams/api.ts`): `{id, label, group, check_type, property, expected, points, mode, hint}` (`params` is returned only when set). Request rules: `label` required string<=255; `group` present string<=100 (empty allowed, the form sends `''`); `check_type` in the `RubricCheckType` values; `property` present string<=150 (may be `''` for manual items); `expected` present string<=500 (may be `''`); `points` integer 1..50; `mode` in `auto,manual`; `hint` nullable string<=500; `params` optional array. Cross rules (`after()`): `check_type = manual` forces `mode = manual`; an `auto` item must pass `RubricCheckCatalog::validate($check_type, $property, $expected)` (4.4) else 422 on `property` with `UnknownRubricCheck`: "Ezt a vizsgálatot még nem tudjuk automatikusan ellenőrizni. Válaszd a kézi ellenőrzést, vagy módosítsd a tulajdonságot." Items are editable only while no *evaluated student submission* exists? **No**: results are snapshots, so editing is always allowed; changing points does not rewrite history.

Audit: `CatalogCreated/Updated/Deleted/Reordered` with subject `rubric_item` (or the exercise for reorder).

### 4.4 The check engine (WP3 core + spreadsheets, WP4 documents, WP5 slides/vector/web)

#### 4.4.1 Architecture

Contracts are created by WP0 (so the three packages build against the same interface), implementations by the owners:

```php
namespace App\Services\FileTasks;

interface FileReader { // one per file family; parses the stored upload once
    /** @return list<string> extensions with the dot */ public function extensions(): array;
    /** @throws UnreadableFile */ public function open(StoredFile $file): OpenedFile;
}
interface OpenedFile { /** @return list<Fact> */ public function facts(): array; }   // marker + "what we found"
interface CheckHandler { // one per RubricCheckType
    public function type(): RubricCheckType;
    public function supports(OpenedFile $file): bool;                       // wrong family -> item is "bad"
    public function validate(string $property, string $expected): ?string;  // Hungarian error or null; used at authoring time
    public function evaluate(OpenedFile $file, RubricItem $item): CheckOutcome;  // {bool passed, ?string found}
}
```

`Services/FileTasks/FileEvaluator.php` (WP3): picks the reader by extension, opens once, loops over the rubric in order, asks `CheckRegistry` (WP0, a tagged-singleton list built from `config('filetasks.readers')` and `config('filetasks.checks')`) for the handler by `check_type`; a handler exception makes that one item `bad` with `found = null` and is logged (`report()`), the loop continues. `mode manual` or `check_type manual` -> state `manual` without calling a handler. Builds groups, facts, totals. **Classes per package**:

- WP0 creates only the contracts and plumbing: the interfaces above, `CheckRegistry`, `CheckOutcome`, `Fact`, `StoredFile`, `UnreadableFile`, `RubricCheckCatalog`, and `config/filetasks.php` with the `readers` / `checks` class lists naming the classes each owner creates below. Until an owner merges, the registry skips configured classes that do not exist (`class_exists`), so the app boots and a missing family simply has no handlers (its auto items are rejected at authoring time by `RubricCheckCatalog`).
- WP3: `Services/FileTasks/Spreadsheet/{SpreadsheetReader,SpreadsheetModel,XlsxParser,OdsParser,FormulaNormalizer}.php`; handlers `CellValueCheck, CellFormulaCheck, NumberFormatCheck, SortOrderCheck, ChartCheck, PrintAreaCheck, SheetFormatCheck, ConditionalFormatCheck` in `Services/FileTasks/Spreadsheet/Checks/`; `TextReader` for `.sql .py .cs .txt` is **not** built (no check type uses it; accepted extensions of upload kinds exclude them).
- WP4: `Services/FileTasks/Document/{DocumentReader,DocumentModel,DocxParser,OdtParser,StyleResolver,Units}.php`; handlers `PageSetupCheck, CharacterFormatCheck, ParagraphFormatCheck, StyleCheck, DocumentTableCheck, ImageCheck, SectionCheck, TabStopCheck, ListFormatCheck`.
- WP5: `Services/FileTasks/Presentation/{PresentationReader,PptxParser,OdpParser}.php`, `Vector/{SvgReader}.php`, `Web/{HtmlReader,CssParser}.php`, `Image/{PngReader}.php`; handlers `SlideCheck, AnimationCheck, ShapeCheck, WebCheck`.

Each check is **all or nothing** for its points (rubric items are atomic like the official guide). A check that finds nothing to inspect (property not present in the file) is `bad`, `found = null`.

#### 4.4.2 `RubricCheckType` values

The admin form's list (read: `RubricBuilder.tsx` `CHECK_TYPES`) plus four additions that the spreadsheet/slide rubric of `FRONTEND.md` section 9 needs and the form must also list (WP11): existing 18: `page_setup, character_format, paragraph_format, style, document_table, image, section, tab_stop, cell_value, cell_formula, number_format, sort_order, chart, print_area, slide, animation, web, manual`; new: `sheet_format` (column width/hidden, sheet name), `conditional_format`, `list_format`, `shape`. File-family of each type: spreadsheet = `cell_value, cell_formula, number_format, sort_order, chart, print_area, sheet_format, conditional_format`; document = `page_setup, character_format, paragraph_format, style, document_table, image, section, tab_stop, list_format`; presentation/vector = `slide, animation, shape, image`; web = `web`; `manual` = any. (`image` and `page_setup`-like checks may also read a presentation; the handler's `supports()` decides.)

#### 4.4.3 Grammar of `property` and `expected` (authoring and evaluation share `validate()`)

General: `property` is an attribute key, optionally followed by one selector in square brackets; `expected` is a value written the way an author reads the official guide. Texts compare case-insensitively and accent-insensitively; numbers accept decimal comma and point (`0,5` = `0.5`); lengths accept `cm`, `mm`, `pt`, `in` and match within `filetasks.length_tolerance_mm` (1.0 mm); colours `#RRGGBB` or the Hungarian names `piros, zöld, kék, fekete, fehér, sárga, narancs, szürke`; booleans `igen|nem|true|false`. Function names are normalised across Hungarian and English (a table in `FormulaNormalizer`: `HA/IF, SZUM/SUM, ÁTLAG/AVERAGE, MIN, MAX, DARABTELI/COUNTIF, DARABHATÖBB/COUNTIFS, INDEX, HOL.VAN/MATCH, KEREKÍT/ROUND, ...`).

Document selectors: `[paragraph=N]` (1-based), `[style=NAME]` (every paragraph with that style must satisfy), `[text=FRAGMENT]` (first paragraph containing it), `[heading=N]` (the N-th heading), `[table=N]`, `[image=N]`, `[section=N]`; no selector = the document default (Normál style). Spreadsheet addressing: `Sheet!A1`, `Sheet!A1:C9`, or without sheet = first sheet.

| `check_type` | allowed `property` | `expected` | notes |
|---|---|---|---|
| `cell_value` | `Sheet!B3` | literal; numbers within 1e-4 or 0.01 % ; `~text` = contains | computed value as cached in the file |
| `cell_formula` | `Sheet!B2` or range | comma-separated AND terms: `any`, `fn:HA`, `ref:$A$1`, `copied` (all formulas in the range are equal in R1C1 form), `nofixed` (no hard-coded numbers) | formula text, not value |
| `number_format` | cell/range | format code (`0,00`, `pp:mm`, `# ##0 "Ft"`); aliases normalised | |
| `sort_order` | range (one column; `A2:A40`) or `A2:C40@2` (sort column 2) | `asc` / `desc` [`,num` / `,text`]; multi-key `asc@1;desc@2` | verifies the data is ordered, not that sorting was used |
| `chart` | `type`, `title`, `x_title`, `y_title`, `series_count`, `has_labels`, `has_legend`, optionally `[sheet=Name]` | value (`type`: `column, bar, line, scatter, pie`) | needs the chart part (`xl/charts/chart*.xml`, ODS `Object N/content.xml`) |
| `print_area` | `Sheet` | `A1:F30` | |
| `sheet_format` | `sheet_name`, `column_width[A]`, `column_hidden[A]`, `row_height[3]` | name / length / booleans | |
| `conditional_format` | `Sheet!B2:B20` | `rule:greater_than 50`, `fill:#FF0000` terms | existence plus rule type and threshold |
| `page_setup` | `page_size, orientation, margin_top, margin_bottom, margin_left, margin_right` | `A4`, `álló/fekvő`, length | first section |
| `character_format` | `font, font_size, bold, italic, underline, small_caps, superscript, subscript, color` + selector | value | resolved through `StyleResolver` (run -> paragraph style -> based-on chain -> defaults) |
| `paragraph_format` | `alignment (balra,középre,jobbra,sorkizárt), space_before, space_after, line_spacing, indent_left, indent_first, hyphenation, page_break_before` + selector | value | |
| `style` | `exists`, `applied` + `[style=NAME]` / `[heading=N]` | `igen` / style name | |
| `document_table` | `rows, columns, border, width, height, shading, alignment` + `[table=N]` | value | |
| `image` | `width, height, aspect_ratio, wrap, alt_text, count` + `[image=N]` | value | docx/odt/pptx/odp/svg |
| `section` | `columns, break_before, page_orientation` + `[section=N]` | value | |
| `tab_stop` | `position, type, leader` + selector | `12cm`, `right`, `dot` | |
| `list_format` | `type (bullet\|number), level, symbol` + selector | value | |
| `slide` | `count, width, height, background, background_type (solid\|gradient\|image), master_font, title_size, transition, loop` + `[slide=N]` | value | |
| `animation` | `effect, duration, delay, trigger` + `[slide=N][shape=N]` | value | combined selector `[slide=2,shape=1]` |
| `shape` | `count, type, fill, transparency, text` + `[slide=N,shape=M]` | value | |
| `web` | `title`, `element_count[selector]`, `css[selector.property]`, `class_used[name]`, `link[href]`, `img_size[N]` | value | HTML via DOM, CSS via a small tolerant parser; selectors limited to `tag`, `.class`, `#id`, `tag.class` |
| `manual` | any | any | always manual; the label tells the student what to compare |

`validate()` per handler accepts exactly the keys above; anything else is rejected at authoring time, so every saved auto item is executable. `RubricCheckCatalog` (WP0 file, filled by handlers' `validate`) is the single place the admin request calls.

#### 4.4.4 Facts

`facts()` of an opened file fills `FileSubmission.facts`. Document: page size and orientation, margins, default font and size, number of tables, number of images with widths, styles in use, number of columns; spreadsheet: sheet names, used range per sheet, number of formulas, charts; slides: slide count and size, layouts; web: title text, element counts. Values are short strings; no student file content beyond these summaries is echoed.



### 4.5 Exams: mock exam runner and exam editor (WP6)

Concept: an **exam** (one official paper, e.g. 2026 május közép) has ordered **parts**; each part points at an **exercise** that carries the task text, sources, rubric (file parts) or tests (editor parts). A student starts an **attempt** (mode `exam` with a server deadline, or `practice` without), uploads one file per file part, solves editor parts in the normal workspace, submits everything together; the server evaluates all parts, converts raw points to exam points and stores a result snapshot. No grade is shown (`FRONTEND.md` section 10; thresholds unverified).

Classes (WP6; models/enums/jobs stubs are created by WP0): `Http/Controllers/Api/V1/Exams/{ExamController,ExamAttemptController,ExamPartFileController}.php`; `Http/Controllers/Api/V1/Admin/Exams/{ExamController,ExamPartController,ExamAttachmentController}.php`; `Http/Requests/Exams/{StartExamAttemptRequest,UploadExamPartFileRequest}.php`; `Http/Requests/Admin/Exams/{ExamRequest,ExamPartRequest}.php`; `Http/Resources/Exams/{ExamSummaryResource,ExamDetailResource,ExamAttemptResource,ExamResultResource}.php`; `Http/Resources/Admin/{AdminExamResource,AdminExamPartResource}.php`; `Actions/Exams/{StartExamAttempt,UploadExamPartFile,SubmitExamAttempt,EvaluateExamAttempt,RecomputeExamResult}.php`; `Actions/Admin/Exams/{ManageExam,ManageExamPart}.php`; `Services/Exams/{ExamAccess,AttemptClock,PartScorer,ReviewSuggester,AttemptView}.php`; `Policies/ExamAttemptPolicy.php`; `Exceptions/Exams/{ExamModeUnavailable,ExamAttemptClosed,PartNotUploadable,ExamNotPublishable,ExamResultNotReady}.php`; jobs `Jobs/CloseExpiredExamAttempts.php`, `Jobs/PruneIdleExamAttempts.php` (bodies; the schedule lines are in WP0); `lang/hu/exams.php`.

#### 4.5.1 Access

`ExamAccess::denialFor(?User): ?AccessDenial` delegates to `ContentAccess::premiumDenialFor` (WP0 adds this user-level method and makes `denialFor` use it): login, verified e-mail, premium (subscription or grant), admin always. Decision 8.1: exams are premium; `GET /exams` is public so the list can sell them. Tasks reached through an exam follow the exercise's own lesson rule; for editor parts the student also needs access to that lesson (exam parts should live in premium lessons or the admin must accept that a free lesson exercise is reachable).

#### 4.5.2 Student endpoints

| Route | Middleware | Behaviour |
|---|---|---|
| `GET /exams` | optional token (`$request->user('sanctum')`) | published exams, ordered `session desc, level`. `{data: ExamSummary[]}` |
| `GET /exams/{exam}` | `auth:sanctum` | `{data: ExamDetail}`. Unpublished or unknown -> 404 (admins may read unpublished). Viewers without access get the structure but empty `description`, `steps`, `sources`, `source_zip: null` |
| `POST /exams/{exam}/attempts` | `auth:sanctum`, `throttle:exam-write` | body `{mode: "exam"\|"practice"}` -> 201 (new) or 200 (existing open attempt returned unchanged) `{data: ExamAttempt}` |
| `GET /exam-attempts/{attempt}` | `auth:sanctum` | owner (or admin) else 404. Triggers lazy expiry (below) |
| `POST /exam-attempts/{attempt}/parts/{part}/file` | `auth:sanctum`, `throttle:exam-write` | multipart `file`; returns the whole `ExamAttempt` |
| `POST /exam-attempts/{attempt}/submit` | `auth:sanctum`, `throttle:exam-write` | idempotent; returns `ExamAttempt` (state `evaluated`) |
| `GET /exam-attempts/{attempt}/result` | `auth:sanctum` | `{data: ExamResult}` or 409 `ExamResultNotReady` |

`ExamSummary` (exact, read: `exams/api.ts`):

```jsonc
{ "id": 3, "session": "2026-05", "title": "2026. május", "level": "emelt", "minutes": 240, "points": 120,
  "parts": [{ "id": 11, "order": 1, "key": "dokumentum", "name": "Dokumentumkészítés vagy táblázatkezelés", "points": 35, "minutes": 70 }],
  "attempt": null }   // or {"id": 9, "state": "in_progress", "score": null, "max_score": 120, "completed_parts": [1, 3]} for the viewer's latest attempt
```

`completed_parts` = the `order` numbers of parts that have an upload or a qualifying code submission. `attempt.max_score` is always the exam total (sum of part points). Guests and users without attempts get `attempt: null` (the list does N+1-free: load the viewer's latest attempt per exam in one query).

`ExamDetail` = `ExamSummary` where each part also has `description` (the exercise's Markdown), `steps` (`spec.steps`, `[]` for editor parts), `sources` `[{name,size,url}]` (exercise `source` attachments), `deliverable`, `accepted_extensions`, `software` (string: `spec.software` joined with `" / "`, or `null`), `exercise_id` (**only for editor parts**, i.e. kind `code`/`sql`; `null` for file parts, because the runner uses `exercise_id !== null` to show the "open the editor" banner instead of a Dropzone, `ExamRunner.tsx` PartView), plus `source_zip: {name,size,url} | null`. File URLs use `AttachmentUrls::forExam` with TTL `exams.file_url_ttl_minutes` (360), because an exam runs for hours and the page keeps the first response.

`ExamAttempt` (exact):

```jsonc
{ "id": 9, "exam_id": 3, "mode": "exam", "state": "in_progress",
  "started_at": "2026-10-12T08:00:00+00:00", "deadline": "2026-10-12T12:00:00+00:00",   // deadline null for practice
  "server_time": "2026-10-12T08:41:12+00:00",   // extra field, lets the client correct clock skew (section 6)
  "submissions": [{ "part_id": 11, "file_name": "hyrox.xlsx", "uploaded_at": "2026-10-12T08:40:00+00:00" }] }
```

`submissions` has one entry per part that has something: file parts -> the stored upload's `original_name` and `created_at`; editor parts -> the best qualifying code submission, `file_name` = `megoldas.py` / `megoldas.cs` / `megoldas.sql` by language, `uploaded_at` = its `created_at`. This is how the runner's rail shows editor parts as done. `ExamResult`:

```jsonc
{ "attempt_id": 9, "exam": { /* ExamSummary with attempt = this attempt, score filled */ },
  "score": 81, "max_score": 100, "pending_manual_points": 4,
  "parts": [{ "part_id": 11, "score": 29, "max_score": 35, "summary": "A legtöbb pont itt veszett el: Formázás (3 pont).", "file_submission_id": 77 }],   // file_submission_id null for editor parts / missing uploads
  "review": [{ "lesson_id": 40, "title": "Szövegszerkesztés: stílusok", "track": "Szövegszerkesztés" }] }
```

#### 4.5.3 Rules

**Start.** Transaction; lock the user row; deny by `ExamAccess` (`PremiumContentLocked`); exam must be published (404); first expire an open attempt that is past its deadline (below); if an open attempt exists return it (200) regardless of the requested mode; else mode `exam` needs `exam.timed_mode` (else 422 `ExamModeUnavailable`: "Ehhez a feladatsorhoz nincs vizsgahelyzet, válaszd a gyakorlást."); create with `in_progress_marker = true`, `started_at = now`, `deadline_at = started_at + minutes` for `exam`, `last_activity_at = now`.

**Timer.** The server `deadline_at` is the only authority; the client countdown is cosmetic. Uploads are accepted until `deadline_at + exams.grace_seconds` (15, env `EXAMS_GRACE_SECONDS`; the Playwright backend sets 0) so an upload started just before the end and clock skew do not lose work. After that moment the attempt is *expired*.

**Autosave.** There is no draft saving on the server except what is already persisted: each file upload (replaces the part's previous file; the old file is deleted after the new one is stored) and each code submission. The editor drafts stay in the browser (`useCodeDraft`). A reload or a lost connection simply re-fetches `GET /exam-attempts/{id}` and continues ("Megszakadt kapcsolat esetén ott folytathatod").

**Expiry (three triggers, all call the same `SubmitExamAttempt`).** (1) the client's auto-submit at 0:00 calls `POST .../submit`; (2) any `GET /exam-attempts/{id}` or `POST .../file` that finds `now > deadline_at + grace` submits and evaluates first, then answers with the closed attempt (uploads get 409 `ExamAttemptClosed`: "A feladatsor már be van adva, a megoldások nem módosíthatók."); (3) the scheduled job `CloseExpiredExamAttempts` (every minute, `state = in_progress and mode = exam and deadline_at + grace < now`, batch 20) for students who closed the browser. The job also retries attempts stuck in `submitted` (older than 2 minutes, never evaluated).

**Second tab / second device.** The same open attempt is returned to both. Submitting in one makes the other's next `GET` return `state != in_progress` (the runner then redirects to the result page, `ExamRunner.tsx` line 40) and its uploads fail with 409. Concurrent uploads to the same part: last write wins (unique `(exam_attempt_id, exam_part_id)`; replace inside a transaction with a row lock on the attempt).

**Upload to a part** (`UploadExamPartFile`): attempt must be `in_progress` and not expired; the part must belong to the attempt's exam; the part's exercise must be an upload kind (else 422 `PartNotUploadable`: "Ezt a részt a beépített szerkesztőben oldod meg."); same authorization-free inspection and storage as 4.3.3 steps 2 and 4 with the exercise's `accepted_extensions` (no concurrency gate, no evaluation); **no evaluation** (row status `stored`); touch `last_activity_at`.

**Submit** (`SubmitExamAttempt`): lock attempt; if not `in_progress` return it unchanged (idempotent, second tab); set `state submitted`, `submitted_at = now`, `in_progress_marker = NULL`; call `EvaluateExamAttempt` in the same request. If evaluation throws, log it and leave the attempt `submitted`; the job retries (the result endpoint answers 409 meanwhile). Practice attempts are submitted by the student only (or by `PruneIdleExamAttempts`).

**Evaluate** (`EvaluateExamAttempt`, `PartScorer`): for each part in order:
- *file part*: the attempt's `file_submissions` row. None -> raw 0, summary "Ebben a részben nem adtál be fájlt." Else run `FileEvaluator` (WP3) with the part exercise (`FileSubmission.attempt = 1`, `status evaluated|failed`, result snapshot stored on the row so `GET /file-submissions/{id}` works for the result page's "Értékelőlap megnyitása" link). `raw = score`, `raw_max = max_score` (rubric total; 0 means the rubric is empty: treat as `part.points`).
- *editor part*: among the user's `submissions` for `part.exercise_id` with `status in (passed, failed)` and `created_at` in `[started_at, min(now, deadline_at + grace)]` (practice: until `submitted_at`), pick the highest `score/max_score` (ties: latest id). `raw = score`, `raw_max = max_score` (fall back to passed/total counted from `results` for old rows). None -> raw 0, summary "Nem adtál be megoldást ebben a részben."
- converted `score_part = floor(raw * part.points / raw_max)` (always floor; the official conversion, `FRONTEND.md` section 9). `max_score_part = part.points`.
- `summary` (Hungarian, may be null when full points): file part -> "A legtöbb pont itt veszett el: {group} ({lost} pont)." using the group with the largest loss; editor part with subtasks -> "A(z) {n}. részfeladat nem adott pontot: {label}."; without subtasks -> "{failed} teszteset közül {total} nem teljesült." (counts only; never hidden details).
- `pending_manual_points` = sum over unmarked manual items of `floor(max_points * part.points / raw_max)`.
- Write `result` snapshot, `score = sum`, `max_score = sum(part.points)`, `state evaluated`, `evaluated_at`.

`RecomputeExamResult` (called by `SaveManualMarks`): recompute only file parts from their rows, update `result`, `score`, `pending_manual_points`; editor parts keep their stored raw values.

**Review links** (`ReviewSuggester`, heuristic, decision 8.7): for parts with lost points, in order of loss, take the lessons of the part exercise's module that come before the part exercise's lesson (closest first), published, at most 3 in total, and show the track title in `track`. A part without a lesson contributes nothing. If a future UI adds `rubric_items.review_lesson_id` it overrides this.

**Idle practice attempts** (`PruneIdleExamAttempts`, hourly): `mode practice`, `in_progress`, `last_activity_at < now - exams.idle_days` (14): if it has any upload or qualifying submission submit and evaluate, else delete it.

Policy `ExamAttemptPolicy`: `view` (owner or admin), `upload` and `submit` (owner only).

#### 4.5.4 Admin endpoints (exact shapes: `admin/exams/api.ts`)

| Route | Behaviour |
|---|---|
| `GET /admin/exams` | `{data: AdminExam[]}` (not paginated), `session desc, level`; eager-load `parts.exercise` with `withSum('rubricItems','points')` |
| `POST /admin/exams` | body `ExamPayload` `{title, level, minutes, points, is_published, timed_mode}` (+ optional `session`) -> 201 `{data: AdminExam}`. Creating published is refused (no parts yet) |
| `GET /admin/exams/{exam}` | `{data: AdminExam}` |
| `PUT /admin/exams/{exam}` | same body; publishing rules below |
| `POST /admin/exams/{exam}/parts` | body `{key, name, exercise_id\|null, points, minutes}` -> **returns the whole `AdminExam`** (the frontend does `Envelope<AdminExam>`), 201 |
| `DELETE /admin/exam-parts/{part}` | 204; refused with 409 `CatalogItemInUse::hasStudentData()` when any attempt exists for the exam |
| `PUT /admin/exams/{exam}/parts/order` | `{ids}` all parts exactly once, 204 |
| `POST /admin/exams/{exam}/attachments` | multipart `file` (`source_zip`), 201 `AdminAttachment` (shared Action from WP0) |
| `DELETE /admin/attachments/{attachment}` | shared with WP1 |

`AdminExam`: `{id, title, level, minutes, points, is_published, timed_mode, session, parts: AdminExamPart[], files: [{name,size,url}]}` (`session` is an addition; `files` are the exam's attachments with signed admin URLs). `AdminExamPart`: `{id, order, key, name, exercise_id, exercise_title, points, minutes, rubric_status, missing_points}`:
- `rubric_status = 'tests'` when the part exercise is an editor kind with at least one visible test case; `'complete'` when it is an upload kind and `rubric_total >= target` where `target = spec.raw_points ?? part.points` and `rubric_total` is the sum of its rubric `points`; else `'incomplete'`. A part without an exercise is `'incomplete'`. `missing_points = max(0, target - rubric_total)` for file parts, else 0 (for an editor part without tests: `part.points`).
- Request rules: `title` string<=255; `level` in `kozep,emelt`; `minutes` int 1..600; `points` int 1..300; `session` regex `^\d{4}-(05|10)$` optional; `key` `Rule::enum(ExamPartKey)`; part `points` int 0..300, `minutes` int 0..600; `exercise_id` nullable `exists:exercises,id`.
- **Publishing** (`is_published` true on `PUT /admin/exams/{exam}`): 422 on `is_published` with a Hungarian message when: no parts; any part has `rubric_status = 'incomplete'` ("A(z) N. rész értékelőlapja hiányos."); any editor part's exercise is unpublished ("A(z) N. rész feladata nincs publikálva."); sum of part points differs from `points` ("A részek pontjainak összege (X) nem egyezik a vizsga összpontszámával (Y)."). Unpublishing is always allowed. `ExamPublished` / `ExamUnpublished` audit on change.
- Adding a part to a published exam: 422 ("Közzétett vizsgához nem adható új rész. Előbb vond vissza a közzétételt."). Reorder is allowed.

#### 4.5.5 Rate limiters (WP0 defines)

`exam-write`: 30 per minute per user. `file-submission`: 6 per minute and 150 per day per user. `admin-upload`: 30 per minute per admin.

#### 4.5.6 Interfaces WP0 pre-creates so WP3 and WP6 can work in parallel

`Services/Exams/ExamResultRecalculator` (interface with one method `recompute(ExamAttempt): void`, bound in `AppServiceProvider::register` to a null implementation by WP0 and to the real one by WP6) is what `SaveManualMarks` (WP3) calls. `Services/FileTasks/FileEvaluator` is a class owned by WP3; until it merges WP6 tests that need evaluation are written against the editor-part path and `rubric-check` fixtures, and the full path is verified after WP3 is merged (section 7.13 merge order).

### 4.6 Preferences and oral practice (WP7)

Classes: `Http/Controllers/Api/V1/Learning/{PreferencesController,OralPracticeController}.php`; `Http/Requests/Learning/{UpdatePreferencesRequest,UpdateOralPracticeRequest}.php`; `Http/Resources/Learning/{PreferencesResource,OralPracticeResource}.php`; `Actions/Learning/{SavePreferences,SaveOralPractice,RecordOralAttempt}.php`; `Models/OralPractice.php` (WP0); `config/learning.php` (WP0); `lang/hu/learning.php`.

| Route | Middleware | Behaviour |
|---|---|---|
| `GET /account/preferences` | `auth:sanctum` | `{data: {level, exam_period, language, weekly_hours} \| null}` (`null` = never saved; the frontend then uses `DEFAULT_PREFERENCES`) |
| `PUT /account/preferences` | `auth:sanctum`, `throttle:30,1` | all four fields required; `level` in `kozep,emelt`; `exam_period` in `config('learning.exam_periods')` (`2027-05`, `2027-10`, `2028-05` today, mirrors `EXAM_PERIODS` in `shared/domain/preferences.ts`; it changes over time, so it is config); `language` in `python,csharp`; `weekly_hours` in `1-2,3-4,5+`. Returns the saved object. Stored in `users.preferences` |
| `GET /oral/practice` | `auth:sanctum` | `{data: OralPractice[]}` rows that exist |
| `PUT /oral/practice/{topic}` | `auth:sanctum`, `throttle:60,1` | upsert `{checked, notes, scores}`; `{topic}` must be one of the six slugs in `config('learning.oral_topics')` (`szovegszerkesztes, grafika-es-kepszerkesztes, bemutatokeszites, publikalas-a-vilaghalon, tablazatkezeles, adatbazis-kezeles`) else 404; `checked` array<=30 of distinct int 0..29; `notes` string<=5000 (empty allowed); `scores` object whose keys are in `config('learning.oral_self_criteria')` (`Logikai felépítés`, `Kifejezőkészség, szaknyelv`, `Kommunikatív készség`) and values int 0..4 |
| `POST /oral/practice/{topic}/attempts` | `auth:sanctum`, `throttle:60,1` | increments `attempts`, sets `last_practiced_at`; creates the row if needed |

`OralPractice` JSON (exactly the frontend's `OralPractice` plus the topic): `{topic, checked: number[], notes: string, scores: Record<string, number>, attempts: number, last_practiced_at: string|null}`. The topic content (outline, B task, solution, scoring table) stays in `frontend/src/features/oral/topics.ts` (decision 8.9). Guests keep no server state; the frontend uses a guest key in `localStorage` for them or shows the page without saving (WP10).

### 4.7 Progress integration and privacy (WP8)

**Progress.** File tasks and exam work must count where code submissions count today.

- New `Services/Progress/ExerciseAttempts.php`: one place that knows both sources. Methods: `solvedBy(User): Collection<int,int>` (exercise ids with a `submissions.status = 'passed'` row or a practice `file_submissions.passed = true` row, `exam_attempt_id IS NULL`), `attemptedBy(User)`, `existsClause` for query builders (used by `ListTasks::whereStatus`).
- Refactor to use it: `Services/Progress/ExerciseStatuses::for` (currently a `GROUP BY` on `submissions`), `Services/Progress/LessonStatuses::forUser` (attempted lessons), `Actions/Progress/RecordLessonProgress` (counts only *gradable* published exercises: kinds `code, sql, sheet_upload, doc_upload, visual_upload`; browser-only kinds are ignored; if none are gradable it returns false), `Actions/Catalog/ListTasks::whereStatus`, `Actions/Progress/CompleteTheoryLesson` (`LessonHasExercises` only if a *gradable* published exercise exists), `Exceptions/Catalog` / `ExerciseController::destroy` already extended in WP1.
- A lesson is completed through a file task when its latest-best practice row has `passed = true` (decision 8.2). Exam rows never count for progress.
- `GET /progress`, `GET /tracks`, `GET /tasks` need no contract change.
- Indexes already created in WP0 (`file_submissions_progress_index`) keep the union cheap; keep it a constant number of queries per request (no per-exercise queries).

**Export** (`Actions/Account/ExportAccountData`, the file's docblock demands it): add keys `preferences`, `oral_practice` (all fields), `file_submissions` (`id, exercise {id,title}, attempt, file_name, size, status, score, max_score, passed, exam_attempt_id, submitted_at, result`; the files themselves are not included, decision 8.9), `exam_attempts` (`id, exam {id,title,level}, mode, state, started_at, submitted_at, score, max_score, parts`).

**Deletion** (`Actions/Account/DeleteAccount` + new listeners on `AccountDeleted`; users are soft-deleted so DB cascades never run): `DeleteAccount` also sets `preferences` to `null` in its `forceFill`; `Listeners/PurgeSubmittedFilesOnAccountDeletion` deletes every file of the user's `file_submissions` from the disk, then the rows, then the user's `exam_attempts` (rows and their remaining files); `Listeners/PurgeOralPracticeOnAccountDeletion` deletes the rows. Code submissions keep their existing behaviour (detached, anonymous). Files are removed *before* rows so a crash cannot orphan them; the listener is idempotent and safe to re-run.

**Retention** (`Jobs/PruneExpiredFileSubmissions`, daily 03:30 Europe/Budapest, scheduled in WP0): delete practice `file_submissions` older than `filetasks.retention_days` (365) and exam attempts older than the same with their files. `Console/Commands/PruneOrphanFiles` (`files:prune-orphans`, weekly): deletes files on `submission_files` that have no row and are older than 1 day; for `exercise_files` it only **reports** (author content is never auto-deleted).

### 4.8 Admin overview endpoint (WP9, optional)

Today `AdminOverview.tsx` fires six queries (four user-list page loads just for their `total`, one invoices page, one tracks list). One endpoint is cheaper and can add numbers the lists cannot give (incomplete rubrics, draft exams, recent actions). Not required by any page behaviour; schedule it last.

`GET /admin/overview` (admin, cached 60 s with `Cache::remember`, key `admin.overview`):

```jsonc
{ "data": {
  "users": { "total": 120, "unverified": 8 },
  "subscribers": { "active": 31, "past_due": 2 },
  "invoices": { "attention": 1 },                 // same definition as GET /admin/invoices meta.total
  "catalog": { "tracks": 6, "draft_tracks": 1, "incomplete_rubrics": 2, "draft_exams": 1 },
  "recent_actions": [{ "id": 90, "action": "catalog.updated", "label": "Tananyag módosítva", "actor": { "id": 1, "name": "Admin" }, "subject_type": "exercise", "subject_id": 12, "created_at": "2026-10-12T08:00:00+00:00" }]   // last 10, actor null = system
} }
```

Classes: `Http/Controllers/Api/V1/Admin/OverviewController.php`, `Actions/Admin/BuildOverview.php`, `Http/Resources/Admin/OverviewResource.php`, `lang/hu/overview.php` (labels per `AuditAction`). `users.total` counts non-deleted users; `subscribers.active` = users with a live subscription of status `active`; `past_due` likewise; `incomplete_rubrics` = published upload-kind exercises with no rubric item, plus exam parts whose `rubric_status` is `incomplete` (count distinct exercises). One query per figure, no per-user work. Reference for the old dashboard approach: commit `122e6a4` (much larger than needed; do not copy its metrics).


---

## 5. Cross-cutting concerns

### 5.1 Security of uploads and files (shared services are WP0; every upload endpoint must use them)

One pipeline, `Services/Files/UploadedFileInspector` (+ `ZipSafety`, `XmlSafety`), used by file submissions, exam part files and admin attachments. Never write ad-hoc checks in controllers.

1. **Extension whitelist**, case-insensitive, taken from the exercise's `spec.accepted_extensions` (intersected with `config('filetasks.extensions')`, which maps `.docx .odt .xlsx .ods .pptx .odp .svg .png .html .css .sql .py .cs .txt .zip` to a category: `document`, `image`, `text`, `archive`). Double extensions (`a.xlsx.exe`) are judged by the last one. Macro-enabled and executable families are always rejected, even if somebody lists them: `.docm .dotm .xlsm .xlsb .xlam .pptm .ppam .potm .sldm .exe .dll .bat .cmd .ps1 .js .vbs .jar .msi` (`config('filetasks.blocked_extensions')`).
2. **Size caps** per category (config, bytes): `document` 10 MB, `image` 5 MB, `text` 1 MB, `archive` 50 MB (exam zip, admin only). Enforced twice: PHP `upload_max_filesize` / nginx (below) and the FormRequest `max` rule (KB) so the answer is a Hungarian 422, not a PHP/nginx error page.
3. **Content sniffing, never trust the client**: `finfo` (`FILEINFO_MIME_TYPE`) on the stored temp file. OOXML/ODF/zip family must sniff as a zip (`application/zip`, `application/vnd.openxmlformats-officedocument.*`, `application/vnd.oasis.opendocument.*`, or `application/octet-stream` with a `PK\x03\x04` signature); png as `image/png`; svg/html/css/text as text. A renamed `.exe` or a text file named `.xlsx` is rejected with `UnsupportedUpload`.
4. **Zip safety** (`ZipSafety::assertSafe(ZipArchive)`): entry count <= 2000; sum of declared uncompressed sizes <= 150 MB; one entry <= 50 MB; any entry's ratio `uncompressed/compressed` <= 200; entry names must not start with `/` or `\`, contain `..` or a NUL; reject encrypted entries; reject nested archives deeper than the parsers need (we do not recurse). Macro payloads rejected by name: `vbaProject.bin`, `*/vbaProject.bin`, ODF `Basic/`, `Scripts/`, `Object *` with `script:`/macro events (`macrosEnabled` content types). We **never extract to disk**: parsers read entries into memory through `ZipArchive::getFromName` / `getStream` with a hard byte cap (`filetasks.xml_part_max_bytes`, 8 MB per XML part) and count actual bytes read (the declared size can lie). Path traversal is therefore impossible by construction; the name check is defence in depth.
5. **XML safety** (`XmlSafety::load(string): DOMDocument`): reject any part containing `<!DOCTYPE` or `<!ENTITY` (no DTD, no entities, so no XXE and no billion laughs); `LIBXML_NONET | LIBXML_NOBLANKS`; never `LIBXML_NOENT`, `LIBXML_DTDLOAD`, `LIBXML_DTDATTR`; `libxml_use_internal_errors(true)` and `libxml_disable_entity_loader` is not needed on PHP >= 8. Deep nesting: libxml's default depth (256) stays on. XPath only with fixed namespaces registered by the parser.
6. **HTML/CSS/SVG** are parsed, never rendered or executed by the server. `DOMDocument::loadHTML` with `LIBXML_NONET`, no network, no includes. SVG: same `XmlSafety` (no DOCTYPE), and when served back (`preview_url`) always `Content-Type: image/svg+xml` + `Content-Security-Policy: default-src 'none'; sandbox` + `nosniff`; a student SVG is only ever shown in an `<img>`, where scripts do not run.
7. **Storage names are random** (`Str::ulid()` + extension from the whitelist); the original name is kept only as a display string, sanitised by `safeName` (basename, strip control chars and path separators, NFC, <= 255 bytes) and never used to build a path. Download headers use `Content-Disposition: attachment; filename*=UTF-8''<rawurlencode(name)>`.
8. **Virus scanning**: optional hook `FILETASKS_SCAN_COMMAND` (e.g. `clamdscan --no-summary {path}`); off by default (decision 8.10). If set and the command exits non-zero the upload is rejected with `UnsupportedUpload`.
9. **Evaluator limits**: wall-clock `filetasks.evaluation_timeout` (25 s), XML part cap 8 MB, DOM node cap enforced by the models (stop reading after 200 000 nodes -> `UnreadableFile`), memory: parse sheet XML with `XMLReader` (streaming) for worksheets and shared strings, DOM only for small parts (styles, workbook, document with a size cap). Evaluator code must never `eval`, `include`, call a shell, or fetch a URL found in a file.
10. **nginx / PHP limits (deploy)**: WP0 edits `deploy/nginx/infotanar.conf` so the PHP location accepts 12 MB (`client_max_body_size 12m;` inside `location ~ ^/index\.php$`, because the `/api` location only does an internal redirect to it; every other FormRequest keeps its own small `max`), `fastcgi_read_timeout 60s` is enough. PHP-FPM: `upload_max_filesize = 12M`, `post_max_size = 14M`, `max_file_uploads = 5`, `memory_limit = 256M`; document these in `docs/runbooks/go-live.md` (the app does not set them). The Playwright `php -S` server uses PHP defaults (2 MB upload): API tests keep fixture files under 1.5 MB, and a size-limit test uses the `text` category cap through a config override env var.

### 5.2 Authorization map (IDOR checks, 404 not 403 for foreign objects)

| Endpoint | Rule |
|---|---|
| `GET /exercises/{id}/file-submissions` | lists only `where user_id = me and exam_attempt_id is null`; an unknown or unpublished exercise id -> 404 (no list) |
| `GET /file-submissions/{id}`, `PUT .../manual`, `GET .../file` (signed) | `FileSubmissionPolicy`: owner (or admin to read); foreign -> **404**. Signed `.../file` route additionally re-checks that the row exists and the file is an image |
| `GET /exam-attempts/{id}`, `.../result`, `POST .../file`, `POST .../submit` | `ExamAttemptPolicy`: owner (admin may read); foreign -> 404 |
| `POST /exam-attempts/{id}/parts/{part}/file` | `{part}` must belong to the attempt's exam, else 404 (do not trust two ids together) |
| `GET /exams/{id}` | unpublished -> 404 for non-admins |
| `GET /attachments/{id}/download` | signed; roles `input` and `sample_solution` -> 404 unless the signature carries the admin marker issued only in admin resources |
| Everything under `/admin/*` | `admin` middleware (before route-model binding) |
| `PUT /oral/practice/{topic}` etc. | scoped to `auth()->id()`; unknown topic -> 404 |

Content access: an upload to a premium exercise needs `ContentAccess::denialFor`; reading own old results does not. Locked tasks (`TaskResource`) never serialise `file_task`, `sources`, `sample_image_url` or any URL. **Hidden tests must never leak** through the new features: input files with `test_case_id` set are never listed in any student resource and the download route 404s them; subtask `note` is null when a hidden case decided; exam summaries expose only counts for editor parts; `HiddenResultRedactor` is unchanged and `submissions.subtasks` stores no expected/actual text.

### 5.3 Performance

- Every list/Resource that touches relations eager-loads them explicitly (strict models throw otherwise). Specific traps: `ExamSummaryResource` (latest attempt per exam: one `whereIn(exam_id)` query grouped by exam), `AdminExamResource` (parts + exercise + `withSum('rubricItems','points')`), `TaskResource` (attachments, one query), the progress union (constant queries).
- All lists are bounded: file submissions 50, exams unbounded but tiny (tens), rubric items unbounded (tens), oral 6.
- Uploads are hashed with `hash_file('sha256', ...)` (streaming) and moved, never read into memory. Evaluation reads each XML part once.
- Exam closing job: batch of 20, `->withoutOverlapping()`; each attempt is evaluated in its own transaction so one bad file cannot block the rest.
- Indexes are listed per table in section 3; do not add others without a query that needs them.

### 5.4 Configuration and `.env.example`

WP0 adds these files and keys (defaults in the config, documented in `backend/.env.example`; the server `.env` is hand-managed, so every key must have a safe default):

- `config/filetasks.php`: `FILETASKS_PASS_RATIO=0.8`, `FILETASKS_KEEP_PER_EXERCISE=10`, `FILETASKS_RETENTION_DAYS=365`, `FILETASKS_URL_TTL_MINUTES=60`, `FILETASKS_EVALUATION_TIMEOUT=25`, `FILETASKS_MAX_CONCURRENT_EVALUATIONS=4`, `FILETASKS_LENGTH_TOLERANCE_MM=1.0`, `FILETASKS_SCAN_COMMAND=`, size caps `FILETASKS_MAX_DOCUMENT_MB=10`, `FILETASKS_MAX_IMAGE_MB=5`, `FILETASKS_MAX_TEXT_KB=1024`, `FILETASKS_MAX_ARCHIVE_MB=50`; arrays `extensions`, `blocked_extensions`, `zip` caps, `readers`, `checks`; rate settings `FILETASKS_RATE_PER_MINUTE=6`, `FILETASKS_RATE_PER_DAY=150`.
- `config/exams.php`: `EXAMS_GRACE_SECONDS=15`, `EXAMS_IDLE_DAYS=14`, `EXAMS_FILE_URL_TTL_MINUTES=360`, `EXAMS_CLOSE_BATCH=20`.
- `config/learning.php`: `exam_periods`, `weekly_hours`, `oral_topics`, `oral_self_criteria` (arrays, no env).
- `config/filesystems.php`: disks `exercise_files` (root `storage/app/private/exercise-files`) and `submission_files` (root `storage/app/private/submission-files`), both `visibility private`, `throw false`, `report false`, like `lesson_videos`; env `EXERCISE_FILES_DISK`, `SUBMISSION_FILES_DISK` (default the names above) so S3 can replace them later.
- `composer.json`: `"ext-zip": "*"`, `"ext-dom": "*"`, `"ext-fileinfo": "*"` under `require` (platform requirements; run `composer update --lock` so `composer.lock` stays valid; CI already installs zip and fileinfo).
- `deploy/`: nginx `client_max_body_size` (5.1), `deploy/backup/infotanar-backup.sh` + `docs/runbooks/backup-restore.md` back up `exercise-files` weekly like `lesson-videos` (author content is irreplaceable); `submission-files` is deliberately **not** backed up (the DB keeps scores and result snapshots; students can re-upload).
- `app:check-config` (`Support/Config/ProductionConfigAudit.php`): add a check that the two disks' directories are writable and that `ext-zip` is loaded.

### 5.5 Queues and scheduled jobs

One worker, one scheduler (`routes/console.php`, WP0 adds the lines with stub jobs; owners fill the bodies):

| Job / command | Schedule | Owner | Notes |
|---|---|---|---|
| `Jobs\CloseExpiredExamAttempts` | every minute, `withoutOverlapping()` | WP6 | closes expired exam-mode attempts, retries stuck `submitted` ones |
| `Jobs\PruneIdleExamAttempts` | hourly | WP6 | idle practice attempts |
| `Jobs\PruneExpiredFileSubmissions` | daily 03:30 Europe/Budapest | WP8 | retention |
| `files:prune-orphans` | weekly (Sunday 04:00) | WP8 | orphan files |

No new queued jobs on the request path: evaluation is synchronous (4.3.3, 4.5.3). In Playwright `QUEUE_CONNECTION=sync` and no scheduler runs, so expiry is tested through the lazy path only. Failed jobs already alert through `AppServiceProvider::alertOnFailedJobs`.

### 5.6 Seeders

- `CatalogSeeder` (real catalog, run by `db:seed-once` only when there are zero exercises): **unchanged**. New content types are authored in the admin UI; shipping a demo exam in the production seeder would be wrong. If the owner wants example content, add it as a separate opt-in seeder (not in this plan).
- `ApiTestSeeder` and `tests/src/data/seed.ts` change **together, in WP0**, because every package's API tests depend on the same ids. The existing fixtures (exercises 1 to 4, lessons 1 to 4 in module `pw-teszt-temakor`) must not change: `tests/specs/api/catalog.spec.ts` asserts the module's `task_count` (3) and that the `emelt` filter returns exactly one task. All new fixtures therefore go into a **second module** `pw-tipusos-temakor` of the same track, are all level `kozep`, and are created **after** `ApplyFreemiumDefaults` runs, with `is_free` set explicitly:

| Exercise id | Lesson id (free?) | Kind and title | Fixture detail |
|---|---|---|---|
| 5 | 5 (free) | `sheet_upload`, "PW teszt: Táblázat feltöltés" | spec: `steps ["Rendezd a táblázatot."]`, `deliverable tabla`, `accepted_extensions [.xlsx,.ods]`, `software [Excel]`, `exam_points 10`, `raw_points 10`; rubric (positions 0..3): (1) group "Képletek", `cell_value` `Munka1!B2` expected `42`, 4 points, auto; (2) "Képletek", `cell_formula` `Munka1!B3` expected `fn:SZUM`, 3, auto; (3) "Formázás", `number_format` `Munka1!B2` expected `0,00`, 2, auto; (4) "Formázás", `manual`, 1 point, hint "Hasonlítsd a mintához." (total 10). One `sample_image` attachment (1x1 png) |
| 6 | 6 (premium) | `doc_upload`, "PW teszt: Szöveg feltöltés" | `accepted_extensions [.docx]`; rubric: `page_setup` `page_size` `A4`, 2 points. Used for lock tests (student without subscription -> 403 `subscription_required`) |
| 7 | 7 (free) | `web`, "PW teszt: Weboldal" | `web_task` with `index.html` and one `title` check |
| 8 | 8 (free) | `code`, "PW teszt: Részfeladatok" | python, `spec.subtasks [{number 1,label "Darabszám",points 2},{number 2,label "Összeg",points 3}]`, one visible test case (`stdin ""`, `expected_stdout "1. feladat\n3\n2. feladat\n6\n"`), one `source` attachment `adatok.txt` (written to the `exercise_files` disk by the seeder) |
| 9 | 9 (free) | `sheet_browser`, "PW teszt: Táblázat böngészőben" | `sheet_practice` with one `has_formula` check |

| Exam id | Fixture |
|---|---|
| 1 | "PW teszt vizsga", session `2026-05`, `kozep`, minutes 30, points 20, published, `timed_mode` true; parts: (order 1) key `tablazat`, exercise 5, points 10, 15 min; (order 2) key `programozas`, exercise 8, points 10, 15 min; one `source_zip` attachment |
| 2 | "PW teszt vizsga (lejárt)", minutes **0** (inserted directly; the API forbids it), published, one part (exercise 5, 10 points). With `EXAMS_GRACE_SECONDS=0` set in `tests/config/web-servers.ts`, an attempt on it is expired at once, which makes the timeout path testable without waiting |
| 3 | unpublished exam (404 test) |

`seed.ts` gets the matching constants (`SEEDED.typed.*`, `SEEDED.exams.*`, titles and ids), the rubric totals, the `SEEDED.accounts` stays. Binary fixtures live in `tests/fixtures/files/` (new directory, files < 20 KB each, created once with LibreOffice and committed): `pw-tabla-ok.xlsx` (B2 = 42 with number format `0.00`, B3 = `=SUM(A1:A5)`; files store English function names, which is why `fn:SZUM` must normalise to `SUM`), `pw-tabla-rossz.xlsx` (B2 = 41, B3 a constant), `pw-tabla.ods` (same content as the ok file), `pw-serult.xlsx` (plain text renamed, not a zip), `pw-makro.xlsm` (any small file; rejected by extension), `pw-szoveg-a4.docx` and `pw-szoveg-letter.docx` (page size A4 and Letter). The zip-bomb test builds its archive in memory with Node's `zlib` (nothing dangerous is committed). The API tests upload them through `request.fetch` multipart (`multipart: { file: { name, mimeType, buffer } }`). `PrepareApiTestFixtures` (`test:prepare-api-fixtures`) also empties the two new disks so reruns start clean.
- Judge0 mock (`tests/src/mocks/judge0/server.ts`, WP2): new control string `PW_JUDGE0_SUBTASKS` makes the mock answer `1. feladat\n3\n2. feladat\n7\n` (subtask 2 wrong); `PW_JUDGE0_ECHO_FILE` is not needed.

### 5.7 Test infrastructure changes (WP0)

- `tests/src/api/ApiClient.ts`: make `get/post/put/patch/delete` **public** (they are `protected` today) and add `postMultipart(path, fields, file)` and `getBinary(path)`. Area helpers then live in new files (`tests/src/api/areas/{fileTasks,exams,rubrics,learning,attachments}.ts`, exporting functions that take an `ApiClient`), so packages never edit the same file. Response types go into `tests/src/api/types/{fileTasks,exams,...}.ts` re-exported from `tests/src/api/types.ts` (WP0 adds the empty re-export lines).
- `tests/src/data/index.ts` re-exports `seed.ts` (unchanged).
- A test helper `premiumStudent(apiClient, admin)` in `tests/src/api/areas/accounts.ts`: sign up, `POST /admin/users/{id}/verify-email`, `POST /admin/users/{id}/access-grants`, log in; reused by exam and file-task tests. (Premium requires a verified e-mail, `ContentAccess`.)
- New spec files, one per package, under `tests/specs/api/` (names in section 7). The `api-rate-limit` project is not extended.

---

## 6. Frontend changes required

Principle: the backend matches the frontend. The changes below are the places where the frontend must change because the backend now exists, because a `localStorage` stand-in is replaced, or because there is no UI to author the new data. UI rules from `CLAUDE.md` / `FRONTEND.md` sections 4 to 6 apply (only `src/shared/ui`, tokens only, no new card/button/badge styles, Hungarian copy that says what happened and what to do).

### 6.1 WP10: frontend integration (server state, robustness)

1. **Preferences** (`features/onboarding`): add `features/onboarding/api.ts` with `preferencesQuery()` (`GET /account/preferences`) and `savePreferences()` (`PUT`), mapping the wire keys `exam_period` / `weekly_hours` to the camelCase `StudyPreferences` fields. `Onboarding.tsx` and `OralTopic.tsx` use a `useStudyPreferences()` hook: logged in -> server (default `DEFAULT_PREFERENCES` when the response is `null`), guest -> the existing `localStorage` key (the `/indulas` route is open to guests today, `App.tsx`). One-time migration: when logged in, the server value is `null` and the old `localStorage` value exists, `PUT` it, then remove the key. Remove `usePersistentState` from these two pages afterwards.
2. **Oral practice** (`features/oral`): add `api.ts` (`oralPracticeQuery`, `saveOralPractice`, `recordOralAttempt`); `Oral.tsx` reads attempts from the list query, `OralTopic.tsx` saves `checked/notes/scores` through a debounced mutation (800 ms, the endpoint allows 60/min) and calls the attempts endpoint in `finish()`; guests keep `readPractice`/`practiceKey` behaviour. Same one-time `localStorage` migration per topic.
3. **Exam clock** (`features/exams/api.ts`, `ExamRunner.tsx`): add `server_time: string` to `ExamAttempt`; compute `offset = Date.parse(server_time) - fetchedAt` once per fetch and use `Date.now() + offset` for the countdown and the auto-submit trigger. Without it a student whose clock is five minutes slow sees extra time that the server will not honour.
4. **Exam start denial** (`ExamStart.tsx`): when `start.error` is a lock (`zarolasOka(error)`), show the existing `Paywall` pattern or a `ButtonLink` to `/arak` / `/elofizetes` instead of only the message.
5. **Polling** (`filetasks/api.ts`): `submissionQuery` and `submissionsQuery` get `refetchInterval: (q) => q.state.data?.status === 'processing' ? 1500 : false` (list: any item processing). Harmless now (the backend evaluates synchronously); needed if evaluation ever becomes async.
6. **Admin overview** (`features/admin/overview/pages/AdminOverview.tsx`): replace the six queries by `GET /admin/overview` (WP9), falling back to the current queries on 404; show the new numbers (`incomplete_rubrics`, `draft_exams`) as `Stat`s and todos, and optionally the recent actions list.
7. **Legal text** (`features/legal/content`): the privacy policy and ÁSZF must mention uploaded files, exam attempts, oral notes, preferences and the 365-day retention. The text is the owner's decision (`FRONTEND.md` section 16: legal text is a placeholder); WP10 only adds a clearly marked paragraph.
8. **Types**: `types/index.ts` needs no change for the contract (the types already match); `features/admin/exams/api.ts` `AdminExam` gains `session: string`.
9. **E2E mocks** (`tests/src/mocks/MockApi.ts`): add `withExams()`, `withFileTask()`, `onFileUpload()` so `e2e-mocked` specs for `/vizsgak`, `/feladatok/:id` (upload kinds) and the result panel can exist. Writing those specs is the owner's call (project memory: the user writes the tests); the mock helpers are infrastructure and may be added.

### 6.2 WP11: admin authoring UI (without it nobody can create the new content)

1. **`AdminExercise.tsx`** (+ `features/admin/catalog/api.ts`): `AdminExercise` and `ExercisePayload` gain `kind`, `spec`, `comparison`, `attachments`, `rubric_item_count`. A "Típus" select (the eight kinds, Hungarian labels); disabled with a hint when the exercise already has student data (the server answers 422 `kind`). The language and starter-code fields show only for `code`/`sql`. A new tab "Típus-adatok": for upload kinds a small form (one step per line in a textarea, deliverable, accepted extensions as checkboxes limited to the kind's set, software list, exam reference, exam points, raw points); for `web`, `sheet_browser`, `doc_browser`, `sql` a JSON textarea with the shape documented in 4.1.3 and the server's 422 message under it (pragmatic: the shapes are deep, and a JSON editor is the smallest correct UI; a visual editor is a later improvement). For `code`: the subtasks list (number, label, points) and the "Kimenet összevetése" selector (mode, tolerances, options).
2. **Attachments tab** "Fájlok" (all kinds): list (`GET /admin/exercises/{id}/attachments`), upload with a role select (`source`, `sample_image`, `sample_solution`, and `input` with a test-case select for code kinds), delete. Uses a file input and `FileChip`.
3. **`RubricBuilder.tsx`**: add the four new check types to `CHECK_TYPES` (`sheet_format` "Munkalap és oszlopok", `conditional_format` "Feltételes formázás", `list_format` "Felsorolás", `shape` "Alakzat") and, optionally, "Kipróbálás mintamegoldással" (`POST .../rubric-check`, shows the result with `SubmissionResult`) and row editing through `PUT /admin/rubric-items/{id}`. Show the validation message from the server when an auto item's property/expected is not understood.
4. **`AdminExam.tsx`**: add the "Vizsgaidőszak" select (periods from the same list as onboarding) to the form and `ExamPayload`; in "Fájlok" add a source-zip upload and a delete button (`POST /admin/exams/{id}/attachments`, `DELETE /admin/attachments/{id}`).
5. **Admin user page** (optional, not in this plan): buttons for the existing `GET /admin/users/{id}/export` and `DELETE /admin/users/{id}`, which exist on the backend and in the design but not in the UI (section 2.3).


---

## 7. Execution plan

### 7.1 Shape of the work

Twelve packages. **WP0 first, alone**; after it merges, WP1 to WP9 can be developed fully in parallel (each owns a disjoint set of files and codes against the contracts WP0 creates), and the two frontend packages WP10 and WP11 can start from the endpoint shapes in section 4. Merge order and the few verification dependencies are in 7.13.

Route files (WP0 creates them empty with a docblock and adds `require __DIR__.'/api/<file>.php';` lines **inside** the `v1` group of `backend/routes/api.php`; each file declares its own `Route::middleware(...)` / `Route::prefix('admin')->name('admin.')->middleware(['auth:sanctum','admin'])` groups, so owners never edit `api.php`):

| File | Owner | Content |
|---|---|---|
| `backend/routes/api/typed-tasks.php` | WP1 | attachment download (signed), admin exercise attachments |
| `backend/routes/api/file-tasks.php` | WP3 | file submissions, manual marks, signed file preview, rubric admin, rubric-check |
| `backend/routes/api/exams.php` | WP6 | student exam routes, admin exams, exam parts, exam attachments |
| `backend/routes/api/learning.php` | WP7 | preferences, oral practice |
| `backend/routes/api/admin-overview.php` | WP9 | overview |

Common definition of done for every backend package: `composer lint` and `composer analyse` green; `php artisan docs:endpoints` run and the regenerated `docs/api-endpoints.md` committed (on a merge conflict in that file, rebase and regenerate, never hand-merge); the package's Playwright spec passes with `cd tests && npx playwright test --project=api specs/api/<spec>.spec.ts`; `cd tests && npm run check` green; all earlier API specs still pass (`npm run test:api`); no new lint-suppression comments. Frontend packages: `npm run lint`, `npm run typecheck`, `npm run build` in `frontend/`, `npm run check` in `tests/`, and `npx playwright test --project=e2e-mocked` still green.

### 7.2 WP0: Foundation (one engineer, merges first)

**Goal**: create everything the others share so they never touch the same file.

**Creates / owns**
- Migrations (section 3): `2026_10_12_100000_add_kind_spec_and_comparison_to_exercises_table`, `..._110000_add_score_and_subtasks_to_submissions_table`, `..._120000_add_preferences_to_users_table`, `..._130000_create_attachments_table`, `..._140000_create_rubric_items_table`, `..._150000_create_exams_table`, `..._151000_create_exam_parts_table`, `..._152000_create_exam_attempts_table`, `..._160000_create_file_submissions_table` (after exams/exam_attempts because of the FKs), `..._170000_create_oral_practices_table`.
- Models (full `@property` docblocks, casts, relations both ways, `published`-style scopes where useful): `Attachment, RubricItem, FileSubmission, Exam, ExamPart, ExamAttempt, OralPractice`; edits to `Exercise` (casts `kind => ExerciseKind`, `spec/comparison => array`; relations `attachments() (morphMany)`, `rubricItems()`, `fileSubmissions()`, `examParts()`; `$fillable` adds `kind, spec, comparison`), `User` (cast `preferences => array`; `fileSubmissions()`, `examAttempts()`, `oralPractices()`), `Submission` (`score`, `max_score`, `subtasks` casts, fillable).
- Enums: `ExerciseKind, AttachmentRole, RubricMode, RubricCheckType (22 values, 4.4.2), RubricState, FileSubmissionStatus, ExamMode, ExamAttemptState, ExamPartKey`; `AuditAction` new cases (3.4); morph map, rate limiters `exam-write`, `file-submission`, `admin-upload` (4.5.5) and the `ExamResultRecalculator` null binding in `AppServiceProvider`.
- Config: `config/filetasks.php`, `config/exams.php`, `config/learning.php`, `config/filesystems.php` disks (5.4); `.env.example`; `composer.json` + `composer.lock` platform requirements.
- Shared services and contracts: `Services/Files/{UploadedFileInspector,ZipSafety,XmlSafety,PrivateFileStore,AttachmentUrls,StoredFile}.php`; `Actions/Admin/Catalog/ManageAttachment.php`; `Exceptions/FileTasks/{UnsupportedUpload,UploadTooLarge,MacroEnabledFile}.php` (422, field `file`, messages in `lang/hu/filetasks.php`: "Ezt a fájltípust nem fogadjuk el ({ext}). Elfogadott: {lista}.", "A fájl túl nagy ({méret} MB). Legfeljebb {max} MB lehet.", "A makrót tartalmazó fájlokat nem fogadjuk el. Mentsd el makró nélküli formátumban (.xlsx, .docx, .pptx)."); `Services/FileTasks/{FileReader,OpenedFile,CheckHandler,CheckRegistry,CheckOutcome,Fact,UnreadableFile,RubricCheckCatalog}.php` (contracts, 4.4.1); `Services/Exams/ExamResultRecalculator.php` (interface + null implementation); `ContentAccess::premiumDenialFor` (and `denialFor` rewritten on top of it, behaviour unchanged).
- Routes: the five empty files and the `require` lines; `routes/console.php` schedule lines (5.5) with **stub** classes `Jobs/{CloseExpiredExamAttempts,PruneIdleExamAttempts,PruneExpiredFileSubmissions}.php` (empty `handle()`) and `Console/Commands/PruneOrphanFiles.php` (stub).
- Lang: empty-but-valid `lang/hu/{filetasks,exams,learning,overview}.php`. **Nobody edits `lang/hu/validation.php`.**
- Ops: `deploy/nginx/infotanar.conf` (5.1), `deploy/backup/infotanar-backup.sh` and `docs/runbooks/backup-restore.md`, `docs/runbooks/go-live.md` (PHP limits, `ext-zip`), `Support/Config/ProductionConfigAudit.php` checks.
- Tests/seed: `backend/database/seeders/ApiTestSeeder.php` + `tests/src/data/seed.ts` (fixtures of 5.6), `tests/fixtures/files/*`, `ApiClient` public methods and `postMultipart/getBinary`, `tests/src/api/areas/*.ts` and `types/*.ts` stubs plus `accounts.ts` helper, `PrepareApiTestFixtures` disk cleanup, `tests/config/web-servers.ts` (`EXAMS_GRACE_SECONDS: '0'`).

**Reads only**: everything else.

**Acceptance**: `php artisan migrate:fresh --seed --seeder=ApiTestSeeder` (via `test:prepare-api-fixtures`) works on SQLite and on MySQL (the CI MySQL job); `migrate:rollback` of the new migrations works; Larastan green with the new models; all existing API specs pass unchanged; the five route files load; `app:check-config` still passes in a normal environment.

**API tests**: `tests/specs/api/foundation.spec.ts`: (1) `GET /topics` still reports `task_count 3` for `pw-teszt-temakor` and `GET /tasks?level=emelt` still returns exactly the one old task; (2) `GET /tasks` contains the five new fixture titles; (3) the typed module appears under `GET /topics` with its slug.

### 7.3 WP1: Typed tasks and attachments

**Goal**: section 4.1 complete. **Depends on**: WP0.
**Owns**: `Http/Requests/Admin/Catalog/ExerciseRequest.php`, `Http/Resources/Admin/AdminExerciseResource.php`, `Http/Controllers/Api/V1/Admin/Catalog/ExerciseController.php`, `Http/Controllers/Api/V1/Admin/Catalog/AttachmentController.php`, `Http/Requests/Admin/Catalog/AttachmentRequest.php`, `Http/Resources/Admin/AdminAttachmentResource.php`, `Http/Controllers/Api/V1/Catalog/AttachmentDownloadController.php`, `Http/Resources/TaskResource.php`, `Http/Controllers/Api/V1/Catalog/TaskController.php`, `Services/Catalog/Spec/*`, `Exceptions/Catalog/{PublishedExerciseNeedsRubric,PublishedExerciseNeedsSpec,AttachmentLimitReached}.php`, `lang/hu/catalog.php`, `routes/api/typed-tasks.php`, `tests/specs/api/typed-tasks.spec.ts`, `tests/src/api/areas/attachments.ts`.
**Reads**: `Services/Files/*`, models, `ListTasks`.
**Acceptance**: every JSON example in 4.1.4 reproducible; frontend admin payload without new fields still creates/updates exercises; locked tasks leak nothing.
**API tests** (`typed-tasks.spec.ts`): (a) `GET /tasks/5` as admin: `kind sheet_upload`, `allowed_languages []`, `limits` is an object, `file_task` has the seeded steps and `.xlsx/.ods`, no `raw_points`, `sample_image_url` is a signed URL that downloads a PNG, and a URL with a tampered `signature` gets 403; (b) tasks 7, 9, 8: `web_task` with numeric check ids, `sheet_practice`, `sources[0]` downloadable with the right bytes; (c) guest on task 6: `locked true`, `locked_reason login_required`, no `file_task`; (d) admin create without `kind` -> `code`; create `sheet_upload` with an unknown `spec` key -> 422 on `spec`; `allowed_languages` non-empty on an upload kind -> 422; code kind with `[]` -> 422; (e) publish upload kind without rubric -> 422 `is_published`; publish `web` without checks -> 422; (f) change `kind` after a submission exists -> 422 (use exercise 8 after a submit); (g) attachments: upload `source` with an invalid name -> 422; sixth source -> 422; same name replaces (one row); `input` without `test_case_id` -> 422; student token 403, guest 401; `input` and `sample_solution` URLs 404 for students; delete 204 then download 404; (h) delete exercise with attachments removes them.

### 7.4 WP2: Code execution upgrades

**Goal**: section 4.2. **Depends on**: WP0 (models, config); the `comparison`/`spec` fields are written by WP1 but WP2 can seed them directly for its own checks.
**Owns**: listed in 4.2 (`Services/SolutionEvaluator.php`, `Services/Judge0Service.php`, `Services/Execution/**` new files, `Actions/Execution/{RunSolution,SubmitSolution}.php`, `Http/Requests/Execution/RunCodeRequest.php`, `Http/Resources/{EvaluationResource,SubmissionResource}.php`, `lang/hu/execution.php`, `config/judge0.php`, `tests/src/mocks/judge0/server.ts`, `tests/specs/api/execution-v2.spec.ts`).
**Acceptance**: with `spec.subtasks` empty and `comparison` NULL every existing response is byte-identical to today; the hidden-result allow-list is unchanged; evaluation deadline logic unchanged.
**API tests**: (a) `POST /run` with `task_id` 5 (upload kind) -> 422 on `task_id`; (b) `/run` on task 8 with source containing `PW_JUDGE0_SUBTASKS`: `subtasks` has two entries, first `passed true, points 2`, second `passed false, points 0`, `note` mentions the expected value because the case is visible; `status` is `failed`; (c) `/submissions` on task 8 returns the same `subtasks` and persists (a second request to `GET /submissions/{id}` still lists the submission); (d) a hidden failing case gives `note: null` (admin adds a hidden case through the test-case API in the test); (e) comparison `tokens` and `numeric` modes through `PATCH /admin/exercises/{id}` `comparison` on a created code exercise (echo program: `3.50` vs expected `3,5`, extra spaces) accepted/rejected as designed; `ignore_accents` accepts `kerek` for `kérek`; (f) a code exercise with a `source` attachment sends non-empty `additional_files` to the Judge0 mock (the mock gets control string `PW_JUDGE0_REQUIRE_FILE`: wrong answer unless the field is present); (g) `/run` without subtasks has no `subtasks` key.

### 7.5 WP3: File submissions, rubric admin, check engine core, spreadsheets

**Goal**: sections 4.3 and 4.4 for spreadsheets. **Depends on**: WP0. **Owns**: `Services/FileTasks/{FileEvaluator,...}`, `Services/FileTasks/Spreadsheet/**`, `Actions/FileTasks/{SubmitFileSolution,SaveManualMarks}.php`, `Actions/Admin/Catalog/ManageRubricItem.php`, `Http/Controllers/Api/V1/FileTasks/FileSubmissionController.php`, `Http/Controllers/Api/V1/Admin/Catalog/RubricItemController.php`, `Http/Controllers/Api/V1/Admin/Catalog/RubricCheckController.php`, `Http/Requests/FileTasks/{UploadFileSubmissionRequest,SaveManualMarksRequest}.php`, `Http/Requests/Admin/Catalog/RubricItemRequest.php`, `Http/Resources/FileSubmissionResource.php`, `Http/Resources/Admin/AdminRubricItemResource.php`, `Policies/FileSubmissionPolicy.php`, `Exceptions/FileTasks/{NotAFileTask,ManualMarkRefused,UnknownRubricCheck}.php`, `Console/Commands/EvaluateFileCommand.php` (`filetasks:evaluate {exercise} {file}`, prints the JSON; a development aid for WP4/WP5), `lang/hu/filetasks.php` (appends), `routes/api/file-tasks.php`, `tests/specs/api/file-submissions.spec.ts`, `tests/specs/api/rubrics.spec.ts`, `tests/src/api/areas/{fileTasks,rubrics,zip}.ts`.
**Acceptance**: the JSON of 4.3.2 for xlsx and ods fixtures; synchronous evaluation under 2 s for the fixtures; unreadable files give `status: failed` (201); no student file content is logged.
**API tests**: `file-submissions.spec.ts`: guest 401; unknown exercise 404; upload to task 1 (code kind) 422; task 6 as a student without subscription 403 with `reason subscription_required`; task 5 `pw-tabla-ok.xlsx`: 201, `status evaluated`, `score 9`, `max_score 10`, groups `Képletek 7/7` and `Formázás 2/3`, the manual item `state manual`, `attempt 1`, `previous_score null`; `pw-tabla.ods` gives the same score; second upload `pw-tabla-rossz.xlsx`: `attempt 2`, `previous_score 9`, lower score, the failing item has `state bad` and a non-null `hint`; list returns both newest first; wrong extension (`.docx` on task 5) 422 field `file`; `.xlsm` 422 with the macro message; `pw-serult.xlsx` (text renamed) 422; a valid zip without a workbook (`pw-ures-zip.xlsx`) 201 `status failed` with `error`; a generated zip bomb 422; oversize file 422; 11th upload keeps only 10 rows; manual marks: marking the manual item true gives `score 10` and (WP8 merged) lesson completion; marking a non-manual item 422; non-boolean 422; foreign user `GET /file-submissions/{id}` 404 and `PUT .../manual` 404; admin may read; exercise delete refused 409 when a file submission exists. `rubrics.spec.ts`: guest 401, student 403; list returns the four seeded items in order; create (auto, valid), create with unknown property -> 422 `property`; `check_type manual` forces `mode manual`; reorder with a missing id -> 422; delete compacts positions; `PUT /admin/rubric-items/{id}`; `rubric-check` with `pw-tabla-ok.xlsx` returns `id 0` and stores nothing (list of file submissions unchanged); without file and without `sample_solution` -> 422.

### 7.6 WP4: Document checks (docx, odt)

**Goal**: the document handlers of 4.4. **Depends on**: WP0 (contracts); verification needs WP3's `rubric-check` endpoint or `filetasks:evaluate`. **Owns**: `Services/FileTasks/Document/**`, `tests/specs/api/checks-documents.spec.ts`, `tests/fixtures/files/documents/*`, `lang/hu/filetasks_document.php`. To avoid a conflict on `lang/hu/filetasks.php` (WP3), WP4 and WP5 keep their Hungarian `found` strings in their own lang files `filetasks_document.php` and `filetasks_presentation.php` (WP0 creates both empty). **Acceptance**: every property row for the document family in 4.4.3 has a positive and a negative fixture case; `StyleResolver` resolves run -> paragraph style -> based-on chain -> document defaults for docx and the equivalent for odt automatic styles; `facts()` filled. **API tests**: through a temporary `doc_upload` exercise created via the admin API with a one-item rubric per case and `POST .../rubric-check`: page size A4 vs Letter, orientation, margins within tolerance, font/size/bold on a styled heading and on direct formatting, alignment, line spacing, style applied by name, table rows/columns, image width ratio, tab stop position/leader, columns count; the same cases on an `.odt` fixture; an unsupported property -> 422 at authoring time.

### 7.7 WP5: Slides, vector, web and image checks (pptx, odp, svg, html, css, png)

**Goal**: handlers `slide, animation, shape, web` and image checks for these families. **Depends on**: WP0; verification as WP4. **Owns**: `Services/FileTasks/Presentation/**`, `Vector/**`, `Web/**`, `Image/**`, `lang/hu/filetasks_presentation.php`, `tests/specs/api/checks-slides-web.spec.ts`, fixtures. **Acceptance**: slide count, size, background type, master font, transition, animation effect/timing readable from pptx and odp; svg element/shape counts and fills; html `title`, element counts, class use, links, css declarations and selectors; png dimensions (`image`). **API tests**: as WP4 per property, including HTML with a DOCTYPE-less fragment, CSS with comments and `@media`, and an svg with `<!DOCTYPE` rejected as unreadable (`status failed`).

### 7.8 WP6: Exams

**Goal**: section 4.5. **Depends on**: WP0; for verification WP1 (kinds in resources), WP2 (subtask scores of editor parts) and WP3 (file evaluation) must be merged (7.13). **Owns**: everything listed in 4.5 plus `routes/api/exams.php`, `lang/hu/exams.php`, `tests/specs/api/exams.spec.ts`, `tests/src/api/areas/exams.ts`. **Acceptance**: all JSON of 4.5.2; idempotent start and submit; lazy expiry; admin publish rules.
**API tests** (`exams.spec.ts`, using `premiumStudent` and the admin token): public list shows exam 1 and 2, not 3; `attempt null` for guests; `GET /exams/1` guest 401, unsubscribed student sees parts with empty descriptions and `source_zip null`, subscribed student sees `exercise_id` only on the editor part (part 2) and `null` on part 1; `GET /exams/3` 404 (student), 200 (admin); start as unsubscribed student 403 `subscription_required`; start `exam` as premium: 201, `deadline` = `started_at` + 30 min; a second start returns the same id (200); `mode: practice` has `deadline null`; mode `exam` on an exam with `timed_mode false` (created by the admin API in the test) 422; upload `pw-tabla-ok.xlsx` to part 1 appears in `submissions`; upload to part 2 422; wrong extension 422; foreign part id 404; foreign attempt 404 for `GET`, upload, submit and result; submit -> `state evaluated`; second submit 200 unchanged; upload after submit 409; result: `score 9` (part 1: floor(9*10/10)), part 2 0 with "Nem adtál be megoldást ebben a részben.", `pending_manual_points 1`, `file_submission_id` set for part 1 and `GET /file-submissions/{id}` works for the owner; marking the manual item through `PUT /file-submissions/{id}/manual` raises `score` to 10 on a re-read of the result; editor part: submit code to exercise 8 with `PW_JUDGE0_SUBTASKS` before submitting the attempt -> part 2 score floor(2*10/5) = 4 and `submissions` lists `megoldas.py`; expired exam 2 (minutes 0, grace 0): start, then `GET /exam-attempts/{id}` returns `evaluated` (lazy expiry) and an upload is 409; result before submit 409 `ExamResultNotReady`; two parallel starts create one attempt; admin: create (default `session`), invalid level 422, add parts, reorder, remove, publish blocked (no parts / incomplete rubric / point sum mismatch / unpublished editor exercise), publish ok after fixing, student 403, guest 401, `source_zip` upload then it appears in `files` and in `GET /exams/{id}` `source_zip` for a premium student, remove a part of an exam that has attempts 409.

### 7.9 WP7: Preferences and oral practice

**Goal**: section 4.6. **Depends on**: WP0. **Owns**: files of 4.6, `routes/api/learning.php`, `lang/hu/learning.php`, `tests/specs/api/learning.spec.ts`, `tests/src/api/areas/learning.ts`. **API tests**: preferences `null` for a new user, `PUT` valid then `GET` equal, invalid `level`/`exam_period`/`language`/`weekly_hours` -> 422 on that field, missing field 422, guest 401, two users isolated; oral: empty list, upsert creates, second `PUT` overwrites, unknown topic 404, `scores` key not in the criteria list 422, value 5 or -1 422, `checked` with 30 -> 422, notes 5001 chars 422, attempts endpoint increments and sets `last_practiced_at`, rows isolated per user.

### 7.10 WP8: Progress integration, privacy, retention

**Goal**: section 4.7. **Depends on**: WP0; verification needs WP3 (file submissions). **Owns**: `Services/Progress/{ExerciseAttempts,ExerciseStatuses,LessonStatuses}.php`, `Actions/Progress/{RecordLessonProgress,CompleteTheoryLesson}.php`, `Actions/Catalog/ListTasks.php`, `Actions/Account/{ExportAccountData,DeleteAccount}.php`, `Listeners/{PurgeSubmittedFilesOnAccountDeletion,PurgeOralPracticeOnAccountDeletion}.php`, `Jobs/PruneExpiredFileSubmissions.php`, `Console/Commands/PruneOrphanFiles.php`, `tests/specs/api/progress-privacy.spec.ts`. **Acceptance**: code-only behaviour unchanged (existing specs pass); constant query count in `ExerciseStatuses::for`.
**API tests**: a passed file submission (`pw-tabla-ok.xlsx` plus the manual mark, so 10/10) makes `my_status` `solved` on `GET /tasks/5`, completes lesson 5 in `GET /progress`, and `GET /tasks?status=unsolved` no longer lists task 5; a weak attempt (`pw-tabla-rossz.xlsx`) gives `attempted`; exam-attempt uploads change none of these; lesson 7 (only a `web` exercise) can be completed with `POST /lessons/7/complete`, lesson 5 cannot (409 `LessonHasExercises`); `GET /account/export` contains `preferences`, `oral_practice`, `file_submissions`, `exam_attempts`; after `DELETE /account` (body `{password}`) of a user who has a file submission, an exam attempt, oral practice and preferences, the API shows no trace (login impossible) and, checked with Node `fs` in the test, `backend/storage/app/private/submission-files/u{id}` no longer exists (the path comes from env `TEST_BACKEND_PATH`, default `../backend`); the retention job and `files:prune-orphans` are exercised with `php artisan` from a test helper (`execFile`) against the fixture database only.

### 7.11 WP9: Admin overview (optional, last of the backend packages)

**Goal**: section 4.8. **Depends on**: WP0, and for the rubric/exam numbers WP3/WP6 models only. **Owns**: files of 4.8, `routes/api/admin-overview.php`, `lang/hu/overview.php`, `tests/specs/api/admin-overview.spec.ts`. **API tests**: guest 401, student 403, admin 200 with the exact keys; `users.total` grows after a registration; `unverified` counts it; `recent_actions` lists a `catalog.created` entry by the admin after the test creates a track; at most 10 entries; the 60 s cache is skipped when `APP_ENV=testing` so the numbers are always current in tests.

### 7.12 WP10 and WP11: frontend

**WP10** (6.1). **Owns**: `frontend/src/features/onboarding/**`, `features/oral/**`, `features/exams/**`, `features/filetasks/api.ts`, `features/admin/overview/**` (new `api.ts`), `shared/domain/preferences.ts`, `features/legal/content/**` (marked paragraph), `tests/src/mocks/MockApi.ts`. **Depends on**: endpoint shapes only (WP7 and WP9 for the first and sixth items; the rest are behaviour-preserving). **Acceptance**: with the backend packages merged the onboarding goals and the oral state survive a login on another browser; the exam countdown follows `server_time`; with the routes missing (404) the pages behave exactly as before (the existing "not available yet" branches stay). **Checks**: frontend lint/typecheck/build, `npm run check` in `tests/`, `--project=e2e-mocked`.

**WP11** (6.2). **Owns**: `frontend/src/features/admin/catalog/**`, `features/admin/exams/**`, `shared/ui/**` only if a missing generic component is unavoidable (ask first; the UI rules forbid new card/button/badge styles). **Depends on**: WP1 (exercise fields, attachments), WP3 (rubric update and check), WP6 (exam session and files). **Acceptance**: an admin can create a `sheet_upload` task end to end (type, spec form, source and sample files, rubric items, publish), a `web` task through the JSON tab, and an exam with a source zip, without touching the database. **Checks**: as WP10, plus a manual walkthrough against a local backend (the golden path above).

### 7.13 Shared files, ownership, merge order

| Shared file | Changed by (only) | Notes |
|---|---|---|
| `backend/routes/api.php`, `routes/console.php`, `app/Providers/AppServiceProvider.php`, `app/Enums/AuditAction.php`, `app/Models/{Exercise,User,Submission}.php`, `config/*`, `composer.json/lock`, `.env.example`, `lang/hu/{filetasks_document,filetasks_presentation,exams,learning,overview}.php` (created empty) | WP0 | other packages write the need in their final report; they never edit these |
| `app/Services/Access/ContentAccess.php` | WP0 | WP6 consumes `premiumDenialFor` |
| `app/Http/Resources/TaskResource.php`, `TaskController.php`, `Admin/AdminExerciseResource.php`, `Admin/Catalog/ExerciseController.php`, `ExerciseRequest.php`, `lang/hu/catalog.php` | WP1 | WP3/WP6/WP8 need exercise delete/kind rules: they are implemented in WP1 |
| `Services/SolutionEvaluator.php`, `Judge0Service.php`, `RunCodeRequest.php`, `lang/hu/execution.php`, `tests/src/mocks/judge0/server.ts` | WP2 | |
| `lang/hu/filetasks.php` | WP0 creates and fills the upload errors; WP3 appends | WP4/WP5 use their own lang files |
| `Actions/Account/{ExportAccountData,DeleteAccount}.php`, `Services/Progress/*`, `Actions/Progress/*`, `Actions/Catalog/ListTasks.php` | WP8 | WP3/WP6/WP7 add nothing there |
| `tests/src/api/ApiClient.ts`, `tests/src/api/types.ts`, `tests/src/data/seed.ts`, `ApiTestSeeder.php`, `tests/config/web-servers.ts`, `tests/src/fixtures/*` | WP0 | everyone else adds files under `tests/src/api/areas/`, `tests/src/api/types/`, `tests/specs/api/`, `tests/fixtures/files/<area>/` |
| `docs/api-endpoints.md` | every backend package regenerates it | resolve conflicts by re-running `php artisan docs:endpoints` |
| `frontend/src/features/admin/exams/api.ts` and `RubricBuilder.tsx`, `AdminExam.tsx` | WP11 | WP10 does not touch the admin exam files |
| `tests/src/mocks/MockApi.ts` | WP10 | |

**Merge order**: WP0 -> {WP1, WP2, WP7, WP9} in any order -> WP3 -> {WP4, WP5} -> WP6 -> WP8 -> WP10 and WP11 (frontend packages may merge as soon as the routes they call exist; every new call degrades to the existing "not available yet" states on 404). Rationale: WP6 tests need WP1 (kind in resources), WP2 (editor-part scores) and WP3 (file evaluation); WP8's tests need WP3 and WP6; WP4/WP5 are verified through WP3's endpoint. After each merge every open package rebases and re-runs `npm run test:api`.

**Parallelism summary**: after WP0, nine backend packages and two frontend packages are independent in code; the only cross-package *runtime* dependencies are the three listed above and they affect test verification, not file ownership.


---

## 8. Open decisions (implement the default; change only if the owner says so)

| # | Decision | Options | Default and why |
|---|---|---|---|
| 8.1 | Who may take an exam | (a) premium only; (b) any verified user; (c) premium for editor parts only | **(a)**: exams are the most valuable content and the site sells premium. The list `GET /exams` stays public as a shop window. One method (`ContentAccess::premiumDenialFor`) to flip |
| 8.2 | When does a file task count as solved (progress, `my_status`, lesson completion) | fixed 100 %; ratio; any evaluated upload | **ratio 0.8** of the rubric total (`FILETASKS_PASS_RATIO`), manual points counting only once marked. Full marks are unrealistic for hard tasks, "any upload" makes progress meaningless. Inferred; cheap to change |
| 8.3 | OOXML/ODF parsing | (a) own readers on `ZipArchive` + DOM/`XMLReader`; (b) add `phpoffice/phpspreadsheet` (+ `phpword`) | **(a)**. No new dependency, full control over the exact properties the rubric needs (styles, tab stops, numbering), and PhpWord reads style details poorly. Cost: more code in WP3/WP4. PhpSpreadsheet is an acceptable swap **inside WP3 only** if the spreadsheet reader proves too slow to write (it is behind `SpreadsheetReader`) |
| 8.4 | Programming subtasks | all-or-nothing per subtask, overall `passed` = all subtasks full; or `passed` at a ratio | **all-or-nothing, all full**: deterministic, matches how the guide awards points step by step, and keeps lesson completion simple. Partial points are visible in `subtasks` and in exam scoring regardless |
| 8.5 | SQL | (a) keep Judge0's SQLite, `sql_task` informational; (b) build a MariaDB sandbox | **(a)**. A MariaDB sandbox is new infrastructure and out of scope. The student-facing copy must not promise MySQL-specific features; document the dialect gap in the task text. Per-query-name scoring is not built |
| 8.6 | Output files of programs (`vX.txt`, `tabla.html`) | build now; defer | **defer**. Judge0 returns stdout only; the epilogue approach of ADR 0003 must be proven on a real Judge0 first |
| 8.7 | "Ezt érdemes átnézni" lesson links | heuristic (earlier lessons of the part's module); explicit `rubric_items.review_lesson_id` | **heuristic** (4.5.3). Add the column later if authors want control |
| 8.8 | Manual marks | trust the student; staff queue | **trust the student** (`FRONTEND.md` section 9: "Nothing goes to a staff queue"). Consequence: a student can mark everything `Megvan`. Documented, accepted; the pass ratio and exam percent are practice aids, not certificates |
| 8.9 | Oral content and export of files | (a) oral topics static in the frontend, export lists upload metadata only; (b) topics in DB, export includes file bytes | **(a)**. The tételsor is a placeholder (`FRONTEND.md` section 16); the JSON export cannot hold binaries and students keep their own files |
| 8.10 | Virus scanning | off; ClamAV via command hook | **off by default, hook available** (`FILETASKS_SCAN_COMMAND`). Files are never executed or served inline, macro formats are blocked |
| 8.11 | Browser-only kinds (`web`, `sheet_browser`, `doc_browser`) and progress | not counted; add a self-report endpoint | **not counted**. No frontend caller exists. A lesson with only such exercises completes via the existing "Kész" button |
| 8.12 | Previews and thumbnails | LibreOffice headless thumbnails; none | **none in v1**; `preview_url` is set only for png/svg uploads, `sample_url` from the `sample_image` attachment. The frontend already handles `null`. LibreOffice rendering is a later package (FRONTEND.md calls it sandboxed work) |
| 8.13 | Retention of uploaded files | indefinite; 365 days; 90 days | **365 days** and the newest 10 per exercise (`FILETASKS_RETENTION_DAYS`); privacy text in WP10 must say so |
| 8.14 | Exam dates and periods | server table; frontend env | **frontend env** (`examDate`) and the `config/learning.php` `exam_periods` list (3 entries today); no lookup table until the Oktatási Hivatal schedule is verified |
| 8.15 | Editor draft autosave on the server (exam) | add; browser only | **browser only** (`useCodeDraft`). The exam persists uploads and submissions, not drafts |
| 8.16 | Evaluation sync or queued | queue + polling; synchronous | **synchronous** because the UI does not poll (6.1 item 5 prepares the switch). Protected by a concurrency gate (4.3.3 step 3) |
| 8.17 | Grade on the exam result | show; do not show | **do not show** (thresholds unverified, `FRONTEND.md` section 10) |
| 8.18 | Rubric expressiveness | string grammar only (current form); structured `params` | **string grammar (4.4.3) now, `params` accepted but optional**, so importers can be added without a migration |
| 8.19 | Hosting official papers | host the OH PDFs; link and host only derived tasks | **link**, and the `source_zip` holds derived/own material that the owner is entitled to host (`FRONTEND.md` section 16). The existing `ExamList` fallback already links the OH PDFs |
| 8.20 | Exercises used only inside exams | must be published; may be unpublished for file parts | **file parts may reference unpublished exercises** (they are reached through the exam); editor parts must be published because the editor page is `/feladatok/{id}` and `Exercise::published()` hides unpublished ones (4.5.4) |
| 8.21 | A running exam attempt and mode | allow a second attempt in parallel; one open attempt per exam | **one open attempt per user and exam**, enforced by `in_progress_marker` |

---

## 9. Out of scope and risks

### 9.1 Out of scope (do not build in this plan)

- `/progress` readiness per exam part, practice calendar, weak topics (the page does not read them, 2.4).
- MariaDB sandbox; output-file checks for programs; per-query SQL scoring; LibreOffice thumbnails; Java/C++ execution.
- Hints, reference solutions, custom run input, editor preferences, audit-log viewer, lesson media upload, large metrics dashboard (commits `f2cec23`, `b718c06`, `234738d`, `38d8271`, `761e580`, `122e6a4`): no frontend exists for them.
- Grades and the official grade thresholds; teacher/classroom features; certificates; in-app notifications; dark theme.
- Oral exam content on the server (topics, outlines, tasks); an exam date table; an `emelt` document-or-spreadsheet choice in preferences.
- Admin UI buttons for user export/delete (backend exists), listed in 6.2 item 5 as optional.
- Paying for or replacing Judge0.

### 9.2 Risks and mitigations

1. **Judge0 `additional_files` unproven** on the installed version (ADR 0003 consequences). Mitigation: WP2 ends with a manual check on the real Judge0 (Python and C# opening `adatok.txt`); if it fails, ship subtasks and comparison modes without input files and keep exercises on stdin.
2. **`ext-zip` missing on a developer machine** (this one) or in a future server image. Mitigation: `composer.json` platform requirement, `app:check-config`, runbook.
3. **OOXML/ODF fidelity.** Excel and LibreOffice write different XML for the same thing (cached formula values, number-format ids vs codes, automatic styles in ODF, shared strings, rich text, Hungarian vs English function names in ODS `of:=` formulas). Mitigation: the fixtures cover xlsx and ods from LibreOffice; WP3/WP4 must also test one file saved by Excel (owner supplies it) before launch; unsupported or unreadable situations fail visibly (`bad` item or `failed` status), never silently pass. Purely visual items stay manual by design.
4. **Rubric authoring effort.** Every official task needs 20 to 40 items typed through a form; a JSON import for rubrics would help (the `params` column leaves room) but is not planned.
5. **Fairness of automatic checks.** All-or-nothing items can be stricter than a human marker; the `found` text and `hint` are the mitigation, and `rubric-check` lets authors test edge cases. The official "version with most points counts" rule is implemented by taking the best attempt for exams (editor parts) and the single uploaded file (file parts).
6. **Small server under upload load**: synchronous evaluation holds a PHP-FPM worker up to 25 s. Mitigation: the four-slot gate, per-user limiter (6 per minute, 150 per day), 8 MB XML cap, streaming sheet parsing.
7. **Signed URLs are bearer capabilities** (60 minutes for tasks, 6 hours for exams) and `<img>`/`<a download>` require them. Same model as lesson videos.
8. **Clock skew** between client and server on the exam timer; mitigated by `server_time` (6.1 item 3) and server-authoritative deadlines with a 15 s grace.
9. **MySQL vs SQLite** differences (3.5): the one-open-attempt rule and unique-with-NULL behaviours were reasoned, not run on MySQL here; CI's MySQL job is the check.
10. **Admin UX for JSON specs** (6.2): acceptable for a small team, error-prone for non-technical authors; a visual editor is a follow-up.
11. **Legal**: storing student documents is new personal-data processing (privacy text, retention, export limits); the owner must approve the wording (6.1 item 7).
12. **Exam premium rule vs free lessons**: an editor part whose exercise lives in a free lesson is reachable without premium through `/feladatok/{id}`; authors should put exam exercises in premium lessons or accept it (4.5.1).
13. **Frontend shapes that are odd but kept**: `AddPart` returns the whole `AdminExam`; `ExamPartDetail.software` is a string while `FileTaskInfo.software` is an array; `ExamSummary.attempt.completed_parts` holds order numbers; preferences are camelCase in the frontend and snake_case on the wire.

---

## 10. What was verified

**Read and compared (code is the source of truth):**
- `CLAUDE.md` and `FRONTEND.md` completely (sections 7 to 13 closely).
- Every `frontend/src/features/**/api.ts` (14 files), `shared/api/{client,errors,reportError}.ts`, `types/index.ts` completely; the pages and components that consume the new APIs: `exams/*`, `filetasks/*`, `admin/exams/*`, `AdminExercise.tsx` (structure, tabs), `AdminOverview.tsx`, `TaskSolve.tsx` (workspace selection, run/submit), `ResultPanel.tsx` (subtasks), `SqlSchemaPanel.tsx`, `Onboarding.tsx`, `OralTopic.tsx`, `Oral.tsx`, `ProgressDashboard.tsx`, `ExamRunner.tsx` (timer, auto-submit, rail), `Dropzone.tsx`, `RubricItem.tsx`, `App.tsx` routes; every `localStorage`/`sessionStorage` use (grep).
- Backend: `routes/api.php`, `routes/console.php`, `docs/api-endpoints.md`, `bootstrap/app.php`, `AppServiceProvider`, `ContentAccess`, `Exercise`, `Submission`, `User` models, `TaskController`, `TaskResource`, `TaskSummaryResource`, `ListTasks`, `ExerciseStatuses`, `LessonStatuses`, `RecordLessonProgress`, `CompleteTheoryLesson`, `SubmitSolution`, `RunSolution`, `SolutionEvaluator`, `HiddenResultRedactor`, `Verdict`, `EvaluationResource`, `RunCodeRequest`, admin `ExerciseController`/`ExerciseRequest`/`AdminExerciseResource`/`ManageCatalogItem`/`ManageTestCase`/`TestCaseController`, `DomainException`, `PremiumContentLocked`, `CatalogItemInUse`, `AuditAction`, `RecordAuditEvent`, `DeleteAccount`, `ExportAccountData`, `PurgeLearningProgressOnAccountDeletion`, `AccountDeleted`, `LessonVideoController`, `IssueLessonVideoUrl`, `SubmissionHistoryController`, `SubmissionPolicy`, `UserPolicy`, `config/{filesystems,judge0,catalog}.php`, `.env.example`, `phpstan.neon`, `composer.json`, the catalog restructure migration and the other migration names, `ApiTestSeeder`, `PrepareApiTestFixtures`, the key lists of 20 Resources and 12 Requests against the frontend types (names of keys, not every type).
- Tests: `tests/README.md`, `ApiClient.ts`, `MockApi.ts`, `seed.ts`, `config/web-servers.ts`, Judge0 mock header, `catalog.spec.ts`, `admin-users.spec.ts` (structure).
- Deploy: `deploy/nginx/infotanar.conf`, backup docs, CI PHP extension lists.
- The dropped commits `122e6a4`, `38d8271`, `761e580`, `00c8e59` (and `b718c06`, `f2cec23`, `037e9f5`, `234738d`) by `git show --stat` and, for `00c8e59`, ADR 0003. SHA correction in 2.5.

**Not verified / could not be verified here:**
- I did **not** run PHP, Composer, `php artisan route:list`, Larastan, Pint or any Playwright project (task constraint: nothing that starts servers). Route and Resource comparisons are by reading; `docs/api-endpoints.md` was compared with `routes/api.php` by eye (consistent), not by `docs:endpoints --check`.
- "Exists and matches" in section 2 means the key names and request rules agree with the frontend types and calls; I did not compare every nullability and numeric type of every Resource (billing, invoices, users were checked by key list).
- The MySQL behaviour claims in 3.5 and the unique-marker approach for one open attempt are reasoned, not executed; the nginx claim that `client_max_body_size` must sit in the `index.php` location (internal redirect) is standard nginx behaviour but untested against this config.
- The feasibility and effort of the OOXML/ODF readers (4.4) are estimated, not prototyped; no real exam file was opened. Official point conversions (`FRONTEND.md` section 9, section 13) were taken from `FRONTEND.md` as written there (it says the exam facts are partly keyword-counted).
- Judge0 `additional_files` support on the installed version; hidden behaviours of the real Judge0 (ADR 0003 says the same).
- The three Judge0-related claims about the dropped commits (`00c8e59`, `037e9f5`) describe their commit messages and ADR, not a line-by-line code review; implementers should `git show <sha>:<path>` the files they reuse.
- The `CLAUDE.md` text shown to me while planning said `docs:endpoints` could not be found; the repository contains `GenerateEndpointDocs.php` and CI runs it, so this plan treats the command as existing.
- Frontend behaviour was derived by reading, not by running the app.

---

## 11. The foundation as built (read this before your package; it overrides sections 3 to 7 where they differ)

WP0 is merged on `fullstack/backend-platform`. Where it had to differ from the plan, the code is right and the plan text above is not. Read the classes themselves before relying on a signature.

**Already built, although the plan gave it to another package**

- `Http/Controllers/Api/V1/Catalog/AttachmentDownloadController` and the route `api.attachments.download` in `routes/api/typed-tasks.php` exist, because `AttachmentUrls` cannot sign without the route. WP1 extends them and does not create them.
- `Exceptions/Catalog/AttachmentLimitReached` and `Exceptions/Catalog/InvalidAttachment` (422 on `name`, `test_case_id` or `role`) exist, thrown by `ManageAttachment`. All attachment messages are in `lang/hu/filetasks.php`.
- The `ExamResultRecalculator` binding in `AppServiceProvider` switches to the real implementation by itself as soon as the class `App\Actions\Exams\RecomputeExamResult` exists and implements the interface. WP6 must use exactly that class name and does not touch the provider.

**Signatures and names to code against**

- `UploadedFileInspector::inspect(UploadedFile, list<string> $allowed, ?string $category = null, ?int $maxBytes = null): InspectedUpload`, with static helpers `safeName`, `extensionOf`, `categoryOf`, `maxBytesFor`, `maxKilobytesFor`.
- `App\Services\Files\FileDisk` enum (`ExerciseFiles`, `SubmissionFiles`), used by `StoredFile` and `PrivateFileStore`.
- `PrivateFileStore`: `put`, `bytes`, `stream`, `delete`, and also `putContents`, `exists`, `withLocalPath`, `deletePath`, `deleteDirectory`, `response` (the shared download headers).
- `ZipSafety`: `open`, `assertSafe`, `read` (capped; `null` when the entry is missing; throws `UnreadableFile`). Ratio checks skip entries under 100 KB, because tiny repetitive XML exceeds 200:1 harmlessly.
- `XmlSafety` is static: `load`, `reader`, `loadHtml`, `assertNoDoctype`. The other services are injected instances.
- Model helpers: `Attachment::storedFile()`, `FileSubmission::storedFile()`, `ExamPart::order()`, `RubricItem::isManual()`; `ExerciseKind::isGradable()`, `uploadExtensions()`, `gradableValues()`; `FileSubmissionStatus::apiValue()`.
- `CheckRegistry` allows several handlers per check type (`handlersFor`, `handlerFor($type, $file)`), since `image` spans documents and presentations. `RubricCheckCatalog::validate(RubricCheckType, string, string): ?string` passes when any handler accepts.
- Reader and handler class names are fixed in `config/filetasks.php`, which only the integrator edits. Readers: `Spreadsheet\SpreadsheetReader`, `Document\DocumentReader`, `Presentation\PresentationReader`, `Vector\SvgReader`, `Web\HtmlReader`, `Image\PngReader`. Checks live in `<Family>\Checks\` (WP4's in `Document\Checks\`). WP5's slots: `Presentation\Checks\{SlideCheck,AnimationCheck,ShapeCheck,ImageCheck}`, `Vector\Checks\{ShapeCheck,ImageCheck}`, `Web\Checks\WebCheck`, `Image\Checks\ImageCheck`. Check the config for the exact list before naming a class.
- Signed attachment URLs are absolute (request host, like lesson videos), not the relative path shown in 4.1.4.
- `filetasks.extensions` also contains `.jpg`, `.jpeg`, `.webp` and `.csv`.

**Attachment rules**

- `sample_image`, `sample_solution` and `source_zip` are one per owner: a new upload replaces the old one whatever its name. A given `name` must keep the uploaded file's extension. `input` is only for code and sql kinds, `sample_solution` only for upload kinds. Replacing keeps the row id; old files are deleted after commit.
- Deleting a test case cascades its `input` attachment rows but leaves the files on disk. WP1 fixes this where exercises and test cases are deleted, or reports it.

**Data and configuration**

- `oral_practices.checked` and `scores` have no database default (MySQL rejects JSON literals); the model supplies them. An empty `scores` reads back as `[]`, so the resource must cast it to an object.
- Rate limits are config-driven (`FILETASKS_RATE_PER_MINUTE`, `FILETASKS_RATE_PER_DAY`, `FILETASKS_ADMIN_UPLOAD_PER_MINUTE`, `EXAMS_WRITE_PER_MINUTE`). The test backend sets all four very high, and sets `FILETASKS_MAX_DOCUMENT_MB=1`: the oversize test uploads a file over 1 MB and under 2 MB (PHP's default upload cap in `php -S`).
- `test:prepare-api-fixtures` empties `storage/app/private/exercise-files` and `submission-files`. The test backend shares those directories with local development.

**Fixtures and test helpers**

- Fixture files are generated by `tests/fixtures/files/generate.ts` (`npm run fixtures`, byte-deterministic). Add new fixtures there. Beyond the plan it also writes `pw-ures-zip.xlsx`, `pw-makro-rejtett.xlsx`, `pw-minta.png`, `pw-adatok.txt`, `pw-forrasok.zip`. They were parsed with PHP only, never opened in Excel, LibreOffice or Word.
- Seed ids (all in `tests/src/data/seed.ts`): rubric items 1 to 4 on exercise 5 and item 5 on exercise 6 (auto items have hints); attachments 1 (sample image), 2 (`adatok.txt`), 3 (exam zip); exam parts 1 and 2 on exam 1, part 3 on exam 2. `pw-tabla-rossz.xlsx` keeps the number format, so its expected score is 2.
- `adminAccount()` shares one admin token across spec files. Admin login is limited to 5 per minute, so a spec must never log the admin in itself. Also available: `verifiedStudent`, `premiumStudent`, `fixtureFile`, `uploadOf`, and `zipArchive` in `tests/src/support/zip.ts`.
- `tests/src/api/types.ts` re-exports every `types/*.ts`, so type names must be unique across those files.
