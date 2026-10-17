---
slug: where-feltetelek
title: WHERE szűrés feltétellel
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Nem minden sor kell

Eddig a lekérdezések a tábla **minden sorát** visszaadták. A valós kérdések szűkebbek: "kik járnak a 10.A-ba?", "melyik fuvar volt 20 km-nél hosszabb?". A `WHERE` ("ahol") a lekérdezés végére írt feltétel: az eredménybe csak azok a sorok kerülnek, amelyekre a feltétel **igaz**.

A példákban ez a `diak` tábla szerepel:

| id | nev | osztaly | pont |
|---|---|---|---|
| 1 | Anna | 10.A | 42 |
| 2 | Bence | 10.B | 37 |
| 3 | Csilla | 10.A | 51 |
| 4 | Dora | 11.A | 80 |

## A WHERE helye

A sorrend rögzített: előbb `SELECT`, utána `FROM`, azután a `WHERE`:

```sql
SELECT nev, pont
FROM diak
WHERE pont >= 50;
```

| nev | pont |
|---|---|
| Csilla | 51 |
| Dora | 80 |

Az adatbázis soronként ellenőrzi a feltételt: Anna 42 pontja nem felel meg, Csilláé (51) és Dóráé (80) igen.

## Az összehasonlító jelek

| Jel | Jelentés | Példa |
|---|---|---|
| `=` | egyenlő | `osztaly = '10.A'` |
| `<>` | nem egyenlő (MariaDB: `!=` is) | `osztaly <> '10.A'` |
| `<` | kisebb | `pont < 50` |
| `>` | nagyobb | `pont > 50` |
| `<=` | kisebb vagy egyenlő | `pont <= 50` |
| `>=` | nagyobb vagy egyenlő | `pont >= 50` |

Az SQL egyenlőségjele **egyetlen** `=`, nem `==`, mint a programozási nyelvekben.

**Próbáld ki:** keresd meg a legalább 80 pontos diákokat.

## Szöveg összehasonlítása

A szöveges értéket **aposztróf** közé írjuk:

```sql
SELECT nev, osztaly
FROM diak
WHERE osztaly = '10.A';
```

| nev | osztaly |
|---|---|
| Anna | 10.A |
| Csilla | 10.A |

Aposztróf nélkül az adatbázis a `10.A`-t mezőnévnek venné, és hibát jelezne. A számot viszont **nem** tesszük aposztrófba: `pont >= 50`.

A szöveg összehasonlítása az SQLite-ban nagybetű-érzékeny (`'10.a'` nem egyenlő a `'10.A'`-val), a MariaDB-ben alapból nem az. A biztonság kedvéért a szöveget úgy írd, ahogy az adatban szerepel.

## Szűrés olyan mezőre, amit nem kérdezel le

A `WHERE`-ben szereplő mezőnek **nem kell** szerepelnie a `SELECT` listájában:

```sql
SELECT nev
FROM diak
WHERE osztaly = '11.A';
```

| nev |
|---|
| Dora |

A szűrés a sorokra vonatkozik, a `SELECT` az oszlopokat választja ki: a kettő független.

## Mi történik, ha egyetlen sor sem felel meg?

Üres eredmény: a fejléc megvan, de nincs sor. Ez nem hiba, hanem helyes válasz. Ha viszont ezt nem vártad, ellenőrizd a szöveg betűit, szóközeit és az összehasonlító jelet.

## Gyakori hibák

1. **`==` vagy `=` összekeverése.** SQL-ben az egyenlőség `=`.
2. **Aposztróf nélküli szöveg.** `WHERE osztaly = 10.A` hibás.
3. **Aposztrófos szám.** `WHERE pont >= '50'` hibázhat vagy váratlanul szövegként hasonlít; a szám nem kell aposztróf.
4. **Rossz irányú összehasonlítás.** "Legalább 80" az `>= 80`; a `> 80` a 80 pontosat kihagyja. A határértékeket mindig gondold végig.
5. **A `WHERE` rossz helyen.** A `FROM` után, a rendezés (`ORDER BY`) előtt áll.

## Összefoglalás

- `WHERE feltétel` megszűri a sorokat: csak az igaz feltételű sorok maradnak.
- Összehasonlító jelek: `=`, `<>`, `<`, `>`, `<=`, `>=`.
- Szöveget aposztrófba írunk, számot nem.
- A szűrő mezője nem kell, hogy a `SELECT`-ben is szerepeljen.
- Az üres eredmény érvényes válasz.
