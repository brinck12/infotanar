---
slug: tartalomjegyzek-es-kordokumentum
title: "Tartalomjegyzék és kördokumentum"
position: 7
free: false
published: false
reviewed_by:
reviewed_at:
---

Két olyan funkciót ismersz meg, amely a szövegszerkesztő "automatikus" oldalát mutatja: a **tartalomjegyzék** a címsorokból épül fel, a **kördokumentum** pedig egyetlen sablonból sok személyre szóló levelet állít elő egy adattáblázat alapján.

**Érettségi szint:** emelt. A tartalomjegyzék stílusok felhasználásával és a kördokumentum-készítés emelt szintű követelmény (a vizsgaszintet a hivatalos követelményrendszerben is ellenőrizd), az alapjaik megértése azonban a középszintű munkát is segíti.

## Tartalomjegyzék

A tartalomjegyzék a dokumentum címsorainak és oldalszámainak listája. Ha a címsorokat **Címsor 1, Címsor 2, Címsor 3 stílussal** formáztad (lásd a stílusok leckét), a program ezekből kész jegyzéket generál.

### Előfeltétel: stílusok

1. Minden fejezetcím kapja a Címsor 1 stílust.
2. Az alfejezetek a Címsor 2, az al-alfejezetek a Címsor 3 stílust kapják.
3. Ne formázd kézzel a címsorokat: a kézzel nagyított szöveg nem kerül be a jegyzékbe.

### Beszúrás

- **Word:** állítsd a kurzort oda, ahol a jegyzék lesz (általában az első oldal, a címlap után), majd Hivatkozások > Tartalomjegyzék > Automatikus tartalomjegyzék. A testreszabáshoz: Tartalomjegyzék > Egyéni tartalomjegyzék. Itt megadhatod:
  - a megjelenített szintek számát (például 3),
  - a kitöltő karaktert (pontsor) és az oldalszámok jobbra igazítását,
  - hogy az oldalszámok legyenek-e láthatók,
  - a formátumot: a Módosítás gomb a TJ 1, TJ 2 stb. stílusokat nyitja meg.
- **LibreOffice Writer:** Beszúrás > Tartalomjegyzék és mutatók > Tartalomjegyzék, index vagy irodalomjegyzék. A párbeszédablak Típus fülén a szintek számát, az Elemek fülön a sorok szerkezetét (cím + tabulátor + oldalszám), a Stílusok fülön a jegyzék sorstílusait állítod.

### Frissítés

A tartalomjegyzék nem követi automatikusan a változásokat: ha módosítod a címsort vagy új oldalak kerülnek a dokumentumba, frissítened kell.

- **Word:** kattints a jegyzékre > Tartalomjegyzék frissítése (vagy F9). A "Csak az oldalszámok" vagy az "Egész tábla" közül az utóbbit választd, ha címet is módosítottál.
- **Writer:** jobb gomb a jegyzéken > Mutató frissítése; vagy Eszközök > Frissítés > Minden mutató és tartalomjegyzék.

Ha a jegyzékbe nem kerül be egy cím, ellenőrizd a stílusát: lehet, hogy csak kézzel van nagyítva, vagy a szintje nincs bent a megjelenített szintek között.

**Próbáld ki:** írj két fejezetet három-három alfejezettel, és szúrj be tartalomjegyzéket. Adj hozzá egy új alfejezetet, frissítsd a jegyzéket, és nézd meg, hogy a címsor és az oldalszámok megjelennek.

## Kördokumentum

A kördokumentum (körlevél, levélösszefésülés) két részből áll:

- **Fő dokumentum (sablon):** a változatlan szöveg, amelybe a változó adatok helyét **összevonási mezők** jelölik, például «Név» és «Cím».
- **Adatforrás:** egy táblázat, amelynek oszlopai a mezők, sorai pedig a címzettek (például Excel-, ODS- vagy CSV-fájl, vagy Word-táblázat).

Az összevonás minden adatsorra előállít egy példányt a fő dokumentumból, a mezők helyén az adott sor adataival.

### Az adatforrás

Fontos, hogy az első sor az **oszlopfejléc**, és a táblázatban ne legyen üres sor. Egy egyszerű adatforrás:

| Nev | Telepules | Osztaly |
|---|---|---|
| Kovács Anna | Szeged | 12.A |
| Tóth Gábor | Pécs | 12.B |
| Nagy Réka | Győr | 11.C |

A mezőnevekben kerüld a szóközöket és az ékezeteket (például "Nev", "Telepules"), mert egyes programok így megbízhatóbban kezelik.

### Menete Wordben

