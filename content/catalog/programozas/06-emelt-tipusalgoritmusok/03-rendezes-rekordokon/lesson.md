---
slug: rendezes-rekordokon
title: Rendezés rekordokon
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Rekordok rendezése

Rekordokat nem szám szerint rendezünk, hanem valamelyik **mezőjük**, a **kulcs** szerint. A ranglista a pontszám szerint, a névsor a név szerint rendez, de mindkét esetben a teljes rekord mozog. A rendezés algoritmusa ugyanaz, mint a számoknál; az összehasonlítás helyén a két rekord kulcsát hasonlítod össze.

> **Rendezés kulcs szerint:** ugyanaz, mint a minimumkiválasztásos vagy a beszúró rendezés, csak az "`A[j]` kisebb, mint `A[m]`" feltétel helyén az "`A[j]` **kulcsa** kisebb, mint `A[m]` **kulcsa**" áll, és a csere az egész rekordot cseréli.

## Beépített rendezés kulccsal

::: python

A `sorted` és a `sort` a `key` paramétert kapja: egy függvényt, amely a rekordból kiveszi a kulcsot. A kulcs egyszerűen megadható `lambda` kifejezéssel.

```python
rang = sorted(tanulok, key=lambda t: t.pont)                  # pont szerint növekvő
rang = sorted(tanulok, key=lambda t: t.pont, reverse=True)    # csökkenő
```

:::

::: csharp

A LINQ `OrderBy` és `OrderByDescending` metódusa kulcsválasztó függvényt kap. Használatukhoz kell a `using System.Linq;`.

```csharp
var rang = tanulok.OrderBy(t => t.Pont).ToList();             // pont szerint növekvő
var rang2 = tanulok.OrderByDescending(t => t.Pont).ToList();  // csökkenő
```

:::

## Stabilitás

Egy rendezés **stabil**, ha az egyenlő kulcsú elemek az eredeti sorrendjüket megtartják. Ha a bemenetben Anna a 30 pontos Bence előtt áll, és mindketten 30 pontosak, a stabil rendezés után is Anna van előbb.

Pythonban a `sorted` és a `sort` **stabil**, még `reverse=True` mellett is. C#-ban az `OrderBy` stabil, de a `List<T>.Sort` és az `Array.Sort` **nem**: egyenlő kulcsoknál tetszőleges sorrendet adhat. Ha a sorrend számít (például a ranglistán az egyforma pontúak sorrendje), C#-ban `OrderBy`-t használj.

A stabilitásra azért van szükség, mert segítségével **többszempontú rendezést** építhetsz fel: előbb rendezz a kevésbé fontos kulcs szerint, majd a fontosabb szerint, és az utóbbi nem rontja el az előbbit az egyenlő elemek között.

## Többszempontú rendezés

Gyakori a kérés: "osztály szerint növekvő, azon belül pont szerint csökkenő, azon belül név szerint".

::: python

Pythonban a kulcs egy rendezett n-es (tuple); a csökkenő számnál a kulcs ellentettjét vesszük.

```python
rang = sorted(tanulok, key=lambda t: (t.osztaly, -t.pont, t.nev))
```

:::

::: csharp

C#-ban a `ThenBy` és a `ThenByDescending` fűzi egymás után a szempontokat. A szövegeket `StringComparer.Ordinal` szerint hasonlítjuk, így a sorrend a karakterkódokon alapul, és nem függ a nyelvi beállítástól.

```csharp
var rang = tanulok
    .OrderBy(t => t.Osztaly, StringComparer.Ordinal)
    .ThenByDescending(t => t.Pont)
    .ThenBy(t => t.Nev, StringComparer.Ordinal)
    .ToList();
```

:::

Szövegek rendezésénél ügyelj a nagy- és kisbetűkre: a karakterkód szerinti sorrendben minden nagybetű megelőzi a kisbetűket (`Zoli` előbb áll, mint `anna`). A feladatok ezt általában kizárják, vagy megmondják.

## A rendezés kézzel, rekordokon: beszúró rendezés

A **beszúró rendezés** a rendezett kezdőszakaszba szúr be egyenként: a következő elemet addig tolja visszafelé, amíg az előtte lévő nagyobb kulcsú.

> 1. A második elemtől az utolsóig, `i`-vel:
>    1. Vedd ki az `i`-edik elemet, ez az `x`.
>    2. Amíg van előtte elem, és annak kulcsa **szigorúan nagyobb**, mint az `x` kulcsa, told eggyel jobbra.
>    3. Az üres helyre tedd az `x`-et.

A **szigorúan** szó adja a stabilitást: egyenlő kulcsnál megáll, így az `x` nem lép át az egyenlő társán. Ha `>=`-t írnál, a sorrend megfordulna az egyenlők között.

## Gyakori hibák

- Pythonban a `key` helyett `cmp`-szerű függvényt próbálsz adni.
- C#-ban a `List.Sort`-ot használod ott, ahol az egyenlők sorrendje számít (nem stabil).
- A csökkenő sorrendet rendezés + `reverse` kombinációval oldod meg: az egyenlők sorrendje ilyenkor megfordul. Használj `reverse=True`-t vagy `OrderByDescending`-et.
- A számot szövegként rendezed (`"100" < "20"`); a mezőt alakítsd számmá.
- A kulcs típusa nem egyezik a mezővel (szám és szöveg keveredik egy `tuple`-ben).

## Összefoglalás

- Rekordot kulcsmező szerint rendezünk; a teljes rekord mozog.
- Python: `sorted(..., key=...)`; C#: `OrderBy`, `ThenBy` (LINQ).
- A stabil rendezés megőrzi az egyenlő kulcsúak eredeti sorrendjét; `List.Sort` nem stabil.
- Többszempontú rendezés: tuple-kulcs (Python), `ThenBy` (C#).
- A beszúró rendezés szigorú összehasonlítással stabil.
