---
slug: unio
title: Unió
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Két halmaz egyesítése

A metszet a közös elemeket adta; az **unió** (egyesítés) azokat, amelyek **legalább az egyik** sorozatban szerepelnek. Ha az egyik szakkörnek Anna és Bence a tagja, a másiknak Bence és Csilla, az unió Anna, Bence és Csilla: a Bence egyszer szerepel, nem kétszer. Az unió fő kérdése tehát az **ismétlődés kezelése**.

A tankönyvi összefüggés: az unió elemeinek száma `|A| + |B| - |metszet|`. Erre a feladatokban gyakran szükség van: ha tudod az unió és a metszet méretét, a két csoport "csak az egyikben" elemeinek száma is kiolvasható.

## Az algoritmus mondatokban

> **Bemenet:** `A` és `B` sorozat
> **Kimenet:** `U` lista (az unió)
>
> 1. Az `U` lista legyen üres.
> 2. Vedd sorra az `A` elemeit. Ha az elem még nincs az `U`-ban, tedd az `U` végére.
> 3. Vedd sorra a `B` elemeit. Ha az elem még nincs az `U`-ban, tedd az `U` végére.
> 4. Vége.

Vagyis az `A` elemei után a `B`-ből csak az "új" elemek kerülnek be. A "még nincs az `U`-ban" eldöntés ugyanaz a tétel, amit a metszetnél használtál.

::: python

```python
a = [4, 1, 7, 4]
b = [9, 4, 6, 1]
unio = []
for x in a + b:
    if x not in unio:
        unio.append(x)
print(unio)
```

Kimenet: `[4, 1, 7, 9, 6]`. Az `a + b` a két listát összefűzi, ezért egyetlen ciklus elég.

:::

::: csharp

```csharp
var a = new List<int> { 4, 1, 7, 4 };
var b = new List<int> { 9, 4, 6, 1 };
var unio = new List<int>();
foreach (int x in a)
{
    if (!unio.Contains(x))
    {
        unio.Add(x);
    }
}
foreach (int x in b)
{
    if (!unio.Contains(x))
    {
        unio.Add(x);
    }
}
Console.WriteLine(string.Join(" ", unio));
```

Kimenet: `4 1 7 9 6`.

:::

## Rendezett listák: összefésülés

Ha a két lista **szigorúan növekvően rendezett**, az uniót a metszethez hasonlóan két mutatóval, lineáris lépésszámmal is megkapod, és az eredmény rendezett lesz. Ezt hívják **összefésülésnek**.

> 1. `i` = 0, `j` = 0, az `U` lista legyen üres.
> 2. Amíg `i` kisebb az `A` hosszánál **és** `j` kisebb a `B` hosszánál:
>    1. Ha `A[i]` egyenlő `B[j]`-vel: tedd az `A[i]`-t az `U`-ba, majd `i` és `j` is nő.
>    2. Ha `A[i]` kisebb: tedd az `A[i]`-t az `U`-ba, `i` nő.
>    3. Különben tedd a `B[j]`-t az `U`-ba, `j` nő.
> 3. Ha az `A`-ban maradt elem, tedd át mindet az `U` végére.
> 4. Ha a `B`-ben maradt elem, tedd át mindet az `U` végére.

A ciklus után legfeljebb az egyik listában maradhat elem; az mind nagyobb, mint az eddig kitett elemek, ezért a végére másolható.

::: python

```python
i = 0
j = 0
unio = []
while i < len(a) and j < len(b):
    if a[i] == b[j]:
        unio.append(a[i])
        i += 1
        j += 1
    elif a[i] < b[j]:
        unio.append(a[i])
        i += 1
    else:
        unio.append(b[j])
        j += 1
unio += a[i:]
unio += b[j:]
```

A `a[i:]` az `i`-edik elemtől a végéig a lista egy része.

:::

::: csharp

```csharp
int i = 0;
int j = 0;
var unio = new List<int>();
while (i < a.Count && j < b.Count)
{
    if (a[i] == b[j])
    {
        unio.Add(a[i]);
        i++;
        j++;
    }
    else if (a[i] < b[j])
    {
        unio.Add(a[i]);
        i++;
    }
    else
    {
        unio.Add(b[j]);
        j++;
    }
}
while (i < a.Count)
{
    unio.Add(a[i]);
    i++;
}
while (j < b.Count)
{
    unio.Add(b[j]);
    j++;
}
```

:::

Ha a rendezett listákban **ismétlődés megengedett**, és az összes elemet meg akarod tartani (összefuttatás), az egyenlő eset egyszerűen az `A[i]` kitétele, majd `i` növelése, így az `A` és a `B` egyenlő elemei is mind bekerülnek.

## Gyakoriság: hány listában szerepel?

Az uniót gyakran megfejeli egy számlálás: melyik értéket hány lista tartalmazza? Ilyenkor listánként halmazt képezel (hogy egy listán belül az ismétlődés ne számítson), és szótárban növeled a számlálót. A kimenet rendezése a kulcsok rendezésével megy. Az érték mindig legfeljebb annyi, ahány lista van.

## Gyakori hibák

- Az ismétlődés kimarad: az `a + b` összefűzés unió helyett csak egyesít.
- Összefésülésnél a tartalék (maradék) elemek átmásolása hiányzik.
- Az egyenlő eset kezelése hiányzik: az érték kétszer kerül be.
- Rendezetlen listára futtatod az összefésülést.
- A `|A| + |B|` összeget az unió méretének hiszed; a metszet méretét le kell vonni.

## Összefoglalás

- Az unió azokat az elemeket adja, amelyek legalább az egyik sorozatban szerepelnek, mindegyiket egyszer.
- Általános eset: `A` minden elemét, majd `B` azon elemeit, amelyek még nincsenek az eredményben.
- Rendezett listáknál összefésüléssel, két mutatóval, lineáris lépésszámmal megy.
- `|unió| = |A| + |B| - |metszet|`.
