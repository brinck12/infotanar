# Architektúra

Hogyan épül fel a rendszer, és miért így. A végpontok listája a generált
[api-endpoints.md](api-endpoints.md) fájlban van; a döntések indoklása az
[ADR-ekben](adr).

## Áttekintés

```
böngésző ──HTTPS──> nginx ──┬─> statikus frontend (React SPA)
                            └─> /api  ──> php-fpm (Laravel)
                                           ├─> MySQL
                                           ├─> Judge0 (localhost; kódfuttatás)
                                           ├─> Barion (fizetés)
                                           └─> Számlázz.hu (számla)

queue worker  ── sorban álló feladatok: e-mail, Barion-állapot, számla, megújítás
scheduler     ── ütemezett feladatok: megújítás, pótlások, emlékeztetők, életjel
```

A frontend és az API élesben azonos domainen fut; a frontend soha nem beszél
közvetlenül a Judge0-val, a Barionnal vagy a Számlázz.hu-val.

## Backend

Egy kérés útja: **útvonal → FormRequest → Controller → Action → Resource**.

| Réteg | Feladata | Szabály |
|---|---|---|
| `Http/Requests` | bemenet ellenőrzése | minden bemenethez FormRequest; a hibaüzenetek a `lang/hu`-ból |
| `Http/Controllers` | összekötés | vékony: nincs benne üzleti logika |
| `Actions` | egy használati eset | egy osztály, egy `handle()`; itt van a tranzakció és a szabály |
| `Http/Resources` | kimenet | minden válasz Resource-on megy át; a modell nem szivárog ki |
| `Services` | külső rendszerek és számítás | Judge0, Barion, Számlázz.hu, kódszabály-elemzők |
| `Jobs` | sorban futó és ütemezett munka | idempotensek; a billing jobok bukása riasztást küld |
| `Exceptions` | előre látható üzleti hibák | `DomainException`: magyar üzenet és státuszkód, nem kerül a hibanaplóba |

Az API mindig JSON-t ad, a hibákat is (`bootstrap/app.php`).

### Hitelesítés és jogosultság

- Sanctum **tokenes** hitelesítés; a token 30 nap után lejár.
- Egy elküldött, de már érvénytelen token minden végponton 401-et kap, a vendégként
  is hívható végpontokon is (`RejectInvalidToken`). Így egy lejárt munkamenet nem
  válik csendben vendéggé.
- Két szerepkör: `student` és `admin`. Az admin útvonalakat az `admin` middleware
  védi, és a jogosultság-ellenőrzés a modell-kötés **előtt** fut, hogy a 404/403
  különbségéből ne lehessen azonosítókat kitalálni.

### Tananyag és hozzáférés

Szerkezet: **Track → Module → Lesson → Exercise → TestCase**. Csak a publikált
elemek látszanak a diákoknak.

Egy lecke tartalmához való hozzáférést egyetlen hely dönti el
(`Services/Access/ContentAccess`):

| Helyzet | Eredmény |
|---|---|
| a lecke ingyenes | mindenkinek elérhető |
| vendég | `login_required` |
| admin | elérhető |
| meg nem erősített e-mail-cím | `email_unverified` |
| élő előfizetés (aktív, vagy türelmi időben lévő) vagy érvényes kézi hozzáférés | elérhető |
| egyébként | `subscription_required` |

Zárolt feladatnál a leírás, a kiinduló kód és a tesztesetek nem kerülnek a válaszba.

### Kódfuttatás

```
POST /run          csak a nyilvános teszteseteken fut, nem mentődik
POST /submissions  minden teszteseten fut, mentődik, és a haladást is frissíti
```

