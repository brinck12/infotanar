# Mentés és visszaállítás

Mit mentünk, hová, és hogyan állítható vissza. A mentés csak annyit ér, amennyire
vissza lehet állítani belőle: a lap alján lévő próbát élesítés előtt és utána
negyedévente érdemes elvégezni.

## Mi készül

| Mit | Hogyan | Mikor | Megőrzés |
|---|---|---|---|
| MySQL adatbázis | `mysqldump --single-transaction`, gzip | éjszaka 02:30 | 7 napi, 4 heti, 12 havi |
| Számlák (`storage/app/private/invoices`) | `rclone copy` (csak bővül) | éjszaka | korlátlan (számviteli megőrzés) |
| Lecke-videók és feliratok (`…/lesson-videos`) | `rclone copy` | hetente (vasárnap) | korlátlan |
| Deploy előtti pillanatkép | `php artisan db:snapshot-before-migrate` | minden deploy, ha van új migráció | az utolsó 3, **a szerveren** |

A szkript: [`deploy/backup/infotanar-backup.sh`](../../deploy/backup/infotanar-backup.sh).
Az időzítés: `deploy/systemd/infotanar-backup.timer`.

A deploy előtti pillanatkép a szerver lemezén van
(`backend/storage/app/private/db-snapshots/`), ezért lemezhiba ellen nem véd; arra
való, hogy egy rossz migráció után percek alatt vissza lehessen állni.

Amit **nem** mentünk: a `.env` (titkok; jelszókezelőben legyen meg), a naplók, a
cache és a sor. A kód a GitHubon van.

## Egyszeri beállítás a szerveren

1. **Tároló.** Egy S3-kompatibilis bucket másik szolgáltatónál vagy másik
   gépen, mint a szerver. A hozzáférési kulcs csak ehhez a buckethez adjon jogot.
2. **rclone.**
   ```bash
   sudo apt install rclone
   sudo rclone config          # root nevében: a konfiguráció a /root/.config/rclone alá kerül
   ```
   Két tárolót érdemes felvenni: egy sima S3 tárolót (`infotanar-s3`), és arra
   épülő `crypt` típusút (`infotanar-offsite`, cél: `infotanar-s3:<bucket>`).
   A crypt tároló a szerveren titkosít, így a bucketben csak titkosított adat
   van. **A crypt jelszavát és sóját jelszókezelőben is őrizd meg: nélkülük a
   mentés olvashatatlan, és ha csak a szerveren vannak meg, a szerverrel együtt
   elvesznek.**
3. **Szkript, konfiguráció, időzítő.** A lépések a
   `deploy/systemd/infotanar-backup.service` fejlécében vannak. A
   `/etc/infotanar/backup.env` fájlban töltsd ki az adatbázis-jelszót és a
   `BACKUP_REMOTE` értékét (`infotanar-offsite:`).
4. **Első futtatás kézzel**, és a kimenet ellenőrzése:
   ```bash
   sudo systemctl start infotanar-backup
   journalctl -u infotanar-backup -n 30
   sudo rclone ls infotanar-offsite:db/daily
   ```

## Honnan látszik, hogy fut

- `systemctl list-timers infotanar-backup.timer`: a következő és az utolsó futás.
- A szkript siker esetén a `storage/app/private/backup-last-success` fájlba írja
  az időpontot (UTC). Ezt a readiness végpont (#130) is mutatja; 36 óránál
  régebbi érték figyelmeztetés.
- Hiba esetén a unit `failed` állapotba kerül: `systemctl status infotanar-backup`.

## Visszaállítás

### Adatbázis a távoli mentésből

```bash
# 1. Melyik mentés kell?
sudo rclone ls infotanar-offsite:db/daily

# 2. Letöltés
sudo rclone copy infotanar-offsite:db/daily/infotanar-2026-10-01.sql.gz /tmp/restore/

# 3. Az oldal leállítása a visszaállítás idejére
cd /var/www/infotanar/backend && php artisan down
sudo systemctl stop infotanar-queue infotanar-scheduler

# 4. Visszatöltés (a dump eldobja és újra létrehozza a táblákat)
gunzip -c /tmp/restore/infotanar-2026-10-01.sql.gz | mysql -u infotanar -p infotanar

# 5. Ha a kód újabb, mint a mentés: a hiányzó migrációk futtatása
php artisan migrate --force

# 6. Indítás
sudo systemctl start infotanar-queue infotanar-scheduler
php artisan up
```

A mentés és a visszaállítás közötti változások elvesznek. Fizetésnél ez azt
jelenti, hogy a Barionnál megtörtént terhelés nálunk nem látszik: a
`SyncPendingPayments` csak a nálunk is létező fizetéseket egyezteti. Visszaállítás
után a Barion és a Számlázz.hu felületén át kell nézni a kiesett időszakot.

### Adatbázis a deploy előtti pillanatképből

```bash
cd /var/www/infotanar/backend
ls -1 storage/app/private/db-snapshots/        # a legutolsó a legfrissebb
php artisan down
gunzip -c storage/app/private/db-snapshots/<fájl>.sql.gz | mysql -u infotanar -p infotanar
```

Ezután a **korábbi kódot** kell visszatenni (a hibás commit visszavonása és új
deploy), különben a következő deploy újra lefuttatja a hibás migrációt.

### Számlák és videók

```bash
sudo rclone copy infotanar-offsite:invoices /var/www/infotanar/backend/storage/app/private/invoices
sudo rclone copy infotanar-offsite:videos   /var/www/infotanar/backend/storage/app/private/lesson-videos
sudo chown -R www-data:www-data /var/www/infotanar/backend/storage/app/private
```

Hiányzó számla-PDF a Számlázz.hu fiókból is letölthető; az adatbázisban a
számlaszám megvan.

## Visszaállítási próba

Nem az éles adatbázisba, hanem egy eldobható adatbázisba töltünk vissza:

```bash
sudo rclone copy infotanar-offsite:db/daily/<legfrissebb>.sql.gz /tmp/drill/
mysql -u root -p -e "CREATE DATABASE restore_drill"
gunzip -c /tmp/drill/<legfrissebb>.sql.gz | mysql -u root -p restore_drill

# Egyeznek-e a sorok száma a fő táblákban?
for t in users subscriptions payments invoices submissions; do
  mysql -u root -p -N -e "SELECT '$t', (SELECT COUNT(*) FROM infotanar.$t), (SELECT COUNT(*) FROM restore_drill.$t)"
done

mysql -u root -p -e "DROP DATABASE restore_drill"
rm -rf /tmp/drill
```

A sorok száma a mentés óta eltelt idő miatt kissé eltérhet; nagyságrendi
eltérés vagy hiányzó tábla hiba.

A CI minden futásnál elvégzi ugyanezt kicsiben (`backend-mysql` job, „Mentés és
visszaállítási próba”): a valódi szkripttel ment, üres adatbázisba tölt vissza,
és összeveti a sorok számát. Ez a szkriptet ellenőrzi, nem az éles mentést.

| Dátum | Ki | Melyik mentés | Eredmény |
|---|---|---|---|
| *(még nem történt éles próba)* | | | |
