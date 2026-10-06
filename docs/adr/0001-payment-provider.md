# ADR 0001 — Fizetési szolgáltató: Barion

- **Állapot:** elfogadva (2026-09-30)
- **Kapcsolódó issue-k:** #12 (döntés), #14 checkout, #15 webhook/callback, #16 megújítás és türelmi idő, #17 önkiszolgáló kezelés, #18 számlázó (ADR 0002)

## Kontextus

Magyar, fogyasztóknak szóló, havi előfizetéses SaaS. Követelmények (#12):

| Szempont | Követelmény |
|---|---|
| Pénznem | HUF, magyar kártyák és bankok |
| Ismétlődő terhelés | havi előfizetés a vásárló újbóli jelenléte nélkül |
| Értesítés | megbízható visszajelzés sikeres, sikertelen, megújított fizetésről |
| Kifizetés | forintban, magyar bankszámlára |
| Számlázás | illeszkedjen egy magyar, NAV-kompatibilis számlázóhoz (Számlázz.hu, ADR 0002) |

Jelöltek: **Stripe** (Billing + Customer Portal) és **Barion** (Smart Gateway, magyar).

## Döntés

**Barion**, a Számlázz.hu számlázóval párban.

## Indoklás

- Magyar szolgáltató, HUF-ban számol és fizet ki, a hazai vásárlók számára ismerős fizetőoldal.
- Ismétlődő terhelés **tokenes fizetéssel** támogatott (lásd lent), ami a havi előfizetéshez elég.
- Jól illeszkedik a magyar számlázáshoz: a számlát a mi rendszerünk állítja ki a Számlázz.hu-val a sikeres terhelés után (#20), nem a fizetési szolgáltató.

## Hogyan működik nálunk (a #14–#17 megvalósítás alapja)

**Első fizetés + token regisztráció** — `POST /v2/Payment/Start` a következőkkel:
`InitiateRecurrence = true`, `RecurrenceId` (általunk generált, boltonként és felhasználónként egyedi, max. 100 karakter), `RecurrenceType = "RecurringPayment"`, `Currency = "HUF"`, `Locale = "hu-HU"`, `RedirectUrl`, `CallbackUrl`. A válasz `PaymentId`-t és a fizetőoldal URL-jét adja.

**Havi megújítás** — ugyanaz a `Payment/Start`, de `InitiateRecurrence = false` és a meglévő `RecurrenceId`: a Barion a tárolt kártyát terheli, a vásárló jelenléte nélkül. **Az időzítést mi végezzük** (ütemezett job), a Barion nem kezel előfizetési ciklust.

**Értesítés (callback)** — állapotváltozáskor a Barion `POST`-ot küld a `CallbackUrl`-re, a query-ben a `paymentId`-val. **A callback nincs aláírva, és nem tartalmazza az állapotot**, csak jelzés. Ezért:
1. 15 mp-en belül `200 OK`-t adunk;
2. a valós állapotot mindig a Barion API-tól kérdezzük le (`PaymentState`, a POSKey-jel);
3. a feldolgozás a `PaymentId` + állapot szerint idempotens (#15).

Ez a Stripe-féle aláírás-ellenőrzést váltja ki: hamisított callback nem okoz kárt, mert csak egy lekérdezést indít el nálunk.

**Önkiszolgáló kezelés** — a Barionnak nincs a Stripe Customer Portalhoz hasonló felülete, ezért a lemondás és a kártyacsere saját végpontokkal történik (#17): a lemondás a következő megújítást állítja le, a kártyacsere új token-regisztráló fizetés.

## Következmények

- A megújításokat és a sikertelen terhelések utáni türelmi időt nálunk kell ütemezni (a #16 hourly sweep mellé egy napi megújító job kerül).
- A kártyaadatok soha nem érintik a rendszerünket (a Barion fizetőoldalán adja meg a vásárló), PCI-terhünk minimális.
- A 3D Secure megfelelés érdekében az első fizetés vásárló-jelenléttel zajlik; a későbbi, általunk indított terhelés `RecurringPayment` típusú.
- Konfiguráció: `BARION_POS_KEY`, `BARION_PAYEE` (a bolt Barion e-mail címe), `BARION_ENVIRONMENT` (`test` / `prod`).

## A bolt jóváhagyásához szükséges elemek (#139)

A Barion az éles boltot kézzel hagyja jóvá. A dokumentációja automatizált lekéréssel nem volt olvasható (HTTP 403), ezért az alábbi lista a keresőben megjelenő Barion-oldalak kivonatán alapul; **élesítés előtt a Barion aktuális ellenőrzőlistájával össze kell vetni.**

| Elvárás | Hol teljesül | Állapot |
|---|---|---|
| Hivatalos kártyaelfogadó logó az oldalon, módosítás nélkül | lábléc (`frontend/src/app/Footer.tsx`); a fájl helye `frontend/src/assets/barion-card-acceptance.svg` | **a fájlt a tulajdonosnak kell letöltenie** a Barion logó-oldaláról; hiányára a build figyelmeztet |
| Alap Barion Pixel minden oldalon | `frontend/src/shared/consent/barionPixel.ts`, a `VITE_BARION_PIXEL_ID` beállításával | kész; azonosító nélkül kikapcsolva |
| Hozzájárulás a marketing célú használathoz (`grantConsent` / `rejectConsent`) | süti-sáv (`CookieBanner.tsx`), a döntés a láblécből módosítható | kész |
| A Barion fizetés szerepel az ÁSZF-ben | `frontend/src/features/legal/content/aszf.md` 4. szakasz | vázlat, jogi szöveg kell |
| ÁSZF, adatkezelési tájékoztató, impresszum elérhető | #132 | vázlat, jogi szöveg kell |

**A Pixel betöltése és a hozzájárulás.** A Barion az alap Pixelt csalásmegelőzési célúnak tekinti, amely a hozzájárulástól függetlenül fut; a marketing célú feldolgozáshoz kell a `grantConsent`. Hogy az alap Pixel betölthet-e a látogató döntése előtt, az adatvédelmi kérdés, és a tulajdonos döntése:

- `VITE_BARION_PIXEL_REQUIRES_CONSENT=true` (alapértelmezés): a Pixel csak elfogadás után töltődik be. Ez az óvatosabb olvasat; ha a Barion a jóváhagyáskor a Pixelt hozzájárulás nélkül is látni akarja, ezen kell változtatni.
- `false`: az alap Pixel azonnal betölt, a hozzájárulás-esemény a döntést követi.

**Nem készült el:** a teljes (marketing) Pixel eseményei (`contentView`, `initiateCheckout`, `purchase`). Az eseményleírást nem tudtam elolvasni, és hibás mezőkkel küldött eseménynek nincs értelme; ha kell, külön issue.

## Hivatkozások

- [Payment/Start v2](https://docs.barion.com/Payment-Start-v2)
- [Token payment](https://docs.barion.com/Token_payment)
- [Subscriptions: set up recurring billing](https://docs.barion.com/Subscriptions:_set_up_recurring_billing)
- [Callback mechanism](https://docs.barion.com/Callback_mechanism)
- [Payment/PaymentState v4](https://docs.barion.com/Payment-PaymentState-v4)
