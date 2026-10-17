---
slug: kivalasztas-es-kereses
title: Kiválasztás és keresés
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Hányadik?

Az eldöntés azt mondja meg, hogy van-e találat. Gyakran az is kell, hogy **hol** van: hányadik helyen áll az első páros szám? Erre való a **kiválasztás** és a **keresés**. A kettő között egyetlen különbség van: biztosan van-e találat.

- **Kiválasztás:** a feladat garantálja, hogy van olyan elem. Nem kell a "nincs" esettel foglalkozni.
- **Keresés:** lehet, hogy nincs találat. Ilyenkor a program jelzi, hogy nincs.

## A mondatszerű leírás: kiválasztás

> **Bemenet:** `N`, `A[1..N]` (biztosan van megfelelő elem)
>
> **Kimenet:** `Hely` (az első megfelelő elem sorszáma)
>
> 1. Az `i` értéke legyen 1.
> 2. Amíg `A[i]` nem felel meg a feltételnek, az `i` értéke növekedjen 1-gyel.
> 3. A program kimenete az `i`.

Mivel a találat garantált, a ciklus biztosan megáll, mielőtt kifutnánk a sorozatból.

## A mondatszerű leírás: keresés

> **Bemenet:** `N`, `A[1..N]`
>
> **Kimenet:** `Hely` (az első megfelelő elem sorszáma, vagy 0, ha nincs ilyen)
>
> 1. A `Hely` értéke legyen 0, és `i` legyen 1.
> 2. Amíg `i ≤ N` és a `Hely` értéke 0, ismételd:
>    - Ha `A[i]` megfelel a feltételnek, akkor a `Hely` értéke legyen `i`.
>    - Az `i` értéke növekedjen 1-gyel.
> 3. Ha a `Hely` értéke 0, akkor nincs találat, különben a kimenet a `Hely`.

A 0 itt **őrérték**: olyan érték, amely nem lehet valódi sorszám (a sorszámok 1-től indulnak), ezért "még nem találtam" jelentésű.

## Keresés kódban

::: python

A `range(1, n + 1)` 1-től `n`-ig számol, így az `i` közvetlenül a sorszám.

```python
n = int(input())
hely = 0
for i in range(1, n + 1):
    szam = int(input())
    if szam < 0:
        hely = i
        break
if hely == 0:
    print('NINCS')
else:
    print(hely)
```

:::

::: csharp

A ciklusváltozó 1-től `n`-ig megy (`i <= n`), így az `i` közvetlenül a sorszám.

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        int hely = 0;
        for (int i = 1; i <= n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            if (szam < 0)
            {
                hely = i;
                break;
            }
        }
        if (hely == 0)
        {
            Console.WriteLine("NINCS");
        }
        else
        {
            Console.WriteLine(hely);
        }
    }
}
```

:::

A `4`, majd `5`, `3`, `-1`, `-2` bemenetre a kimenet `3`: az első negatív a harmadik. A `-2` is negatív, de azt már nem keressük, mert a `break` az első találatnál kilépett.

## Szó keresése a listában

A keresés szavakra is működik. Itt előbb a **listát** olvasod be, és csak utána a keresett szót, mert a keresés a már beolvasott listán fut.

::: python

```python
n = int(input())
szavak = []
for _ in range(n):
    szavak.append(input())
keresett = input()
hely = 0
for i in range(n):
    if szavak[i] == keresett:
        hely = i + 1
        break
```

A listában az indexek 0-tól indulnak, ezért a sorszám `i + 1`.

:::

::: csharp

```csharp
int n = int.Parse(Console.ReadLine());
string[] szavak = new string[n];
for (int i = 0; i < n; i++)
{
    szavak[i] = Console.ReadLine();
}
string keresett = Console.ReadLine();
int hely = 0;
for (int i = 0; i < n; i++)
{
    if (szavak[i] == keresett)
    {
        hely = i + 1;
        break;
    }
}
```

A tömbben az indexek 0-tól indulnak, ezért a sorszám `i + 1`.

:::

Ha a `barack` szót keresed az `alma`, `korte`, `barack`, `szilva` listában, a hely 3. A kis- és nagybetű különbözik: az `Alma` nem egyezik az `alma` szóval.

## Legkisebb osztó

A kiválasztásra jó példa a legkisebb 1-nél nagyobb osztó. Biztosan van találat, mert `N` osztja önmagát, ezért elég egy ciklus, amely addig növeli `d`-t, amíg `N % d` nem nulla:

::: python

```python
d = 2
while n % d != 0:
    d += 1
```

:::

::: csharp

```csharp
int d = 2;
while (n % d != 0)
{
    d++;
}
```

:::

## Összehasonlítás az előzővel

A keresésnél az elem és az **előző** elem viszonya is lehet a feltétel, például: hol van az első elem, amely nagyobb az előzőnél? Az első elemnek nincs előzője, ezért az összehasonlítás a második elemnél kezdődik, és minden lépés végén frissíted az előző értéket.

## Gyakori hibák

::: python

1. **Elcsúszott sorszám.** A lista indexe 0-tól indul, a "hányadik" kérdés sorszáma 1-től. A kettő között `+ 1` a különbség.
2. **A "nincs találat" eset kimarad.** Ha a hely 0 marad, ne azt írd ki, hanem `NINCS`-et.
3. **A `break` hiánya.** Nélküle a ciklus tovább megy, és később is felülírhatja a helyet: az **utolsó**, nem az első találatot kapod.

:::

::: csharp

1. **Elcsúszott sorszám.** A tömb indexe 0-tól indul, a "hányadik" kérdés sorszáma 1-től. A kettő között `+ 1` a különbség.
2. **A "nincs találat" eset kimarad.** Ha a hely 0 marad, ne azt írd ki, hanem `NINCS`-et.
3. **A `break` hiánya.** Nélküle a ciklus tovább megy, és később is felülírhatja a helyet: az **utolsó**, nem az első találatot kapod.

:::

## Összefoglalás

- Kiválasztás: biztosan van találat, az első helyét keressük.
- Keresés: lehet, hogy nincs találat; a 0 érték jelzi, hogy még nem találtunk.
- Az első találatnál lépj ki a ciklusból.
- Mindig gondold végig, hogy a sorszámok 1-től vagy 0-tól indulnak.
