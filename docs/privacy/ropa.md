# Adatkezelési nyilvántartás (GDPR 30. cikk) és feldolgozói lista

Állapot: **tervezet**. A tények a kódból és a `deploy/` mappából származnak;
ami nem derül ki belőlük, az `[KITOLTENDO]`. A szerződéseket (DPA) és a
jogalapokat a jogász tölti ki. Forrás: `docs/roadmap/production-readiness.md`, PRIV-9.

Az adatkezelő: `[KITOLTENDO: cégnév, székhely, elérhetőség, adatvédelmi felelős]`.

## 1. Feldolgozók és rendszerek

| Rendszer | Cél | Adatkategóriák | Hely | DPA | Átviteli alap | Megőrzés (kódból) |
|---|---|---|---|---|---|---|
| Hosting szerver (alkalmazás, fájltár, napló) | Az API, a SPA, a privát fájltár (számlák PDF, leckevideók, feladat-csatolmányok, fájlbeadások) és a naplók futtatása | Minden alább felsorolt adat; naplóban `user_id`, URL, user agent, hibaüzenet (kliens hibajelentés) | `[KITOLTENDO: szolgáltató, ország, régió]` | `[KITOLTENDO]` | `[KITOLTENDO]` | Laravel napló: 14 nap (`LOG_DAILY_DAYS`, `config/logging.php`; a `client` csatorna is); lejárt Sanctum token törlése 24 óra után (`sanctum:prune-expired --hours=24`, naponta); elfelejtett jelszó token érvényessége 60 perc (`config/auth.php`) |
| MySQL 8 (a szerveren) | Fő adatbázis: felhasználók, katalógus, haladás, vizsgakísérletek, előfizetések, fizetések, számlák, auditnapló, sorok és munkamenetek | Név, e-mail, jelszó-hash, szerepkör, haladás, vizsgakísérletek és beadott megoldások, fizetési azonosítók, auditnapló | A hosting szerveren (lásd fent); `[KITOLTENDO: bérelt, saját vagy menedzselt]` | Azonos a hostingéval: `[KITOLTENDO]` | `[KITOLTENDO]` | Fiók törlésekor soft delete, majd a haladás, a hozzáférési jogok, a szóbeli gyakorlás és a beadott fájlok törlése (`AccountDeleted` listenerek); nyitott, tétlen gyakorló vizsgakísérlet lezárása vagy törlése 14 nap tétlenség után (`EXAMS_IDLE_DAYS`, óránként); fájlbeadások és gyakorló vizsgakísérletek törlése 365 nap után (`FILETASKS_RETENTION_DAYS`, naponta 03:30 Budapest); sikertelen sorjobok törlése 720 óra (30 nap) után (`queue:prune-failed`); az auditnapló és a kiszámlázott fizetések megőrzési ideje `[KITOLTENDO: nincs automatikus törlés a kódban]` |
| Redis | Az alkalmazás konfigurációja tartalmazza (`REDIS_*`), de a `.env.example` sor, gyorsítótár és munkamenet alapja `database`; éles használata nem derül ki | `[KITOLTENDO: használja-e éles]` | `[KITOLTENDO]` | `[KITOLTENDO]` | `[KITOLTENDO]` | `[KITOLTENDO]` |
| SMTP szolgáltató (`MAIL_MAILER=smtp`) | Megerősítő, jelszó-visszaállító, megújítási emlékeztető és admin levelek | Név, e-mail cím, levél tartalma (megerősítő és visszaállító linkek) | `[KITOLTENDO: szolgáltató, ország]` | `[KITOLTENDO]` | `[KITOLTENDO]` | `[KITOLTENDO: szolgáltatói napló]`; a `log` mailer éles módban tiltandó (PRIV-5) |
| Off-site mentés (`rclone`, `BACKUP_REMOTE`) | Napi adatbázis-dump és a privát fájltár mentése szerveren kívülre | Teljes adatbázis (gzip dump), számlák, leckevideók (heti), feladat-csatolmányok (heti) | `[KITOLTENDO: tároló, ország]`; ajánlott `crypt` tároló (`deploy/backup/backup.env.example`) | `[KITOLTENDO]` | `[KITOLTENDO]` | Dumpok: napi 7 nap, heti (vasárnap) 28 nap, havi (hónap 1.) 366 nap (`deploy/backup/infotanar-backup.sh`); a fájlmappák `rclone copy`-val mennek, **nincs törlés**: ami a szerverről eltűnik (pl. törölt fiók fájlja), a mentésben megmarad `[KITOLTENDO: döntés]` |
| Judge0 (kódfuttatás) | A diák kódjának futtatása és értékelése | Beküldött forráskód, teszt bemenet és kimenet; felhasználói azonosító nem megy át | A szerver localhostján (`JUDGE0_URL=http://localhost:2358`, `config/judge0.php`); hogy ugyanaz a gép-e, mint az alkalmazás, `[KITOLTENDO: ellenőrizendő]` | Nem külső feldolgozó, ha ugyanaz a szerver: `[KITOLTENDO]` | Nincs átvitel, ha saját szerver | Futtatás után nem tárolt (a backend `POST /run` nem ment); a Judge0 saját adatbázisa `[KITOLTENDO]` |
| Barion Zrt. (fizetés) | Bankkártyás fizetés és előfizetés megújítás (token-terhelés) | Fizetési azonosítók, összeg, állapot, számlázási név és cím, e-mail; kártyaadatot nem kezelünk | Barion `api.barion.com` (`config/billing.php`); `[KITOLTENDO: ország]` | `[KITOLTENDO]` | `[KITOLTENDO]` | Fizetési rekordok megőrzése `[KITOLTENDO: számviteli kötelezettség]`; a számlázás jelenleg halasztott (PRIV-8, REL-2) |
| Számlázz.hu | Számla kiállítása minden sikeres terhelésről | Név, számlázási cím, adószám (ha van), tételek, e-mail | `www.szamlazz.hu` (`config/billing.php`); `[KITOLTENDO]` | `[KITOLTENDO]` | `[KITOLTENDO]` | Számlák megőrzése `[KITOLTENDO: számviteli törvény]`; a PDF a privát fájltárban (`invoices/`) és a mentésben is megvan |
| GitHub Actions (CI és deploy) | Kód építése, tesztelése, telepítése SSH/rsync-kel | Forráskód és titkok (`DEPLOY_SSH_KEY`, `HEALTH_TOKEN`); éles személyes adat nem megy át | GitHub `[KITOLTENDO: régió]` | `[KITOLTENDO]` | `[KITOLTENDO]` | Futási naplók a GitHub beállítása szerint `[KITOLTENDO]` |
| Sentry (JÖVŐBELI) | Hibakövetés (nincs bekötve) | Hibaüzenet, stack, URL, user azonosító; PII-szűrés szükséges | `[KITOLTENDO: EU régió választása]` | `[KITOLTENDO]` | `[KITOLTENDO]` | `[KITOLTENDO]`; élesítés előtt ezt a táblát és a tájékoztatót frissíteni kell |

