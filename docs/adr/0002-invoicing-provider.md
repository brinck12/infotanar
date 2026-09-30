# ADR 0002 — Számlázó: Számlázz.hu (Számla Agent)

- **Állapot:** elfogadva (2026-09-30)
- **Kapcsolódó issue-k:** #18 (döntés), #19 számlázási adatok, #20 automatikus számla, ADR 0001 (Barion)

## Kontextus

Minden sikeres terhelés (első fizetés, megújítás, kártyacsere – ADR 0001, #15, #17) után pontosan egy, a magyar szabályoknak megfelelő számlát kell kiállítani, a vásárlónak e-mailben elküldeni, és az adatait a NAV Online Számla rendszerébe beküldeni. A fizetési szolgáltató (Barion) nem számláz helyettünk.

| Szempont | Követelmény |
|---|---|
| NAV adatszolgáltatás | automatikus, a számlázó végzi (Online Számla) |
| API | számla létrehozása emberi beavatkozás nélkül, szerverről |
| Kézbesítés | e-számla, a számlázó küldi e-mailben a vásárlónak |
| Visszakövethetőség | a számlaszám és a PDF a fizetéshez köthető |
| Költség, ismertség | kis forgalomnál is gazdaságos, a magyar könyvelők ismerik |

Jelöltek: **Számlázz.hu** (Számla Agent) és **Billingo** (API v3).

## Döntés

**Számlázz.hu, a Számla Agent interfészen keresztül.**

## Összevetés

| | Számlázz.hu Agent | Billingo API v3 |
|---|---|---|
| Hívás | `POST https://www.szamlazz.hu/szamla/`, multipart, `action-xmlagentxmlfile` mező, XML törzs | REST/JSON, `X-API-KEY` fejléc |
| Hitelesítés | Számla Agent kulcs az XML-ben (`beallitasok/szamlaagentkulcs`) | API kulcs |
| NAV Online Számla | automatikus | automatikus |
| E-mail a vásárlónak | ugyanabban a hívásban (`vevo/sendEmail`) | külön hívás (dokumentum küldése) |
| Válasz | a számlaszám és a hiba HTTP fejlécekben (`szlahu_szamlaszam`, `szlahu_error`, `szlahu_error_code`, `szlahu_nettovegosszeg`, `szlahu_bruttovegosszeg`); kérésre a PDF is | JSON |
| Fejlesztői élmény | régebbi, XML-alapú, de stabil és széles körben használt | modernebb REST |

A Billingo API-ja kényelmesebb, de a Számlázz.hu mellett szól, hogy a számla kiállítása, a NAV-beküldés és az e-mailes kézbesítés **egyetlen atomi hívás**, így kevesebb részleges állapotot kell nálunk kezelni. Emellett a legelterjedtebb hazai számlázó, a könyvelők ismerik, és a termékgazda ezt választotta.

## Hogyan működik nálunk (a #19–#20 megvalósítás alapja)

1. A sikeres fizetés (#15) után egy sorban álló job kiállítja a számlát. A fizetési folyamatot a számlázás hibája nem akaszthatja meg.
2. **Pontosan egy számla fizetésenként.** Saját `invoices` táblát vezetünk, a `payment_id` oszlopon egyedi indexszel, és egy állapotgéppel (`pending` → `issued` / `failed`). A Számla Agentnek nincs idempotencia-kulcsa, ezért:
   - hívás előtt zároljuk és ellenőrizzük a sort;
   - a fizetés `request_id`-ját rendelésszámként (`fejlec/rendelesSzam`) átadjuk;
   - bizonytalan kimenetel (pl. időtúllépés) után **nem hívjuk újra vakon**, hanem rendelésszám alapján lekérdezzük, hogy készült-e már számla. Csak ha nem, akkor próbáljuk újra.
3. Az XML fő részei:
   - `beallitasok`: agent-kulcs, `eszamla=true`, PDF-letöltés, válaszverzió;
   - `fejlec`: teljesítés és fizetési határidő (a fizetés napja), a fizetési mód („bankkártya”), `HUF`, a számla nyelve (`hu`), a rendelésszám, és jelzés, hogy a számla már ki van fizetve;
   - `elado`: bank és e-mail beállítások;
   - `vevo`: név, cím, e-mail, adószám (#19), `sendEmail=true`;
   - `tetelek`: egy tétel (a csomag neve, 1 hónap, nettó/ÁFA/bruttó).
4. A sikeres válaszból a számlaszámot a fizetéshez mentjük. A PDF a privát tárolóba kerül, és a felhasználó a fizetési történetből (#17) letöltheti.
5. A vevő számlázási adatait (név, cím, magánszemély vagy cég, adószám) a checkout előtt kérjük be és validáljuk (#19). A számla ezekből a mentett adatokból készül, nem a Barion adataiból.

## Következmények

- Konfiguráció:
  - `SZAMLAZZ_AGENT_KEY`: titok, csak a szerver `.env`-jében;
  - `SZAMLAZZ_INVOICE_PREFIX`: opcionális számlaszám-előtag;
  - `SZAMLAZZ_VAT_RATE`: pl. `27` vagy `AAM` alanyi adómentesség esetén. **Ezt a könyvelővel kell egyeztetni.**
- Az XML-séma a Számlázz.hu dokumentációja alapján készül. A dokumentációs oldal kliensoldalon renderel, ezért élesítés előtt **egy teszt Agent-kulccsal végigfuttatott valós kérés kötelező**. Különösen ellenőrizni kell az elemsorrendet és a `sendEmail` viselkedését.
- A Számlázz.hu leállása nem blokkolja a fizetést. A számla `failed` állapotban marad, a job exponenciális várakozással újrapróbál, a végleges hiba pedig kritikus naplóbejegyzést ad.
- A visszatérítés (sztornó számla) jelenleg nincs a hatókörben. Ha szükséges, külön issue.

## Hivatkozások

- Számlázz.hu fejlesztői dokumentáció (Számla Agent): https://docs.szamlazz.hu
- Billingo API v3: https://www.billingo.hu/api
