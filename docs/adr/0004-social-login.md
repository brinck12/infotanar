# ADR 0004 — Közösségi belépés: csak Google, saját állapotkezeléssel

- **Állapot:** elfogadva (2026-10-22); éles bekapcsolás a domain és a Google-kulcsok után
- **Kapcsolódó issue:** #252, terv: `docs/superpowers/plans/2026-10-21-google-login.md`

## Kontextus

A diákok többsége tizenéves, és van Google-fiókja. Az e-mailes regisztráció két lépés (űrlap, majd megerősítő levél), a premium hozzáférés pedig megerősített e-mailt kér (`ContentAccess`). Levelezés és domain még nincs élesben, így egy olyan belépés, amely az e-mail megerősítést magától adja, csökkenti a súrlódást és a levelezéstől való függést.

## Döntés

**Csak Google, a Laravel Socialite-tal, szerveroldali átirányításos folyamattal. Az e-mailes belépés marad.**

- Apple nem kell: webes SPA-nál nem kötelező (csak iOS-appnál, ha más közösségi belépés is van), fizetős fejlesztői fiók kell hozzá, és az aláíró kulcsot forgatni kell. Ha natív app készül, újra kell nézni.
- Microsoft később jöhet (sok iskola Microsoft 365-öt használ). A `social_accounts` tábla és az Actionök szolgáltató-semlegesek, így az csak új konfig és gomb.
- Google Identity Services gomb helyett átirányítás: nincs külső script, a CSP nem változik, nincs FedCM/harmadik fél süti.

## Hogyan működik

1. A SPA a böngészőben (`sessionStorage`) egy véletlen `verifier`-t tart, és a SHA-256 hash-ét (`code_challenge`) elküldi a `POST /auth/google/redirect`-nek. A szerver a `state`-hez a gyorsítótárban (10 perc) köti a challenge-et, és visszaadja a Google címét.
2. A Google a backend `callback` végpontjára tér vissza; az a profilt (`sub`, e-mail, `email_verified`, név) kiolvassa, egyszer használható kódot ad, és a frontend `/belepes/google` oldalára irányít (hiba esetén `?error=cancelled|failed`, soha nem nyers JSON).
3. A kódot csak a `verifier` birtokosa válthatja be (`exchange`): az API-nak nincs munkamenete, ez köti a folyamatot ahhoz a böngészőhöz, amelyik elindította, így egy támadó nem léptetheti be az áldozat böngészőjét a saját Google-fiókjával. Hibás verifier nem emészti fel a kódot.

A `social_accounts` tábla nem tárol szolgáltatói tokent, profilképet vagy e-mailt: csak a szolgáltató nevét és a stabil azonosítót (`sub`).

## Fiók-összekötés (a biztonsági mag)

- Már összekötött azonosító: belépés.
- Egyébként csak a Google által igazolt e-mail (`email_verified=true`) számít, különben elutasítás.
- Ugyanazzal a címmel létező, **megerősített** fiók automatikusan összekötődik, és a tulajdonos levelet kap.
- Ha a létező fiók címe **nincs megerősítve**, a fiókot valaki más is nyithatta (előzetes regisztrálás az áldozat címére). Az összekötés előtt a fiók jelszava megszűnik és minden tokenje törlődik, így az előzetes regisztráló kizárul.
- Új fiók csak hozzájárulás után nyílik (ÁSZF/adatkezelés verziókkal, #133), zárt béta alatt meghívókóddal: ugyanaz a kapu, mint a jelszavas regisztrációnál. Az e-mail ekkor megerősítettnek számít.

## Jelszó nélküli fiók

A `users.password` nullable. Ilyen fiókkal jelszavas belépés nem lehetséges, a jelszót kérő műveletek (jelszócsere, e-mail-csere, fióktörlés) érthető hibát adnak. A jelszó az „elfelejtett jelszó” levélen át állítható be: az az e-mail-cím birtoklását igazolja, ezért egy ellopott token nem tudja átvenni a fiókot. A fiók oldalon egy gomb ezt egy lépésben indítja.

## Következmények

- Új adatfeldolgozó: a Google. Az adatkezelési nyilvántartás (`docs/privacy/ropa.md`) frissült; a nyilvános adatkezelési tájékoztató szövege és verziója a tulajdonos/jogász feladata az éles bekapcsolás előtt.
- Éles üzemhez domain, HTTPS redirect URI és Google Cloud projekt kell (consent screen „In production” állapotban, scope: `openid email profile`). Lépések: `docs/runbooks/go-live.md`.
- Az `app:check-config` bekapcsolt funkciónál ellenőrzi a kulcsokat, és blokkolja, ha a Google-végpontok más hostra mutatnak (a tesztstub élesben hamis belépést tenne lehetővé).

## Későbbi

- Google-os újrahitelesítés a jelszó nélküli fiók érzékeny műveleteihez (jelszó helyett).
- A kötés megszüntetése a fiók oldalról (csak jelszóval rendelkező fióknál).
