# Heti ritmus és kedves heti összefoglaló: megvalósítási terv

**Státusz (2026-10-22):** megvalósítva a `fullstack/253-weekly-rhythm` ágon (#253), a Google-belépés ágára építve. Eltérések: a `WeeklySummaryNotification` az aláírt linkeket maga számolja (`UnsubscribeLinks`), nem kapja konstruktorban; a leiratkozó végpont `throttle:30,1` (a `sensitive` 5/perc a levelezők egyklikkes hívásait is fojtaná); az opt-in végpont `PUT /account/notifications`; a felület a meglévő `Switch` komponenst használja.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Eltérés a szokásos TDD-menettől:** a felhasználó állandó megállapodása szerint a teszteket (Playwright) **ő írja**. Ezért a tesztlépések helyett minden feladat „Ellenőrzés” lépése eldobható szkripttel és a repo kapuival bizonyít (nem commitolt szkript, a Google-belépésnél bevált módon), és minden feladat végén ott a **„A felhasználó tesztjeihez”** lista: mely viselkedéseket kell lefedni. Új Playwright-specet nem írunk.

**Goal:** A diák egy szám nélküli, heti ritmussávon látja, mely napokon tanult; kérésre hetente egy ünneplő hangú e-mail összefoglalót kap. Elveszíteni nincs mit, szidás és nógatás nincs.

**Architecture:** Az aktivitás a meglévő `lesson_completions` és `submissions` táblákból számolódik (új aktivitás-tábla nincs), magyar naptári napokra bontva. Egy Service adja a tanulási napokat, erre épül a sáv végpontja és a heti összefoglaló is. Az e-mail egy ütemezett, sorból küldő Job; az opt-in két új `users` oszlop plusz egy rögzített hozzájárulás.

**Tech Stack:** Laravel 12 / PHP 8.3 (Larastan max), Carbon, ütemezett Job + queued Notification, React 19 + TanStack Query, `shared/ui` komponensek.

**Spec:** `docs/superpowers/specs/2026-10-22-weekly-rhythm-design.md` (jóváhagyva 2026-10-22)

## Global Constraints

- Kód, megjegyzés, UI-szöveg és hibaüzenet **magyar**; felhasználónak szóló backend-szöveg a `backend/lang/hu/*.php`-ból (`__()`). Backend megjegyzések ékezet nélkül, mint a környező kódban.
- PHP: `declare(strict_types=1)`, hatás-osztályok `final readonly` egy `handle()`-lel, teljes típusozás (`@param`/`@return`/`@throws`); `composer lint` és `composer analyse` zöld. Útvonal-változás után `php artisan docs:endpoints`. Meglévő migrációt nem szerkesztünk, újat adunk.
- Domain-hibák `App\Exceptions\DomainException` leszármazottak; auditált műveletek `RecordAuditEvent` + új `AuditAction` eset (e-mail-cím nem kerül a naplóba).
- Frontend: csak `shared/ui` + tokenek (nincs `[...]` érték), `import type`, nincs `any`/`!`/`console.log`; feature nem importál másik feature belsejéből. Új kártya-, gomb- vagy jelvénystílus jóváhagyást kér: a sáv jelei meglévő tokenekből épülnek (`bg-accent`, `border-line`), és a Task 2 végén **képernyőképet mutatunk a felhasználónak**.
- Hangnem a felhasználótól: **kedves, stressz nélkül**. Tilos: napi széria, futó szám, „lemaradtál/megszakadt/veszítesz” jellegű szöveg, eszkalálódó emlékeztető, push, ranglista, követőpixel.
- A hét hétfőtől vasárnapig tart, a napok határa `Europe/Budapest` (`config/learning.php` `timezone`). Tanulási nap = a magyar naptári napon van lecketeljesítés (`lesson_completions.completed_at`) vagy feladatbeadás (`submissions.created_at`, bármilyen státusszal); gyakorló vizsgakísérlet nem számít.
- Heti cél a `users.preferences['weekly_hours']`-ból: `1-2` → 2, `3-4` → 3, `5+` → 4 aktív nap; megadott óraszám nélkül nincs cél. A cél **csak** az ünneplő mondatot váltja ki, jelölése a sávon nincs.
- Az e-mail: alapból kikapcsolt; csak opt-in + megerősített e-mail mellett; vasárnap 17:00 (Europe/Budapest); legfeljebb egy levél hetente; csak ha a héten volt tanulási nap; nincs olvasásmérés; minden levélben leiratkozás (aláírt link + `List-Unsubscribe` fejléc). A bekapcsolás hozzájárulásként rögzül.
- A fiók törlésekor az opt-in és a küldési időbélyeg is törlődik; az export tartalmazza a beállítást.

## Review Focus

1. **Hét- és napátmenet:** vasárnap 23:30 magyar idő (UTC szerint már hétfő is lehet) és a téli időszámításra váltás hete (2026-10-25, 25 órás vasárnap): a tevékenység a magyar naptári napra kerüljön, ne a UTC-re (Task 1).
2. **Új vagy soha nem tanuló felhasználó:** a sáv üres, nincs hiba, nincs cél-szöveg, nincs levél (Task 1, 4).
3. **Kétszeri futás:** a vasárnapi job kétszer fut (újrapróbálás, átfedő ütemezés): egy levél megy, nem kettő (Task 4).
4. **Nem küldhető címzett:** opt-in, de nem megerősített e-mail; törölt (anonimizált) fiók; aki közben leiratkozott: nem kap levelet (Task 3, 4).
5. **Leiratkozás:** kamu vagy másik felhasználóra szóló aláírás elutasítva; már leiratkozottnak is barátságos siker; a hozzájárulás-sor megmarad (bizonyíték), a kapcsoló kikapcsol (Task 5).

---

## Fájlstruktúra

| Fájl | Felelősség |
|---|---|
| `backend/config/learning.php` | `timezone`, `weekly_goal_days` |
| `backend/app/Services/Progress/StudyDays.php` | egy felhasználó tanulási napjai egy hétre |
| `backend/app/Services/Progress/WeeklyRhythm.php` + `Actions/Progress/BuildWeeklyRhythm.php` | a sáv adata és összeállítása |
| `backend/app/Http/Resources/Progress/WeeklyRhythmResource.php` | a sáv API-alakja |
| `backend/database/migrations/2026_10_22_100000_add_weekly_summary_to_users_table.php` | opt-in oszlopok |
| `backend/app/Actions/Account/UpdateWeeklySummary.php` + `Http/Controllers/Api/V1/Account/NotificationSettingsController.php` | be- és kikapcsolás |
| `backend/app/Services/Progress/WeeklySummary.php` + `Actions/Progress/BuildWeeklySummary.php` | a levél tartalma |
| `backend/app/Jobs/SendWeeklySummaries.php` + `Notifications/WeeklySummaryNotification.php` | küldés |
| `backend/app/Actions/Account/UnsubscribeWeeklySummary.php` + `Http/Controllers/Api/V1/Notifications/UnsubscribeController.php` | leiratkozás |
| `backend/lang/hu/rhythm.php` | a levél és az üzenetek szövege |
| `frontend/src/features/progress/components/WeeklyRhythm.tsx` | a sáv (és az opt-in felkínálás) |
| `frontend/src/features/account/` (Értesítések rész), `features/auth/pages/WeeklySummaryUnsubscribe.tsx` | beállítás, leiratkozó oldal |

---

## Task 1: Aktivitás és a heti ritmus végpontja

**Files:**
- Modify: `backend/config/learning.php`, `backend/routes/api.php` (a `/progress` útvonal mellé), `docs/api-endpoints.md` (generált)
- Create: `Services/Progress/StudyDays.php`, `Services/Progress/WeeklyRhythm.php`, `Actions/Progress/BuildWeeklyRhythm.php`, `Http/Resources/Progress/WeeklyRhythmResource.php`, `Http/Controllers/Api/V1/Progress/RhythmController.php`

**Interfaces:**
- Produces: `StudyDays::forWeek(User $user, CarbonImmutable $weekStart): list<string>` (a hét azon magyar napjai, `Y-m-d`, amelyeken tanult; rendezett, egyedi). `$weekStart` a hétfő 00:00 magyar idő szerint.
- Produces: `final readonly class WeeklyRhythm { __construct(public CarbonImmutable $weekStart, public string $today, public array $days /* list<array{date: string, active: bool}> hét elem */, public ?int $goalDays, public bool $goalReached) }`
- Produces: `BuildWeeklyRhythm::handle(User $user, ?CarbonImmutable $now = null): WeeklyRhythm`; `GET /api/v1/progress/rhythm` (`auth:sanctum`, név `progress.rhythm`) → `{data: {week_start, today, days: [{date, active}×7], goal_days, goal_reached}}`.

- [ ] **Step 1: `config/learning.php`:** `'timezone' => 'Europe/Budapest'` és `'weekly_goal_days' => ['1-2' => 2, '3-4' => 3, '5+' => 4]`, kommenttel, hogy a kulcsok a `weekly_hours` értékeivel egyeznek.
- [ ] **Step 2: `StudyDays::forWeek`:** két lekérdezés (teljesítések `completed_at`, beadások `created_at` a `[weekStart, weekStart+7 nap)` intervallumban, UTC-re váltva), az időbélyegek magyar időzónába alakítva és napra vágva; `rendezett egyedi dátumok`. Szigorú modellmódban nem lehet lusta betöltés. A napra vágás a magyar idő szerint történik (Review Focus 1).
- [ ] **Step 3: `BuildWeeklyRhythm`:** a hétfőt az `$now` magyar ideje szerint számolja; hét elem; `goalDays` a `$user->preferences['weekly_hours'] ?? null` és a config alapján; `goalReached = goalDays !== null && aktív napok száma >= goalDays`.
- [ ] **Step 4: Resource, kontroller (vékony, `#[CurrentUser]`), útvonal;** `php artisan docs:endpoints`.
- [ ] **Step 5: Ellenőrzés:** `composer quality`, `docs:endpoints --check`; eldobható szkript valódi backenden: friss felhasználó → hét üres nap, `goal_reached=false`; egy lecketeljesítés és egy beadás két külön napon → két aktív nap; **vasárnap 23:30 magyar idő** (UTC-ben még vasárnap 21:30) és **hétfő 00:30 magyar idő** (UTC vasárnap 22:30) a megfelelő hétre/napra esik; a 2026-10-25-i hét hét eleme és napjai helyesek; `weekly_hours=3-4` + 3 aktív nap → `goal_reached=true`, 2 nap → `false`.
- [ ] **Step 6: Commit:** `feat: heti ritmus végpont (aktív napok magyar idő szerint)`

**A felhasználó tesztjeihez:** üres hét; napok magyar időhatárnál (és DST-hét); lecke és beadás is számít, gyakorló vizsga nem; cél elérése/el nem érése/cél nélkül; hitelesítés nélkül 401.

## Task 2: A sáv a felületen

**Files:**
- Modify: `frontend/src/types/index.ts` (`WeeklyRhythm` típus), `frontend/src/features/progress/api.ts` (`progressKeys.rhythm`, `rhythmQuery()`), `ProgressDashboard.tsx` és `features/learning/pages/LearningPath.tsx` (a kártya beillesztése)
- Create: `frontend/src/features/progress/components/WeeklyRhythm.tsx`

**Interfaces:**
- Consumes: `GET /progress/rhythm` (Task 1). Produces: `rhythmQuery()` (`queryOptions`, a `progressQuery` mintájára) és a propok nélküli `WeeklyRhythm` komponens.

- [ ] **Step 1: Típus és lekérdezés:** a `WeeklyRhythm` TS-típus a Task 1 válaszalakját tükrözi (kézzel szinkronban, nincs codegen); a kulcs a `progressKeys.all` alatt, hogy a kijelentkezés ürítse.
- [ ] **Step 2: `WeeklyRhythm.tsx`:** egy `Panel`, cím „Heti ritmusod”, hét jel (H K Sz Cs P Sz V): tanult nap `bg-accent`, egyéb `border-line` üres jel; a mai nap diszkréten jelölve. **Szám nincs.** Minden jelnek hozzáférhető neve („hétfő, volt tanulás” / „hétfő”). Cél elérésekor egy mondat: „Megvan a heti ritmusod.”; egyébként **semmi extra szöveg**. Betöltés közben nincs villogás (semmi/halk helyőrző), **hibánál a komponens nem renderel semmit** (ne zavarjon).
- [ ] **Step 3: Beillesztés:** a haladás oldalon a visszaszámlálás alá, a tanulási út tetejére; mindkettő bejelentkezett felhasználónak (a oldalak már védettek / a tanulási úton `user` nélkül ne hívódjon).
- [ ] **Step 4: Ellenőrzés:** `npm run lint`, `typecheck`, `build`; eldobható böngészős szkript a valódi backenddel: friss fiók üres sáv; egy lecketeljesítés után a mai jel kitöltött; 375 px szélességen nincs vízszintes gördülés; **képernyőkép a felhasználónak** (új vizuális elem jóváhagyása).
- [ ] **Step 5: Commit:** `feat: heti ritmussáv a haladás oldalon és a tanulási úton`

**A felhasználó tesztjeihez:** a sáv jelei és hozzáférhető nevei; cél-mondat csak elérésekor; hibás válasznál nem jelenik meg; kijelentkezett felhasználónak nincs hívás; nincs szám sehol.

## Task 3: Opt-in tárolása, be- és kikapcsolás

**Files:**
- Create: `database/migrations/2026_10_22_100000_add_weekly_summary_to_users_table.php`, `Actions/Account/UpdateWeeklySummary.php`, `Http/Requests/Account/WeeklySummaryRequest.php`, `Http/Controllers/Api/V1/Account/NotificationSettingsController.php`, `Exceptions/Account/WeeklySummaryNeedsVerifiedEmail.php` (422)
- Modify: `Enums/ConsentType.php` (`WeeklySummary = 'weekly_summary'`), `Enums/AuditAction.php` (`AccountWeeklySummaryEnabled`, `AccountWeeklySummaryDisabled`), `Models/User.php` (cast + `@property`), `Http/Resources/UserResource.php`, `Actions/Account/DeleteAccount.php`, `Actions/Account/ExportAccountData.php`, `routes/api.php`, `lang/hu/rhythm.php` (új), `docs/api-endpoints.md`

**Interfaces:**
- Produces: `users.weekly_summary_opt_in` (bool, alapból `false`), `users.weekly_summary_sent_at` (nullable timestamp); `UpdateWeeklySummary::handle(User $user, bool $enabled, ?string $privacyVersion): void`; `PUT /api/v1/account/notifications` `{enabled: bool, privacy_version?: string}` (`auth:sanctum`, `throttle:profile-update`, név `account.notifications.update`) → `UserResource`; a `UserResource` új mezője: `weekly_summary: bool`.

- [ ] **Step 1: Migráció és modell:** két oszlop; a `User` boolean cast-ot kap; az oszlopok **nincsenek** a `$fillable`-ben (csak `forceFill`).
- [ ] **Step 2: `UpdateWeeklySummary`:** bekapcsoláshoz megerősített e-mail kell (különben `WeeklySummaryNeedsVerifiedEmail`); bekapcsoláskor tranzakcióban `RecordConsent` (`ConsentType::WeeklySummary`, a kapott `privacy_version`) és audit; **már bekapcsolt állapotban nem készül új hozzájárulás-sor** (idempotens); kikapcsoláskor csak a kapcsoló és az audit (a hozzájárulás-sor bizonyíték, marad). `privacy_version` a `WeeklySummaryRequest`-ben bekapcsoláskor kötelező.
- [ ] **Step 3: Kontroller, útvonal, `UserResource`, `lang/hu/rhythm.php`** hibaüzenet; `docs:endpoints`.
- [ ] **Step 4: `DeleteAccount`** a `forceFill`-ben `weekly_summary_opt_in => false, weekly_summary_sent_at => null`; **`ExportAccountData`** profiljába `weekly_summary`.
- [ ] **Step 5: Ellenőrzés:** `composer quality`, `docs:endpoints --check`; szkript: megerősített fiók bekapcsol → `weekly_summary=true` + egy hozzájárulás-sor; újra bekapcsol → még mindig egy sor; kikapcsol → `false`, sor marad; nem megerősített fiók bekapcsolása 422; fióktörlés után az opt-in `false`; export tartalmazza.
- [ ] **Step 6: Commit:** `feat: heti összefoglaló be- és kikapcsolása hozzájárulással`

**A felhasználó tesztjeihez:** alapból kikapcsolt; bekapcsolás hozzájárulást rögzít, ismételt bekapcsolás nem duplikál; nem megerősített cím 422; kikapcsolás; fióktörlés és export.

## Task 4: A heti összefoglaló küldése

**Files:**
- Create: `Services/Progress/WeeklySummary.php`, `Actions/Progress/BuildWeeklySummary.php`, `Jobs/SendWeeklySummaries.php`, `Notifications/WeeklySummaryNotification.php`
- Modify: `routes/console.php`, `lang/hu/rhythm.php`

**Interfaces:**
- Consumes: `StudyDays::forWeek` (Task 1), `users.weekly_summary_*` (Task 3), `unsubscribeUrls(User $user)` a Task 5-ből. **Végrehajtási sorrend: 1, 2, 3, 5, 4, 6, 7** (a Task 4 értesítése a Task 5 segédjét hívja).
- Produces: `final readonly class WeeklySummary { __construct(public int $activeDays, public int $lessonsCompleted, public int $submissions) }`; `BuildWeeklySummary::handle(User $user, CarbonImmutable $weekStart): ?WeeklySummary` (`null`, ha a héten nem volt tanulási nap); `SendWeeklySummaries` job; `WeeklySummaryNotification(WeeklySummary $summary, string $unsubscribeUrl, string $unsubscribeApiUrl)` (queued, `afterCommit`).

- [ ] **Step 1: `BuildWeeklySummary`:** `activeDays` a `StudyDays`-ből, a darabszámok ugyanabból a hétből; `null` nulla aktív napnál.
- [ ] **Step 2: `SendWeeklySummaries`:** `ShouldBeUnique, ShouldQueue`, `AlertsOperatorOnFailure` (mint a `SendRenewalReminders`); címzett: `weekly_summary_opt_in`, `email_verified_at` nem null, nem törölt, és (`weekly_summary_sent_at` null vagy 6 napnál régebbi); `chunkById(200)`. Felhasználónként: összefoglaló építése; ha `null`, kihagyja (**nem foglal**); **ha van, egyetlen feltételes `UPDATE`-tel foglalja a küldést** (`whereKey(id)` + ugyanaz az időbélyeg-feltétel, `=== 1` esetén küld), hogy kétszeri futás egy levelet adjon (Review Focus 3); a foglalás után `notify`.
- [ ] **Step 3: `WeeklySummaryNotification`:** magyar, ünneplő levél a `lang/hu/rhythm.php`-ból: hány napon tanult, mit fejezett be, egy gomb a folytatáshoz (`FRONTEND_URL/tanulasi-ut`); **nincs** hiányzó nap szöveg, nincs nógatás; a lábrészben leiratkozás-link (frontend, Task 5) és `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` fejléc a háttér aláírt POST címével (`withSymfonyMessage`).
- [ ] **Step 4: Ütemezés:** `Schedule::job(new SendWeeklySummaries)->weeklyOn(0, '17:00')->timezone('Europe/Budapest')` a `routes/console.php`-ban, magyar kommenttel.
- [ ] **Step 5: Ellenőrzés:** `composer quality`; szkript (`MAIL_MAILER=outbox`, a `SendWeeklySummaries` egy eldobható artisan-szkriptből `dispatchSync`-kel futtatva): opt-in + aktív hét → pontosan egy levél az outboxban, a tárgy és a szöveg magyar, **nem tartalmaz** „lemaradt/hiányzik/megszakadt” szavakat; a job **másodszor** futtatva → még mindig egy levél; nem opt-in, nem megerősített, aktivitás nélküli hét, törölt fiók → nincs levél.
- [ ] **Step 6: Commit:** `feat: heti összefoglaló e-mail (opt-in, hetente legfeljebb egy)`

**A felhasználó tesztjeihez:** kinek megy levél és kinek nem (a négy kizárási eset); egy levél kétszeri futásnál; a levélszöveg tartalma és hiányzó nógatás; a fejlécek és a leiratkozás-link jelenléte.

## Task 5: Leiratkozás

**Files:**
- Create: `Actions/Account/UnsubscribeWeeklySummary.php`, `Http/Controllers/Api/V1/Notifications/UnsubscribeController.php`
- Modify: `routes/api.php`, `Enums/AuditAction.php` (használja a Task 3 `AccountWeeklySummaryDisabled`-jét), `lang/hu/rhythm.php`, `docs/api-endpoints.md`

**Interfaces:**
- Produces: `POST /api/v1/notifications/weekly-summary/{id}/unsubscribe` (`whereNumber('id')`, `signed:relative`, `throttle:sensitive`, név `notifications.weekly-summary.unsubscribe`) → `{message}`; `UnsubscribeWeeklySummary::handle(int $userId): void` (idempotens); egy `unsubscribeUrls(User $user): array{frontend: string, api: string}` segéd (a Task 4 értesítése hívja; a frontend cím a `verify-email` minta szerint viszi a query-paramétereket).

- [ ] **Step 1: Action:** a felhasználót azonosító alapján keresi (törölt vagy ismeretlen: ugyanaz a semleges siker); kikapcsolja a kapcsolót, auditál; már kikapcsolt állapotban sem hiba.
- [ ] **Step 2: Útvonal, kontroller, URL-segéd:** az aláírás **nem lejáró** (`URL::signedRoute`), hogy a régi levél linkje is működjön; a minta: `EmailVerificationController::verify` és `VerifyEmailNotification` (relatív aláírás, a SPA továbbadja a paramétereket).
- [ ] **Step 3: `docs:endpoints`, Ellenőrzés:** szkript: érvényes aláírással leiratkozik és a kapcsoló `false`; ugyanaz a hívás másodszor is siker; hibás vagy más azonosítóra szóló aláírás **403**; a hozzájárulás-sor megmarad; `composer quality`.
- [ ] **Step 4: Commit:** `feat: egy lépéses leiratkozás a heti összefoglalóról`

**A felhasználó tesztjeihez:** érvényes aláírás; kamu/más felhasználóra szóló aláírás elutasítva; ismételt leiratkozás; ismeretlen vagy törölt fiók semleges válasza.

## Task 6: Beállítás és leiratkozás a felületen

**Files:**
- Modify: `frontend/src/types/index.ts` (`AuthUser.weekly_summary`), `features/account/api.ts` (`updateWeeklySummary(enabled, privacyVersion?)`), `features/account/pages/AccountProfile.tsx` (új „Értesítések” rész), `WeeklyRhythm.tsx` (opt-in felkínálás), `app/routes.tsx` és `app/App.tsx` (`/leiratkozas`)
- Create: `features/auth/pages/WeeklySummaryUnsubscribe.tsx`

**Interfaces:**
- Consumes: `PUT /account/notifications` (Task 3), `POST /notifications/weekly-summary/{id}/unsubscribe` (Task 5), `LEGAL_VERSIONS.privacy`.

- [ ] **Step 1: Fiók oldal:** „Értesítések” rész a „Jelszó” után: kapcsoló a heti összefoglalóhoz, rövid, nyugodt leírással (mit kap, hogy hetente legfeljebb egy, hogy bármikor kikapcsolható); nem megerősített e-mailnél a kapcsoló letiltva, mellette a teendő („Előbb erősítsd meg az e-mail-címed.”). A felhasználó `weekly_summary` mezőjét a defenzív `=== true` módon olvassuk (a mockolt válaszokban hiányozhat).
- [ ] **Step 2: Felkínálás a kártyán:** a `WeeklyRhythm` alján, **csak** megerősített, még nem feliratkozott felhasználónak, egyszer: „Kérsz hetente egy rövid összefoglalót e-mailben?” két gombbal („Kérem” / „Most nem”); a „Most nem” `localStorage`-ben megjegyzi (a repo `userStorage` kulcsmintájával, try/catch), és többé nem kérdezünk. Sikeres feliratkozás után köszönő sor.
- [ ] **Step 3: `/leiratkozas` oldal** (AuthShell, nem védett): a levél linkjének query-paramétereit továbbadja a Task 5 végpontnak egy gombnyomásra („Leiratkozom a heti összefoglalóról”); siker után kedves megerősítés („Nem küldünk több összefoglalót. Bármikor visszakapcsolhatod a fiókodnál.”); hibánál érthető szöveg.
- [ ] **Step 4: Ellenőrzés:** `npm run lint`, `typecheck`, `build`; eldobható böngészős szkript valódi backenddel és outbox-szal: bekapcsolás a fiók oldalon, a kapcsoló állapota frissítés után is megvan; a felkínálás egyszer jelenik meg, „Most nem” után nem; a levélben kapott leiratkozó link gombnyomásra kikapcsol; **képernyőképek a felhasználónak** (Értesítések rész, felkínálás).
- [ ] **Step 5: Commit:** `feat: értesítési beállítás és leiratkozó oldal`

**A felhasználó tesztjeihez:** a kapcsoló és tiltott állapota; a felkínálás egyszeri megjelenése; a leiratkozó oldal sikeres és hibás ága.

## Task 7: Dokumentáció és kapuk

**Files:**
- Modify: `docs/privacy/ropa.md`, `CLAUDE.md`, `docs/superpowers/plans/2026-10-22-weekly-rhythm.md` (állapot)

- [ ] **Step 1: `ropa.md`:** a megerősítő/jelszó-levelek sor mellett új sor vagy kiegészítés: heti összefoglaló (cél, adatkategóriák: név, e-mail, aktivitási napok/darabszámok; jogalap: hozzájárulás, `consents` típus `weekly_summary`; megőrzés: a kapcsoló a fiókkal él, törléskor nullázódik). Az **adatkezelési tájékoztató szövegét és verzióját a tulajdonos/jogász frissíti** az éles bekapcsolás előtt; ezt a felhasználónak jelezzük, a nyilvános jogi szöveget nem írjuk át.
- [ ] **Step 2: `CLAUDE.md`:** egy rövid bekezdés „Weekly rhythm” címmel (hol a számítás, miért nincs széria, a kedvesség-szabályok, a hozzájárulás és a leiratkozás).
- [ ] **Step 3: Kapuk:** `composer lint`, `composer analyse`, `docs:endpoints --check`, frontend `lint`/`typecheck`/`build`, a tests mappában `npm run check`; **a meglévő** API-csomag (`npm run test:api`, `PHPRC` a `zip` kiterjesztéssel) és az érintett mockolt e2e-specek (regisztráció, reliability, `/fiok`) zöldek; az eldobható szerverek leállítva (nem hagyunk futó `node`/`php` folyamatot).
- [ ] **Step 4: Commit:** `docs: heti ritmus a nyilvántartásban és a CLAUDE.md-ben`

---

## Önellenőrzés (spec-lefedettség)

Sáv szám nélkül, heti cél csak ünneplésre → Task 1–2. Mi számít napnak, magyar idő → Task 1. Elhelyezés (`/haladas`, tanulási út) → Task 2. Alapból kikapcsolt, fiók oldali kapcsoló, szerény felkínálás → Task 3, 6. Vasárnap 17:00, csak aktív héten, hetente legfeljebb egy, nincs követés → Task 4. Egy kattintásos leiratkozás, megerősítő oldal, `List-Unsubscribe` → Task 4–6. Hozzájárulás rögzítése, `ropa.md` → Task 3, 7. Fióktörlés/export → Task 3. Későbbre halasztott (napi emlékeztető, vizsgaszámláló, push) szándékosan kimarad.
