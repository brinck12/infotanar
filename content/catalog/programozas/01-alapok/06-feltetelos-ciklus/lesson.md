---
slug: feltetelos-ciklus
title: Feltételes ciklus
position: 5
free: false
published: false
reviewed_by:
reviewed_at:
---

## Amikor nem tudjuk, hányszor

A `for` ciklus akkor kényelmes, ha előre tudod, hány kör lesz. De sokszor nem tudod. Például: "olvass be számokat, amíg nullát nem írnak", vagy "kérdezz, amíg a tipp nem talál". Ilyenkor a **feltételes ciklus** a megoldás: addig ismétel, **amíg egy feltétel igaz**. A neve `while`, vagyis "amíg".

## A while ciklus

::: python

A `while` után egy feltétel áll, a ciklus magja beljebb van húzva, akárcsak az `if`-nél.

```python
szam = 1
while szam <= 5:
    print(szam)
    szam = szam + 1
```

:::

::: csharp

A `while` után zárójelben egy feltétel áll, a ciklus magja kapcsos zárójelek között van.

```csharp
using System;

class Program
{
    static void Main()
    {
        var szam = 1;
        while (szam <= 5)
        {
            Console.WriteLine(szam);
            szam = szam + 1;
        }
    }
}
```

:::

A kimenet `1`, `2`, `3`, `4`, `5`. A működés: a gép **minden kör előtt** megvizsgálja a feltételt. Ha igaz, lefuttatja a magot, majd újra vizsgál. Ha hamis, a ciklus véget ér, és a program a ciklus utáni sorral folytatódik. Ha a feltétel már az elején hamis, a mag egyszer sem fut le.

## A végtelen ciklus csapdája

Figyeld meg a példában a `szam = szam + 1` sort. Ez **változtatja** azt az értéket, amelyet a feltétel vizsgál. Ha kihagynád, a `szam` mindig 1 maradna, a feltétel mindig igaz lenne, és a program sosem állna meg. Ezt hívjuk **végtelen ciklusnak**. Minden `while` esetén kérdezd meg magadtól: *mitől lesz egyszer hamis a feltétel?*

## Beolvasás nullával lezárva

A feltételes ciklus tipikus feladata: számokat olvasunk be, és egy különleges érték, itt a `0` jelzi a végét. Ezt az értéket **őrszemnek** is hívják. A minta: az első számot a ciklus előtt olvassuk be, a következőt a ciklus mag végén.

::: python

```python
osszeg = 0
szam = int(input())
while szam != 0:
    osszeg = osszeg + szam
    szam = int(input())
print(osszeg)
```

:::

::: csharp

```csharp
var osszeg = 0;
var szam = int.Parse(Console.ReadLine());
while (szam != 0)
{
    osszeg = osszeg + szam;
    szam = int.Parse(Console.ReadLine());
}
Console.WriteLine(osszeg);
```

:::

Bemenet `4`, `6`, `0` esetén a kimenet `10`. A záró nulla már nem kerül az összegbe, mert a feltétel megállítja a ciklust, mielőtt hozzáadnánk.

## Számjegyek összege

Egy másik tipikus feladat: egy szám számjegyeit szeretnénk összeadni. A trükk két művelet. A `szam % 10` megadja az **utolsó számjegyet**, az egész osztás `10`-zel pedig **levágja** azt. Addig ismételjük, amíg a szám el nem fogy.

::: python

Pythonban az egész osztás jele a `//`.

```python
szam = int(input())
osszeg = 0
while szam > 0:
    osszeg = osszeg + szam % 10
    szam = szam // 10
print(osszeg)
```

:::

::: csharp

C#-ban két egész szám osztása eleve egész osztás, ezért a `/` is elég.

```csharp
var szam = int.Parse(Console.ReadLine());
var osszeg = 0;
while (szam > 0)
{
    osszeg = osszeg + szam % 10;
    szam = szam / 10;
}
Console.WriteLine(osszeg);
```

:::

A `472` esetén a körök: `472` → utolsó számjegy 2, marad `47`; majd 7, marad `4`; majd 4, marad `0`. Az összeg `13`. Itt a feltétel azért lesz egyszer hamis, mert a szám minden körben kisebb lesz.

