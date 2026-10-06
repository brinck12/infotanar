# Backlog 2026-10: what comes after the first 123

Written on 2026-10-01, after PRs #95–#123 were merged and `main` (`d9a23e9`) contained every issue from Epics 1–5 except #64 (manual server provisioning).

This document records how the next backlog was produced, what the codebase scan found, and the 68 issues that came out of it (#124–#191). The issues themselves are the source of truth for scope; this file explains the reasoning and the order.

## How the scan was done

1. Read `PLAN.md`, `README.md`, both ADRs, the CI and deploy workflows, the systemd units and `.env.example`.
2. Read `routes/api.php`, `routes/console.php`, `bootstrap/app.php` and every config file the app owns (`billing`, `judge0`, `catalog`, `constraints`, `sanctum`, `filesystems`).
3. Read the domain core: all models, the execution path (`RunCodeRequest` → `RunSolution`/`SubmitSolution` → `SolutionEvaluator` → `Judge0Service`), access rules (`ContentAccess`), the billing actions and jobs, invoicing XML, account export/deletion, auth actions.
4. Read the frontend shell (`App.tsx`, `routes.tsx`), the API client and token store, and the main pages of each feature folder.
5. Compared the two sides: which endpoints have no UI, which UI fields have no reader, which data is stored and never shown.
6. Searched for things a paying product needs and checked whether any trace exists (TLS, legal pages, refunds, backups, error tracking, pruning, CORS config, sitemap, Barion Pixel).
7. Listed the existing Playwright specs to see what is covered.

Every claim in an issue's Context section was checked against the code at `d9a23e9`. Where an issue depends on a third party's rules (Barion approval checklist, Számlázz.hu date validation, consumer-law wording), the issue says so and makes confirming it the first step.

## What the scan found

### Things that are wrong today

| Finding | Evidence | Issue |
|---|---|---|
| A shipped artisan command can wipe the production database | `PrepareApiTestFixtures` runs `migrate:fresh --force` with no environment check | #124 |
| Invoice dates use UTC and back-date the issue date on late issuing | `InvoiceXml::issue()` uses `$paidAt->toDateString()` for all three dates; app timezone is UTC | #125 |
| The documented server setup is HTTP only | README nginx block listens on 80; deploy smoke check uses `http://` | #128 |
| Expired sessions are not handled in the UI | `client.ts` has no response interceptor; `AuthProvider` checks once | #136 |
| The header overflows on phones | single flex row in `App.tsx` / `AccountNav.tsx` | #141 |
| Rate limit punishes classrooms | `throttle:10,1` keys on IP for `/run` and `/submissions` | #148 |
| One submission can hold a PHP-FPM worker for 45 s | sequential `wait=true` Judge0 calls inside the request | #149 |
| The editor is downloaded from a third-party CDN at runtime | `@monaco-editor/react` default loader; tests intercept it | #150 |
| Existing subscribers silently follow env price changes | `ChargeRenewal` charges `config('billing.plan.price_huf')`; no price on `subscriptions` | #170 |

### Things that are built on one side only

| What exists | What is missing | Issue |
|---|---|---|
| `GET /account/export`, `DELETE /account` | any account page | #134 |
| `lessons.content` authored in the admin editor | any endpoint or page that shows it to students | #143 |
| Track → Module → Lesson structure, `GET /tracks` | a student-facing way to browse it (only the flat list) | #142 |
| Every submission stored with source and results | any way to see them again | #147 |
| `audit_logs` written for 12 actions | any reader | #161 |
| `submissions.status` values `pending`, `running` | any code that uses them | #149 |
| `staging.env` for the test suite | a staging environment | #181 |
| Video and caption paths on lessons | a way to upload the files | #158 |

### Things a paid product needs that have no trace in the repo

Legal pages and consent records (#132, #133), lifecycle e-mails for billing (#137), retries of failed renewals (#138), Barion logo/Pixel and cookie consent (#139), refunds (#163), backups (#129), readiness checks (#130), error tracking (#131), MySQL in CI (#126), dependency auditing (#179), data retention (#184), rollback-capable deploys (#180).

### Documentation that no longer matches the code

`README.md` still describes an auth-less prototype with six endpoints; `PLAN.md` forbids things the product now has. Covered by #140.

## The backlog

Issue numbers are the working order. They were created in the sequence I intend to implement them, following the existing rule of one branch and one PR per issue, in number order.

Priorities: **P0** launch blocker, **P1** core product gap, **P2** valuable but not urgent.

### Epic 6: Launch Readiness & Compliance (16)

Everything that must be true before real customers pay.

| # | Issue | Priority | Scope | Kind |
|---|---|---|---|---|
| #124 | Refuse to run `test:prepare-api-fixtures` outside local/testing | P0 | backend | bug |
| #125 | Invoice dates are computed in UTC and back-dated when an invoice is issued late | P0 | backend | bug |
| #127 | Production configuration hardening (CORS, log rotation, token pruning, sane .env defaults) | P0 | backend | task |
| #128 | Serve the site over HTTPS: reference nginx config, security headers, HTTPS smoke check | P0 | backend | task |
| #129 | Automated database and storage backups with a documented restore | P0 | backend | task |
| #130 | Add a readiness endpoint and scheduler/queue heartbeats | P1 | backend | feature |
| #131 | Error tracking and alerting for backend, queue and frontend | P1 | backend + frontend | feature |
| #132 | Add site footer with ÁSZF, Adatkezelési tájékoztató and Impresszum pages | P0 | frontend | feature |
| #133 | Record terms acceptance at registration and the withdrawal-right acknowledgement at checkout | P0 | backend + frontend | feature |
| #134 | Build the account settings page with GDPR data export and account deletion | P0 | frontend | feature |
| #135 | Let users change their name, password and e-mail address | P1 | backend + frontend | feature |
| #136 | Handle expired or revoked sessions globally in the frontend | P1 | frontend | bug |
| #137 | Send transactional e-mails for the subscription lifecycle | P0 | backend | feature |
| #138 | Retry failed renewal charges during the grace period | P1 | backend | feature |
| #139 | Barion shop requirements: card-acceptance logo, Barion Pixel and cookie consent | P0 | frontend + backend | feature |
| #140 | Rewrite README and add a go-live runbook | P1 | backend + frontend | task |

### Epic 7: Learning Experience v2 (21)

From a list of exercises to a course, with faster and fairer code execution.

| # | Issue | Priority | Scope | Kind |
|---|---|---|---|---|
| #141 | Responsive site header with a mobile menu | P1 | frontend | bug |
| #142 | Curriculum browsing: tracks, modules and lessons as the main way into the content | P1 | backend + frontend | feature |
| #143 | Deliver lesson content to students: lesson page with theory, video and exercises | P1 | backend + frontend | feature |
| #144 | Allow completing lessons that have no exercises | P2 | backend + frontend | feature |
| #145 | Previous/next navigation and a "next exercise" step after an accepted submission | P1 | frontend + backend | feature |
| #146 | Show solved and attempted state on exercise lists, with an "unsolved only" filter | P1 | backend + frontend | feature |
| #147 | Submission history: list my submissions per exercise and reload an earlier solution | P1 | backend + frontend | feature |
| #148 | Rate-limit code execution per user instead of per IP for signed-in users | P1 | backend | feature |
| #149 | Evaluate submissions asynchronously (queue + polling) instead of blocking the request | P1 | backend + frontend | feature |
| #150 | Serve the Monaco editor from our own origin instead of the jsDelivr CDN | P1 | frontend | task |
| #151 | Per-exercise CPU time and memory limits | P2 | backend + frontend | feature |
| #152 | Exercises with input data files (érettségi-style file processing) | P1 | backend + frontend | feature |
| #153 | Run code with custom input ("Saját bemenet") | P2 | backend + frontend | feature |
| #154 | Hints and a reference solution per exercise | P2 | backend + frontend | feature |
| #155 | Configurable output comparison (token-based and numeric tolerance) | P2 | backend + frontend | feature |
| #156 | Workspace keyboard shortcuts and editor preferences | P2 | frontend | feature |
| #157 | Search and richer filters on the exercise list | P2 | backend + frontend | feature |
| #174 | New exercise type: multiple-choice and short-answer questions | P2 | backend + frontend | feature |
| #175 | Mock exam mode: timed exercise sets with a score report | P2 | backend + frontend | feature |
| #176 | Learning streaks and a weekly goal on the progress dashboard | P2 | backend + frontend | feature |
| #177 | Spike: exercise types for the non-programming exam parts (HTML/CSS, spreadsheet) | P2 | backend + frontend | spike |

### Epic 8: Authoring & Back-Office v2 (10)

Producing content at scale and running the business from the admin area.

| # | Issue | Priority | Scope | Kind |
|---|---|---|---|---|
| #158 | Upload lesson videos and captions from the admin UI | P1 | backend + frontend | feature |
| #159 | Verify test cases against a reference solution in the exercise editor | P1 | backend + frontend | feature |
| #160 | Admin dashboard with business and usage metrics | P1 | backend + frontend | feature |
| #161 | Audit log viewer in the admin area | P2 | backend + frontend | feature |
| #162 | Admin user management actions: roles, verification, sessions, billing history | P2 | backend + frontend | feature |
| #163 | Refunds: admin-initiated Barion refund with a storno invoice | P1 | backend + frontend | feature |
| #164 | Per-exercise analytics for authors | P2 | backend + frontend | feature |
| #165 | Import and export catalog content as JSON | P2 | backend + frontend | feature |
| #166 | Preview unpublished lessons and exercises as a student would see them | P2 | backend + frontend | feature |
| #167 | Let students report a problem with an exercise, with an admin inbox | P2 | backend + frontend | feature |

### Epic 9: Billing & Growth (7)

Being found, converting visitors, and more ways to pay.

| # | Issue | Priority | Scope | Kind |
|---|---|---|---|---|
| #168 | Build a real landing page with curriculum overview, pricing and FAQ | P1 | frontend | feature |
| #169 | SEO foundations: per-route titles and meta, Open Graph, sitemap, prerendered public pages | P1 | frontend + backend | feature |
| #170 | Store the price on each subscription and handle price changes explicitly | P1 | backend + frontend | feature |
| #171 | Multiple plans: add an annual subscription | P2 | backend + frontend | feature |
| #172 | Coupon codes for the first payment | P2 | backend + frontend | feature |
| #173 | Lifecycle e-mails: welcome, inactivity nudge, weekly progress summary, with opt-out | P2 | backend + frontend | feature |
| #178 | Spike: school and teacher licences (classes, seats, teacher view) | P2 | backend + frontend | spike |

### Epic 10: Platform, Operations & Quality (14)

CI, deploys, API contract, retention, security hardening, tech debt.

| # | Issue | Priority | Scope | Kind |
|---|---|---|---|---|
| #126 | Run migrations and the API test suite against MySQL 8 in CI | P0 | backend | task |
| #179 | Dependency and secret scanning in CI (Dependabot, composer/npm audit) | P1 | backend + frontend | task |
| #180 | Atomic releases with rollback and maintenance mode during migrations | P1 | backend | task |
| #181 | Staging environment with Barion and Számlázz.hu test accounts | P1 | backend + frontend | task |
| #182 | Publish an OpenAPI contract and generate the frontend API types from it | P2 | backend + frontend | task |
| #183 | Retire the prototype API vocabulary (`/tasks`, `/topics`, `task_id`) in favour of exercises and modules | P2 | backend + frontend | task |
| #184 | Data retention: prune anonymous submissions, stale records and old logs | P2 | backend | task |
| #185 | Serve lesson videos through nginx (X-Accel-Redirect) instead of PHP | P2 | backend | task |
| #186 | Remove Laravel skeleton leftovers from the API-only backend | P2 | backend | task |
| #187 | Session management and login hardening | P2 | backend + frontend | feature |
| #188 | Two-factor authentication (TOTP) for admin accounts | P2 | backend + frontend | feature |
| #189 | Spike: move from localStorage bearer tokens to cookie-based SPA authentication | P2 | backend + frontend | spike |
| #190 | Load test and capacity baseline for code execution and the catalog | P2 | backend | task |
| #191 | Test coverage backlog for existing features (tracking) | P1 | tests | task |

Totals: 68 issues (11 P0, 27 P1, 30 P2).

## Order and dependencies

- #124–#131 come first because they protect everything after them: the destructive-command guard, the invoice-date fix, MySQL in CI (most later issues add migrations), production config checks, TLS, backups, readiness and error tracking.
- #132–#140 complete what a customer and a payment provider expect before money changes hands.
- #141–#157 turn the prototype's flat exercise list into a course: navigation shell, curriculum, lesson content, history, then execution capacity (#148–#150) before the features that add load (#152 files, #175 exams).
- #158–#167 are authoring and support tools. #159 (reference-solution check) is worth pulling earlier if content production starts before the code catches up.
- #168–#173 are acquisition and monetisation; #170 (price lock) must precede #171 and #172.
- #174–#178 are larger product bets; two are spikes that end in an ADR and follow-up issues.
- #179–#191 are platform work. #179 (dependency audit) and #186 (skeleton cleanup) are small and can be taken at any time without disturbing the stack.

Hard dependencies are written in each issue under "Depends on". The main chains:

```
#132 legal pages ─┬─> #133 consent ──> #173 lifecycle e-mails
                  └─> #139 Barion compliance (also needs #128)
#134 account page ──> #135 profile edit, #187 sessions, #188 admin 2FA
#142 curriculum ──> #143 lesson page ──> #144 theory completion
#147 history + #148 per-user throttle ──> #149 async evaluation ──> #175 exam mode
#154 hints/solutions ──> #159 reference check
#162 admin user actions ──> #163 refunds
#170 price lock ──> #171 annual plan, #172 coupons
#130 readiness + #129 backups ──> #180 atomic deploy ──> #181 staging ──> #190 load test
#182 OpenAPI ──> #183 vocabulary cleanup
```

## What needs the repository owner

These cannot be done from the repository and are called out inside the issues:

| Item | Issue |
|---|---|
| Queue worker and scheduler on the server | #64 (still open) |
| TLS certificate, `DEPLOY_URL` secret, `APP_URL`/`FRONTEND_URL` | #128 |
| Off-site backup bucket and credentials; install the timer | #129 |
| Choice of error-tracking service and its DSN | #131 |
| Legal texts (ÁSZF, privacy notice, impresszum) | #132 |
| Barion shop approval items, Pixel ID | #139 |
| Számlázz.hu test Agent key for the verification run | #125 |
| Visual direction for the landing page | #168 |
| One-time server restructuring for release directories | #180 |
| Staging host, DNS and test-account credentials | #181 |
| Writing the specs listed under "Needs test coverage" | #191 |

## Decisions recorded as open in the issues

- #131: hosted error tracking (proposed) or log-channel alerts only.
- #139: confirm Barion's current approval checklist before building.
- #152: whether output files can be judged reliably through stdout, or only input files ship.
- #169: prerendering approach for track and lesson pages.
- #172: how a 100 % coupon still registers a card with Barion.
- #182: one pagination shape for the whole API.
- #177, #178, #189: spikes, each ending in an ADR (0004, 0005, 0006).

## What was changed on GitHub

- Labels added: `area:ops`, `area:growth`, `priority:P0`, `priority:P1`, `priority:P2`, `spike`.
- Milestones added: Epic 6 – Epic 10 (see the tables above).
- Issues created: #124–#191 (68). No existing issue, PR or branch was modified.
- No application code was changed.
