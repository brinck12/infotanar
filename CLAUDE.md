# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

InfoTanár.hu: a Hungarian *digitális kultúra* (school-leaving exam) prep platform. Students work through a catalog of video lessons and coding exercises (Python, C#, SQL), run solutions in a browser editor, and get automatic grading. Premium content is behind a monthly subscription (Barion payments, Számlázz.hu invoices).

Monorepo with three independent packages, each with its own dependencies:

| Dir | What | Stack |
|---|---|---|
| `backend/` | JSON API under `/api/v1` | Laravel 12, PHP 8.3 (composer allows ^8.2), Sanctum bearer tokens |
| `frontend/` | SPA | React 19, TypeScript 6, Vite 8, Tailwind 4, TanStack Query, Axios, Monaco |
| `tests/` | All automated tests | Playwright + TypeScript |

Code comments, UI text, docs and issue discussion are in **Hungarian**. Match that. User-facing backend strings live in `backend/lang/hu/*.php` and go through `__()`; do not hardcode messages in PHP.

**`README.md` and `PLAN.md` are stale.** They describe the original prototype (tasks/topics, `src/pages`, `src/components`, no auth, no billing). The catalog is now Track → Module → Lesson → Exercise → TestCase. README is still accurate for the deploy pipeline, server prerequisites and the Judge0 SSH tunnel; trust the code for everything else.

## Commands

### Backend (`cd backend`)

```bash
composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --seed        # SQLite by default; CatalogSeeder loads the catalog
php artisan serve                 # http://127.0.0.1:8000

composer lint                     # pint --test (CI gate)
composer format                   # pint, fixes style
composer analyse                  # larastan at level max (CI gate)
composer quality                  # lint + analyse
```

There is **no PHPUnit/Pest suite** in `backend/` (no `tests/` dir, no `test` script). Backend behaviour is covered by the Playwright API project in `tests/`. Both `composer lint` and `composer analyse` must pass: larastan runs at `max`, so new code needs full type annotations (`@param`/`@return` generics, `@throws`).

Code execution needs Judge0, which is only reachable on the server's localhost. For real runs locally, open a tunnel first and leave it open: `ssh -N -L 2358:localhost:2358 <user>@<server>`, and set `JUDGE0_AUTH_TOKEN` in `.env`. Billing/invoicing need `BARION_*` and `SZAMLAZZ_*` keys; both have `*_BASE_URL` overrides for pointing at a local stub.

Custom artisan commands: `db:seed-once` (deploy-only: seeds iff there are zero exercises), `test:prepare-api-fixtures` (fresh `database/testing.sqlite` + `ApiTestSeeder`; used by the Playwright backend server), `user:role {email} {student|admin}` (bootstrap the first admin; admins can otherwise change roles through the API), `docs:endpoints` (regenerates `docs/api-endpoints.md`; `--check` only verifies it), `app:check-config` (is the configuration fit for production), `db:snapshot-before-migrate` (deploy-only: backs up the database when a migration is pending).

Background work needs two long-running processes in production (units in `deploy/systemd/`): `queue:work` and `schedule:work`. Locally, `composer dev` starts server, queue listener, pail and `backend/`'s own Vite (unused Laravel-skeleton asset pipeline; the real frontend is `frontend/`), so you may prefer running `php artisan serve` and `php artisan queue:listen` yourself.

### Frontend (`cd frontend`)

```bash
npm install && cp .env.example .env   # VITE_API_URL=http://127.0.0.1:8000/api/v1
npm run dev                           # http://localhost:5173
npm run lint                          # oxlint --deny-warnings (CI gate)
npm run typecheck                     # tsc -b --noEmit (CI gate)
npm run build                         # tsc -b && vite build (CI gate)
```

Lint is strict: no `any`, no non-null assertions (`!`), no `console.log` (only `error`/`warn`), `import/no-cycle`, hooks exhaustive-deps, `jsx-a11y`. `tsconfig.app.json` enables `noUncheckedIndexedAccess`, `verbatimModuleSyntax` (use `import type`) and `erasableSyntaxOnly` (no enums, no parameter properties).

### Tests (`cd tests`)

```bash
npm ci && npx playwright install chromium
npm run check          # tsc + eslint over the test code (CI gate)
npm run test:e2e       # project e2e-mocked: builds frontend, mocks the API; no PHP needed
npm run test:api       # projects api + api-rate-limit: real Laravel on SQLite + Judge0 mock; needs PHP and `composer install`
npm run test:smoke     # only @smoke      (also @regression, @a11y)
```

Run a single test: `npx playwright test --project=e2e-mocked specs/e2e/<file>.spec.ts -g "<title substring>"` (pick `--project=api` for API specs). **Always pass `--project`**: `tests/config/web-servers.ts` parses `process.argv` to start only the servers that project needs, and with no `--project` it starts everything.

Conventions enforced by ESLint: import `test`/`expect` only from `src/fixtures`; page objects expose locators and steps but no assertions; no `waitForTimeout`. See `tests/README.md` for the full framework guide.

## Architecture

### Backend: layering

Request flow is `routes/api.php` → thin controller (`Http/Controllers/Api/V1/<Area>`) → FormRequest validation → **Action** → models / **Services** → API Resource.

- **Actions** (`app/Actions/<Area>/`): one use case per class, `final readonly`, a single `handle()` method, constructor-injected. Anything that mutates state or spans models belongs here, wrapped in `DB::transaction` when it must be atomic (see `Admin/Users/ChangeUserRole` for the lock-then-recheck pattern used to protect "last admin"). Controllers should not contain business logic.
- **Services** (`app/Services/`): reusable domain machinery with no HTTP awareness: `Judge0Service`, `SolutionEvaluator`, `Constraints/*`, `Access/ContentAccess`, `Billing/Barion/*`, `Billing/Szamlazz/*`, `Progress/*`.
- **Domain errors**: throw a subclass of `App\Exceptions\DomainException` (abstract `status()`, optional `errors()`); it renders itself as `{message, errors?}` JSON and is excluded from error reporting. Per-area subclasses live in `app/Exceptions/<Area>/`. `bootstrap/app.php` also maps auth/403/404/429/invalid-signature to JSON for any `api/*` path, and maps `Judge0Exception` to a 503 in the run-response shape (`status: "error"`).
- **Audit trail**: security- and money-relevant actions call `RecordAuditEvent` with an `AuditAction` enum case. Add a case there rather than logging ad hoc.
- **Authorization**: `admin` route middleware (`EnsureUserIsAdmin`, prioritised *before* route-model binding so non-admins cannot probe which IDs exist) plus per-user `UserPolicy` abilities applied with `can:<ability>,user`. Model morph aliases are enforced in `AppServiceProvider` (`Relation::enforceMorphMap`): register new polymorphic subjects there. Models run in strict mode outside production (lazy loading, silent attribute discards and missing attributes throw), so N+1s fail loudly in dev/test.
- **Rate limiting**: named limiters (`login`, `sensitive`, `checkout`, `admin-user-mail`, …) are defined in `AppServiceProvider::configureRateLimiting`; code execution uses the `execution` limiter, whose per-role limits come from the `JUDGE0_RATE_*` settings.
- **Endpoint list**: `docs/api-endpoints.md` has every route with access level and limiter. It is generated: run `php artisan docs:endpoints` after any route change, because CI fails when the file is out of date.
- **Migrations**: never edit a migration that is already on `main`; add a new one.

### Code execution and grading (the core domain)

The browser never talks to Judge0. `POST /run` (visible test cases only, nothing stored) and `POST /submissions` (all test cases, stored) go through `Actions/Execution/{RunSolution,SubmitSolution}` → `SolutionEvaluator` → `Judge0Service`.

- `SolutionEvaluator` does the comparison itself (normalised whitespace and trailing newlines), **not** Judge0's `expected_output`, and returns a per-test `Verdict` plus an overall one. Judge0 language IDs are resolved at runtime from Judge0's `/languages` (cached; matched via `config/judge0.php` `languages.*.match`), with `fallback_id` only if that call fails. Do not hardcode IDs.
- Per-exercise **code constraints** (`Services/Constraints`, stored on `exercises.constraints`, edited in the admin UI) are checked statically *before* anything reaches Judge0, using a Python AST helper and a C# analyzer. A violation yields `Verdict::ConstraintViolation` without running the code.
- **SQL exercises** run in Judge0's sqlite sandbox: the test case `stdin` is the dataset script, and `SqlResultComparator` compares CSV output (row order only matters when `sql_order_sensitive`).
- **Hidden test cases must never leak.** `HiddenResultRedactor` is an allow-list: hidden results expose only pass/fail and verdict, with no stdout, stderr, compile output, time or expected value. When adding a field to a result, it stays hidden by default; do not add it to `ALLOWED` without thinking about what it reveals.
- A whole evaluation has a wall-clock budget (`judge0.evaluation_deadline`, 45 s) that must stay below the frontend's 60 s Axios timeout. Judge0 outages stop the loop and return `system_error`, not a 500.

### Content access (freemium)

`Services/Access/ContentAccess` is the single rule for "may this user see this lesson": free lessons for everyone; otherwise login + verified email + premium (active subscription or an admin-issued `AccessGrant`), admins always. Lesson, video, run and submit endpoints all ask it; do not re-implement the check. Lesson videos are served from a private disk via short-lived signed URLs (`lessons.video.stream` / `.captions` are `signed:relative`).

### Billing

Decisions are recorded in `docs/adr/` (0001 Barion, 0002 Számlázz.hu); read them before touching billing.

- Checkout creates a `Payment` and redirects to Barion's hosted page; Barion calls back to `POST /webhooks/barion`, and `SyncPendingPayments` (scheduled) reconciles lost callbacks. `SyncPaymentState` is the shared transition logic.
- Renewals are token charges driven by scheduled jobs (`routes/console.php`): `ProcessDueSubscriptions` (hourly), `ExpireGracePeriods` (hourly; failed renewal → `past_due` → grace period of `billing.grace_period_days` → closed), `RetryPendingInvoices`.
- Every successful charge yields exactly one Számlázz.hu invoice (`IssueInvoice` job, `Actions/Billing/Invoicing/*`); failed invoices are visible and retryable in the admin UI.
- Account deletion is event-driven (`AccountDeleted` → listeners cancel the subscription and purge access grants and progress); users are soft-deleted.

### Frontend

Feature-sliced under `frontend/src/`:

- `app/`: `Providers` (QueryClient, auth, toast), `routes.tsx` (all pages are lazy chunks via the `page()` helper; add new routes there), `App.tsx` (route table grouped by shell), `shells/` (`SiteShell`, `WorkspaceShell`, `AuthShell`, `AccountShell`, `AdminShell` as layout routes with `<Outlet />`; the exam runner renders its own header), `ErrorBoundary`.
- `features/<area>/{api.ts,components,pages}`: `admin` (overview, catalog, exams, users, invoices), `auth`, `account`, `billing`, `catalog`, `learning` (path, track, lesson), `progress`, `workspace` (the editor + results page), `filetasks`, `webtasks`, `practice` (in-browser sheet and document), `exams`, `oral`, `onboarding`, `marketing`, `legal`, `system` (error pages), `home`. Each feature owns its `api.ts` (typed Axios wrappers) and keeps its server state in TanStack Query.
- `shared/`: `api/client.ts` (single Axios instance; attaches the Bearer token from `tokenStore`; 60 s timeout), `api/errors.ts`, `domain/` (labels, exam facts, preferences), generic `ui/` and `hooks/`.
- Pages in the workspace and admin shells hand their breadcrumb to the shell with `useCrumbs` (`shared/ui/shell.ts`).
- **Not every page has a backend yet.** `exams`, `filetasks`, the rubric builder and exam editor in `admin/exams`, and the `kind`/`file_task`/`web_task`/`sql_task`/`sheet_practice`/`doc_practice` fields on a task follow the *proposed* contract in `FRONTEND.md` section 11. Those pages treat a 404 as "not available yet". Onboarding preferences and oral-exam practice live in `localStorage` until the server stores them.

Responses come wrapped as `{ data: … }` (`Envelope<T>`). Keep TypeScript types in sync with backend API Resources by hand; there is no codegen. Features should not import from each other's internals; share via `shared/` (lint forbids import cycles).

### Tests and CI

`tests/` has one Playwright config with three projects. `e2e-mocked` serves the *built* frontend and intercepts every API call with `mockApi` (no backend). `api` and `api-rate-limit` hit a real Laravel (`php -S`, SQLite fixture DB, `MAIL_MAILER=outbox` so tests read mail links from `backend/storage/framework/outbox`, Judge0 replaced by `src/mocks/judge0`). `api-rate-limit` runs after `api` because it exhausts the shared quota. The seeded data the API tests assume is described in `tests/src/data/seed.ts`, sourced from `backend/database/seeders/ApiTestSeeder.php`: change one, change the other.

CI (`.github/workflows/ci.yml`) runs on every push: frontend lint/typecheck/build, backend `composer lint` + `composer analyse`, test-code `check`, sharded E2E, API tests. Deploy (`deploy.yml`) runs only after CI succeeds on `main`, over SSH/rsync; never hand-copy code or run migrations on the server. The server `.env` is hand-managed and never overwritten by deploy.

## UI work

`FRONTEND.md` is the frontend design reference: tokens, components, every page, task workspaces, the file-checking model, and the new backend endpoints the design needs. `frontend/src` implements that light "kockás füzet" UI (its opening note about a dark prototype is out of date). The tokens live in `frontend/src/index.css` (`@theme static`; the default Tailwind palette, type scale, shadows and breakpoints are wiped, so only the named tokens exist, e.g. `text-15`, `bg-sheet`, `max-w-page`, `md:` = 760 px). Before touching UI, read its sections 4–6 and follow these rules: use only `src/shared/ui` components; colours, spacing and radii only from the tokens (no arbitrary `[...]` values); one green accent, red only for errors; no new card/button/badge styles without approval; the editor is dark and everything else light; 44 px controls with visible focus; Hungarian copy that says what happened and what to do. The design mock-up is at https://claude.ai/artifact/MbuQsDEJQXunrn5c18LWPX.

## Workflow

Pull requests are disabled in this repository: finished work goes straight to `main`. For anything larger than a small fix, work on a branch named `<backend|frontend|fullstack>/<issue-number>-<slug>` (e.g. `fullstack/162-admin-user-actions`), then merge it into `main` with a merge commit and push. A push to `main` runs CI and, when CI passes, deploys to production, so run the CI gates locally first (the lint, analyse, typecheck, build and test commands above).