1. **Levelezés > Körlevélkészítés indítása > Levelek.**
2. **Címzettek kiválasztása > Meglévő lista használata**, és válaszd ki az adatforrásfájlt (táblázat, ha több munkalap van, a megfelelőt).
3. Írd meg a levél szövegét, majd a változó helyeken **Összevonási mező beszúrása**: például "Kedves «Nev»!" és "A «Telepules» településen tartott...".
4. **Eredmények előnézete**: lapozhatsz a rekordok között, és ellenőrizheted a levelet.
5. **Befejezés és összefésülés > Egyedi dokumentumok szerkesztése** (új dokumentum készül, minden címzett külön oldalon), vagy **Dokumentumok nyomtatása**.

### Menete LibreOffice Writerben

1. **Eszközök > Körlevélvarázsló**: a varázsló végigvezet a lépéseken (kiindulási dokumentum, a levél típusa, címzettek kiválasztása, címblokk és üdvözlés, a dokumentum kiegészítése).
2. A címzett adatforrást az Adatforrások nézetből (Ctrl + Shift + F4) vagy a varázslóban adhatod meg.
3. Kézi beszúrás: Beszúrás > Mező > További mezők > Adatbázis > **Körlevélmezők**, itt választod ki az adatbázist, a táblát és a mezőt.
4. A végeredményt a varázsló utolsó lépésében mentheted vagy nyomtathatod.

### Szűrés és rendezés

Gyakori feladat, hogy csak egy címzetti csoportnak szóljon a levél, például csak a 12. évfolyam diákjainak. Wordben a **Címzettlista szerkesztése** ablakban a "Szűrés" és "Rendezés" is elérhető; megadhatod, hogy az "Osztaly" mező tartalmazza a "12" szöveget. Writerben a címzettek listájában jelölhetők ki a kívánt rekordok.

## Gyakorold

1. **Tartalomjegyzék.** Egy 5 fejezetes dolgozatban a Címsor 1 és Címsor 2 szintek jelenjenek meg a tartalomjegyzékben, pontsorral kitöltve. *Megoldás:* Hivatkozások > Tartalomjegyzék > Egyéni tartalomjegyzék > szintek: 2, kitöltő: pontsor.
2. **Címsor hiányzik.** A jegyzékből kimarad az egyik fejezet. Mi lehet az ok? *Megoldás:* a címet kézzel nagyítottad, nem kapott Címsor stílust. Alkalmazd a Címsor 1 stílust, és frissítsd a jegyzéket.
3. **Meghívó.** Készíts kördokumentumot, amelyben a "Kedves «Nev»! A «Osztaly» osztály találkozóját «Telepules» városában tartjuk." szöveg minden diákra személyre szóló. *Megoldás:* a fenti háromoszlopos táblázat az adatforrás; a három mezőt összevonási mezőként illeszd be; Eredmények előnézete; Egyedi dokumentumok szerkesztése. Eredmény az első címzettnél: "Kedves Kovács Anna! A 12.A osztály találkozóját Szeged városában tartjuk."
4. **Szűrt kör.** Csak a 12. évfolyamosoknak készüljön levél. *Megoldás:* Címzettlista szerkesztése > Szűrés: Osztaly tartalmazza a "12" szöveget; ebben a példában Kovács Anna és Tóth Gábor kap levelet.

## Gyakori hibák

- **Frissítetlen tartalomjegyzék.** A módosítás után az oldalszámok elcsúsznak; mindig frissítsd az F9-cel.
- **Kézzel írt tartalomjegyzék.** Nem frissül, és hibás oldalszámokat tartalmazhat.
- **Üres sor az adatforrásban.** Üres levél készülhet; töröld az üres sorokat.
- **Hiányzó fejléc az adatforrásban.** Az első adatsor mezőnévnek számít, és hiányzik a címzettek közül.
- **Beírt, nem mezőként beszúrt adat.** A «Nev» szöveget kézzel gépelve nem működik: az összevonási mező speciális objektum.
- **A dátum vagy a szám formátuma eltér.** A forrásban szövegként tárolt számok a körlevélben másképp jelennek meg; ellenőrizd az előnézetet.

## Összefoglalás

- A tartalomjegyzék a Címsor stílusokkal formázott címekből épül; a szintek és a kitöltés beállítható, a módosítás után frissíteni kell.
- A kördokumentum két részből áll: fő dokumentum (összevonási mezőkkel) és adatforrás (fejlécsoros táblázat).
- Word: Levelezés fül; Writer: Eszközök > Körlevélvarázsló. Az összevonás előtt mindig nézd meg az előnézetet.
- Érettségi szint: emelt.
