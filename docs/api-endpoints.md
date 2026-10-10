# API végpontok

> Generált fájl, ne szerkeszd kézzel. Frissítés: `cd backend && php artisan docs:endpoints`.

Minden végpont a `/api/v1` előtag alatt érhető el. A hozzáférés oszlop jelentése:
**nyilvános**: token nélkül is hívható (érvénytelen token 401-et kap);
**bejelentkezve**: `Authorization: Bearer <token>` kell;
**admin**: admin szerepkör kell;
**aláírt link**: a levélben kiküldött, lejáró aláírás védi.

## account

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `DELETE` | `/account` | bejelentkezve | `sensitive` |
| `POST` | `/account/email` | bejelentkezve | `sensitive` |
| `GET` | `/account/email/confirm/{id}/{hash}` | aláírt link | – |
| `GET` | `/account/export` | bejelentkezve | `account-export` |
| `PUT` | `/account/password` | bejelentkezve | `sensitive` |
| `PATCH` | `/account/profile` | bejelentkezve | `10,1` |

## admin

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `DELETE` | `/admin/access-grants/{accessGrant}` | admin | – |
| `GET` | `/admin/constraint-options` | admin | – |
| `GET` | `/admin/exercises` | admin | – |
| `POST` | `/admin/exercises` | admin | – |
| `DELETE` | `/admin/exercises/{exercise}` | admin | – |
| `GET` | `/admin/exercises/{exercise}` | admin | – |
| `PUT|PATCH` | `/admin/exercises/{exercise}` | admin | – |
| `GET` | `/admin/exercises/{exercise}/test-cases` | admin | – |
| `POST` | `/admin/exercises/{exercise}/test-cases` | admin | – |
| `PUT` | `/admin/exercises/{exercise}/test-cases/order` | admin | – |
| `GET` | `/admin/invoices` | admin | – |
| `PUT` | `/admin/invoices/{invoice}/buyer` | admin | – |
| `POST` | `/admin/invoices/{invoice}/retry` | admin | – |
| `GET` | `/admin/lessons` | admin | – |
| `POST` | `/admin/lessons` | admin | – |
| `DELETE` | `/admin/lessons/{lesson}` | admin | – |
| `GET` | `/admin/lessons/{lesson}` | admin | – |
| `PUT|PATCH` | `/admin/lessons/{lesson}` | admin | – |
| `PUT` | `/admin/lessons/{lesson}/exercises/order` | admin | – |
| `GET` | `/admin/modules` | admin | – |
| `POST` | `/admin/modules` | admin | – |
| `DELETE` | `/admin/modules/{module}` | admin | – |
| `GET` | `/admin/modules/{module}` | admin | – |
| `PUT|PATCH` | `/admin/modules/{module}` | admin | – |
| `PUT` | `/admin/modules/{module}/lessons/order` | admin | – |
| `GET` | `/admin/ping` | admin | – |
| `DELETE` | `/admin/test-cases/{testCase}` | admin | – |
| `GET` | `/admin/test-cases/{testCase}` | admin | – |
| `PUT|PATCH` | `/admin/test-cases/{testCase}` | admin | – |
| `GET` | `/admin/tracks` | admin | – |
| `POST` | `/admin/tracks` | admin | – |
| `PUT` | `/admin/tracks/order` | admin | – |
| `DELETE` | `/admin/tracks/{track}` | admin | – |
| `GET` | `/admin/tracks/{track}` | admin | – |
| `PUT|PATCH` | `/admin/tracks/{track}` | admin | – |
| `PUT` | `/admin/tracks/{track}/modules/order` | admin | – |
| `GET` | `/admin/users` | admin | – |
| `DELETE` | `/admin/users/{user}` | admin | – |
| `GET` | `/admin/users/{user}` | admin | – |
| `GET` | `/admin/users/{user}/access-grants` | admin | – |
| `POST` | `/admin/users/{user}/access-grants` | admin | – |
| `GET` | `/admin/users/{user}/export` | admin | – |
| `POST` | `/admin/users/{user}/password-reset` | admin | `admin-user-mail` |
| `GET` | `/admin/users/{user}/payments` | admin | – |
| `GET` | `/admin/users/{user}/payments/{payment}/invoice` | admin | `30,1` |
| `PUT` | `/admin/users/{user}/role` | admin | – |
| `DELETE` | `/admin/users/{user}/tokens` | admin | – |
| `POST` | `/admin/users/{user}/verification-notification` | admin | `admin-user-mail` |
| `POST` | `/admin/users/{user}/verify-email` | admin | – |

## auth

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `POST` | `/auth/email/verification-notification` | bejelentkezve | `verification-resend` |
| `POST` | `/auth/forgot-password` | nyilvános | `password-reset` |
| `POST` | `/auth/login` | nyilvános | `login` |
| `POST` | `/auth/logout` | bejelentkezve | – |
| `GET` | `/auth/me` | bejelentkezve | – |
| `POST` | `/auth/register` | nyilvános | – |
| `POST` | `/auth/reset-password` | nyilvános | `password-reset` |
| `GET` | `/auth/verify-email/{id}/{hash}` | aláírt link | – |

## billing

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `POST` | `/billing/checkout` | bejelentkezve | `checkout` |
| `GET` | `/billing/payments` | bejelentkezve | – |
| `GET` | `/billing/payments/{payment}` | bejelentkezve | – |
| `GET` | `/billing/payments/{payment}/invoice` | bejelentkezve | `30,1` |
| `GET` | `/billing/plan` | nyilvános | – |
| `GET` | `/billing/profile` | bejelentkezve | – |
| `PUT` | `/billing/profile` | bejelentkezve | `10,1` |
| `GET` | `/billing/subscription` | bejelentkezve | – |
| `POST` | `/billing/subscription/cancel` | bejelentkezve | `sensitive` |
| `POST` | `/billing/subscription/card` | bejelentkezve | `checkout` |
| `POST` | `/billing/subscription/resume` | bejelentkezve | `sensitive` |

## client-errors

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `POST` | `/client-errors` | nyilvános | `10,1` |

## health

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `GET` | `/health` | nyilvános | – |
| `GET` | `/health/ready` | nyilvános | `30,1` |

## languages

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `GET` | `/languages` | nyilvános | – |

## lessons

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `POST` | `/lessons/{lesson}/complete` | bejelentkezve | `30,1` |
| `GET` | `/lessons/{lesson}/video` | nyilvános | – |
| `GET` | `/lessons/{lesson}/video/captions` | aláírt link | – |
| `GET` | `/lessons/{lesson}/video/stream` | aláírt link | – |

## progress

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `GET` | `/progress` | bejelentkezve | – |

## run

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `POST` | `/run` | nyilvános | `execution` |

## submissions

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `GET` | `/submissions` | bejelentkezve | – |
| `POST` | `/submissions` | nyilvános | `execution` |
| `GET` | `/submissions/{submission}` | bejelentkezve | – |

## tasks

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `GET` | `/tasks` | nyilvános | – |
| `GET` | `/tasks/{task}` | nyilvános | – |
| `GET` | `/tasks/{task}/submissions` | bejelentkezve | – |

## topics

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `GET` | `/topics` | nyilvános | – |

## tracks

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `GET` | `/tracks` | nyilvános | – |
| `GET` | `/tracks/{slug}` | nyilvános | – |
| `GET` | `/tracks/{trackSlug}/lessons/{lessonSlug}` | nyilvános | – |

## webhooks

| Metódus | Útvonal | Hozzáférés | Limit |
|---|---|---|---|
| `POST` | `/webhooks/barion` | nyilvános | `60,1` |
