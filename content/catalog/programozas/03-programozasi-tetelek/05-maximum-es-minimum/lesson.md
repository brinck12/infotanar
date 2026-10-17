---
slug: maximumkivalasztas-tetele
title: Maximum- és minimumkiválasztás
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Ki a legmagasabb az osztályban?

Ha meg akarod találni a legmagasabb diákot, nem kell mindenkit mindenkivel összehasonlítani. Elég egy "jelenlegi rekorder", akit minden újabb diákhoz mérsz: ha az új magasabb, ő lesz a rekorder. A **maximumkiválasztás tétele** pontosan ezt csinálja. A párja a **minimumkiválasztás**, amely a legkisebb elemet keresi.

## A mondatszerű leírás

> **Bemenet:** `N`, `A[1..N]`
>
> **Kimenet:** `Max` (a legnagyobb elem), `Hely` (a helye)
>
> 1. A `Max` értéke legyen `A[1]`, a `Hely` értéke 1.
> 2. Ismételd az `i` értékével 2-től `N`-ig:
>    - Ha `A[i] > Max`, akkor a `Max` értéke legyen `A[i]`, a `Hely` értéke pedig `i`.
> 3. A program kimenete a `Max` és a `Hely`.

A kezdőérték **az első elem**, és a ciklus a másodiktól indul. Ne írj `0`-t kezdőértéknek: ha minden szám negatív, a 0 hibás eredményt adna.

## Maximum kódban

::: python

```python
n = int(input())
legnagyobb = int(input())
for _ in range(n - 1):
    szam = int(input())
    if szam > legnagyobb:
        legnagyobb = szam
print(legnagyobb)
```

:::

::: csharp

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        int legnagyobb = int.Parse(Console.ReadLine());
        for (int i = 1; i < n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            if (szam > legnagyobb)
            {
                legnagyobb = szam;
            }
        }
        Console.WriteLine(legnagyobb);
    }
}
```

:::

A `4`, majd `3`, `9`, `2`, `7` bemenetre a kimenet `9`. A lépések: a rekord 3, majd 9 (mert 9 > 3), a 2 és a 7 már nem nagyobb nála.

## Minimum

A minimumkiválasztás a tükörképe: a kezdőérték itt is az első elem, de a feltétel `szam < legkisebb`. Ha a feladat a **legkisebbet** kéri, ne maradjon benne véletlenül a `>` jel.

## Az érték és a hely

Sokszor nem csak az érték kell, hanem az is, hogy hányadik helyen áll. Ilyenkor mindkettőt tárold, és együtt frissítsd.

::: python

A ciklusváltozó 2-től indul, mert az első elem már a kezdőérték. A `print` több értéket szóközzel választ el.

```python
n = int(input())
legnagyobb = int(input())
hely = 1
for i in range(2, n + 1):
    szam = int(input())
    if szam > legnagyobb:
        legnagyobb = szam
        hely = i
print("Legnagyobb:", legnagyobb)
print("Helye:", hely)
```

:::

::: csharp

A ciklusváltozó 2-től indul, mert az első elem már a kezdőérték.

```csharp
int n = int.Parse(Console.ReadLine());
int legnagyobb = int.Parse(Console.ReadLine());
int hely = 1;
for (int i = 2; i <= n; i++)
{
    int szam = int.Parse(Console.ReadLine());
    if (szam > legnagyobb)
    {
        legnagyobb = szam;
        hely = i;
    }
}
Console.WriteLine("Legnagyobb: " + legnagyobb);
Console.WriteLine("Helye: " + hely);
```

:::

## Első vagy utolsó előfordulás?

Ha a legnagyobb érték többször is szerepel, a feltételen múlik, melyik helyet kapod:

- `szam > legnagyobb` (szigorú): csak **nagyobb** érték frissít, tehát az **első** előfordulás marad.
- `szam >= legnagyobb`: egyenlőségnél is frissít, tehát az **utolsó** előfordulás lesz.

A `4`, `9`, `2`, `9`, `1` sorozatban a maximum 9: az első előfordulás a 2., az utolsó a 4. hely.

## Maximum nem csak számokra

A tétel bármire működik, amit össze tudsz hasonlítani. Szavaknál például a **hosszuk** szerint: a legrövidebb név kiválasztásánál a kezdőérték az első név, és a feltétel `len(nev) < len(legrovidebb)` (C#-ban `nev.Length < legrovidebb.Length`). Fontos: az összehasonlítás a hosszra vonatkozik, de a **nevet** kell eltárolnod, nem a hosszt.

## Gyakori hibák

::: python

1. **Rossz kezdőérték.** A `legnagyobb = 0` hibás, ha minden szám negatív. Az első elemmel indulj.
2. **A ciklushatárok.** Az első elem már a kezdőérték, ezért a ciklus csak a maradék `n - 1` elemre fut (`range(n - 1)`, vagy `range(2, n + 1)`, ha a sorszám is kell).
3. **Fordított összehasonlítás.** A `<` a minimumot, a `>` a maximumot adja.

:::

::: csharp

1. **Rossz kezdőérték.** Az `int legnagyobb = 0;` hibás, ha minden szám negatív. Az első elemmel indulj.
2. **A ciklushatárok.** Az első elem a kezdőérték, ezért a ciklus `i = 1`-től (0 alapú) vagy `i = 2`-től (1 alapú sorszámnál) indul.
3. **Fordított összehasonlítás.** A `<` a minimumot, a `>` a maximumot adja.

:::

## Összefoglalás

- Maximumkiválasztás: kezdőérték az első elem, a ciklus a másodiktól; nagyobbnál frissítünk.
- Minimumkiválasztás: ugyanez, de kisebbnél frissítünk.
- Ha a hely is kell, az értékkel együtt tárold és frissítsd.
- Szigorú összehasonlítás: első előfordulás; egyenlőséggel is: utolsó előfordulás.
