---
slug: szoveg-es-szam-fuggvenyek
title: Szövegfüggvények
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi az a függvény?

A függvény egy kis gép: beteszel valamit, és kijön belőle valami más. Az SQL-ben a függvénynek **neve** van, utána **zárójel**, a zárójelben pedig az, amit beteszel. Például:

```sql
UCASE(vezeteknev)
```

Ez azt jelenti: "vedd a `vezeteknev` értékét, és alakítsd csupa nagybetűssé".

Két fontos dolog:

- A függvény **nem változtatja meg a táblát**. Csak az eredményben jelenik meg az új érték.
- A függvényt oda írod, ahová eddig oszlopnevet írtál: a `SELECT` után, de a `WHERE`-be is mehet.

Ebben a leckében a **szöveggel** dolgozó függvényeket tanuljuk meg. Ezek pontosan úgy működnek az érettségi MariaDB-jében is, és a gyakorlófelület is ugyanígy érti őket.

A példákban ez a `tanulo` tábla szerepel:

| `id` | `vezeteknev` | `keresztnev` | `osztaly` |
|---|---|---|---|
| 1 | Kiss | Anna | 10.A |
| 2 | Nagy | Béla | 10.B |
| 3 | Tóth | Csaba | 10.A |
| 4 | Szentpéteri | Zsombor | 11.B |

## UCASE és LCASE: nagy- és kisbetű

Az `UCASE` a szöveget csupa **nagybetűssé**, az `LCASE` csupa **kisbetűssé** alakítja.

```sql
SELECT vezeteknev, UCASE(vezeteknev)
FROM tanulo;
```

Mit csinál ez a lekérdezés? Minden sorhoz kiírja a vezetéknevet, mellé pedig ugyanazt nagybetűvel. Az eredmény:

| `vezeteknev` | `UCASE(vezeteknev)` |
|---|---|
| Kiss | KISS |
| Nagy | NAGY |
| Tóth | TÓTH |
| Szentpéteri | SZENTPÉTERI |

Az `LCASE` ugyanígy működik, csak kisbetűt ad: az `LCASE('Kiss')` eredménye `kiss`.

(Az `UPPER` és a `LOWER` ugyanezt tudja, az érettségin ezek is előfordulnak.)

**Próbáld ki:** írd ki a keresztneveket csupa kisbetűvel.

## Az új oszlop neve: AS

Láttad, hogy az oszlop fejléce `UCASE(vezeteknev)` lett. Ez csúnya, és hosszú. Az `AS` ("mint") szóval **saját nevet** adhatsz az oszlopnak:

```sql
SELECT vezeteknev, UCASE(vezeteknev) AS nagybetus
FROM tanulo;
```

| `vezeteknev` | `nagybetus` |
|---|---|
| Kiss | KISS |
| Nagy | NAGY |
| Tóth | TÓTH |
| Szentpéteri | SZENTPÉTERI |

A feladatok általában megmondják, milyen nevű oszlopot várnak. Azt a nevet írd az `AS` után.

## CHAR_LENGTH: hány karakter?

A `CHAR_LENGTH` megszámolja, hány **karakterből** áll a szöveg. A szóköz is karakter.

```sql
SELECT vezeteknev, CHAR_LENGTH(vezeteknev) AS hossz
FROM tanulo;
```

Ez minden vezetéknév mellé kiírja a hosszát:

| `vezeteknev` | `hossz` |
|---|---|
| Kiss | 4 |
| Nagy | 4 |
| Tóth | 4 |
| Szentpéteri | 11 |

Az `LENGTH` függvény neve hasonló, de a MariaDB-ben az **bájtot** számol: az ékezetes betű (például `ó`) két bájt, ezért a `LENGTH('Tóth')` 5 lenne. Karakterszámra mindig a `CHAR_LENGTH`-et használd.

**Próbáld ki:** írd ki a keresztnevek hosszát `hossz` néven.

## Függvény a WHERE-ben

A függvény a `WHERE` feltételben is használható. Keressük azokat, akiknek a vezetékneve **hosszabb 5 karakternél**:

```sql
SELECT vezeteknev
FROM tanulo
WHERE CHAR_LENGTH(vezeteknev) > 5;
```