1. `RunCodeRequest`: a nyelv engedélyezett-e a feladatnál; SQL-nél tiltott parancs van-e.
2. Hozzáférés-ellenőrzés (`ContentAccess`).
3. Kódszabályok (`Services/Constraints`): a feladat megtilthat vagy előírhat
   elemeket (pl. „ne használd a `sum`-ot”). A Python kódot egy külső `python3`
   folyamat elemzi **futtatás nélkül**; megsértés esetén a Judge0-hoz el sem megy
   a kód.
4. `SolutionEvaluator`: tesztesetenként egy Judge0-hívás (`wait=true`), sorban. Az
   elvárt kimenettel a backend veti össze (sorvégi szóközök és záró üres sorok
   nélkül); SQL-nél az eredménytáblát hasonlítja. Fordítási hibánál megáll. Az
   egész kiértékelésnek határideje van (`JUDGE0_EVALUATION_DEADLINE`, 45 mp).
5. `HiddenResultRedactor`: rejtett tesztesetből csak az eredmény megy ki, adat nem
   (se bemenet, se kimenet, se hibakimenet). Fehérlistás, hogy egy később
   hozzáadott mező se szivárogjon.
6. Beadásnál, ha a lecke minden publikált feladata megoldott, a lecke teljesítettnek jelölődik.

### Lecke teljesítése

Egy lecke kétféleképpen lesz teljesített (`lesson_completions`, felhasználónként és leckénként egy sor):

- **Feladatos lecke:** amikor a diák a lecke minden publikált feladatát megoldotta (beadáskor, `RecordLessonProgress`).
- **Feladat nélküli lecke** (csak elmélet vagy videó): a diák maga jelöli késznek (`POST /lessons/{id}/complete`, `CompleteTheoryLesson`). Feladatos leckénél ez a végpont 409-et ad.

A teljesítés végleges: ha egy már teljesített, feladat nélküli leckéhez később feladat kerül, a teljesítés megmarad, a diáknak nem kell újra megszereznie. Ugyanez igaz arra, ha egy teljesített feladatos lecke új feladatot kap.

A Judge0 hibája nem 500-as hiba: a válasz `status: "error"` magyar üzenettel.

