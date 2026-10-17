---
slug: megszamlalas-tetele
title: Megszámlálás
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi a megszámlálás?

Hány piros autó áll a parkolóban? Végigsétálsz a soron, és minden piros autónál eggyel feljebb számolsz. A **megszámlálás tétele** ezt csinálja: egy sorozatban megadja, hány elem felel meg egy feltételnek. Az összegzéshez hasonlít, de itt nem az elemeket adjuk össze, hanem **1-et adunk hozzá** minden találatnál.

## A mondatszerű leírás

> **Bemenet:** `N`, `A[1..N]`
>
> **Kimenet:** `Db` (a feltételnek megfelelő elemek száma)
>
> 1. A `Db` értéke legyen 0.
> 2. Ismételd az `i` értékével 1-től `N`-ig:
>    - Ha `A[i]` megfelel a feltételnek, akkor a `Db` értéke növekedjen 1-gyel.
> 3. A program kimenete a `Db`.

A **számláló** (`Db`) kezdőértéke 0. A feltétel bármi lehet: páros, 10-nél nagyobb, magánhangzó. A tétel szerkezete mindig ugyanaz, csak a feltétel cserélődik.

## Megszámlálás kódban

::: python

A páros számok megszámolása. Egy szám páros, ha a 2-vel osztva a maradéka 0: `szam % 2 == 0`.

```python
n = int(input())
db = 0
for _ in range(n):
    szam = int(input())
    if szam % 2 == 0:
        db += 1
print(db)
```

:::

::: csharp

A páros számok megszámolása. Egy szám páros, ha a 2-vel osztva a maradéka 0: `szam % 2 == 0`. A `db++` eggyel növeli a számlálót.

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        int db = 0;
        for (int i = 0; i < n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            if (szam % 2 == 0)
            {
                db++;
            }
        }
        Console.WriteLine(db);
    }
}
```

:::

Ha a bemenet `4`, majd `1`, `2`, `3`, `4`, a kimenet `2`. Próbáld ki, aztán cseréld a feltételt: számold meg a 10-nél nagyobbakat!

## Összegzés és megszámlálás: mi a különbség?

Mindkettő végigmegy a sorozaton, és egy változót növel. Az összegzés a **szám értékével** növel (`osszeg += szam`), a megszámlálás **1-gyel**, de csak ha a feltétel teljesül (`db += 1`). Ha összetévesztenéd őket, gondold végig: mit kérdez a feladat, mennyi vagy hány darab?

## Szöveg karaktereinek megszámlálása

A megszámlálás szövegekre is működik: egy szöveg karakterein is végigmehetsz ciklussal, és megszámolhatod, hány felel meg a feltételnek, például hány magánhangzó van egy szóban.

::: python

A `betu in "aeiou"` azt vizsgálja, hogy a betű szerepel-e a megadott szövegben. A `lower()` kisbetűssé alakít, így a nagybetűket sem hagyod ki.

```python
szoveg = input().lower()
db = 0
for betu in szoveg:
    if betu in "aeiou":
        db += 1
print(db)
```

:::

::: csharp

Az `"aeiou".IndexOf(betu) >= 0` azt vizsgálja, hogy a betű szerepel-e a megadott szövegben. A `ToLowerInvariant()` kisbetűssé alakít, így a nagybetűket sem hagyod ki.

```csharp
string szoveg = Console.ReadLine().ToLowerInvariant();
int db = 0;
foreach (char betu in szoveg)
{
    if ("aeiou".IndexOf(betu) >= 0)
    {
        db++;
    }
}
Console.WriteLine(db);
```

:::

Az `Informatika` szóban az `I`, `o`, `a`, `i`, `a` magánhangzó, vagyis 5 db.

## Összetett feltétel

A feltétel több részből is állhat. A "3-mal vagy 5-tel osztható, de 15-tel nem" feltételhez kell a **vagy**, az **és**, és a zárójel, mert az **és** erősebben köt, mint a **vagy**.

::: python

```python
if (szam % 3 == 0 or szam % 5 == 0) and szam % 15 != 0:
    db += 1
```

:::

::: csharp

```csharp
if ((szam % 3 == 0 || szam % 5 == 0) && szam % 15 != 0)
{
    db++;
}
```

:::

## Az előző elemhez hasonlítás

Ha azt kell megszámolni, hányszor egyezik egy elem az **előzővel**, tárold el az előző értéket egy külön változóban. Az első elemnek nincs előzője, ezért azt a ciklus előtt olvasod be, és a ciklus a második elemtől indul. A ciklus végén frissítsd az `elozo` változót az éppen vizsgált értékre.

## Gyakori hibák

::: python

1. **A számláló nincs nullázva a ciklus előtt.** Kezdőérték nélkül hibaüzenetet kapsz.
2. **Elfelejtett feltétel.** Ha az `if` nélkül írod a `db += 1`-et, a program az összes elemet megszámolja.
3. **Zárójel nélküli összetett feltétel.** A `szam % 3 == 0 or szam % 5 == 0 and szam % 15 != 0` mást jelent, mint a zárójelezett változat.

:::

::: csharp

1. **A számláló nincs nullázva a ciklus előtt.** A C# fordítási hibát jelez, ha a változó nem kapott kezdőértéket.
2. **Elfelejtett feltétel.** Ha az `if` nélkül írod a `db++`-t, a program az összes elemet megszámolja.
3. **Zárójel nélküli összetett feltétel.** A `szam % 3 == 0 || szam % 5 == 0 && szam % 15 != 0` mást jelent, mint a zárójelezett változat.

:::

## Összefoglalás

- A megszámlálás tétele megadja, hány elem felel meg egy feltételnek.
- A számláló kezdőértéke 0, és minden találatnál 1-gyel nő.
- A feltétel cserélhető; a szerkezet ugyanaz marad.
- Összetett feltételnél használj zárójelet.
