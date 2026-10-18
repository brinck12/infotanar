---
slug: szovegek
title: Szövegek
position: 6
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi az a szöveg?

Eddig főleg számokkal dolgoztunk, de a programok legtöbb adata szöveg: nevek, szavak, mondatok. A szöveg **karakterek sorozata**: betűké, számjegyeké, szóközöké, írásjeleké. Ebben a leckében megtanulod megkérdezni a hosszát, elérni az egyes karaktereit, darabokat kivágni belőle, és karakterenként végigmenni rajta. A ciklusokat az előző két leckéből már ismered, most új terepen használod őket.

## Hossz és indexelés

A szöveg hosszát a karakterek száma adja, a szóközöket is beleszámolva.

::: python

A `len(...)` függvény adja a hosszt. Az egyes karaktert szögletes zárójellel érjük el: `szo[0]` az első karakter. A számozást **nullától** kezdjük; ezt a számot **indexnek** hívjuk.

```python
szo = "alma"
print(len(szo))
print(szo[0])
print(szo[3])
```

:::

::: csharp

A `Length` tulajdonság adja a hosszt (zárójel nélkül). Az egyes karaktert szögletes zárójellel érjük el: `szo[0]` az első karakter. A számozást **nullától** kezdjük; ezt a számot **indexnek** hívjuk.

```csharp
using System;

class Program
{
    static void Main()
    {
        var szo = "alma";
        Console.WriteLine(szo.Length);
        Console.WriteLine(szo[0]);
        Console.WriteLine(szo[3]);
    }
}
```

:::

A kimenet: `4`, `a`, `a`. Az `alma` karakterei: `a` (0), `l` (1), `m` (2), `a` (3). Az utolsó karakter indexe tehát mindig a hossz mínusz egy.

::: python

Pythonban a negatív index hátulról számol: `szo[-1]` az utolsó karakter.

:::

Ha olyan indexet kérsz, amely nincs a szövegben (például `szo[4]` az `alma` esetén), a program futási hibával leáll.

## Szeletelés

Egy szövegnek nem csak egy karakterét, hanem egy darabját is kivághatod.

::: python

A `szo[a:b]` az `a` indextől a `b` indexig tart, de a `b`-edik karaktert már nem veszi bele. Ha az elejét vagy a végét elhagyod, a szöveg elejétől vagy végéig tart.

```python
szo = "programozas"
print(szo[0:4])
print(szo[4:])
```

:::

::: csharp

A `szo.Substring(kezdet, hossz)` a `kezdet` indextől kezdve `hossz` darab karaktert ad. Ha csak a kezdetet adod meg, a szöveg végéig tart.

```csharp
var szo = "programozas";
Console.WriteLine(szo.Substring(0, 4));
Console.WriteLine(szo.Substring(4));
```

:::

A kimenet: `prog` és `ramozas`.

## Keresés, kis- és nagybetű

::: python

A `szo.find(resz)` megadja, hol kezdődik a keresett rész, vagy `-1`-et, ha nincs benne. A `szo.upper()` nagybetűssé, a `szo.lower()` kisbetűssé alakít. Ezek **új szöveget adnak**, az eredeti nem változik.

```python
szo = "Programozas"
print(szo.find("gram"))
print(szo.find("x"))
print(szo.upper())
print(szo.lower())
```

:::

::: csharp

A `szo.IndexOf(resz)` megadja, hol kezdődik a keresett rész, vagy `-1`-et, ha nincs benne. A `szo.ToUpper()` nagybetűssé, a `szo.ToLower()` kisbetűssé alakít. Ezek **új szöveget adnak**, az eredeti nem változik.

```csharp
var szo = "Programozas";
Console.WriteLine(szo.IndexOf("gram"));
Console.WriteLine(szo.IndexOf("x"));
Console.WriteLine(szo.ToUpper());
Console.WriteLine(szo.ToLower());
```

:::

A kimenet: `3`, `-1`, `PROGRAMOZAS`, `programozas`. Kisbetűssé alakítás akkor hasznos, ha a kis- és nagybetűt egyformának akarjuk venni: az `E` és az `e` két különböző karakter, de a kisbetűsített szövegben már csak `e` van.

## Karakterek bejárása

A ciklus és a szöveg együtt nagyon erős: karakterenként végigmehetsz a szövegen. Számoljuk meg például, hányszor szerepel az `a` betű.

::: python

A `for` ciklus közvetlenül a karaktereken is végigmehet.

