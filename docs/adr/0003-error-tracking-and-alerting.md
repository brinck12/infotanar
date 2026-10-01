# ADR 0003 — Hibakövetés és riasztás: saját megoldás, külső szolgáltató nélkül

- **Állapot:** elfogadva (2026-10-01); a külső szolgáltató kérdése nyitva marad, lásd „Felülvizsgálat”
- **Kapcsolódó issue-k:** #131 (ez a döntés), #130 (readiness), #103 (elakadt számlák admin felülete)

## Kontextus

A hibák eddig csak a szerver naplófájljába kerültek. Három dolog maradt észrevétlen:

1. **Végleg elbukott háttérfeladat.** A `failed_jobs` táblát senki nem nézi; egy ki nem állított számla vagy egy meg nem újított előfizetés csak a vásárló panaszából derült volna ki.
2. **Elutasított vagy elakadt számla, fizetés.** A #103 admin felülete megmutatja őket, de senkit nem értesít, hogy oda kell nézni.
3. **A böngészőben összeomló oldal.** Az `ErrorBoundary` hibaüzenetet mutat a diáknak, mi nem tudunk róla.

Két út volt:

| | Külső szolgáltató (pl. Sentry) | Saját megoldás |
|---|---|---|
| Mit ad | csoportosítás, stack trace forrástérképpel, trendek, kiadáskövetés | e-mail riasztás, naplófájl |
| Ár | ingyenes csomag korlátokkal, utána havidíj | nincs |
| Adatvédelem | új adatfeldolgozó: a tájékoztatóban szerepelnie kell, a hibákhoz tapadó adatok (URL, felhasználó-azonosító, IP) harmadik félhez kerülnek | minden a saját szerveren marad |
| Előfeltétel | fiók, DSN, két új függőség (PHP és JS SDK) | működő levelezés |

## Döntés

**Saját megoldás, külső szolgáltató nélkül.** Az indok nem technikai: egy új adatfeldolgozó bevonása és egy fiók megnyitása a tulajdonos döntése, és a mostani forgalomnál a saját megoldás lefedi azt, amire ténylegesen szükség van (tudjunk róla, ha kézi beavatkozás kell).

## Hogyan működik

### Üzemeltetői riasztás (`App\Support\Alerts\OperatorAlert`)

- Minden riasztás `critical` szinten a naplóba kerül.
- Ha az `ALERT_EMAIL` be van állítva, levél is megy. **Azonnal, nem a sorból**: a riasztás gyakran épp arról szól, hogy a sor áll.
- Ugyanarról a hibáról (azonos szöveg és azonosítók) óránként legfeljebb egy levél megy.
- A riasztás kontextusába csak azonosítók kerülnek (számla, fizetés, előfizetés), személyes adat és forráskód nem.

Mi riaszt:

| Esemény | Honnan |
|---|---|
| Egy job az összes próbálkozás után is elbukott | a billing jobok saját azonosítóikkal (`AlertsOperatorOnFailure`), minden más job a `Queue::failing` figyelőn át |
| A Számlázz.hu véglegesen elutasított egy számlát | `IssuePendingInvoice` |
| Elutasított számla, vagy 24 óránál régebb óta függő számla/fizetés van | `ReportStuckBilling`, naponta 08:00-kor |

### Frontend hibák (`POST /api/v1/client-errors`)

- Az `ErrorBoundary` és a globális `error` / `unhandledrejection` figyelők jelentenek, csak éles buildben.
- Egy oldalbetöltés alatt ugyanaz a hiba egyszer, összesen legfeljebb öt jelentés megy; a végpont IP-nként 10 kérés/perc.
- A sikertelen API-hívások nem számítanak hibának (azokat a felület kezeli, a szerver naplózza).
- A jelentések a `storage/logs/client-YYYY-MM-DD.log` fájlba kerülnek: üzenet, URL, stack, a build commitja (`VITE_RELEASE`), és a felhasználó azonosítója, ha be van jelentkezve (a token alapján, nem a kliens állítása szerint).
- **Nem megy róluk levél.** Egy hibás kiadás minden látogatónál jelentene; a fájlt kiadás után érdemes megnézni.

## Következmények

- Konfiguráció: `ALERT_EMAIL` a szerver `.env`-jében. Nélküle a riasztás csak naplózódik; a `php artisan app:check-config` figyelmeztet a hiányára.
- A riasztás a levelezéstől függ. Ha a levelezés áll, a riasztás nem érkezik meg (a naplóban megvan); ezt a readiness végpont (#130) külső figyelése fedi le.
- A frontend stack trace-ek minifikált kódra mutatnak, forrástérkép nincs. A kiadás commitjából és a komponens-stackből a hiba helye általában így is azonosítható.
- Nincs csoportosítás és trend: a naplófájlt kell olvasni.

## Felülvizsgálat

Érdemes külső szolgáltatóra váltani, ha a kliens-napló olvasása rendszeres munka lesz, vagy ha a minifikált stack trace-ek miatt egy hibát nem sikerül megtalálni. A váltás kis munka: az `OperatorAlert` és a `reportError` a két belépési pont, mögéjük köthető be az SDK. Ehhez kell a tulajdonos döntése a szolgáltatóról és az adatkezelési tájékoztató (#132) kiegészítése.
