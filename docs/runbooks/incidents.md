# Teendők üzemzavar esetén

Első lépés mindig az állapot lekérdezése; megmondja, melyik rész áll:

```bash
curl -s -H "X-Health-Token: <token>" https://<domain>/api/v1/health/ready
```

Naplók a szerveren: `backend/storage/logs/laravel-<dátum>.log` (szerver),
`client-<dátum>.log` (böngészőben keletkezett hibák); a háttérfolyamatoké
`journalctl -u infotanar-queue` és `-u infotanar-scheduler`.

A parancsok a `/var/www/infotanar/backend` mappából futtatandók.

## A sor torlódik, vagy a worker / scheduler életjele régi

**Tünet:** a readiness `queue_worker`, `scheduler` vagy `queue_backlog` sora
`failed`; nem mennek ki levelek, a fizetések „feldolgozás alatt” maradnak.

```bash
systemctl status infotanar-queue infotanar-scheduler
sudo systemctl restart infotanar-queue infotanar-scheduler
php artisan queue:failed                 # végleg elbukott jobok
php artisan queue:retry all              # újrapróbálás, ha az ok megszűnt
```

A billing jobok ismételhetők: az újrafuttatás nem okoz dupla terhelést vagy
dupla számlát.

## Fizetés „függőben” maradt

**Tünet:** a vásárló fizetett, de az előfizetése nem indult el; vagy a
`ReportStuckBilling` riasztott (`payments_pending_over_24h`).

A Barion visszajelzése (callback) elveszhet; a `SyncPendingPayments` 5 percenként
pótolja, ha a scheduler és a worker fut. Kézzel:

```bash
php artisan tinker --execute='App\Jobs\SyncPendingPayments::dispatchSync();'
```

Ha ezután is függő: a Barion felületén a fizetés állapota a mérvadó. A mi
oldalunkon a fizetés a `payments` táblában a `request_id` (a Barionnál:
PaymentRequestId) alapján kereshető.

## Számla nem készült el

**Tünet:** riasztás „A Számlázz.hu véglegesen elutasított egy számlát”, vagy a
vásárló nem kapott számlát.

1. Admin felület → **Számlák**: itt látszik az elakadt számla és a Számlázz.hu
   hibaüzenete.
2. Ha a vevő adata hibás (pl. adószám): javítás ugyanitt, majd **Újraküldés**.
3. Ha a beállítás hibás (Agent-kulcs, ÁFA-kulcs): a `.env` javítása,
   `php artisan config:cache`, majd **Újraküldés**.

Újraküldés előtt a rendszer lekérdezi, készült-e már számla ehhez a fizetéshez,
így dupla számla nem keletkezik. Átmeneti hibánál (a Számlázz.hu nem elérhető)
nincs teendő: 15 percenként magától újrapróbálja.

## A megújítások nem futnak

**Tünet:** az előfizetések időszaka lejárt, de nincs új fizetés.

- Fut-e a scheduler? (readiness `scheduler`)
- `journalctl -u infotanar-queue | grep -i renewal`
- Kézi indítás: `php artisan tinker --execute='App\Jobs\ProcessDueSubscriptions::dispatchSync();'`

Egy időszakra egy kísérlethez egy terhelés tartozik, ezért a kézi indítás
biztonságos.

## A kódfuttatás nem működik

**Tünet:** a „Futtatás” hibát ad; a readiness `judge0` sora `degraded`.

```bash
curl -H "X-Auth-Token: <token>" http://localhost:2358/about
docker ps | grep judge0                  # ha a Judge0 Dockerben fut: élnek-e a konténerei
```

Az oldal többi része (tananyag, belépés, fizetés) ilyenkor is működik. Ha a
futtatás lassú, de nem hibás: egy beadás a kiértékelés idejére egy php-fpm
workert foglal (legfeljebb 45 mp), sok egyidejű beadás az egész oldalt
lelassítja (#149 oldja meg).

## Elfogyott a lemez

**Tünet:** a readiness `disk` sora `degraded` vagy `failed`.

```bash
df -h
du -sh storage/logs storage/app/private/* | sort -h
```

Tipikus okok: naplók (`LOG_STACK=daily` esetén 14 nap után törlődnek), a deploy
előtti mentések (`storage/app/private/db-snapshots`, az utolsó három marad),
videók.

## Egy deploy elrontott valamit

1. A hibás commit visszavonása (`git revert`) és push a `main`-re: a pipeline
   újra deployol.
2. Ha a hiba egy **migráció**, előbb az adatbázis visszaállítása a deploy előtti
   pillanatképből, lásd a [mentési runbookot](backup-restore.md).

Automatikus visszaállás még nincs (#180).

## Egy fiók feltörése gyanús

Admin felület → Felhasználók. A felhasználó jelszó-visszaállítást kérhet az
„Elfelejtett jelszó” oldalon: ez minden eszközön kijelentkezteti. Admin
jogosultság elvétele:

```bash
php artisan user:role <e-mail> student
```