```python
szoveg = input()
db = 0
for betu in szoveg:
    if betu == "a":
        db = db + 1
print(db)
```

Ha az indexre is szükséged van, használhatod a `range(len(szoveg))` megadást: ekkor az `i` a 0, 1, ... indexeket veszi fel, és `szoveg[i]` a karakter.

:::

::: csharp

A `foreach` ciklus a szöveg minden karakterén végigmegy; a karakter típusa `char`, a karaktert aposztrófok között írjuk: `'a'`.

```csharp
var szoveg = Console.ReadLine();
var db = 0;
foreach (char betu in szoveg)
{
    if (betu == 'a')
    {
        db = db + 1;
    }
}
Console.WriteLine(db);
```

Ha az indexre is szükséged van, használhatsz `for (int i = 0; i < szoveg.Length; i++)` ciklust: ekkor `szoveg[i]` a karakter.

:::

Egy halmazba tartozás vizsgálatához a keresést is használhatod: megnézed, hogy a karakter szerepel-e egy szövegben.

::: python

```python
if betu in "aeiou":
    print("maganhangzo")
```

Az `in` megvizsgálja, hogy a bal oldali karakter megtalálható-e a jobb oldali szövegben.

:::

::: csharp

```csharp
if ("aeiou".IndexOf(betu) >= 0)
{
    Console.WriteLine("maganhangzo");
}
```

Az `IndexOf` nem `-1`-et ad, ha a karakter megtalálható a szövegben.

:::

## Szöveg összefűzése és ismétlése

Szöveget úgy építhetsz fel, hogy egy üres szövegből indulsz, és karaktereket fűzöl hozzá, ahogy az összegnél számokat adtál hozzá.

::: python

```python
eredmeny = ""
for betu in "abc":
    eredmeny = eredmeny + betu + "-"
print(eredmeny)
```

Szöveget a `*` is ismétel: a `"ab" * 3` eredménye `ababab`.

:::

::: csharp

```csharp
var eredmeny = "";
foreach (char betu in "abc")
{
    eredmeny = eredmeny + betu + "-";
}
Console.WriteLine(eredmeny);
```

Szöveget a `new string('a', 3)` ismétel: ez `aaa`-t ad. Az első paraméter egy karakter, a második az ismétlések száma.

:::

A kimenet: `a-b-c-`. A visszafelé építés is lehetséges: ha a karaktert **elé** fűzöd (`betu + eredmeny`), a sorrend megfordul.

## Gyakori hibák

::: python

1. **Eggyel elcsúszott index.** Az első karakter a `szo[0]`, az utolsó a `szo[len(szo) - 1]`. A `szo[len(szo)]` hibát okoz.
2. **A szöveg nem módosítható helyben.** A `szo.upper()` nem változtatja meg a `szo`-t; az eredményt el kell tenni: `szo = szo.upper()`.
3. **Kis- és nagybetű különbsége.** Az `"A" == "a"` hamis. Összehasonlítás előtt érdemes `lower()`-rel egységesíteni.

:::

::: csharp

1. **Eggyel elcsúszott index.** Az első karakter a `szo[0]`, az utolsó a `szo[szo.Length - 1]`. A `szo[szo.Length]` hibát okoz.
2. **A szöveg nem módosítható helyben.** A `szo.ToUpper()` nem változtatja meg a `szo`-t; az eredményt el kell tenni: `szo = szo.ToUpper();`.
3. **Aposztróf és idézőjel keverése.** A `'a'` egy karakter, az `"a"` egy egykarakteres szöveg; a kettő nem hasonlítható össze egymással.

:::

## Összefoglalás

- A szöveg karakterek sorozata; az indexelés nullától kezdődik.
- Hossz, egy karakter, egy darab: indexelés és szeletelés.
- Keresésnél a találat helye, vagy `-1`, ha nincs találat.
- Karakterenként ciklussal járhatod be; közben számolhatsz vagy új szöveget építhetsz.
- A szövegműveletek új szöveget adnak vissza, az eredetit nem módosítják.

::: python

- `len(s)`, `s[i]`, `s[a:b]`, `s.find(x)`, `s.upper()`, `s.lower()`, `x in s`, `s * n`.

:::

::: csharp

- `s.Length`, `s[i]`, `s.Substring(a, hossz)`, `s.IndexOf(x)`, `s.ToUpper()`, `s.ToLower()`, `new string(c, n)`.

:::
