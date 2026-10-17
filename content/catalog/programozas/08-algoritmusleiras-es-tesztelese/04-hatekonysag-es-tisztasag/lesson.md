---
slug: hatekonysag-es-tisztasag
title: Hatékonyság és tisztaság
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mit jelent a jó megoldás?

A működő program még nem feltétlenül **jó** program. A javítási útmutató általában ezeket nézi: helyes-e az eredmény minden bemenetre, jók-e a ciklusok és feltételek, és a program **érthető-e**. Aki később elolvassa (te magad is, két hét múlva), ne kelljen rejtvényt fejtenie. Ebben a leckében működő, de esetlen programokat kell letisztítanod úgy, hogy a **viselkedésük ne változzon**.

## Beszédes elnevezések

A változó és a függvény neve mondja meg, mit tárol vagy mit csinál. A `x1`, `t`, `valami` semmit nem mond; a `szelesseg`, `osszeg`, `szokoev` igen.

- A név magyarul vagy angolul legyen, de következetesen, ékezet nélkül.
- Egy betűs név csak a rövid ciklusváltozónak jó (`i`).
- A függvény neve igét vagy kérdést tükrözzön: `szamol_osszeg`, `prim_e`.
- Ne használj beépített nevet változónak (`max`, `sum`, `list`).

## Felesleges ciklusok és ismétlés

Ha ugyanazt a listát háromszor járod végig, miközben egyszer is elég lenne, a program lassabb és hosszabb. Az összegzést, a maximumot és a megszámlálást **egy ciklusban** is el lehet végezni:

::: python

```python
osszeg = 0
legnagyobb = None
for _ in range(n):
    szam = int(input())
    osszeg += szam
    if legnagyobb is None or szam > legnagyobb:
        legnagyobb = szam
```

:::

::: csharp

```csharp
int osszeg = 0;
int legnagyobb = 0;
for (int i = 0; i < n; i++)
{
    int szam = int.Parse(Console.ReadLine());
    osszeg += szam;
    if (i == 0 || szam > legnagyobb)
    {
        legnagyobb = szam;
    }
}
```

:::

Felesleges az is, ha a ciklus akkor is végigfut, amikor az eredmény már ismert. Az **eldöntés** tételében az első találatnál meg lehet állni.

::: python

```python
def van_negativ(lista):
    for elem in lista:
        if elem < 0:
            return True
    return False
```

:::

::: csharp

```csharp
static bool VanNegativ(int[] lista)
{
    foreach (int elem in lista)
    {
        if (elem < 0)
        {
            return true;
        }
    }
    return false;
}
```

:::

## Egyszerűbb feltételek

Az egymásba ágyazott `if`-ek gyakran egyetlen logikai kifejezéssé olvaszthatók, és az igaz/hamis értéket nem kell `if`-fel visszaadni. Ha egy feltétel értéke igaz vagy hamis, a függvény visszaadhatja közvetlenül:

::: python

```python
def paros(n):
    return n % 2 == 0
```

:::

::: csharp

```csharp
static bool Paros(int n)
{
    return n % 2 == 0;
}
```

:::

A `if n % 2 == 0: return True else: return False` ugyanazt csinálja, csak hosszabban.

## Ismétlődő kód: függvény

Ha ugyanaz a kódrészlet háromszor szerepel kis változtatással, tedd **függvénybe**, és hívd háromszor. Így egy hiba javítása egy helyen történik, és a program rövidebb lesz.

## Mi a jó megoldás a javítási útmutatóban?

Az útmutató a **tartalmi** pontokat adja: jó-e az algoritmus (megfelelő tétel, megfelelő kezdőérték, helyes ciklushatár), kezeli-e a szélső eseteket, és a kimenet formája egyezik-e a kéréssel. A stílusért (nevek, tagolás) általában kevesebb pont jár, de a rendezett kód segít, hogy a hibát te is hamar megtaláld, és hogy a javító is lássa a gondolatmenetedet. Fontos szabály: tisztításkor **ne változzon** a program viselkedése, ezért tisztítás után futtasd újra a teszteket.

## Gyakori hibák

- Tisztítás közben elromlik a viselkedés (más kimeneti szöveg, eltolt határ).
- Túl rövid, olvashatatlan kifejezések: a tömörség nem cél, az érthetőség igen.
- A függvény kiír is és vissza is ad: döntsd el, melyik a dolga.
- A megőrzött felesleges változók, amelyeket már senki sem használ.

## Összefoglalás

- A jó program helyes, érthető, és nem végez felesleges munkát.
- Beszédes nevek, egy ciklus a több helyett, korai kilépés eldöntésnél, ismétlődő rész függvénybe.
- Tisztításnál a kimenet maradjon azonos; tisztítás után mindig teszteld újra.