A `WHERE` soronként kiszámolja a hosszt, és csak ott engedi át a sort, ahol a feltétel igaz:

| `vezeteknev` |
|---|
| Szentpéteri |

Ha egyetlen sor sem felel meg, az eredmény **üres**: nem lesz sem sor, sem fejléc. Ez nem hiba.

## CONCAT: szövegek összefűzése

A `CONCAT` több szöveget **egymás után fűz**. A zárójelbe vesszővel elválasztva írod a darabokat. A darab lehet oszlop vagy szó aposztrófok között.

Teljes név: vezetéknév, szóköz, keresztnév.

```sql
SELECT CONCAT(vezeteknev, ' ', keresztnev) AS nev
FROM tanulo;
```

A `' '` egy szóköz egy aposztrófpárban. Ezt is te írod bele, a `CONCAT` magától nem tesz semmit a darabok közé.

| `nev` |
|---|
| Kiss Anna |
| Nagy Béla |
| Tóth Csaba |
| Szentpéteri Zsombor |

Függvényt függvénybe is tehetsz: belülről kifelé értékelődik ki. Kisbetűs felhasználónév:

```sql
SELECT LCASE(CONCAT(vezeteknev, '.', keresztnev)) AS felhasznalo
FROM tanulo;
```

Előbb a `CONCAT` összerakja, hogy `Kiss.Anna`, aztán az `LCASE` kisbetűssé teszi:

| `felhasznalo` |
|---|
| kiss.anna |
| nagy.béla |
| tóth.csaba |
| szentpéteri.zsombor |

**Próbáld ki:** írd ki az osztályt és a vezetéknevet egy oszlopban így: `10.A - Kiss`.

## A NULL mindent elront

A `NULL` azt jelenti: "nincs érték". Ha a `CONCAT` egyik darabja `NULL`, az **egész** eredmény `NULL` lesz. Tegyük fel, hogy van egy `becenev` oszlop, és Béla becenevét nem töltötték ki:

| `vezeteknev` | `becenev` |
|---|---|
| Kiss | Panni |
| Nagy | NULL |

```sql
SELECT CONCAT(vezeteknev, ' - ', becenev) AS felirat
FROM tanulo;
```

| `felirat` |
|---|
| Kiss - Panni |
| NULL |

Ez nem hiba, így működik a `NULL`. Fontos, hogy ne lepjen meg. (Hogyan lehet a hiányzó értéket kezelni, azt a feltételes kifejezésnél tanuljuk.)

## Gyakori hibák

- **Aposztróf nélküli szöveg.** `CONCAT(vezeteknev, ' ', keresztnev)` a helyes. Ha a szóköz vagy a pont kimarad az aposztrófból, az adatbázis oszlopnevet keres.
- **Elfelejtett szóköz a `CONCAT`-ban.** A `CONCAT(vezeteknev, keresztnev)` eredménye `KissAnna`.
- **`LENGTH` a `CHAR_LENGTH` helyett.** Ékezetes szövegnél eltérő számot kapsz.
- **Hiányzó zárójel.** Minden megnyitott `(`-hez kell egy `)`. Egymásba tett függvénynél különösen figyelj.
- **Idézőjel az aposztróf helyett.** Szöveghez az aposztróf (`'`) való.

## Összefoglalás

| Függvény | Mit csinál | Példa | Eredmény |
|---|---|---|---|
| `UCASE(s)` | nagybetűssé alakít | `UCASE('Kiss')` | `KISS` |
| `LCASE(s)` | kisbetűssé alakít | `LCASE('Kiss')` | `kiss` |
| `CHAR_LENGTH(s)` | a karakterek száma | `CHAR_LENGTH('Kiss')` | `4` |
| `CONCAT(a, b, ...)` | összefűz | `CONCAT('Ki', 'ss')` | `Kiss` |

Egy függvény bárhol állhat, ahol oszlopnevet írhatnál: a `SELECT` után és a `WHERE`-ben. Az `AS` ad az új oszlopnak nevet. Ha bármelyik `CONCAT`-darab `NULL`, az egész eredmény `NULL`.
