---
slug: szamlalos-ciklus
title: Számlálós ciklus
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért kell a ciklus?

Képzeld el, hogy a számokat 1-től 100-ig kell kiírnod. Száz `print` sort nem érdemes begépelni, és ha holnap 1000 szám kell, kezdhetnéd elölről. Erre való a **ciklus**: egy utasítássor, amelyet a számítógép többször egymás után végrehajt. Te csak egyszer írod le, hogy mit kell csinálni, és megmondod, hányszor.

Ha előre tudjuk, hányszor kell ismételni, **számlálós ciklust** használunk. Programozásban a számlálós ciklust `for` ciklusnak hívják.

## A for ciklus

::: python

Pythonban a `for` után egy **ciklusváltozó** neve áll, majd a `range(...)` megadja, milyen értékeket vegyen fel. A ciklus **magja** (amit ismételni kell) beljebb kezdődik: négy szóközzel beljebb írjuk, ezt hívjuk behúzásnak.

```python
for i in range(5):
    print("Szia!")
```

Ez ötször írja ki a `Szia!` szöveget. A `range(5)` az `0, 1, 2, 3, 4` értékeket adja: öt értéket, nullától indulva.

:::

::: csharp

C#-ban a `for` után zárójelben három rész áll, pontosvesszővel elválasztva: honnan indul a ciklusváltozó (`int i = 0`), meddig tart a ciklus (`i < 5`), és hogyan változik minden kör után (`i++`, vagyis "növeld eggyel"). A ciklus magja kapcsos zárójelek között van.

```csharp
using System;

class Program
{
    static void Main()
    {
        for (int i = 0; i < 5; i++)
        {
            Console.WriteLine("Szia!");
        }
    }
}
```

Ez ötször írja ki a `Szia!` szöveget: az `i` értéke 0, 1, 2, 3, 4, tehát öt kör.

:::

A ciklusváltozó (`i`) minden körben más értéket kap, és a ciklus magjában ugyanúgy használhatod, mint bármelyik változót. Egy kör neve **iteráció**.

## Számok 1-től N-ig

Az embereknek természetes, hogy 1-től számolnak. Ehhez át kell állítani a kezdőértéket és a határt.

::: python

A `range(a, b)` az `a`-tól `b`-ig számol, de a `b` **már nem** tartozik bele. Ezért az 1..n kiírásához `range(1, n + 1)` kell.

```python
n = int(input())
for i in range(1, n + 1):
    print(i)
```

:::

::: csharp

A feltételt (`i <= n`) úgy írjuk, hogy az `n` még benne legyen a ciklusban.

```csharp
var n = int.Parse(Console.ReadLine());
for (int i = 1; i <= n; i++)
{
    Console.WriteLine(i);
}
```

:::

Ha a bemenet `3`, a kimenet három sor: `1`, `2`, `3`.

## Összegzés: számolás a ciklusban

A ciklus ereje, hogy közben "gyűjthetünk" is. Az összeg kiszámításához kell egy változó, amely nulláról indul, és minden körben hozzáadjuk az aktuális számot.

::: python

```python
n = int(input())
osszeg = 0
for i in range(1, n + 1):
    osszeg = osszeg + i
print(osszeg)
```

:::

::: csharp

```csharp
var n = int.Parse(Console.ReadLine());
var osszeg = 0;
for (int i = 1; i <= n; i++)
{
    osszeg = osszeg + i;
}
Console.WriteLine(osszeg);
```

:::

Ha `n` értéke 4, az `osszeg` sorban 0, 1, 3, 6, 10 lesz, és a kiírt végeredmény `10`. Fontos: az `osszeg = 0` a ciklus **előtt** áll. Ha a ciklusba tennéd, minden körben nullázódna.

## Osztók keresése

Egy szám osztója az, amellyel maradék nélkül osztható. A maradékot a `%` adja, amit már ismersz. Az `n` összes osztóját úgy találjuk meg, hogy 1-től `n`-ig minden számot megvizsgálunk: a ciklusban egy `if` dönti el, osztója-e.

::: python

```python
n = int(input())
for i in range(1, n + 1):
    if n % i == 0:
        print(i)
```

:::

::: csharp

```csharp
var n = int.Parse(Console.ReadLine());
for (int i = 1; i <= n; i++)
{
    if (n % i == 0)
    {
        Console.WriteLine(i);
    }
}
```

:::

A `12` osztói: `1`, `2`, `3`, `4`, `6`, `12`. Ez egy nagyon gyakori minta: **ciklus és feltétel együtt**.

## Szorzótábla és számok összefűzése

A ciklusváltozó értékét szöveggel is összefűzhetjük, így sorokat készíthetünk, például a hármas szorzótáblát.

::: python

Pythonban a számot előbb szöveggé kell alakítani a `str(...)` függvénnyel, hogy a `+` összefűzze.

```python
for i in range(1, 4):
    print("3 * " + str(i) + " = " + str(3 * i))
```

:::

::: csharp

C#-ban a `$"..."` szövegbe a `{}` közé tetszőleges kifejezést is írhatsz.

```csharp
for (int i = 1; i <= 3; i++)
{
    Console.WriteLine($"3 * {i} = {3 * i}");
}
```

:::

A kimenet: `3 * 1 = 3`, `3 * 2 = 6`, `3 * 3 = 9`.

## Lépésköz és visszafelé számolás

Nem kell mindig eggyesével haladni. A harmadik megadott érték a **lépésköz**.

::: python

A `range(kezdet, vege, lepes)` a `lepes` értékével lép. Negatív lépésközzel visszafelé is számolhatsz; a vég ilyenkor sem tartozik bele.

```python
for i in range(10, 0, -2):
    print(i)
```

Ez a `10, 8, 6, 4, 2` számokat írja ki.

:::

::: csharp

A harmadik részben nem kell `i++` lennie: az `i += 2` kettesével lép, az `i--` pedig eggyel csökkent.

```csharp
for (int i = 10; i > 0; i -= 2)
{
    Console.WriteLine(i);
}
```

Ez a `10, 8, 6, 4, 2` számokat írja ki.

:::

## Gyakori hibák

::: python

1. **Eggyel elcsúszott határ.** A `range(1, n)` már nem éri el az `n`-t, ezért az 1..n összeghez `range(1, n + 1)` kell.
2. **Behúzás nélküli mag.** Ami nincs beljebb húzva, az nem része a ciklusnak, és csak egyszer fut le.
3. **Az összegző változó a ciklusban nullázódik.** A `osszeg = 0` a ciklus előtt legyen.

:::

::: csharp

1. **Eggyel elcsúszott határ.** Az `i < n` nem éri el az `n`-t, az 1..n összeghez `i <= n` kell.
2. **Kapcsos zárójel hiánya.** Ha több utasítás tartozik a ciklushoz, mindet `{ }` közé kell tenni, különben csak az első ismétlődik.
3. **Az összegző változó a ciklusban nullázódik.** Az `var osszeg = 0;` a ciklus előtt legyen.

:::

## Összefoglalás

- A számlálós ciklus előre ismert számú ismétlésre való.
- A ciklusváltozó körönként új értéket kap.
- Az összegzéshez a változót a ciklus előtt nullázzuk, a ciklusban növeljük.
- Ciklus és `if` együtt: a számok közül a feltételnek megfelelőket választjuk ki, például az osztókat.

::: python

- `for i in range(a, b)`: `a`-tól `b - 1`-ig; `range(a, b, lepes)` a lépésközzel.

:::

::: csharp

- `for (int i = a; i <= b; i++)`: `a`-tól `b`-ig; a lépés az utolsó részben állítható.

:::
