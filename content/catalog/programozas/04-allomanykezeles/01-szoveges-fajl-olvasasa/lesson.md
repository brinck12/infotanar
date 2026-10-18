---
slug: szoveges-fajl-olvasasa
title: Szöveges fájl olvasása
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért olvasunk fájlt?

Eddig minden adatot a billentyűzetről kértél be. Az érettségi feladatok viszont általában egy **fájlban** adják meg az adatokat: száz, ezer sor, amelyet senki nem gépelne be kézzel. A program dolga ilyenkor az, hogy megnyissa a fájlt, sorról sorra végigolvassa, és feldolgozza a tartalmát. Ebben a leckében a szöveges fájlok olvasását tanulod meg.

A szöveges fájl nem más, mint sorok sorozata: minden sor végén egy láthatatlan **sortörés** jelzi, hogy a következő sor jön. A fájlt a program **a nevével** nyitja meg; a feladatokban a fájl mindig ott van a program mellett, ezért elég a nevét megadni, például `nevek.txt`.

## A fájl megnyitása

::: python

Pythonban a `with open(...)` megnyitja a fájlt, és a blokk végén magától be is zárja. A `encoding="utf-8"` azt mondja meg, hogy a szöveg ékezetes betűit is jól olvassa.

```python
with open("nevek.txt", encoding="utf-8") as f:
    szoveg = f.read()
print(szoveg)
```

A `f.read()` az egész fájlt egyetlen szövegként adja vissza.

:::

::: csharp

C#-ban a `System.IO` névtér `File` osztálya olvassa a fájlokat, ezért a program elejére kell a `using System.IO;` sor. A `File.ReadAllText` az egész fájlt egyetlen szövegként adja vissza.

```csharp
using System;
using System.IO;

class Program
{
    static void Main()
    {
        string szoveg = File.ReadAllText("nevek.txt");
        Console.WriteLine(szoveg);
    }
}
```

:::

Ha a `nevek.txt` fájl tartalma `Anna`, `Bela`, `Csilla` három sorban, a kimenet is ez a három sor lesz. Próbáld ki a feladatnál: a fájl a program mellett van.

## Soronkénti olvasás

Az adatfeldolgozáshoz ritkán kell az egész fájl egy darabban; sokkal inkább **soronként** akarod látni. Mindkét nyelvben két jó módszer van: végigmenni a sorokon, vagy az összes sort egyszerre listába olvasni.

::: python

```python
with open("nevek.txt", encoding="utf-8") as f:
    for sor in f:
        print(sor.strip())
```

A fájlon közvetlenül végig lehet menni egy `for` ciklussal. Minden `sor` a sortörést is tartalmazza a végén, ezért a `strip()` (vagy `rstrip("\n")`) levágja, különben a `print` után üres sor maradna.

Ha az összes sorra egyben van szükséged, például hogy megszámold őket:

```python
with open("nevek.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
print(len(sorok))
```

A `splitlines()` a szöveget sorokra vágja, és a sortöréseket eldobja. Az eredmény egy lista, amelyet úgy kezelhetsz, ahogy a listákról tanultad (`len`, indexelés, ciklus).

:::

::: csharp

```csharp
foreach (string sor in File.ReadAllLines("nevek.txt"))
{
    Console.WriteLine(sor);
}
```

A `File.ReadAllLines` a fájl sorait egy `string[]` tömbként adja vissza, a sortörések nélkül. Ezt a tömböt úgy kezelheted, ahogy a tömbökről tanultad (`Length`, indexelés, `foreach`).

```csharp
string[] sorok = File.ReadAllLines("nevek.txt");
Console.WriteLine(sorok.Length);
```

:::

## Számok a fájlban

A fájlból **mindig szöveg** érkezik, akkor is, ha a sorban egy szám áll. Ugyanúgy kell átalakítani, mint a billentyűzetről érkező számot.

::: python

```python
osszeg = 0
with open("szamok.txt", encoding="utf-8") as f:
    for sor in f:
        osszeg += int(sor)
print(osszeg)
```

Az `int(...)` a sor végi sortörést el tudja viselni, ezért itt nem kell `strip()`.

:::

::: csharp

```csharp
int osszeg = 0;
foreach (string sor in File.ReadAllLines("szamok.txt"))
{
    osszeg += int.Parse(sor);
}
Console.WriteLine(osszeg);
```

:::

Ez ugyanaz az **összegzés**, amit a programozási tételeknél láttál; csak az adatok most a fájlból jönnek, nem a billentyűzetről vagy egy listából.

## Keresés a sorokban

Egy sorról az `in` (C#-ban `Contains`) segítségével eldöntheted, tartalmaz-e egy szövegrészt. Így egy fájlból könnyen kiválogathatod a számodra érdekes sorokat.

::: python

```python
with open("naplo.txt", encoding="utf-8") as f:
    for sor in f:
        if "hiba" in sor:
            print(sor.strip())
```

:::

::: csharp

```csharp
foreach (string sor in File.ReadAllLines("naplo.txt"))
{
    if (sor.Contains("hiba"))
    {
        Console.WriteLine(sor);
    }
}
```

:::

Ez a **kiválogatás**: minden sorra eldöntöd, belekerül-e a kimenetbe. Ha közben egy számlálót is növelsz, a **megszámlálás** tételét is megkaptad.

## Gyakori hibák

- **Rossz fájlnév vagy nincs ott a fájl.** A program hibával leáll (`FileNotFoundException` vagy `FileNotFoundError`). Ellenőrizd a nevet, a kis- és nagybetűket és a kiterjesztést is (`nevek.txt`, nem `nevek`).
- **Elfelejtett `strip()`** (Python): a kiírt sorok után üres sor jelenik meg, mert a `print` is új sort kezd, és a beolvasott sor is sortöréssel végződik.
- **Szám helyett szöveg.** `"5" + "3"` az `"53"`, nem 8. A fájlból jövő számot előbb alakítsd át.
- **Üres sor a fájl végén vagy közepén.** Az `int("")` hibát dob. Ha a fájlban üres sor is lehet, ellenőrizd a sort a feldolgozás előtt.
- **Fájl megnyitása kétszer egymás után**, miközben az első még nyitva van: egy beolvasás elég, a sorokat tedd listába, és azzal dolgozz tovább.

## Összefoglalás

- A fájlt a nevével nyitod meg, és a program mellett kell lennie.
- Pythonban `with open("nev.txt", encoding="utf-8") as f:`, C#-ban `File.ReadAllLines("nev.txt")` (`using System.IO;`).
- A fájl sorait ciklussal vagy listába olvasva dolgozod fel.
- A fájlból mindig szöveg érkezik; számhoz `int(...)` / `int.Parse(...)` kell.
- A programozási tételek (összegzés, megszámlálás, kiválogatás) fájlból érkező adatokon is ugyanúgy működnek.