Megjegyzés a munkamenetről: a SPA Bearer tokennel dolgozik (Sanctum), a token
élettartama alapból 43 200 perc = 30 nap (`SANCTUM_EXPIRATION`, `config/sanctum.php`);
a `SESSION_LIFETIME` 120 perc, a munkamenet-tábla alapból az adatbázisban van.

## 2. A böngésző tárhelye (`localStorage`)

Cookie-t az alkalmazás nem állít be (a kódban nincs `document.cookie`). A kulcsok
a böngészőben maradnak, a szerverre nem mennek. A `{userKey}` a felhasználó azonosítója
vagy `guest`. A "Lejárat" oszlop azt mutatja, amit a kód ténylegesen kikényszerít.

| Kulcs | Cél | Lejárat | Forrás |
|---|---|---|---|
| `infotanar.token` | A Sanctum bejelentkezési token (Bearer) | Kijelentkezéskor törlődik; a token szerveroldali lejárata 30 nap; tiltott tárhelynél csak memóriában él | `shared/api/tokenStore.ts` |
| `infotanar.consent` | A hozzájárulási (Barion Pixel) döntés `{version, decision}` | Nincs időbeli lejárat; verzióváltáskor (`VERSION = 1`) érvénytelen | `shared/consent/consentStore.ts` |
| `infotanar.storageNotice.v1` | Az "eszközön tárolt adatok" értesítés elrejtése | Nincs | `app/shells/SiteNotices.tsx` |
| `infotanar.video.rate` | A lecke videó lejátszási sebessége | Nincs | `features/workspace/components/LessonVideo.tsx` |
| `infotanar.workspace.split.{userId\|guest}` | A munkaterület osztásaránya | Nincs | `features/workspace/pages/TaskSolve.tsx` |
| `infotanar.draft.v1.{userKey}.{taskId}.{language}` | A szerkesztőben írt kód piszkozata | 60 nap (`MAX_AGE_MS`); a lejártat munkamenetenként egyszer `pruneDrafts` törli; legfeljebb 64 000 karakter; a kezdő kóddal egyező nem mentődik | `features/workspace/drafts.ts` |
| `infotanar.draft.v1.{userKey}.{taskId}.lang` | Az utoljára használt nyelv a feladatnál | Nincs (a `pruneDrafts` kihagyja) | `features/workspace/drafts.ts` |
| `infotanar.preferences.v1.{userKey}` | Tanulási beállítások (onboarding), amíg a szerver nem tárolja | Nincs; törlés a `preferences.ts` függvényével | `shared/domain/preferences.ts`, `shared/hooks/useStudyPreferences.ts` |
| `infotanar.oral.v1.{userKey}.{slug}` | A szóbeli tétel önértékelése és gyakorlása (személyes adat) | Nincs időbeli lejárat; kijelentkezéskor nem törlődik (PRIV-7: ellenőrizendő és javítandó) | `features/oral/practice.ts` |
| `infotanar.lastTask.v1.{userKey}` | Az utoljára megnyitott feladat ("folytatás") `{.., openedAt}` | Nincs időbeli lejárat | `shared/domain/lastTask.ts` |

## 3. Nyitott kérdések (jogász és üzemeltetés)

- Jogalapok és adatkategóriánkénti célok véglegesítése, érintetti kör (diákok, szülők, adminisztrátorok).
- Megőrzési idő az auditnaplóra, a fizetési és a számlarekordokra (nincs automatikus törlés a kódban).
- A mentés `copy`-ja nem törli a már törölt fiókok fájljait: törlési kérelem esetén a mentés kezelése.
- Redis tényleges használata és a Judge0 gazdagépe.
- Szóbeli gyakorlás kulcsainak törlése kijelentkezéskor és fióktörléskor (PRIV-7).
