# Külső uptime figyelő (OPS-11)

Az `OperatorAlert` ugyanazon az alkalmazáson és levelezésen megy, amit figyel,
ezért egy leállt app vagy scheduler nem tud magáról szólni. Kell egy, a
szervertől független külső figyelő (UptimeRobot, Better Stack vagy hasonló;
az ingyenes csomag elég).

## 1. Amit figyelni kell

| Monitor | URL | Gyakoriság | Siker feltétele |
|---|---|---|---|
| Elérhetőség | `https://<domain>/api/v1/health` | 1 perc (ingyenes csomagon 5) | HTTP 200 |
| Részletes állapot | `https://<domain>/api/v1/health/ready` | 5 perc | HTTP 200 (a `failed` 503) |
| Frontend | `https://<domain>/` | 5 perc | HTTP 200 |

- A `/health/ready` részletei csak az `X-Health-Token` fejléccel látszanak; a
  token a szerver `.env`-jében a `HEALTH_TOKEN`. Adj a monitornak egyéni
  fejlécet: `X-Health-Token: <token>`. A tokent csak a monitorba és a
  jelszókezelőbe másold, ne e-mailbe vagy chatbe.
- A végpont korlátja 30 kérés/perc, a fenti gyakoriságok bőven alatta vannak.
- A readiness `failed` esetén 503-at ad, `degraded` (figyelmeztetés) esetén
  200-at: a státuszkód elég a leálláshoz. A figyelmeztetésekhez (pl. közelgő
  lemez-telítettség) a monitorban kulcsszó-ellenőrzés kell: a törzs ne
  tartalmazza a `degraded` szót ("keyword must not exist"), enyhébb, nem
  hívó riasztási szinttel.
- A readiness lefedi a scheduler és a queue worker életjelét, a sor
  torlódását, a lemezt és a mentés korát (36 óra), így ezekre nem kell külön monitor.

## 2. Riasztási kapcsolattartók

- Elsődleges: e-mail, **nem** az app saját levelezőjéről és nem az `ALERT_EMAIL`
  postaládájával azonos szolgáltatónál, ha lehet (külön szolgáltatás).
- Másodlagos: push az üzemeltető telefonjára (a monitor appja), vagy Telegram/Slack webhook.
- Eszkaláció: ha 15 percen belül nincs nyugtázás, ismételt riasztás a második kapcsolattartónak.
- Késleltetés: 2 egymást követő sikertelen ellenőrzés után riasszon (1 perces
  monitornál ez 2 perc), hogy egy deploy közbeni `php artisan down` ne okozzon
  téves riasztást. Tervezett karbantartásra a monitor "maintenance window" funkcióját használd.
- Állapotoldal (státusz oldal) a béta alatt nem kötelező.

## 3. Dead-man's-switch (opcionális, de ajánlott)

A readiness `scheduler` sora csak akkor jelez, ha valaki lekérdezi. Teljes
függetlenséghez a scheduler `health-heartbeat` feladata (`routes/console.php`,
percenként) pingelhet egy Healthchecks.io-típusú URL-t is: ha a ping elmarad
5 percnél tovább, a szolgáltatás riaszt. Ez még nincs bekötve; amíg nincs,
a readiness monitor 5 perces gyakorisága adja a felső becslést a scheduler
leállásának észlelésére.

## 4. Mit nézz meg riasztáskor

Első lépés mindig ugyanaz, kívülről és a szerveren is:

```bash
curl -si https://<domain>/api/v1/health                                   # él-e egyáltalán
curl -s -H "X-Health-Token: <token>" https://<domain>/api/v1/health/ready  # melyik rész áll
```

| Tünet | Valószínű ok | Teendő |
|---|---|---|
| Nincs válasz / időtúllépés | szerver, nginx vagy php-fpm áll; tűzfal; DNS/tanúsítvány | `systemctl status nginx php8.3-fpm`, a tanúsítvány lejárata: `sudo certbot certificates`; a szolgáltatói panelen a gép állapota |
| 503 | `php artisan down` maradt bekapcsolva egy félbemaradt deploy után | `php artisan up`; a deploy naplója a GitHub Actionsben |
| 500 a `/health`-en | PHP hiba, hibás `.env`, adatbázis nem elérhető | `storage/logs/laravel-<dátum>.log`, `systemctl status mysql`, `php artisan app:check-config` |
| readiness: `scheduler` vagy `queue_worker` failed | a worker vagy a scheduler leállt | `systemctl status infotanar-queue infotanar-scheduler`, újraindítás; részletek: docs/runbooks/incidents.md |
| readiness: `queue_backlog` | a sor torlódik, a Redis/MySQL lassú | docs/runbooks/incidents.md, docs/runbooks/redis.md (6. pont) |
| readiness: `disk` | betelt a lemez (logok, mentések, feltöltések) | `df -h`, `du -sh /var/www/infotanar/backend/storage/*`, régi logok és mentések törlése |
| readiness: `backup` | az éjszakai mentés 36 órája nem futott | docs/runbooks/backup-restore.md; a mentés szolgáltatás naplója |
| csak a frontend (`/`) piros | nginx statikus gyökér, hibás deploy | az utolsó deploy; `nginx -t`; a `frontend/dist` megléte |

Riasztás után: nyugtázd a monitorban, jegyezd fel az okot és az időtartamot a
docs/runbooks/incidents.md végén, és ha a hiba a szerver oldalán megismétlődhet,
vegyél fel rá teendőt a docs/roadmap/production-readiness.md-ben.

## 5. Beállítás után

- Próbariasztás: a monitort ideiglenesen irányítsd egy nem létező útvonalra, és ellenőrizd, hogy mindkét csatornán megérkezik a riasztás, majd állítsd vissza.
- A `HEALTH_TOKEN` cseréjekor a monitor fejlécét is frissíteni kell.
- A monitor elérhetőségét és a kapcsolattartókat negyedévente nézd át.
