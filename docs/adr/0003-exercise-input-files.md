# ADR 0003 — Feladathoz mellékelt adatfájlok (bemeneti fájlok)

- **Állapot:** elfogadva (2026-10-01); a kimeneti fájlok külön issue-ban (#220) maradnak
- **Kapcsolódó issue-k:** #152, #220 (kimeneti fájlok), #151 (limitek), #159 (referenciamegoldás)

## Kontextus

Az emelt szintű érettségi programozási feladatai adatfájlt adnak (pl. több száz soros szöveges fájl), amelyet a programnak meg kell nyitnia és fel kell dolgoznia. A modellünk eddig csak `stdin → stdout` volt tesztesetenként, ezért a szerzőknek át kellett írniuk a feladatot úgy, hogy stdin-ről olvasson, ami megváltoztatja, amit a diák gyakorol.

## Döntés

**Bemeneti fájlokat támogatunk; a kimeneti fájlok (`expected_files`) egy követő issue-ba kerülnek.**

### Adatmodell

Egy `exercise_files` tábla, két hatókörrel:

| `test_case_id` | Jelentés | A diák letöltheti |
|---|---|---|
| `NULL` | közös fájl, minden tesztesetnél jelen van | igen |
| kitöltve | csak annál a tesztesetnél van jelen, az azonos nevű közös fájl helyére lép | **soha** |

A tartalom base64-ként tárolódik (`longText`): a fájl tetszőleges bájtsor lehet (pl. Latin-2 vagy cp1250 kódolású szöveg), amit egy `utf8mb4` szövegoszlop nem tudna változatlanul megőrizni. Mellé kerül a méret és az SHA-256.

Korlátok (`config/judge0.php`, `files`): fájlnév `[A-Za-z0-9._-]{1,64}` (a `.` és a `..` kizárva), hatókörönként legfeljebb 5 fájl (a közös fájlok és az egyes tesztesetek felülírásai külön számítanak), fájlonként 256 KB. A Judge0 saját fájljainak nevei (`script.py`, `script.sql`, `Main.cs`, `compile`, `run`) foglaltak, mert egy ilyen nevű adatfájl felülírhatná a megoldást.

### Futtatás

Tesztesetenként a hatékony fájlkészlet (közös fájlok, felülírva a teszteset saját fájljaival) egy zip-be kerül, base64-ben a Judge0 `additional_files` mezőjében. A zip a fájlnevek és hash-ek alapján cache-elődik (`ExecutionFileArchive`), így azonos fájlkészletű tesztesetek és ismételt futtatások nem építik újra. A `SolutionEvaluator` a fájlokat egy-egy lekérdezéssel tölti be az egész kiértékeléshez, nem tesztesetenként. SQL-feladatnál nem küldünk fájlt: ott a teszteset bemenete az adatkészlet-szkript.

### Hozzáférés

- `GET /tasks/{id}/files/{name}` ugyanazt a hozzáférési szabályt használja, mint a feladat (`ContentAccess`): ingyenes lecke mindenkinek, fizetős csak jogosultsággal. Csak közös fájlt keres, ezért a tesztesethez kötött fájl a nevével sem érhető el (404).
- A válasz `Content-Disposition: attachment`, `application/octet-stream` és `nosniff`: a böngésző nem értelmezi a tartalmat.
- A `TaskResource` csak a közös fájlok nevét és méretét adja, tartalmat nem; a zárolt feladatnál a lista is kimarad.
- A rejtett teszteset kimenete (stdout, stderr, fordítási kimenet) továbbra is a `HiddenResultRedactor`-on megy át, így egy rejtett fájl tartalmát a program sem tudja a diáknak kiíratni.

### Előnézet

A munkaterület a fájl első 10 sorát mutatja, de csak érvényes UTF-8 szövegnél; más kódolású vagy bináris fájlnál nem jelenít meg hibás karaktereket. Az előnézet a letöltő végponton át, a megnyitáskor töltődik be, így a feladat betöltése nem függ a fájlok méretétől.

## A kimeneti fájlok miért maradnak ki

A Judge0 csak stdout-ot és stderr-t ad vissza, ezért a megoldás által írt fájlt stdout-on át kellene visszahozni: nyelvenként egy, a beadott kódhoz fűzött záró rész véletlen jelölősor után kiírná a fájlt, a kiértékelő pedig a jelölőnél kettévágná a kimenetet. Az issue szerint ezt valódi Judge0-n kell kipróbálni (a korán `exit()`-et hívó program kihagyná a záró részt), és ha nem megbízható, külön issue-ba kell tenni.

Ehhez a munkához nem volt elérhető valódi Judge0 példány, ezért a megközelítést nem tudtuk kipróbálni, és nem szállítjuk le kipróbálatlanul. A kimeneti fájlok a #220 issue-ban folytatódnak.

## Következmények

- **Élesítés előtt valódi Judge0-n ellenőrizni kell**, hogy egy Python és egy C# megoldás a munkakönyvtárból, relatív néven (`open("adatok.txt")`) megnyitja a fájlt. Az `additional_files` mezőt a kód eddig csak hamis Judge0 szerverrel próbáltuk, a Judge0 saját viselkedését nem.
- A fájlok az adatbázisban vannak (legfeljebb 5 × 256 KB feladatonként és tesztesetenként). Ha ez kevés lesz, a tartalom privát tárolóra (mint a lecke-videók) költözhet; a modell (`bytes()`) és az `ExecutionFileArchive` már egyetlen helyen olvassa.
- Az egyedi név hatókörönként a `ManageExerciseFile` ellenőrzi, nem adatbázis-index: a `NULL` `test_case_id` miatt egy egyedi index a közös fájlokat nem védené.
