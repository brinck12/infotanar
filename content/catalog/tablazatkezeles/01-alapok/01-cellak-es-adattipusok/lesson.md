---
slug: cellak-es-adattipusok
title: Cellák és adattípusok
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

*Érettségi szint: közép (a szövegfájl importálása karakterkódolással és az egyéni számformátum: emelt).*

## A táblázat felépítése

A táblázatkezelő programban (Microsoft Excel vagy LibreOffice Calc) az adatok **cellákban** vannak. A cella egy oszlop és egy sor metszéspontja, a címe az oszlop betűjéből és a sor számából áll: a `B3` a B oszlop harmadik sora. Több cella együtt a **tartomány**, például `A2:C9` (az A2 és a C9 által kijelölt téglalap). Egy fájl több **munkalapot** tartalmazhat, ezek a lapfülekkel váltogathatók.

## Mi lehet egy cellában?

Négy dolog fér egy cellába:

| Tartalom | Példa | Hogyan ismered fel? |
|---|---|---|
| szöveg | `Kovács Anna`, `11.A` | alapból balra igazodik |
| szám | `42`, `3,5` | alapból jobbra igazodik |
| logikai érték | `IGAZ`, `HAMIS` | középre igazodik |
| képlet | `=B2*C2` | `=` jellel kezdődik, a cellában az eredmény látszik |

Képlet esetén a **cellában az eredményt**, a **szerkesztőlécen** (képletsorban) a képletet látod. Ha azt kérik, hogy „másold ki a képletet”, a szerkesztőlécet nézd.

Magyar beállításnál a tizedesjel a **vessző** (`3,5`), a függvényargumentumokat **pontosvessző** választja el: `=SZUM(A1;A2)`. Ha pontot írsz tizedesjelnek, a program gyakran szövegnek vagy dátumnak tekinti az értéket.

## Számformátumok

A cella **értéke** és a **megjelenése** két külön dolog. A számformátum csak azt változtatja meg, hogyan látszik az érték; a tárolt szám ugyanaz marad. Beállítása: jelöld ki a cellákat, majd `Ctrl+1` (Cellák formázása) > `Szám` fül (Excel), illetve `Számok` fül (LibreOffice).

| Eredeti érték | Formátum | Megjelenés |
|---|---|---|
| 1234567,891 | Szám, 2 tizedes, ezres tagolással | `1 234 567,89` |
| 0,27 | Százalék, 0 tizedes | `27%` |
| 1500 | Pénznem (Ft) | `1 500 Ft` |
| 46312 | Dátum (éééé.hh.nn.) | `2026.10.17.` |
| 0,75 | Idő (ÓÓ:PP) | `18:00` |

A táblázatkezelő a **dátumot sorszámként** tárolja: egy kezdőnap óta eltelt napok számaként. A `2026.10.17.` ezért a `46312`, a másnap a `46313`. Az **idő** a nap törtrésze: a `12:00` a `0,5`, a `18:00` a `0,75`. Ezért lehet dátumokat kivonni egymásból (az eredmény napokban adódik), és ezért látsz néha ötjegyű számot egy dátum helyén: a cella formátuma „Szám”, ezt kell dátumra váltani.

A százalék formátum a számot **100-zal szorozva** jeleníti meg: a `0,27` értékű cellára állítva `27%` látszik. Ha a formátum beállítása után írod be, hogy `27`, a program `27%`-ot ért alatta, és `0,27`-et tárol.

A tizedesjegyek számát a `Tizedesjegy növelése/csökkentése` gombbal is állíthatod. Ez is csak a megjelenést érinti, a későbbi számítások a pontos értékkel dolgoznak. Ha magát az értéket kell kerekíteni, függvény kell hozzá (KEREKÍTÉS, lásd a függvényes modulban).

## Saját számformátum (emelt szint)

A Cellák formázása ablak **Egyéni** (Excel) vagy **Formátumkód** (LibreOffice) részében szöveges mértékegységet is hozzátehetsz a számhoz idézőjelben:

| Formátumkód | Érték | Megjelenés |
|---|---|---|
| `0 "s"` | 1260 | `1260 s` |
| `0,00 "m/s"` | 3,3333 | `3,33 m/s` |
| `# ##0 "m"` | 4200 | `4 200 m` |

A cellában továbbra is szám van, ezért számolhatsz vele.

## Szöveges fájl importálása (emelt szint)

Az emelt szintű feladat jellemzően szöveges fájlt (`.txt`, `.csv`) ad, amelyet be kell olvasni. Az adatok egy sorban szóközzel, tabulátorral vagy pontosvesszővel elválasztva állnak.

- **Excel**: `Adatok` > `Szövegből/CSV` (régebbi változatban `Adatok` > `Szövegből`). Itt választod ki a fájl eredetét (karakterkódolás), az elválasztó jelet, majd `Betöltés`.
- **LibreOffice Calc**: `Fájl` > `Megnyitás`, és a `.txt` vagy `.csv` fájlt kiválasztva megjelenik a **Szövegimportálás** ablak.

Három beállításra figyelj:

1. **Karakterkódolás**: ha az ékezetes betűk elromlanak (`Ã¡`, `?`), rossz a kódolás. Magyar szövegnél a szokásos lehetőségek az **Unicode (UTF-8)**, a **Közép-európai (Windows-1250)** és a **Közép-európai (ISO-8859-2)**. Próbáld végig, amíg az ékezetek helyesek.
2. **Elválasztó**: tabulátor, pontosvessző, vessző vagy szóköz; az előnézetben látod, jó-e az oszlopokra bontás.
3. **Oszlopok típusa**: ha egy azonosító elején nullák vannak (`007`), az oszlopot szövegnek kell állítani, különben a nulla elvész.

Ellenőrizd az importálás után: a számok jobbra igazodnak-e? Ha balra, szövegként érkeztek (például tizedespont miatt), ezt javítani kell.

## Gyakorold

1. Írd be az `A1` cellába: `0,5`, majd állítsd százalék formátumra. Mit látsz, és mi az `A1` valódi értéke?
2. Mi jelenik meg a `46313` értékű cellában, ha dátum formátumú?
3. Milyen egyéni formátumkóddal jelenik meg a `4200` érték így: `4 200 m`?
4. Az importált fájlban az ékezetes betűk helyén „Ã©” látszik. Mit teszel?

**Megoldás**

- 1. `50%` látszik, az érték `0,5`.
- 2. `2026.10.18.`, mert a 46312 a 2026.10.17., és a következő nap a következő szám.
- 3. `# ##0 "m"`.
- 4. Újra importálod a fájlt, és más karakterkódolást (például UTF-8) választasz.

## Gyakori hibák

- A tizedesjel helyén pontot írsz, és a szám szöveg vagy dátum lesz.
- A kerekítésnek hitt formátumot használsz: `1,666` kijelzése `1,67`, de a továbbszámolt érték az eredeti.
- Importnál az első sor fejléc, mégis adatnak veszed (vagy fordítva).
- A szöveggé alakult számot nem veszed észre, és a SZUM nem adja össze.

## Összefoglalás

A cella tartalma szöveg, szám, logikai érték vagy képlet lehet. A számformátum csak a megjelenést szabályozza, az érték változatlan. A dátum sorszám, az idő a nap törtrésze. Szövegfájl importálásánál a karakterkódolás, az elválasztó és az oszloptípus a három kulcsbeállítás. A cella, tartomány, munkalap, adattípusok és az alap számformátumok közép szintű, az import és az egyéni formátum emelt szintű anyag.
