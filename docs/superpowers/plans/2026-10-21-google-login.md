# Google-belépés: megvalósítási terv

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A diák „Folytatás Google-lel" gombbal regisztrálhat és beléphet; az e-mailes, jelszavas belépés változatlanul marad. A Google által igazolt e-mail-cím a fiókot egyből megerősítettnek számítja.

**Branch:** `fullstack/<issue-szám>-google-login` (issue-t előbb fel kell venni). Merge commit `main`-re; a push élesít, ezért előtte a CI-kapuk helyben.

**Státusz (2026-10-22):** megvalósítva a `fullstack/252-google-login` ágon (#252), éles bekapcsolás előtt még nyitott: domain, Google-kulcsok, a nyilvános adatkezelési tájékoztató szövege. A kérdéseket a felhasználó kihagyta, a lenti döntések **az én döntéseim**, nem egyeztetettek (lásd „Döntések"); a 9. döntést (gomb) jóváhagyta.

## Eltérések a tervtől (megvalósításkor)

- **Task 10 (Playwright-tesztek):** eredetileg kihagytam (a felhasználó addig maga írta a teszteket); 2026-10-24-én a felhasználó kérésére megírtam: `tests/specs/api/auth-social.spec.ts` (36 teszt, valódi backend + `src/mocks/google` mock) és `tests/specs/e2e/google-login.spec.ts` (20 teszt, mockolt API).
- **Soft-deleted címes szabály kiesett:** a törölt fiók e-mailje anonimizálódik (`DeleteAccount`), ezért nem ütközik; az új fiók simán nyílik.
- **Jelszó beállítása:** a fiók oldalon gomb (`Jelszó beállítása e-mailben`) hívja az „elfelejtett jelszó” végpontot, mert az `/elfelejtett-jelszo` oldal `GuestOnly`, bejelentkezve nem érhető el.
- **`has_password`/`linked_providers`:** a fiók oldal csak a kifejezett `has_password === false`-t kezeli jelszó nélküliként, így a régebbi (mockolt) `/auth/me` válasz nem töri el.
- **Plusz:** `GOOGLE_AUTH_URL`/`GOOGLE_TOKEN_URL`/`GOOGLE_USERINFO_URL` felülírhatók a stubhoz; az `app:check-config` élesben blokkolja, ha nem a Google hostjaira mutatnak. Az ADR neve `0004-social-login.md`.

## Előfeltételek (nem kódolhatók)

- [ ] **Domain.** A Google nem enged nem-localhost `http://` redirect URI-t, és a consent screenhez publikus adatkezelési URL kell. Éles bekapcsolás domain nélkül nem megy; fejleszteni és tesztelni így is lehet (`http://localhost`).
- [ ] **Google Cloud projekt:** OAuth consent screen (External), státusz **In production** (Testing módban 100 felhasználó a plafon és a hozzájárulás 7 naponta lejár), scope csak `openid email profile` (nem érzékeny, nincs Google-féle verifikáció), Web application kliens, redirect URI: `{APP_URL}/api/v1/auth/google/callback`.
- [ ] A szerver `.env`-je kézzel kezelt: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_LOGIN_ENABLED=true` felvétele a felhasználó dolga (a deploy nem írja felül).

## Döntések (az én hívásaim)

1. **Csak Google, Socialite-tal.** Apple nem kell webes SPA-hoz (csak iOS-appnál kötelező), fizetős és kulcsot kell forgatni. Microsoft később jöhet: a `social_accounts` táblát és az Actionöket provider-semlegesre írjuk, hogy az csak egy új konfig + gomb legyen.
2. **Szerveroldali redirect-folyam, nem Google Identity Services gomb.** Nincs külső script, a CSP nem változik (a Google-re csak felső szintű navigáció megy), nincs FedCM/3rd-party-cookie kockázat.
3. **Nincs süti, nincs session** (az API Sanctum bearer). A CSRF/login-CSRF elleni kötés **PKCE-szerű**: a SPA `sessionStorage`-ben tart egy véletlen `verifier`-t, a `challenge = base64url(sha256(verifier))`-t elküldi a `redirect` hívásban; a szerver a `state`-hez cache-ben (10 perc) menti a `challenge`-et; a callback után a kódot csak a `verifier` birtokosa válthatja tokenre. Így egy támadó nem tud a áldozat böngészőjébe saját fiókot „belépetni".
4. **Provider tokent nem tárolunk** (adatminimalizálás): a `social_accounts` csak `provider`, `provider_user_id` (Google `sub`), `user_id`, időbélyegek. Profilképet sem mentünk.
5. **Fiók-összekötés szabályai (ez a biztonsági mag):**
   - `(provider, sub)` már összekötött → belépés.
   - Nincs ilyen, de van **aktív** `users.email` egyezés, és a Google `email_verified=true`:
     - a fiók e-mailje **megerősített** → automatikus összekötés + értesítő levél a tulajdonosnak;
     - a fiók e-mailje **nem megerősített** (pre-hijack: a támadó előre regisztrált az áldozat címére) → összekötés előtt a fiók `password`-je `null`-ra áll és minden tokenje törlődik, így a támadó hozzáférése megszűnik.
   - Google `email_verified=false` → elutasítás.
   - Soft-deleted fiók ugyanazzal a címmel → semleges hiba (a `RegisterUser` is így hallgat), nem hozunk létre újat (az `email` egyedi a törölteken is).
   - Egyik sem → **új fiók**, de csak hozzájárulás után (6. pont).
6. **Új fióknál ugyanaz a kapu, mint a jelszavas regisztrációnál:** ÁSZF/adatkezelési hozzájárulás verziókkal (`RecordConsent`, #133) és zárt béta módban meghívókód (`RegistrationGate::requiresInvite`). Ezért a kódváltás két kimenetű: `signed_in` vagy `consent_required`; utóbbi után a SPA hozzájárulás-képernyőt mutat, és a `complete` hívás hozza létre a fiókot. A kód a `complete`-ig érvényes marad (10 perc), tokenkiadáskor fogy el.
7. **`users.password` nullable lesz** (új migráció; meglévőt nem szerkesztünk). Jelszó nélküli fiókra: `User::hasPassword()`; `IssueAccessToken` null jelszónál `InvalidCredentials`-t dob, `Hash::check` null-t nem kap.
8. **Jelszóigényes műveletek jelszó nélküli fióknál (v1):** `current_password` szabály nem teljesíthető (jelszócsere, e-mail-csere, fióktörlés). v1-ben a UI azt mondja: „Előbb állíts be jelszót" és az **„Elfelejtett jelszó"** folyamatra visz (levélbeli igazolás, a meglévő `ResetPassword` már jó). Google-os újrahitelesítés (reauth) külön, későbbi feladat. Ellopott token így nem tud jelszó nélküli fiókot törölni vagy átvenni.
9. **Gomb kinézete:** a `shared/ui` meglévő másodlagos gombja + a Google „G" embléma és a „Folytatás Google-lel" felirat (a Google márkairányelvei ezt engedik). **Jóváhagyva a felhasználó által (2026-10-22):** meglévő másodlagos gomb + „G" embléma, új gombstílus nincs.
10. **Feature flag:** `GOOGLE_LOGIN_ENABLED` + kulcsok nélkül a végpontok 404-et adnak, a gomb nem jelenik meg (helyben és a tesztekben alapból ki).

## Global Constraints

- Kód, megjegyzés, UI-szöveg **magyar**; felhasználónak szóló backend-szöveg a `backend/lang/hu/*.php`-ból (`__()`). Backend megjegyzések ékezet nélkül, mint a környező kódban.
- PHP: `declare(strict_types=1)`, Actionök `final readonly` egy `handle()`-lel, tranzakció ahol atomi kell; `composer lint` és `composer analyse` (Larastan max) zöld, teljes típusozás.
- Domain-hibák `App\Exceptions\DomainException` leszármazottak (`app/Exceptions/Auth/`).
- Minden auth-esemény `RecordAuditEvent`-en át, új `AuditAction` esettel. Naplóba nem kerül e-mail-cím.
- Útvonal-változás után `php artisan docs:endpoints` (CI ellenőrzi).
- Migrációt nem szerkesztünk, újat adunk.
- Frontend: csak `shared/ui` + tokenek (nincs `[...]` érték), `import type`, nincs `any`/`!`/`console.log`; feature nem importál másik feature belsejéből.
- Tesztek: `test`/`expect` csak `src/fixtures`-ből; page object-ben nincs assertion; nincs `waitForTimeout`; mindig `--project=`. A seed-adat `ApiTestSeeder.php` ↔ `tests/src/data/seed.ts` együtt változik.
- Hozzájárulás nélkül, meghívókód nélkül (zárt módban) **nem** jöhet létre fiók.

## Review Focus

1. **Pre-hijack:** nem megerősített, jelszavas fiók + Google belépés ugyanarra a címre: a régi jelszó és tokenek érvénytelenek-e utána (Task 3).
2. **Verifier nélküli vagy hibás verifier** a kódváltásnál: elutasítás, és a kód nem fogy el (Task 4).
3. **Kód újrafelhasználása:** tokenkiadás után a második váltás hibát ad (Task 4).
4. **Zárt béta:** Google-lal sem lehet meghívókód nélkül fiókot nyitni (Task 5).
5. **`email_verified=false`** a Google-től, és soft-deleted címmel érkező belépés (Task 3).
6. **Jelszó nélküli fiók** a jelszavas belépésnél, a jelszócserénél és a törlésnél: nincs 500, nincs `Hash::check(null)` (Task 2, 7).
7. **Fióktörlés:** `social_accounts` sorok és GDPR-export (Task 8).
8. **Callback hiba** (a felhasználó „Mégse"-t nyom a Google-nél, lejárt `state`): barátságos frontend-oldal, nem nyers JSON a böngészőben (Task 4, 9).

---

## Fájlstruktúra

| Fájl | Felelősség |
|---|---|
| `backend/database/migrations/2026_10_21_100000_make_users_password_nullable.php` | `users.password` nullable |
| `backend/database/migrations/2026_10_21_100100_create_social_accounts_table.php` | `social_accounts` (`user_id`, `provider`, `provider_user_id`, egyedi `(provider, provider_user_id)` és `(user_id, provider)`) |
| `backend/app/Models/SocialAccount.php` | modell, `User::socialAccounts()`, `User::hasPassword()` |
| `backend/config/services.php` | `google` blokk (`client_id`, `client_secret`, `redirect`, `enabled`) |
| `backend/app/Services/Auth/Social/` | `SocialProfile` (DTO), `GoogleProvider` (Socialite-burok), `OAuthHandshake` (state + challenge + kód a cache-ben) |
| `backend/app/Actions/Auth/Social/` | `StartSocialLogin`, `ResolveSocialLogin`, `ExchangeSocialCode`, `CompleteSocialSignup` |
| `backend/app/Http/Controllers/Api/V1/Auth/SocialAuthController.php` | vékony kontroller |
| `backend/app/Exceptions/Auth/` | `SocialLoginFailed`, `SocialEmailNotVerified`, `SocialSignupConsentRequired` |
| `backend/app/Notifications/SocialAccountLinkedNotification.php` | értesítő összekötéskor |
| `backend/app/Listeners/PurgeSocialAccountsOnAccountDeletion.php` | fióktörlés |
| `backend/lang/hu/auth.php` | új üzenetek |
| `frontend/src/features/auth/social.ts` + `pages/GoogleCallback.tsx` + `components/GoogleButton.tsx` | PKCE-segéd, landing oldal, gomb |
| `tests/specs/api/auth-social.spec.ts`, `tests/src/mocks/google/` | Google-stub és API-tesztek |

---

## Task 1: Alap — migrációk, modell, konfig

- [ ] Migráció: `users.password` nullable (`->change()`; SQLite alatt is futnia kell, a repo SQLite-ot használ fejlesztéshez).
- [ ] Migráció + `SocialAccount` modell + `User::socialAccounts()`, `User::hasPassword(): bool`. Ellenőrizni: strict mód (lazy loading) nem dob a `/me`-nél.
- [ ] `composer require laravel/socialite`; `config/services.php` `google` blokk; `.env.example` kommentezett kulcsok.
- [ ] `UserResource`: `has_password: bool`, `linked_providers: string[]` (a `socialAccounts` eager load-dal, a `CurrentUserController`-ben és ott, ahol a resource másutt is épül). Frontend `AuthUser` típusa kézzel.
- [ ] Gate: `GOOGLE_LOGIN_ENABLED` hamis → a social végpontok 404.

## Task 2: Jelszó nélküli fiók védelme

- [ ] `IssueAccessToken`: `! $user->hasPassword()` → ugyanaz az `AuthLoginFailed` audit és `InvalidCredentials`.
- [ ] `ChangePasswordRequest`, `DeleteAccountRequest`, `ChangeEmailRequest`: jelszó nélküli fióknál érthető 422 (`__('auth.social.password_required')`), nem a `current_password` szabály félrevezető hibája.
- [ ] API-teszt: jelszó nélküli fiók `/login`-ja 422 (nem 500); a jelszó beállítható a `forgot-password` → `reset-password` úton, utána a belépés megy.

## Task 3: Fiók feloldása (`ResolveSocialLogin`)

- [ ] `SocialProfile` (provider, sub, email, emailVerified, name). `ResolveSocialLogin::handle(SocialProfile): ResolvedLogin` az 5. döntés szabályaival; eredmény: `SignedIn(User)` | `NeedsSignup(profile)`.
- [ ] Pre-hijack ág: tranzakcióban `password = null`, `tokens()->delete()`, `email_verified_at` beállítása, `SocialAccount` létrehozás, audit, `SocialAccountLinkedNotification`.
- [ ] Új `AuditAction` esetek: `AuthSocialLoginSucceeded`, `AuthSocialLoginFailed`, `AuthSocialRegistered`, `AuthSocialLinked`.
- [ ] Egységtesztszerű API-lefedettség a Task 10-ben (nincs PHPUnit a repóban).

## Task 4: Hullámkezelés (state, kód, PKCE)

- [ ] `OAuthHandshake`: `begin(challenge): state`, `consumeState(state): challenge` (egyszer használatos, 10 perc), `storeCode(profile, challenge): code` (10 perc), `redeem(code, verifier)`: `hash_equals` a challenge-re; hibás verifiernél a kód **megmarad**.
- [ ] Végpontok (`routes/api.php`, `auth` csoport, `throttle:oauth` limiter az `AppServiceProvider::configureRateLimiting`-ben):
  - `GET /auth/providers` → `{google: bool}`
  - `POST /auth/google/redirect` `{code_challenge}` → `{url}` (a SPA navigál)
  - `GET /auth/google/callback` → Socialite `stateless()` (a saját `state`-ünket ellenőrizzük), profil kinyerés, `storeCode`, **302 a `FRONTEND_URL/belepes/google?code=…`**; hibánál (`error=access_denied`, lejárt state) `…?error=cancelled|failed`, soha nem nyers JSON
  - `POST /auth/google/exchange` `{code, code_verifier}` → `{status: "signed_in", token…}` vagy `{status: "consent_required", name, email}`
  - `POST /auth/google/complete` `{code, code_verifier, accept_terms, terms_version, privacy_version, invite_code?}` → token
- [ ] A kód csak sikeres tokenkiadáskor fogy el. `docs:endpoints` újragenerálás.

## Task 5: Új fiók létrehozása (`CompleteSocialSignup`)

- [ ] A `RegisterUser` mintájára: tranzakció, `RecordConsent` (Terms + Privacy), zárt módban `ConsumeInviteCode`, `email_verified_at = now()`, `password = null`, `SocialAccount`, audit `AuthSocialRegistered`. Versenyhelyzet: `UniqueConstraintViolationException` → újrafuttatás a feloldással (nyer a másik kérés).
- [ ] A név a Google-ből, hosszra vágva a `users.name` korlátjához.

## Task 6: Konfiguráció-ellenőrzés és dokumentáció

- [ ] `ProductionConfigAudit`: ha `GOOGLE_LOGIN_ENABLED`, hiányzó kulcs vagy nem-https redirect → blokkoló hiba.
- [ ] `docs/privacy/ropa.md`: Google mint bejelentkezési szolgáltató (mit kap: név, e-mail, `sub`; mit tárolunk). Az adatkezelési tájékoztató szövege és verziója (lásd `features/legal`): tartalmi frissítés és verziólépés; a meglévő felhasználók újra-hozzájárulása a repo mostani szabálya szerint. **Jogi szöveget a felhasználóval egyeztetni.**
- [ ] `docs/runbooks/go-live.md`: Google Cloud lépések és a kulcsok felvétele. Új ADR `docs/adr/0004-social-login.md` az 1–3. döntésről.
- [ ] `CLAUDE.md` Architecture rész: egy bekezdés a social belépésről.

## Task 7: Frontend — API és állapot

- [ ] `features/auth/api.ts`: `providers()`, `googleRedirect(challenge)`, `googleExchange(code, verifier)`, `googleComplete(...)`. `types` frissítés (`has_password`, `linked_providers`).
- [ ] `social.ts`: verifier generálás (`crypto.getRandomValues`), `sha256` → base64url, `sessionStorage` kezelés (try/catch, ahogy a repo többi tárolása).
- [ ] `AuthProvider`/`context.ts`: `acceptLogin(response)`: a `login` token-beállító részét kiemelni, hogy a Google-os út is ugyanazt a `tokenStore` + `resetViewerData` + `me` cache-lépést használja.

## Task 8: Fióktörlés és export

- [ ] `PurgeSocialAccountsOnAccountDeletion` listener (a többi mintájára, `GuardsAccountDeletion`).
- [ ] A GDPR-export (`AccountController::export`) tartalmazza a kötött providert és a kötés idejét (tokent nem tárolunk).

## Task 9: Frontend — UI

- [ ] `GoogleButton` (a `providers()` alapján látszik; meglévő másodlagos gomb + „G" embléma, jóváhagyva, lásd 9. döntés) a `Login` és `Register` oldalon, „vagy" elválasztóval az űrlap alatt.
- [ ] `/belepes/google` útvonal (`routes.tsx` `page()` + `App.tsx` AuthShell): kódváltás; `signed_in` → `acceptLogin` + a `GuestOnly` továbbvisz; `consent_required` → hozzájárulás-űrlap (ÁSZF/adatkezelés pipa a megjelenített verziókkal, zárt módban meghívókód mező, a `Register` komponenseit újrahasználva); `error=cancelled|failed` → `Banner` + vissza a belépéshez.
- [ ] Fiók oldal: a „Jelszó" és „Fiók törlése" blokk jelszó nélküli fióknál magyarázatot és „Jelszó beállítása" gombot mutat (az elfelejtett jelszó folyamatra); látszik, hogy a Google összekötött.
- [ ] A magyar szövegek: mi történt és mit tegyen („A Google-belépés megszakadt. Próbáld újra, vagy lépj be e-mail-címmel.").

## Task 10: Tesztek

- [ ] Google-stub: `tests/src/mocks/google/` (token és userinfo végpont), a Judge0-mock mintájára; a backend-szerver `GOOGLE_*_BASE_URL`-t a stubra állítja a `web-servers.ts`-ben. (A Socialite `Google` driver URL-jei felülírásához saját `GoogleProvider` kell, ezért van a Task 1-ben a burok.)
- [ ] `ApiTestSeeder` + `seed.ts`: jelszó nélküli Google-fiók; nem megerősített jelszavas fiók a pre-hijack tesztre.
- [ ] `auth-social.spec.ts` (`api` projekt): új fiók hozzájárulással; hozzájárulás nélkül nincs fiók; zárt módban meghívókód kell; megerősített fiók automatikus összekötése + levél az outboxban; pre-hijack (régi jelszó és token halott); `email_verified=false` elutasítás; hibás verifier; kód újrafelhasználás; lejárt/ismeretlen `state`; jelszó nélküli fiók a `/login`-nál; fióktörlés után a `social_accounts` üres; `GOOGLE_LOGIN_ENABLED=false` → 404.
- [ ] `e2e-mocked`: a gomb látszik/nem látszik a `providers` alapján; callback-oldal `signed_in`, `consent_required` és `error` ágon (`mockApi`).
- [ ] `rate-limit` projektben az `oauth` limiter.

## Task 11: Kapuk és kiadás

- [ ] Helyben: `composer lint`, `composer analyse`, `php artisan docs:endpoints --check`, `npm run lint`, `typecheck`, `build` (frontend), `npm run check` és `test:api`, `test:e2e` (tests/), mindig `--project=`.
- [ ] Merge `main`-re merge commit-tal, push. Éles bekapcsolás **csak** a domain és a Google-kulcsok után (`GOOGLE_LOGIN_ENABLED=true`, `app:check-config` zöld); addig a kód élesben is kikapcsolva fut.

## Későbbi (nem része a v1-nek)

- Google-os újrahitelesítés a jelszó nélküli fiók érzékeny műveleteihez (reauth token).
- Kötés megszüntetése a fiók oldalról (csak ha van jelszó).
- Microsoft-belépés (sok iskola Microsoft 365-öt használ).
- Apple, ha natív app készül.
