---
slug: tetelek-osszeepitese
title: Tételek összeépítése
position: 6
free: false
published: false
reviewed_by:
reviewed_at:
---

## Több tétel egy feladatban

Az érettségi feladatok ritkán kérnek csak egyetlen tételt. Gyakoribb az olyan kérdés, hogy "mennyi a pozitív számok átlaga?" vagy "melyik a legnagyobb páros szám?". Ezekben **több tétel dolgozik együtt**. Ebben a leckében két módszert tanulsz:

1. **Több tétel egy ciklusban:** ha a tételek ugyanazon a sorozaton futnak, és nem függnek egymás eredményétől.
2. **Tételek egymás után:** ha az egyik eredménye kell a másikhoz, például az átlag a darabszámláláshoz.

## Több tétel egy ciklusban: pozitívak átlaga

A pozitív számok átlagához két dolog kell: a pozitívak **összege** és **darabszáma**. Mindkettőt egyetlen ciklusban gyűjtheted.

> **Bemenet:** `N`, `A[1..N]`
>
> **Kimenet:** a pozitív elemek átlaga, vagy "nincs", ha nincs pozitív elem
>
> 1. Az `Osszeg` és a `Db` értéke legyen 0.
> 2. Ismételd az `i` értékével 1-től `N`-ig:
>    - Ha `A[i] > 0`, akkor az `Osszeg` értéke növekedjen `A[i]`-vel, és a `Db` értéke növekedjen 1-gyel.
> 3. Ha a `Db` értéke 0, a kimenet "nincs", különben az `Osszeg / Db`.

::: python

```python
n = int(input())
osszeg = 0
db = 0
for _ in range(n):
    szam = int(input())
    if szam > 0:
        osszeg += szam
        db += 1
if db == 0:
    print("NINCS")
else:
    print(f"{osszeg / db:.2f}")
```

:::

::: csharp

```csharp
using System;
using System.Globalization;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        int osszeg = 0;
        int db = 0;
        for (int i = 0; i < n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            if (szam > 0)
            {
                osszeg += szam;
                db++;
            }
        }
        if (db == 0)
        {
            Console.WriteLine("NINCS");
        }
        else
        {
            Console.WriteLine((osszeg / (double)db).ToString("F2", CultureInfo.InvariantCulture));
        }
    }
}
```

:::

A `4`, majd `6`, `-2`, `3`, `-1` bemenetre a pozitívak 6 és 3, az átlaguk `4.50`. Az osztás előtt mindig ellenőrizd, hogy a darabszám nem nulla: nullával osztani nem lehet.

## Feltételes maximum

A **feltételes maximum** a kiválogatás feltételét és a maximumkiválasztást köti össze: a legnagyobb elemet keresed, de csak azok között, amelyek megfelelnek a feltételnek. Itt a kezdőérték nem lehet "az első elem", mert az első elem lehet, hogy nem felel meg a feltételnek. Ezért külön jelzed, hogy volt-e már megfelelő elem.

::: python

A `None` Pythonban "még nincs érték" jelentésű.

```python
legnagyobb = None
for _ in range(n):
    szam = int(input())
    if szam % 2 == 0:
        if legnagyobb is None or szam > legnagyobb:
            legnagyobb = szam
```

:::

::: csharp

Egy `bool volt` jelző mutatja, hogy volt-e már megfelelő elem.

```csharp
bool volt = false;
int legnagyobb = 0;
for (int i = 0; i < n; i++)
{
    int szam = int.Parse(Console.ReadLine());
    if (szam % 2 == 0)
    {
        if (!volt || szam > legnagyobb)
        {
            legnagyobb = szam;
            volt = true;
        }
    }
}
```

:::

A ciklus után a jelző dönti el, mit írj ki: ha nem volt megfelelő elem, a válasz `NINCS`.

## Tételek egymás után: átlag feletti darabszám

Hány szám nagyobb az átlagnál? Az átlagot csak az **összes** szám ismeretében tudod, ezért két menet kell. Az elsőben beolvasod a számokat egy listába, és összegzel; a másodikban a listán végigmenve megszámolod az átlag felettieket.