## Megszakítás: break

Néha a ciklus közepén derül ki, hogy elég volt. A `break` utasítás azonnal kilép a ciklusból. Gyakran `while True` (Pythonban) vagy `while (true)` (C#-ban) ciklussal együtt használjuk, amelynek a feltétele sosem hamis, így a kilépést a `break` intézi.

::: python

```python
while True:
    szam = int(input())
    if szam < 0:
        print("Negativ szamot kaptam, vege.")
        break
    print("Rendben: " + str(szam))
```

:::

::: csharp

```csharp
while (true)
{
    var szam = int.Parse(Console.ReadLine());
    if (szam < 0)
    {
        Console.WriteLine("Negativ szamot kaptam, vege.");
        break;
    }
    Console.WriteLine("Rendben: " + szam);
}
```

:::

## Euklidész algoritmusa

Két szám **legnagyobb közös osztóját** (lnko) a görög Euklidész több mint kétezer éve ismert módszerével számolhatjuk. A lényeg: az `a` és `b` lnko-ja ugyanaz, mint a `b` és az `a` `b`-vel vett maradékának lnko-ja. Addig ismételjük, amíg a második szám nulla nem lesz; ekkor az első szám a válasz.

Például `a = 18`, `b = 12`: a maradék `6`, tehát az új pár `12, 6`; a maradék `0`, az új pár `6, 0`. A válasz `6`.

::: python

```python
a = int(input())
b = int(input())
while b != 0:
    maradek = a % b
    a = b
    b = maradek
print(a)
```

:::

::: csharp

```csharp
var a = int.Parse(Console.ReadLine());
var b = int.Parse(Console.ReadLine());
while (b != 0)
{
    var maradek = a % b;
    a = b;
    b = maradek;
}
Console.WriteLine(a);
```

:::

Az átmeneti `maradek` változóra azért van szükség, hogy `a` és `b` új értékét ne írjuk felül egymással.

## Véletlen szám (csak ismerkedésnek)

Játékokban gyakran kell véletlen szám, például a számkitalálósban a titkos szám. Ez nyelvenként másképp megy: Pythonban a `random` modul `random.randint(1, 100)` hívása ad egy egész számot 1 és 100 között; C#-ban egy `Random` objektum `Next(1, 101)` metódusa, ahol a felső határ már nem tartozik bele. A feladatokban viszont **nem** használunk véletlent, mert a programod kimenetét a gép automatikusan ellenőrzi, és ahhoz előre tudni kell, mit kell kiírnia. A titkos számot ezért majd te olvasod be.

## Gyakori hibák

::: python

1. **Végtelen ciklus.** A `while` magja nem változtatja a feltételben szereplő változót. Ha a program nem áll le, itt keresd a hibát.
2. **Az utolsó beolvasás kimarad.** Az "amíg nem 0" mintában a következő számot be kell olvasni a mag végén is, különben mindig ugyanazt a számot dolgozod fel.
3. **`/` a `//` helyett.** A `szam / 10` tizedestörtet ad, a számjegyek levágásához `//` kell.

:::

::: csharp

1. **Végtelen ciklus.** A `while` magja nem változtatja a feltételben szereplő változót. Ha a program nem áll le, itt keresd a hibát.
2. **Az utolsó beolvasás kimarad.** Az "amíg nem 0" mintában a következő számot be kell olvasni a mag végén is, különben mindig ugyanazt a számot dolgozod fel.
3. **Hiányzó kapcsos zárójel.** Ha a `while` magja több utasítás, mindet `{ }` közé kell tenni.

:::

## Összefoglalás

- A `while` addig ismétel, amíg a feltétel igaz; a feltételt minden kör előtt vizsgálja.
- A magnak változtatnia kell azt, amit a feltétel vizsgál, különben végtelen ciklus lesz.
- Beolvasás egy záró értékig: első beolvasás a ciklus előtt, a következő a mag végén.
- Számjegyek: `% 10` az utolsó számjegy, egész osztás `10`-zel levágja.
- A `break` azonnal kilép a ciklusból.
- Euklidész: amíg `b` nem nulla, `(a, b)` helyére `(b, a % b)` kerül.
