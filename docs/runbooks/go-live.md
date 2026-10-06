# Élesítési ellenőrzőlista

Sorrendben végrehajtandó lépések az első valódi vásárló előtt. Mindegyik mellett
az áll, hogyan ellenőrizhető. A lista a kódban meglévő feltételeket követi; ami itt
nincs kipipálva, az élesben el fog törni vagy észrevétlen marad.

## 1. Szerver és elérés

- [ ] **Csomagok** telepítve: nginx, PHP 8.3 + php-fpm, MySQL 8, **Python 3**, certbot, rclone.
      Ellenőrzés: `python3 --version` (nélküle a feladatok kódszabályai csendben nem érvényesülnek).
- [ ] **HTTPS**: tanúsítvány és a [`deploy/nginx/infotanar.conf`](../../deploy/nginx/infotanar.conf) telepítve.
      Ellenőrzés: `curl -I http://<domain>` 301-et ad; `curl -I https://<domain>` válaszában ott a `Strict-Transport-Security`.
- [ ] **Judge0** fut, és csak localhostról érhető el.
      Ellenőrzés: a szerveren `curl -H "X-Auth-Token: <token>" http://localhost:2358/about`; kívülről a 2358-as port zárva.

## 2. Konfiguráció

- [ ] A szerver `.env`-je tartalmazza a [`backend/.env.example`](../../backend/.env.example) „Éles környezet” részének minden kulcsát.
      Ellenőrzés: `php artisan app:check-config --strict` → „A konfiguráció éles üzemre alkalmas.”
- [ ] `APP_URL` és `FRONTEND_URL` a végleges `https://` cím (ezekből épülnek a levelek linkjei és a Barion visszairányítás).
- [ ] **Levelezés**: valódi SMTP, a feladó domainjén SPF és DKIM beállítva.
      Ellenőrzés: regisztráció egy külső címmel; a megerősítő levél megérkezik, és nem a spamben köt ki.
- [ ] `ALERT_EMAIL` beállítva (ide jönnek a riasztások), `HEALTH_TOKEN` generálva (`openssl rand -hex 32`).
- [ ] GitHub: `DEPLOY_URL` és `HEALTH_TOKEN` secret, `DEPLOY_STRICT_CONFIG=true` változó.

## 3. Háttérfolyamatok

- [ ] **Queue worker és scheduler** systemd unitként fut (`deploy/systemd/infotanar-queue.service`, `infotanar-scheduler.service`, #64).
      Ellenőrzés: `curl -H "X-Health-Token: <token>" https://<domain>/api/v1/health/ready` → a `scheduler` és a `queue_worker` `ok`.
- [ ] Az **első admin** létrehozva: `php artisan user:role <e-mail> admin`.

## 4. Mentés

- [ ] Szerveren kívüli tároló, rclone (crypt) és az időzítő beállítva a [mentési runbook](backup-restore.md) szerint.
- [ ] **Visszaállítási próba elvégezve**, és a runbook táblázatába beírva.
      Ellenőrzés: a readiness `backup` sora `ok`.

## 5. Fizetés és számlázás

- [ ] **Számlázz.hu teszt Agent-kulccsal egy valódi kérés végigfuttatva** ([ADR 0002](../adr/0002-invoicing-provider.md)): az XML-t elfogadja, a számla e-mailben megérkezik, a PDF letölthető. A próba fedje le azt az esetet is, amikor a kelt későbbi, mint a teljesítés (késleltetett kiállítás).
- [ ] `SZAMLAZZ_VAT_RATE` a könyvelővel egyeztetve.
- [ ] **Barion teszt környezetben** végigvitt folyamat: első fizetés, megújítás, sikertelen megújítás és újrapróbálkozás, kártyacsere, lemondás. Ellenőrizendő az is, hogy a megújítás elutasításakor a Barion melyik hibát adja ([#138](https://github.com/brinck12/infotanar/issues/138) feltételezése: az el sem induló terhelés végleges, az elindult és elutasított újrapróbálható).
- [ ] Barion **éles** bolt jóváhagyva: logó a láblécben (`frontend/src/assets/barion-card-acceptance.svg`), Pixel-azonosító beállítva, a jóváhagyási lista az [ADR 0001](../adr/0001-payment-provider.md) táblázata szerint.
- [ ] `BARION_ENVIRONMENT=prod`, éles `BARION_POS_KEY`, `BARION_PAYEE`; éles `SZAMLAZZ_AGENT_KEY`.

## 6. Jogi szövegek

- [ ] Az ÁSZF, az adatkezelési tájékoztató és az impresszum **végleges, jogász által átnézett** szövege a `frontend/src/features/legal/content` alatt; a vázlat-jelölő sor törölve, a verzió és a hatály léptetve a `documents.ts`-ben.
      Ellenőrzés: a frontend build nem ír ki „még vázlat” figyelmeztetést.
- [ ] A fizetés előtti nyilatkozat szövege (Előfizetés oldal) a jogásszal egyeztetve.
- [ ] Döntés arról, hogy a Barion alap Pixel betölthet-e a hozzájárulás előtt (`BARION_PIXEL_REQUIRES_CONSENT`).

## 7. Tartalom

- [ ] A mintafeladatok helyett valódi tananyag; minden publikált feladatnak van látható tesztesete, és egy helyes megoldás minden teszteseten átmegy.
- [ ] Az első két lecke ingyenes jelölése rendben (`CATALOG_FREE_LESSONS_PER_TRACK`).

## 8. Éles próba

Egy saját kártyával, valódi pénzzel:

- [ ] Regisztráció → megerősítő levél → belépés.
- [ ] Ingyenes feladat futtatása és beadása; a haladás megjelenik.
- [ ] Előfizetés: a Barion oldalán fizetés, visszatérés, „elindult az előfizetésed” levél, a prémium tartalom megnyílik.
- [ ] A számla e-mailben megérkezik, és a fizetési előzményekből letölthető; a dátumai helyesek.
- [ ] Lemondás → levél → visszavonás → levél.
- [ ] A próbafizetés visszatérítése a Barion és a sztornó számla a Számlázz.hu felületén (alkalmazáson belüli visszatérítés még nincs, [#163](https://github.com/brinck12/infotanar/issues/163)).
- [ ] Egy szándékosan elrontott job (pl. hibás `SZAMLAZZ_AGENT_KEY` egy tesztfizetésnél) riasztó levelet küld az `ALERT_EMAIL` címre.

## Élesítés után

- A `storage/logs/client-*.log` átnézése az első napokban (a böngészőben keletkezett hibák).
- A readiness végpont külső figyelése (bármilyen uptime-figyelő, a `HEALTH_TOKEN` fejléccel).