**Ismert korlát:** a kiértékelés a kérésen belül fut, így egy beadás akár 45
másodpercig foglal egy php-fpm workert (#149 teszi sorba).

### Számlázás

A részletek az [ADR 0001](adr/0001-payment-provider.md) és
[ADR 0002](adr/0002-invoicing-provider.md) dokumentumban vannak. A folyamat:

```
checkout ──> Payment (pending) ──> Barion fizetőoldal
                                        │
             callback / pótló sweep <───┘        (a callback aláíratlan: csak jelzés)
                     │
             SyncPaymentState: az állapotot a Barion API-ból kérdezi le
                     │
        siker ───────┼────────── kudarc
          │                         │
  előfizetés indul/hosszabbodik     megújításnál: past_due + türelmi idő
  számla nyílik ──> IssueInvoice    e-mail a felhasználónak
  e-mail a felhasználónak
```

- **Pontosan egy terhelés kísérletenként, pontosan egy számla fizetésenként.** A
  fizetés-sor a szolgáltató hívása előtt jön létre, egyedi indexek védik; a
  Számlázz.hu-nál bizonytalan kimenetel után előbb lekérdezzük, készült-e már
  számla.
- **A megújítást mi ütemezzük**, a Barion csak a tárolt kártyát terheli.
- **Sikertelen megújítás:** az előfizetés `past_due`, a hozzáférés a türelmi idő
  (7 nap) végéig megmarad. A 3. és a 6. napon újra megpróbáljuk a terhelést.
  A türelmi idő végén az előfizetés lezárul.
- **A számla dátumai** a `BILLING_TIMEZONE` szerinti naptári napok: a kelt a
  kiállítás, a teljesítés a fizetés napja.
- **Értesítések:** minden állapotváltásról egy e-mail megy; a rendszer által
  kiváltottakból időszakonként egy (`subscription_notices`).

### Ütemezett feladatok (`routes/console.php`)

| Feladat | Gyakoriság | Mit csinál |
|---|---|---|
| `ProcessDueSubscriptions` | óránként | megújítás, újrapróbálkozás, a lemondott előfizetések lezárása |
| `ExpireGracePeriods` | óránként | a lejárt türelmi idejű előfizetések lezárása |
| `SyncPendingPayments` | 5 percenként | az elveszett Barion callbackek pótlása |
| `RetryPendingInvoices` | 15 percenként | az elakadt számlák újrapróbálása |
| `SendRenewalReminders` | naponta 09:00 | emlékeztető 3 nappal a megújítás előtt |
| `ReportStuckBilling` | naponta 08:00 | riasztás az elakadt számlákról és fizetésekről |
| életjel | percenként | a readiness végpont ebből látja, hogy a scheduler és a worker fut |
| `sanctum:prune-expired`, `queue:prune-failed` | naponta | lejárt tokenek és régi hibás jobok törlése |

### Sebességkorlátok

A névvel ellátottak az `AppServiceProvider`-ben vannak; a végpontonkénti értékek
az [api-endpoints.md](api-endpoints.md) „Limit” oszlopában.

| Név | Korlát | Kulcs |
|---|---|---|
| `login`, `password-reset` | 5 / perc | e-mail-cím + IP |
| `sensitive` (jelszót kérő műveletek) | 5 / perc | felhasználó |
| `checkout` | 5 / perc | felhasználó |
| `verification-resend` | 3 / perc | felhasználó |
| `account-export` | 5 / óra | felhasználó |
| kódfuttatás (`/run`, `/submissions`) | 10 / perc | IP (#148 teszi felhasználónkéntivé) |

### Megfigyelhetőség

- `GET /health`: válaszol-e a PHP. `GET /health/ready`: adatbázis, cache, scheduler
  és worker életjele, sor-torlódás, Judge0, lemez, mentés kora; a részletek csak
  tokennel vagy adminnak.
- Riasztás (`OperatorAlert`, [ADR 0003](adr/0003-error-tracking-and-alerting.md)):
  végleg elbukott job, elutasított számla, elakadt fizetés → napló és e-mail az
  `ALERT_EMAIL` címre.
- A böngészőben keletkezett hibák a `storage/logs/client-*.log` fájlba kerülnek.

## Frontend

- **Funkciónkénti mappák** (`src/features/*`): saját `api.ts`, oldalak,
  komponensek. A közös elemek a `src/shared` alatt vannak.
- **Adatlekérés:** TanStack Query; a lekérdezések kulcsai a funkció `api.ts`
  fájljában. A bejelentkezett felhasználó is a cache-ben él (`['auth', 'me']`).
- **Útvonalak:** minden oldal külön, lustán betöltött csomag (`app/routes.tsx`);
  a védett oldalakat `RequireAuth` / `RequireRole` őrzi.
- **Hitelesítés:** a token a `localStorage`-ban van. Ha egy kérés a jelenlegi
  tokennel 401-et kap, a kliens kijelentkeztet és a belépéshez visz; belépés
  után a felhasználó oda tér vissza, ahol volt.
- **Szerkesztő-piszkozatok:** felhasználónként, feladatonként és nyelvenként a
  böngészőben tárolódnak.
- **Hibák:** a backend minden hibára magyar `message`-et ad, a felület ezt
  jeleníti meg (`shared/api/errors.ts`).
- **Jogi dokumentumok:** Markdown fájlok (`features/legal/content`); a verziójuk
  a `documents.ts`-ben van, és regisztrációkor a szerver rögzíti, melyiket
  fogadta el a felhasználó.

## Tesztek

A `tests/` mappa önálló Playwright projekt: a böngészős tesztek a buildelt
frontendet mockolt API-val hajtják, az API tesztek valódi Laravel backendet
ál-Judge0-val. Részletek: [tests/README.md](../tests/README.md).
