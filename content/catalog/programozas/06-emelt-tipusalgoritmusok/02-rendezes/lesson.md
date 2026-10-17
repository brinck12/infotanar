---
slug: rendezes
title: Rendezés
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért kell a rendezés?

A rendezett adat sok mindent megkönnyít: a legnagyobb és a legkisebb a két végén van, a medián középen, az egyforma elemek egymás mellett, a metszet és az unió pedig lineáris lépésszámmal elvégezhető. Az érettségin gyakran kell rangsort vagy névsort kiírni, ahhoz rendezés kell.

Két dolgot tanulsz meg: hogyan rendez a számítógép **kézzel megírt algoritmussal**, és hogyan használd a **beépített rendezést**. A vizsgán az algoritmus ismerete és a megfelelő beépített eszköz használata egyaránt számít.

## Minimumkiválasztásos rendezés

> **Bemenet:** `N` elemű `A` sorozat
> **Kimenet:** az `A` sorozat növekvő sorrendben
>
> 1. Az `i` legyen 0-tól `N - 2`-ig sorra:
>    1. Keresd meg az `i`-edik és az utolsó elem közti **legkisebb** elem helyét; legyen ez `m`.
>    2. Ha `m` nem egyenlő `i`-vel, cseréld meg az `A[i]` és az `A[m]` elemet.
> 2. Vége: az `A` sorozat rendezett.

A gondolat: az `i`-edik helyre mindig a még rendezetlen rész legkisebbje kerül, ezért a sorozat eleje lépésenként "kész". A legkisebb helyének keresése a már ismert minimumkiválasztás.

::: python

```python
a = [5, 2, 9, 1]
n = len(a)
for i in range(n - 1):
    m = i
    for j in range(i + 1, n):
        if a[j] < a[m]:
            m = j
    if m != i:
        a[i], a[m] = a[m], a[i]
print(a)
```

A csere Pythonban egyetlen sor: `a[i], a[m] = a[m], a[i]`. A kimenet `[1, 2, 5, 9]`.

:::

::: csharp

```csharp
int[] a = { 5, 2, 9, 1 };
int n = a.Length;
for (int i = 0; i < n - 1; i++)
{
    int m = i;
    for (int j = i + 1; j < n; j++)
    {
        if (a[j] < a[m])
        {
            m = j;
        }
    }
    if (m != i)
    {
        int seged = a[i];
        a[i] = a[m];
        a[m] = seged;
    }
}
Console.WriteLine(string.Join(" ", a));
```

C#-ban a cserénél segédváltozó kell, mert az érték egyébként elveszne. A kimenet `1 2 5 9`.

:::

## Cserés (buborék) rendezés

> 1. Ismételd a következőt, amíg egy menetben nem történik csere:
>    1. Vedd sorra a szomszédos párokat: `A[j]` és `A[j + 1]`, `j` = 0-tól `N - 2`-ig.
>    2. Ha `A[j] > A[j + 1]`, cseréld meg őket.

Minden menet a legnagyobb elemet "felbuborékoltatja" a rész végére. Egy cserével pontosan egy **inverziót** (rossz sorrendben álló párt) szüntetsz meg, ezért a cserék száma a kezdeti sorozat inverzióinak száma, bármelyik buborékrendezés-változatot írod.

::: python

```python
csere = 0
volt = True
while volt:
    volt = False
    for j in range(n - 1):
        if a[j] > a[j + 1]:
            a[j], a[j + 1] = a[j + 1], a[j]
            csere += 1
            volt = True
```

:::

::: csharp

```csharp
int csere = 0;
bool volt = true;
while (volt)
{
    volt = false;
    for (int j = 0; j < n - 1; j++)
    {
        if (a[j] > a[j + 1])
        {
            int seged = a[j];
            a[j] = a[j + 1];
            a[j + 1] = seged;
            csere++;
            volt = true;
        }
    }
}
```

:::

## A beépített rendezés

A saját rendezés tanulságos, de éles feladatban a beépítettet használd: gyorsabb és kevésbé hibás.

::: python

```python
b = sorted(a)                # új, rendezett lista
a.sort()                     # helyben rendez
a.sort(reverse=True)         # csökkenő sorrend
```

:::

::: csharp

```csharp
a.Sort();                    // List<int> vagy tömb: Array.Sort(a)
a.Reverse();                 // megfordítja; a Sort után ez a csökkenő sorrend
```

A `List<T>` esetén `a.Sort()` és `a.Reverse()` metódus; tömbnél `Array.Sort(a)` és `Array.Reverse(a)`.

:::

A beépített rendezés használata nem kerüli meg a megértést: tudnod kell, mit rendez, milyen sorrendben, és mi történik az egyenlő elemekkel (erről a következő lecke szól).

## Rendezés mint előkészítés

Rendezett sorozaton több feladat egyszerű lesz.

- **Medián:** a rendezett sorozat középső eleme; páros elemszámnál a két középső átlaga.
- **Különböző értékek:** az egyforma elemek egymás mellett állnak, ezért a szomszédos elempárok különbségeinek megszámolásával megkapod a különböző értékek számát (első elem + minden olyan elem, amely különbözik az előzőtől).
- **Leggyakoribb érték:** az azonos elemek szakaszainak hossza.

## Gyakori hibák

- A csere segédváltozó nélkül: `a[i] = a[m]; a[m] = a[i]` mindkét helyre ugyanazt írja.
- A külső ciklus határa eggyel eltér: a minimumkiválasztásnál az utolsó elemre már nincs szükség.
- A buborékrendezés belső ciklusa túlindexel (`j + 1` eléri az `N`-et).
- A `sort()` Pythonban `None`-t ad vissza; `b = a.sort()` nem rendezett listát ad.
- Az elemeket szövegként rendezed: `"10" < "9"`, ezért előbb alakítsd számmá.

## Összefoglalás

- Minimumkiválasztásos rendezés: az `i`-edik helyre a rendezetlen rész legkisebbje kerül.
- Cserés rendezés: a szomszédos rossz sorrendű párokat cseréljük, amíg van ilyen.
- Beépített: Pythonban `sorted`, `sort`; C#-ban `Sort`, `Array.Sort`.
- A rendezett sorozat megkönnyíti a mediánt, a különböző értékek és a gyakoriság megállapítását.
