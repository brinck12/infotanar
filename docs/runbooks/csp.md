# Runbook: Content-Security-Policy ellenőrzése

A CSP kényszerítő (enforcing) fejléc, a `deploy/nginx/snippets/infotanar-security-headers.conf` állítja be. A Monaco szerkesztő és a betűtípusok saját originről jönnek, külső CDN nincs; az egyetlen külső host a `pixel.barion.com` (Barion Pixel, csak hozzájárulás után tölt).

## Ellenőrzés a böngészőben (minden deploy után, éles és staging)

1. Nyiss privát ablakot, nyisd meg a DevTools konzolt (F12), a szűrőben hagyd bekapcsolva az Errors szintet.
2. Járd végig: főoldal, tanulási út, egy lecke, egy feladat (`/feladatok/<id>`: a szerkesztőnek meg kell jelennie, a Futtatás működik), árak, belépés.
3. A konzolban ne legyen `Refused to load/execute/apply ... because it violates the following Content Security Policy directive` hiba.
4. Network fül: nincs kérés `cdn.jsdelivr.net` vagy más idegen host felé (kivétel: a cookie-sávon elfogadás után `pixel.barion.com`).
5. A fejlécet is nézd meg: `curl -sI https://<domain>/ | grep -i content-security`. Csak `Content-Security-Policy` szerepelhet kényszerítőként.

## Ha egy hiba jelenik meg

- A hibaüzenet megmondja a direktívát és a tiltott URL-t. Ha az a mi kódunk jogos forrása, vedd fel a megfelelő direktívába (a snippetben), `nginx -t && systemctl reload nginx`.
- Idegen host ne kerüljön fel gondolkodás nélkül; előbb döntsd el, kell-e a funkció.
- Szigorítás kipróbálása éles törés nélkül: a snippet végén a `Content-Security-Policy-Report-Only` sor kommentje szerint, az enforcing mellett. A jelentett sértések a konzolon látszanak; ha nincs több, cseréld az enforcing szövegét.

## Ismert bizonytalanság

- A Barion Pixel (`bp.js`) további hostokat is elérhet. Ha hozzájárulás után konzolhiba jön, bővítsd a `script-src`, `img-src` vagy `connect-src` listát a jelzett hosttal.
- `style-src 'unsafe-inline'` marad (a Monaco és a React stílusattribútumai miatt).
