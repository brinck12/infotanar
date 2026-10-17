---
slug: adattipusok
title: Adattípusok
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért számít a típus?

Minden mező meghatározott fajtájú adatot tárol. Egy telefonszámmal nem számolsz, egy ártól viszont elvárod, hogy összeadhasd. A **típus** megmondja az adatbázisnak, mit tárol a mező, mennyi helyet foglal, és milyen műveletet végezhet vele. Az adatbázist a tábla létrehozásakor (később ezt is megtanulod) típusokkal adjuk meg, a lekérdezéseknél pedig fontos tudni, milyen típusú mezővel dolgozunk.

## A leggyakoribb típusok

| Fajta | Mit tárol | Példa érték | MariaDB (érettségi) | SQLite (InfoTanár) |
|---|---|---|---|---|
| szöveg | betűk, szavak | `'Anna'` | `VARCHAR(50)`, `TEXT` | `TEXT` |
| egész szám | darabszám, év, pont | `42` | `INT` | `INTEGER` |
| valós szám | tört érték | `3.14` | `DOUBLE`, `DECIMAL(10,2)` | `REAL` |
| dátum/idő | nap és időpont | `'2025-03-14'` | `DATE`, `DATETIME` | szövegként |
| logikai | igaz vagy hamis | `1` vagy `0` | `BOOLEAN` | egész (0 vagy 1) |

### Szöveg

A szöveget **aposztróf** (`'`) közé írjuk. A `VARCHAR(50)` azt jelenti: legfeljebb 50 karakter hosszú szöveg. Az azonosítók, amelyekkel nem számolunk (telefonszám, irányítószám, rendszám), szintén szövegek.

### Egész szám és valós szám

Az egész szám (`INT`) törtrész nélküli érték: darabszám, életkor, ár forintban. A valós szám törtrészt is tartalmaz; SQL-ben tizedespont áll, nem tizedesvessző: `3.5`. Pénzösszegnél gyakori a `DECIMAL(10,2)`, amely pontosan két tizedesig tárol, így nem csúszik el a kerekítés.

### Dátum és idő

A **dátumot** `ÉÉÉÉ-HH-NN` alakban adjuk meg: `'2025-03-14'`. Az **idő** `ÓÓ:PP:MM` (például `'14:30:00'`), a kettő együtt a `DATETIME`. Az év-hónap-nap sorrend azért jó, mert a szövegesen rendezett dátumok így időrendben követik egymást. A dátumokkal számoló függvényeket (`YEAR`, `MONTH`) egy későbbi modulban ismerjük meg.

### Logikai érték

Az igaz/hamis mezőt MariaDB-ben `BOOLEAN`-nek hívjuk, ami valójában egy kis egész: a `0` a hamis, az `1` az igaz. Az SQLite sem ismer külön logikai típust, ott is `0` és `1` áll. Például egy `visszahozva` mező 1 értéke azt jelentheti, hogy a könyv visszakerült.

## Az üres érték, a NULL

Bármilyen típusú mező lehet **üres**, ha nincs benne adat. Ez az SQL-ben a `NULL`. A NULL nem 0 és nem üres szöveg, hanem "nincs adat" (például a könyvet még nem hozták vissza, ezért nincs visszahozási dátum). A lekérdezés eredményében üres mezőként látod. A NULL kezelését a szűrésnél tanuljuk meg.

## Hogyan látod meg a típust a lekérdezés eredményében?

A lekérdezés eredménye csak értékeket mutat, a típust a tábla leírásából tudod meg: a feladat mindig megadja a mezők típusát. Nézzünk egy termék-táblát:

| id | nev | kategoria | ar | keszlet |
|---|---|---|---|---|
| 1 | Tej | tej | 330 | 12 |
| 2 | Kenyer | pek | 480 | 0 |

- `nev`, `kategoria`: szöveg
- `id`, `ar`, `keszlet`: egész szám

Egy lekérdezés, amely a nevet és az árat adja:

```sql
SELECT nev, ar
FROM termek;
```

| nev | ar |
|---|---|
| Tej | 330 |
| Kenyer | 480 |

A típus befolyásolja a rendezést és az összehasonlítást is: a szöveges `'9'` az ábécé szerint a `'10'` után áll, a szám 9 viszont kisebb, mint a 10. Ezért a számmal számoló mezőt mindig szám típusúnak adjuk meg.

**Próbáld ki:** a feladatokban különböző típusú mezőket kérdezel le, és a leírásból kell kiolvasnod, melyik mező milyen típusú.

## Gyakori hibák

1. **A szám idézőjelbe tétele.** A `'42'` szöveg, a `42` szám. Ha számmal akarsz számolni, ne tedd aposztrófba.
2. **Tizedesvessző tizedespont helyett.** SQL-ben a `3,5` két külön érték, a `3.5` a tört.
3. **A NULL összekeverése a nullával.** A 0 egy szám, a NULL azt jelenti, hogy nincs adat.
4. **Dátum rossz alakban.** `'14-03-2025'` nem dátum az adatbázis szemében; az év áll elöl: `'2025-03-14'`.

## Összefoglalás

- Típusok: szöveg, egész, valós, dátum/idő, logikai.
- Szöveget és dátumot aposztróf közé írunk, számot nem.
- Valós számban tizedespont áll.
- A logikai érték 0 vagy 1; az üres érték a NULL.
- A MariaDB és az SQLite típusnevei kicsit eltérnek, a gondolat ugyanaz.
