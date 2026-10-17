---
slug: metszet
title: Metszet
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Két halmaz közös elemei

Két csoportnak gyakran a **közös** elemeire vagyunk kíváncsiak: mely tanulók járnak mindkét szakkörre, mely számok szerepelnek mindkét listán. Ez a **metszet**: azok az elemek, amelyek az `A` sorozatban **és** a `B` sorozatban is benne vannak. Minden közös elem egyszer szerepel az eredményben, még akkor is, ha valamelyik listán többször áll.

## Az algoritmus mondatokban

> **Bemenet:** `A` és `B` sorozat
> **Kimenet:** `K` lista (a közös elemek)
>
> 1. A `K` lista legyen üres.
> 2. Vedd sorra az `A` sorozat elemeit. Minden `x` elemre:
>    1. Ha az `x` szerepel a `B` sorozatban, **és** még nincs benne a `K` listában, tedd a `K` végére.
> 3. Vége: a `K` az `A` és `B` közös elemeit tartalmazza, az `A` sorrendjében.

A "szerepel a `B`-ben" kérdés **eldöntés** (a tanult eldöntés tétel), a "nincs még a `K`-ban" szintén. A metszet tehát kiválogatás, amelynek a feltétele egy eldöntés. Ha a listák nagyok, ez lassú: minden `x`-hez végig kell nézni a `B`-t.

## Kódolás

::: python

```python
a = [4, 1, 7, 4, 9]
b = [9, 4, 6, 1]
kozos = []
for x in a:
    if x in b and x not in kozos:
        kozos.append(x)
print(kozos)
```

Kimenet: `[4, 1, 9]`. A `in` operátor a listában keres, vagyis egy beépített eldöntés.

:::

::: csharp

```csharp
var a = new List<int> { 4, 1, 7, 4, 9 };
var b = new List<int> { 9, 4, 6, 1 };
var kozos = new List<int>();
foreach (int x in a)
{
    if (b.Contains(x) && !kozos.Contains(x))
    {
        kozos.Add(x);
    }
}
Console.WriteLine(string.Join(" ", kozos));
```

Kimenet: `4 1 9`. A `Contains` a listában keres, vagyis egy beépített eldöntés.

:::

Szótár- vagy halmazszerkezettel (`set`, `HashSet`) a keresés gyors, és a duplikáció is eleve kizárt; erről a halmazokat tárgyaló lecke szól. A metszet egyszerű, de ha a vizsgán a feladat azt kéri, hogy ne használj beépített eszközt, ismerned kell a kézzel megírt változatot is.

## Rendezett listák: lineáris metszet

Ha mindkét lista **szigorúan növekvően rendezett**, a metszet sokkal gyorsabb. Két "ujjal" haladsz: az `i` az `A`-t, a `j` a `B`-t mutatja.

> 1. `i` = 0, `j` = 0, a `K` lista legyen üres.
> 2. Amíg `i` kisebb, mint `A` hossza, **és** `j` kisebb, mint `B` hossza:
>    1. Ha `A[i]` egyenlő `B[j]`-vel: tedd a `K` végére, majd növeld mindkét mutatót.
>    2. Ha `A[i]` kisebb: csak az `i` nő (az `A[i]` nem lehet közös, mert a `B` többi eleme nagyobb).
>    3. Különben a `j` nő.

Minden lépésben legalább az egyik mutató előrelép, ezért legfeljebb `N + M` lépés van; ez a **lineáris** lépésszám. Az eredmény rendezett is lesz.

::: python

```python
i = 0
j = 0
kozos = []
while i < len(a) and j < len(b):
    if a[i] == b[j]:
        kozos.append(a[i])
        i += 1
        j += 1
    elif a[i] < b[j]:
        i += 1
    else:
        j += 1
```

:::

::: csharp

```csharp
int i = 0;
int j = 0;
var kozos = new List<int>();
while (i < a.Count && j < b.Count)
{
    if (a[i] == b[j])
    {
        kozos.Add(a[i]);
        i++;
        j++;
    }
    else if (a[i] < b[j])
    {
        i++;
    }
    else
    {
        j++;
    }
}
```

:::

Próbáld ki: kövesd végig papíron az `[1, 3, 5, 7]` és a `[3, 4, 5, 8]` listát; a közös elemek a 3 és az 5.

## Több lista és rekordok

Három vagy több lista metszete: kezdd az elsővel, és minden további listával szűkítsd az eredményt (csak azokat tartod meg, amelyek abban is szerepelnek). Rekordoknál a metszet mindig **kulcs** szerint megy: két névsor közös tagjait a nevek alapján keresed, de az eredményben a teljes rekordot (vagy mindkét listabeli adatot) használhatod.

## Gyakori hibák

- A duplikációk kezelése hiányzik: ha az `A`-ban kétszer áll egy közös elem, az eredményben is kétszer jelenik meg.
- A lineáris algoritmust rendezetlen listára futtatod: hibás eredményt kapsz. Ellenőrizd, hogy a bemenet rendezett-e.
- A ciklus feltétele `vagy` (`or`) az `és` helyett, ezért túlindexel.
- Az eredmény sorrendje eltér a feladat kérésétől: az első lista sorrendje, vagy növekvő sorrend.
- A mutatók közül mindkettőt növeled, amikor nem egyenlők.

## Összefoglalás

- A metszet a két sorozat közös elemei, mindegyik egyszer.
- Általános eset: az `A` minden elemére eldöntés a `B`-ben (és az eredményben).
- Rendezett listáknál két mutatóval lineáris időben megy.
- Több listánál lépésenként szűkítsd az eredményt; rekordoknál a kulcs számít.
