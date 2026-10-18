# Szerzői útmutató a tananyag-íráshoz

Ez a lap a leckék és feladatok írásának szabályait foglalja össze. A formátum részletei: `../README.md`. A teljes terv: `../../docs/roadmap/lesson-plan.md`. Referencia lecke: `catalog/programozas/01-alapok/01-kiiras-es-bevitel/`.

## Lecke (`lesson.md`)

- Magyarul, tegező, barátságos, rövid mondatokban; a diák **nulláról** indul, ezért minden új fogalmat az első használatnál magyarázz el, hasonlattal és példával. Ne használj olyan fogalmat, amelyet korábbi lecke nem tanított.
- Felépítés: bevezető kérdés vagy cél, 4–7 `##` szakasz (új fogalmanként egy), minden szakaszban egy kis példa és "Próbáld ki" felszólítás, `## Gyakori hibák`, `## Összefoglalás`.
- Nyelvfüggő részekhez `::: python` / `::: csharp` szakaszok (kódblokkal együtt); ami nyelvfüggetlen, a szakaszokon kívül áll. C# kód a leckében lehet egy-két utasítás, de legalább az első teljes példa teljes program (`using System;`, `class Program`, `static void Main()`).
- A front matter: `slug` (kisbetűs, ékezet nélküli, kötőjeles), `title`, `position` (a modulon belüli sorszám 0-tól), `free` (csak a sáv első két leckéje `true`), `published: false`, üres `reviewed_by` és `reviewed_at`.
- Hossz: 700–1400 szó. Ne tölts szöveget; a példák hasznosak, a kimenetet mindig írd ki.

## Feladat (`exercises/NN-cim.yml`)

- `slug` = a `title` Str::slug-ja (ékezetek le, kisbetű, szóköz → `-`, írásjelek ki). `position` 0-tól, `kind: code` (SQL-nél `kind: sql`), `level: kozep|emelt`, `difficulty` 1–5, `published: false`.
- `description` Markdown: mi a feladat, példa bemenet/kimenet, az utolsó bekezdés `Tipp:`. A kimeneti formát pontosan add meg (pl. `Összeg: 12`).
- `starter_code` és `sample_solutions`: **mindkét nyelven** (`python`, `csharp`). A C# kód teljes program, **C# 7.3** (Mono): nincs top-level utasítás, nincs `!`, nincs `switch` kifejezés, nincs `is not`, nincs `record`, nincs `using` deklaráció, nincs `??=`. Pythonban standard könyvtár.
- `tests`: legalább 1 látható (`hidden: false`) és 3 rejtett eset; a rejtettek között legyen szélső eset (0, negatív, egy elem, üres/hosszú szöveg). A `stdin` és az `expected` sortöréssel végződik. A kimenet legyen determinisztikus (nincs véletlen, nincs időbélyeg).
- **Kerüld az ékezetes kimenetet** a tesztekben (a Mono kódolása a szerver nyelvi beállításától függ); az ékezet a feladatleírásban és a bemenetben rendben van, de a program kimenetébe ne kelljen ékezetes betű. Ha mégis kell, a kimeneti szöveg legyen ékezetmentes ("az ékezetmentes kiírás is elfogadott" az érettségin is).
- Egy lecke 3–5 feladata nehezedjen: 1. kitöltendő/átírandó, 2. önálló, 3. más szövegkörnyezetben, 4–5. kihívás (`difficulty` 3+). A feladat szövege szakmailag legyen pontos, a kimenet a leírásból egyértelműen következzen.
- A feladat ne ismételje a lecke példáját szó szerint, de csak a lecke (és az előzők) anyagát kérje.

## Ellenőrzés (kötelező, mielőtt végzel)

```bash
python content/tools/verify_local.py content/catalog/<sáv>/<modul>/<lecke>   # minden mintamegoldás átmegy a teszteken, Python és C# is
cd backend && php artisan catalog:import --dry-run                          # séma- és szabályellenőrzés
```

A helyi ellenőrzés nem helyettesíti a valódi Judge0-t (`catalog:verify --drafts --negative`), de a fordítási és logikai hibákat kiszűri. Egy hibás mintamegoldás vagy rossz elvárt kimenet a diákot rosszra tanítja: minden tesztet ellenőrizz.

## SQL-feladatok

`kind: sql`, `allowed_languages: [sql]`, `sample_solutions: {sql: ...}`. A teszteset `stdin`-je az adatkészletet felépítő szkript (`CREATE TABLE` + `INSERT`), az `expected` a CSV-kimenet **fejlécsorral** (`.headers on`, `.mode csv`). A sorrend nem számít, kivéve ha `sql_order_sensitive: true`. **MariaDB-forma:** a diák SQL-je SQLite-on fut, de a futtató (`backend/resources/sql/mariadb_runner.py`) az érettségi MariaDB-jének gyakori függvényeit regisztrálja: `YEAR`, `MONTH`, `DAY`, `HOUR`, `MINUTE`, `SECOND`, `DATE`, `TIME`, `DATEDIFF`, `ADDDATE`, `SUBDATE`, `DAYOFWEEK`, `DAYNAME`, `MONTHNAME`, `LAST_DAY`, `DATE_FORMAT`, `NOW`, `CONCAT`, `CONCAT_WS`, `LEFT`, `RIGHT`, `LPAD`, `RPAD`, `LOCATE`, `SUBSTRING`, `CHAR_LENGTH`, `UCASE`, `LCASE`, `IF`, `FLOOR`, `CEIL`, `TRUNCATE`, `MOD`, `POW`, `SQRT`, `GREATEST`, `LEAST` és még néhány. A `/` tört osztás (`7 / 2` = `3.5`), a `#` megjegyzés, a `CREATE DATABASE` és a `USE` hatástalan, a `CREATE TABLE`-ben az `AUTO_INCREMENT`, az `ENGINE=`, a `CHARSET` és a `COLLATE` elfogadott, a `TRUNCATE TABLE` töröl. **A leckék és a mintamegoldások ezért a MariaDB-formát tanítják, nem az SQLite-ét** (`YEAR(d)`, nem `strftime`; `CONCAT`, nem `||`; `IF`, nem `IIF`). Amit a futtató nem ismer, azt ne írd bele: `RIGHT/FULL JOIN`, ablakfüggvény, `RETURNING`, `DIV`, `INTERVAL`, `TIMESTAMPDIFF`, `GROUP_CONCAT(... SEPARATOR ...)`. A kétparaméteres `ROUND(x, n)` az SQLite-é marad (a kimenet `2500.0`), a `LENGTH` karaktert számol (a MariaDB-ben bájtot): a leckék a `CHAR_LENGTH`-et tanítják. Üres eredménynél a futtató semmit sem ír ki, a fejlécet sem: az `expected` ilyenkor `""`. Új függvényt a `mariadb_runner.py` `register` függvényében vegyél fel, és futtasd újra az összes SQL-feladat ellenőrzését.
