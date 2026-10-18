---
slug: kodolas-leirasbol
title: Kódolás leírásból
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Leírásból program

Az érettségi programozási feladatai közül sok így szól: "Az alábbi algoritmus ... Készítsd el a megfelelő programot!" A leírás megmondja, **mit** kell csinálni; a te dolgod, hogy lépésről lépésre lekódold. Ebben a leckében két dolgot gyakorolsz: a leírás lekódolását, és a leírás **módosítását**.

## Ismétlés: tétel keresése a leírásban

A programozási tételeket felismered a szerkezetükről:

- **Összegzés**: `osszeg := 0`, a ciklusban `osszeg := osszeg + szam`.
- **Megszámlálás**: `db := 0`, a ciklusban elágazás, igaz ágban `db := db + 1`.
- **Maximum**: `max := az első elem`, a ciklusban `szam > max esetén: max := szam`.
- **Eldöntés**: van-e olyan elem, amelyre a feltétel igaz?

Ha felismered a tételt, a kód jó része már meg is van.

## Lekódolás lépésről lépésre

```text
Algoritmus Maximum
  Be: N
  Be: max
  Ciklus i := 2-től N-ig
    Be: szam
    Elágazás
      szam > max esetén: max := szam
    Elágazás vége
  Ciklus vége
  Ki: max
Algoritmus vége
```

::: python

```python
n = int(input())
maxi = int(input())
for i in range(2, n + 1):
    szam = int(input())
    if szam > maxi:
        maxi = szam
print(maxi)
```

A `max` beépített függvény neve, ezért a változót `maxi`-nak nevezzük.

:::

::: csharp

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        int max = int.Parse(Console.ReadLine());
        for (int i = 2; i <= n; i++)
        {
            int szam = int.Parse(Console.ReadLine());
            if (szam > max)
            {
                max = szam;
            }
        }
        Console.WriteLine(max);
    }
}
```

:::

Két gyakori csapda: a ciklus **2-től** indul, mert az első számot már beolvastuk; és a maximum kezdőértéke az első elem, nem a 0.

## Módosítás: más feltétel

Az érettségin gyakran egy kész algoritmust kell kicsit átalakítani. Az első fajta módosítás: **a feltétel cseréje**. Példa: az eredeti algoritmus a 10-nél nagyobb számokat számolja meg:

```text
Elágazás
  szam > 10 esetén: db := db + 1
Elágazás vége
```

Ha a feladat azt kéri, hogy a 3-mal osztható számokat számolja, csak a feltétel változik, a szerkezet marad:

```text
Elágazás
  szam osztható 3-mal esetén: db := db + 1
Elágazás vége
```

Kódban az oszthatóság: `szam % 3 == 0`.

## Módosítás: más tétel

A második fajta módosítás nagyobb: **másik programozási tételt** kell használni. Például az összegzésből megszámlálás lesz, ha csak a pozitív számokat adod össze és megszámolod is. Ilyenkor azt nézd meg, melyik rész változik:

- mi az **induló érték** (összegnél 0, maximumnál az első elem, számlálónál 0),
- mi a **feltétel**, amely mellett a változó frissül,
- mi **frissül** és hogyan,
- mit kell **kiírni** a végén.

Ha ezt a négy dolgot mindig átnézed, nem marad ki semmi.

## Egy érettségis szokás: lista beolvasása, majd feldolgozás

Sokszor a leírás azt mondja: `Be: lista[1..N]`. Ez azt jelenti, hogy először mind az `N` számot beolvasod egy listába (tömbbe), és csak utána dolgozod fel. Az elemekre `lista[i]` jelöléssel hivatkozik, 1-től számozva. Pythonban és C#-ban a lista 0-tól indul, ezért az `i`-edik elem a `lista[i - 1]`.

## Gyakori hibák

- A ciklus rossz határokkal indul vagy ér véget (`1-től N-ig` vagy `0-tól N-ig`).
- A kezdőérték hiányzik vagy rossz (a maximumnál 0 negatív számoknál hibás).
- A módosításkor a kiírás régi formája marad.
- A leírás 1-től számozott indexét a 0-tól induló listában nem alakítod át.

## Összefoglalás

- A leírás lekódolása soronként történik; előbb ismerd fel a programozási tételt.
- Módosításnál azt keresd, mi változik: induló érték, feltétel, frissítés, kiírás.
- A feltételcsere kicsi, a tételcsere nagyobb átalakítás, de ugyanígy végiggondolható.
