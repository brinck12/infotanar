# Architektúra

Ez a dokumentum a rendszer azon részeit rögzíti, amelyeknek a pontos jelentése nem derül ki a kódból
első olvasásra. Új fejezetet az kap, aminek a számai vagy szabályai mások döntéseit érintik.

## Admin áttekintés

`GET /api/v1/admin/metrics?range=7d|30d|90d` (alapértelmezés: `30d`), a `/admin` kezdőoldal adja. Az
`app/Actions/Admin/BuildDashboardMetrics` állítja össze; a számok az `app/Services/Admin/Metrics`
osztályaiból jönnek.

### Időszak és napok

- **Időszak:** az utolsó 7, 30 vagy 90 *naptári nap* a mai napot is beleértve, `Europe/Budapest` szerint
  (`DASHBOARD_TIMEZONE`). A kezdete a legkorábbi nap helyi éjfele, a vége a mai nap végéig tart.
- **Előző időszak:** közvetlenül előtte, ugyanilyen hosszú. A csempék változása ehhez képest értendő.
- **Napi bontás:** az adatbázis UTC-ben tárol, a napokat helyi idő szerint képezzük. A MySQL
  időzóna-táblái nem feltételezhetők, ezért a PHP az időszakot azonos UTC-eltolású szakaszokra osztja
  (`LocalDayRange`), és a lekérdezés szakaszonként fix eltolással csoportosít (`SqlDialect::localDate`).
  Egy időszakban legfeljebb egy óraállítás van, tehát legfeljebb két szakasz, azaz két lekérdezés
  sorozatonként. A szakaszhatár helyi éjfél; az eltolást a nap déli értékéből vesszük, ezért az őszi
  óraállítás napján az éjfél utáni egy óra a megelőző napra eshet. A napi értékek minden napra
  szerepelnek (0 is).
- **Gyorsítótár:** időszakonként `DASHBOARD_CACHE_TTL` másodpercig (alapból 300). A `generated_at` mutatja,
  mikor számolódott.
- **Teljesítmény:** minden szám SQL-aggregáció, felhasználónkénti vagy sorokénti lekérdezés nincs; egy
  hideg betöltés 30 lekérdezés, az adatmennyiségtől függetlenül. Az érintett oszlopokon index van
  (`2026_10_01_190000_add_dashboard_indexes`).

### Előfizetések

| Mutató | Definíció |
|---|---|
| Aktív | `subscriptions.status = active`, most. |
| Fizetési késedelemben | `status = past_due`, most. |
| Lemondás alatt | `status = active` és `cancel_at_period_end = true`: az időszak végén megszűnik. |
| Új | Az időszakban létrejött előfizetések (`created_at`). |
| Lemorzsolódott | `status = canceled` és `canceled_at` az időszakban. |
| MRR | Az aktív előfizetések száma × a havi csomag ára (`billing.plan.price_huf / period_months`). A fizetési késedelemben levők nem számítanak. Az előfizetésenkénti ár (#170) bevezetése után az előfizetések saját árából számolódik. |

### Bevétel

| Mutató | Definíció |
|---|---|
| Bevétel (napi, összes) | A `succeeded` fizetések bruttó összege forintban, a `paid_at` napján. Az első fizetés, a megújítás és a kártyacsere is fizetés; a számlák (nettó/ÁFA) nem itt jelennek meg. |
| Sikertelen fizetések | `status = failed`, a létrehozás (`created_at`) ideje szerint az időszakban. |

### Felhasználók

Csak a `student` szerepkörűek számítanak (az admin nem), a törölt (soft delete) fiókok nem.

| Mutató | Definíció |
|---|---|
| Regisztrációk (napi, összes) | A regisztráció (`created_at`) napja szerint. |
| Megerősítettek aránya | Az időszakban regisztráltak közül hányadnak van megerősített e-mail-címe (`email_verified_at`). Nincs regisztráció: nincs érték. |
| Ingyenesből fizetőbe | Az időszakban regisztráltak közül hányan fizettek már sikeresen első fizetést (`purpose = initial`, `status = succeeded`), *a mai napig*. Nincs regisztráció: nincs érték. A friss időszak értéke még nő, ahogy a friss regisztrálók fizetnek. |

### Tanulás

A beadásokat (`submissions`) számoljuk, a "Futtatás" nem tárolódik, ezért nem szerepel.

| Mutató | Definíció |
|---|---|
| Beadások (napi, összes) | A beadás (`created_at`) napja szerint, a névtelen beadásokkal együtt. |
| Aktív tanulók (napi) | Különböző bejelentkezett felhasználók (`user_id`) azon a napon beadással. A névtelen beadás nem számít. |
| Aktív tanulók (időszak) | Különböző bejelentkezett felhasználók az egész időszakban (nem a napi értékek összege). |
| Állapotmegoszlás | Beadások száma `verdict` szerint. A #39 előtti, állapot nélküli beadások kimaradnak. |
| Elfogadási arány | `accepted` ÷ az összes értékelt beadás. A `system_error` nem a diák hibája, ezért sem a számlálóban, sem a nevezőben nincs. Nincs értékelt beadás: nincs érték. |

### Figyelmet kér

| Mutató | Definíció |
|---|---|
| Elakadt számlák | `invoices.status = failed` (a #103 kezeli őket). |
| Régóta függő fizetések | `payments.status = pending` és a létrehozás óta több mint `DASHBOARD_PENDING_PAYMENT_HOURS` (24) óra telt el. |
| Sikertelen jobok | A `failed_jobs` tábla sorainak száma. |
| Megoldhatatlannak tűnő feladatok | Több mint `DASHBOARD_UNSOLVED_ATTEMPTS` (20) beadás *összesen* (nem csak az időszakban), és egyetlen elfogadott sem. Legfeljebb 10, a beadások száma szerint csökkenően. Vagy túl nehéz a feladat, vagy hibás a teszteset. |
