---
slug: osszetett-feltetelek
title: Összetett feltételek
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Amikor egy feltétel nem elég

Az előző leckében egyszerű feltételeket írtál, például `kor >= 18`. A valóságban a szabályok gyakran összetettek: "a belépéshez 12 évesnek kell lenned, **és** a magasságod legalább 140 cm", vagy "a kedvezmény jár a diákoknak, **vagy** a nyugdíjasoknak". Ebben a leckében megtanulod a feltételeket összekapcsolni, megfordítani, és egymásba ágyazni.

## Logikai műveletek: és, vagy, nem

Három művelet van, amely logikai (igaz/hamis) értékekből újat készít:

- **és**: akkor igaz, ha **mindkét** rész igaz;
- **vagy**: akkor igaz, ha **legalább az egyik** rész igaz;
- **nem**: megfordítja az értéket (igazból hamis, hamisból igaz).

::: python

Pythonban a három művelet kulcsszava az `and`, az `or` és a `not`.

```python
kor = 15
magassag = 150
print(kor >= 12 and magassag >= 140)   # True
print(kor >= 18 or magassag >= 190)    # False
print(not kor >= 18)                   # True
```

:::

::: csharp

C#-ban a három művelet jele `&&` (és), `||` (vagy) és `!` (nem).

```csharp
int kor = 15;
int magassag = 150;
Console.WriteLine(kor >= 12 && magassag >= 140);   // True
Console.WriteLine(kor >= 18 || magassag >= 190);   // False
Console.WriteLine(!(kor >= 18));                   // True
```

A `!` mögé összetett kifejezésnél zárójelet kell tenni, ahogy fent látod.

:::

Az igazságtábla megmutatja, mi történik az `A` és `B` négy lehetséges értékével:

| A | B | A és B | A vagy B |
|---|---|---|---|
| igaz | igaz | igaz | igaz |
| igaz | hamis | hamis | igaz |
| hamis | igaz | hamis | igaz |
| hamis | hamis | hamis | hamis |

## Intervallumok vizsgálata

Az egyik leggyakoribb használat: egy szám benne van-e egy tartományban. A matematikai `1 <= x <= 10` mindkét feltételt egyszerre jelenti, ezért **kétszer** kell leírni az `x`-et.

::: python

```python
x = int(input())
if x >= 1 and x <= 10:
    print("benne van")
else:
    print("kivul esik")
```

:::

::: csharp

```csharp
int x = int.Parse(Console.ReadLine());
if (x >= 1 && x <= 10)
{
    Console.WriteLine("benne van");
}
else
{
    Console.WriteLine("kivul esik");
}
```

:::

Ha a szám a tartományon **kívül** akarjuk vizsgálni, a `vagy` kell: `x < 1 vagy x > 10`. Ez az ellentéte az előzőnek, ami jó ellenőrzési módszer: ha egy feltétel jó, az "nem" előtaggal ellentétes értéket ad.

## Szökőév: összetett feltétel példa

Egy év szökőév, ha osztható 4-gyel, **kivéve** a százzal oszthatókat, **de** a 400-zal oszthatók mégis szökőévek. Ezt zárójelekkel írjuk le:

- osztható 4-gyel **és** nem osztható 100-zal, **vagy**
- osztható 400-zal.

Egy szám akkor osztható `k`-val, ha a `k`-val vett maradéka 0.

::: python

```python
ev = int(input())
if (ev % 4 == 0 and ev % 100 != 0) or ev % 400 == 0:
    print("szokoev")
else:
    print("nem szokoev")
```

:::

::: csharp

```csharp
using System;

class Program
{
    static void Main()
    {
        int ev = int.Parse(Console.ReadLine());
        if ((ev % 4 == 0 && ev % 100 != 0) || ev % 400 == 0)
        {
            Console.WriteLine("szokoev");
        }
        else
        {
            Console.WriteLine("nem szokoev");
        }
    }
}
```

:::

A `2024` szökőév, az `1900` nem, a `2000` igen. A zárójelek itt fontosak: az `és` erősebben köt a `vagy`-nál, de a zárójel mindig egyértelművé teszi, mire gondolsz.