> 1. Az `Osszeg` értéke legyen 0. Ismételd az `i` értékével 1-től `N`-ig: az `Osszeg` növekedjen `A[i]`-vel.
> 2. A `Db` értéke legyen 0. Ismételd az `i` értékével 1-től `N`-ig:
>    - Ha `A[i] * N > Osszeg`, akkor a `Db` értéke növekedjen 1-gyel.
> 3. A program kimenete a `Db`.

Az `A[i] > Osszeg / N` helyett az `A[i] * N > Osszeg` alakot használjuk: ugyanazt jelenti, de elkerüli a tizedes törteket és a kerekítési hibákat.

::: python

```python
szamok = []
osszeg = 0
for _ in range(n):
    szam = int(input())
    szamok.append(szam)
    osszeg += szam
db = 0
for szam in szamok:
    if szam * n > osszeg:
        db += 1
```

:::

::: csharp

```csharp
int[] szamok = new int[n];
int osszeg = 0;
for (int i = 0; i < n; i++)
{
    szamok[i] = int.Parse(Console.ReadLine());
    osszeg += szamok[i];
}
int db = 0;
for (int i = 0; i < n; i++)
{
    if (szamok[i] * n > osszeg)
    {
        db++;
    }
}
```

:::

Az `1`, `2`, `3`, `4`, `10` számok átlaga 4, ennél csak a 10 nagyobb, tehát a válasz 1.

## Keresés és összegzés együtt

Ha egy elemet az **előtte álló elemek összegéhez** kell hasonlítani, ugyanabban a ciklusban keresel és összegzel. A sorrendre figyelj: előbb hasonlíts az eddigi összeghez, és csak utána add hozzá az aktuális elemet, különben önmagához mérnéd.

## Szakaszok hossza

Az emelt szintű feladatok kedvelt témája a leghosszabb "valamilyen" szakasz (például szigorúan növekvő szakasz). Ehhez két számláló kell: az **aktuális** szakasz hossza, amely nő, amíg a feltétel teljesül, és újraindul 1-ről, amikor megszakad; és a **leghosszabb**, amelyet minden lépés után frissítesz (ez maximumkiválasztás). Az előző elemet itt is el kell tárolni.

## Gyakori hibák

::: python

1. **Osztás nullával.** Átlagnál ellenőrizd, hogy volt-e egyáltalán megfelelő elem (`db == 0`).
2. **Rossz kezdőérték a feltételes maximumnál.** Az első elem nem biztos, hogy megfelel a feltételnek; használj `None` jelzőt.
3. **Egy menet, ahol kettő kell.** Az átlag feletti számokat egy menetben nem tudod megszámolni, mert az átlag a végén derül ki. Tárold a számokat listában.
4. **Az előző elem frissítése kimarad.** Szomszédos párok vizsgálatánál a ciklus végén frissítsd az `elozo` változót.

:::

::: csharp

1. **Osztás nullával.** Átlagnál ellenőrizd, hogy volt-e egyáltalán megfelelő elem (`db == 0`).
2. **Rossz kezdőérték a feltételes maximumnál.** Az első elem nem biztos, hogy megfelel a feltételnek; használj `bool volt` jelzőt.
3. **Egész osztás.** Az `osszeg / db` két `int` esetén egész osztás: az átlagnál alakítsd az egyiket `double`-ra.
4. **Egy menet, ahol kettő kell.** Az átlag feletti számokat egy menetben nem tudod megszámolni, mert az átlag a végén derül ki. Tárold a számokat tömbben.
5. **Az előző elem frissítése kimarad.** Szomszédos párok vizsgálatánál a ciklus végén frissítsd az `elozo` változót.

:::

## Összefoglalás

- Több tétel egy ciklusban működik, ha a tételek ugyanazon a sorozaton futnak egymás eredménye nélkül (például összeg és darabszám).
- Ha az egyik tétel eredménye kell a másikhoz (átlag, majd átlag feletti darabszám), a tételek egymás után futnak, és a sorozatot el kell tárolni.
- Feltételes maximumnál külön jelző kell arra, hogy volt-e megfelelő elem.
- Az átlagnál az osztás előtt ellenőrizd a darabszámot.
- Szakaszoknál az aktuális és a legjobb hosszt külön tartsd nyilván.
