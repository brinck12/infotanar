---
slug: eldontes-tetele
title: Eldöntés
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi az az eldöntés?

Van-e a szekrényedben kék póló? Nem kell megszámolnod az összeset: amint találsz egyet, a válasz igen, és abbahagyhatod a keresést. Az **eldöntés tétele** egy igen/nem kérdésre válaszol: **van-e** a sorozatban olyan elem, amely megfelel a feltételnek. A párja a **minden-e** kérdés: megfelel-e a feltételnek az összes elem?

## A mondatszerű leírás: van-e

> **Bemenet:** `N`, `A[1..N]`
>
> **Kimenet:** `Van` (igen vagy nem)
>
> 1. A `Van` értéke legyen hamis, és `i` legyen 1.
> 2. Amíg `i ≤ N` és a `Van` hamis, ismételd:
>    - Ha `A[i]` megfelel a feltételnek, akkor a `Van` értéke legyen igaz.
>    - Az `i` értéke növekedjen 1-gyel.
> 3. A program kimenete a `Van`.

A ciklus **korán kilép**, amint a válasz eldőlt: ha már találtunk egyet, felesleges tovább nézni.

## Van-e kódban

::: python

A `van` logikai változó (`True` vagy `False`). A `break` azonnal kilép a ciklusból.

```python
n = int(input())
van = False
for _ in range(n):
    szam = int(input())
    if szam < 0:
        van = True
        break
print('IGEN' if van else 'NEM')
```

A kiírásnál az `A if feltétel else B` forma az `A` értéket adja, ha a feltétel igaz, különben a `B`-t.

:::

::: csharp

A `van` logikai változó (`true` vagy `false`). A `break` azonnal kilép a ciklusból.

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        bool van = false;
        for (int i = 0; i < n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            if (szam < 0)
            {
                van = true;
                break;
            }
        }
        Console.WriteLine(van ? "IGEN" : "NEM");
    }
}
```

A kiírásnál a `feltétel ? A : B` forma az `A` értéket adja, ha a feltétel igaz, különben a `B`-t.

:::

A `3`, majd `4`, `-2`, `8` bemenetre a kimenet `IGEN`.

## Minden-e: az ellenpélda keresése

A **minden-e** kérdés (például: minden szám pozitív-e) fordítva működik. A válasz akkor "nem", ha **egyetlen ellenpéldát** találsz. Ezért a jelző kezdetben igaz, és az első ellenpéldánál hamisra vált.

> 1. A `Mind` értéke legyen igaz.
> 2. Ismételd az `i` értékével 1-től `N`-ig:
>    - Ha `A[i]` **nem** felel meg a feltételnek, akkor a `Mind` értéke legyen hamis, és lépj ki a ciklusból.

::: python

```python
mind = True
for _ in range(n):
    szam = int(input())
    if szam <= 0:
        mind = False
        break
```

:::

::: csharp

```csharp
bool mind = true;
for (int i = 0; i < n; i++)
{
    int szam = int.Parse(Console.ReadLine());
    if (szam <= 0)
    {
        mind = false;
        break;
    }
}
```

:::

Vigyázz: a "pozitív" ellentéte nem a "negatív", hanem a "nem pozitív" (a nulla is ide tartozik). Az ellenpélda feltétele tehát `szam <= 0`.

## Prímteszt

Egy szám **prím**, ha 1-nél nagyobb, és csak 1-gyel és önmagával osztható. Ez is minden-e jellegű kérdés: *egyetlen* 2 és `N-1` közötti szám sem osztja `N`-et. Az ellenpélda egy osztó; ha találunk egyet, kiléphetünk. Elég addig keresni, amíg `d * d <= N`, mert ha `N`-nek van 1-nél nagyobb valódi osztója, akkor van olyan is, amely nem nagyobb a négyzetgyökénél.

::: python

```python
n = int(input())
prim = n >= 2
d = 2
while d * d <= n:
    if n % d == 0:
        prim = False
        break
    d += 1
print('IGEN' if prim else 'NEM')
```

:::

::: csharp

```csharp
int n = int.Parse(Console.ReadLine());
bool prim = n >= 2;
int d = 2;
while (d * d <= n)
{
    if (n % d == 0)
    {
        prim = false;
        break;
    }
    d++;
}
Console.WriteLine(prim ? "IGEN" : "NEM");
```

:::

A `9` nem prím: a `d = 3` esetén `9 % 3 == 0`. A `7` prím: a `d = 2` nem osztja, a `d = 3`-nál már `9 > 7`, ezért a ciklus véget ér. Az 1 nem prím: a `prim = n >= 2` ezt kezeli.

## Szomszédos párok

Az eldöntés a szomszédos elemekre is működik. Annak eldöntésénél, hogy a sorozat nem csökkenő-e, az ellenpélda olyan elem, amely kisebb az előzőnél. Ehhez az előző elemet tárold egy változóban, és minden lépés végén frissítsd.

## Gyakori hibák

::: python

1. **Rossz kezdőérték.** A van-e kérdésnél a jelző kezdetben `False`, a minden-e kérdésnél `True`. Ha felcseréled, minden válasz fordított lesz.
2. **A feltétel ellentéte rosszul.** A "mind pozitív" ellenpéldája `szam <= 0`, nem `szam < 0`.
3. **A `break` rossz behúzással a ciklus után áll**, ezért nem lép ki korán, vagy hibás helyen lép ki.

:::

::: csharp

1. **Rossz kezdőérték.** A van-e kérdésnél a jelző kezdetben `false`, a minden-e kérdésnél `true`. Ha felcseréled, minden válasz fordított lesz.
2. **A feltétel ellentéte rosszul.** A "mind pozitív" ellenpéldája `szam <= 0`, nem `szam < 0`.
3. **A `break` rossz helyre kerül:** ha kimarad a kapcsos zárójel az `if` után, csak az első utasítás tartozik hozzá, a `break` pedig mindig lefut, és az első elemnél kilép.

:::

## Összefoglalás

- Az eldöntés igen/nem választ ad: van-e, illetve minden-e.
- Van-e: a jelző kezdetben hamis, az első találatnál igaz.
- Minden-e: a jelző kezdetben igaz, az első ellenpéldánál hamis.
- Amint a válasz eldőlt, a ciklus korán kiléphet (`break`).
- A prímteszt minden-e kérdés: nincs-e osztója.