## Egymásba ágyazott elágazás

Az elágazás ágában is lehet újabb elágazás. Ez akkor hasznos, ha egy második kérdést csak az első válasza után érdemes feltenni.

::: python

```python
kor = int(input())
if kor >= 18:
    valasz = input()
    if valasz == "igen":
        print("Beleptethetem")
    else:
        print("Nincs jegye")
else:
    print("Kiskoru")
```

Figyeld meg a kétszeres behúzást: a belső `if` a külső `if` ágához tartozik.

:::

::: csharp

```csharp
int kor = int.Parse(Console.ReadLine());
if (kor >= 18)
{
    string valasz = Console.ReadLine();
    if (valasz == "igen")
    {
        Console.WriteLine("Beleptethetem");
    }
    else
    {
        Console.WriteLine("Nincs jegye");
    }
}
else
{
    Console.WriteLine("Kiskoru");
}
```

A belső `if` a külső `if` kapcsos zárójelén belül áll.

:::

Sokszor a beágyazás kiváltható `és`-sel vagy `elif`-fel, és az így írt kód laposabb, könnyebben olvasható. Beágyazást akkor használj, ha tényleg egymásra épülő döntésekről van szó.

## Több feltétel, egy kérdés: osztályzat

Az érettségi pontszámokból osztályzat lesz: 0-24 pont elégtelen (1), 25-39 elégséges (2), 40-59 közepes (3), 60-79 jó (4), 80-tól jeles (5). Az `elif` lánc itt jól használható, mert felülről haladva elég a felső határt nézni:

::: python

```python
pont = int(input())
if pont < 25:
    print(1)
elif pont < 40:
    print(2)
elif pont < 60:
    print(3)
elif pont < 80:
    print(4)
else:
    print(5)
```

:::

::: csharp

```csharp
int pont = int.Parse(Console.ReadLine());
if (pont < 25)
{
    Console.WriteLine(1);
}
else if (pont < 40)
{
    Console.WriteLine(2);
}
else if (pont < 60)
{
    Console.WriteLine(3);
}
else if (pont < 80)
{
    Console.WriteLine(4);
}
else
{
    Console.WriteLine(5);
}
```

:::

## Gyakori hibák

::: python

1. **Félig leírt feltétel.** Az `x >= 1 and <= 10` hibás; mindkét oldalon kell az `x`: `x >= 1 and x <= 10`.
2. **`or` és `and` felcserélése.** "Nem esik a tartományba" vagy-gyal készül (`x < 1 or x > 10`); `and`-del ez soha nem lehet igaz.
3. **Zárójel nélküli összetett feltétel.** Ha `and` és `or` keveredik, mindig tegyél zárójelet.
4. **Határértékek.** Gondold végig, hogy a határon (pl. 25 pont, 2000-es év) melyik ágba kerül az érték: `<` vagy `<=`.

:::

::: csharp

1. **Félig leírt feltétel.** Az `x >= 1 && <= 10` hibás; mindkét oldalon kell az `x`: `x >= 1 && x <= 10`.
2. **`||` és `&&` felcserélése.** "Nem esik a tartományba" vagy-gyal készül (`x < 1 || x > 10`); `&&`-sel ez soha nem lehet igaz.
3. **Zárójel nélküli összetett feltétel.** Ha `&&` és `||` keveredik, mindig tegyél zárójelet.
4. **Határértékek.** Gondold végig, hogy a határon (pl. 25 pont, 2000-es év) melyik ágba kerül az érték: `<` vagy `<=`.

:::

## Összefoglalás

::: python

- Logikai műveletek: `and`, `or`, `not`.

:::

::: csharp

- Logikai műveletek: `&&`, `||`, `!`.

:::

- Az "és" mindkét részt, a "vagy" legalább az egyiket kívánja igaznak.
- Intervallumhoz két összehasonlítás kell, "és"-sel kapcsolva.
- Összetett feltételnél a zárójel egyértelművé teszi a sorrendet.
- Az ágakban újabb elágazás állhat (beágyazás), de gyakran az `és` vagy az `elif` egyszerűbb.

Jöhetnek a feladatok.
