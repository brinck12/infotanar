---
slug: emelt-feladat-rekurzio-vagy-2d
title: "Emelt feladat: rekurzió és mátrix"
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Amikor a feladat egy térkép

Az emelt szintű programozási feladatok egy része nem sorokból álló listát ad, hanem **táblázatot**: térképet, játéktáblát, képpontokat. Ilyenkor a fájl első sora a méret, utána pedig annyi sor jön, ahány a táblázat sora. A programban ezt kétdimenziós szerkezettel, **mátrixszal** tárolod. Gyakori kérdés a "hány összefüggő terület van?" típus, és ezt a legkönnyebben **rekurzióval** oldod meg.

Ebben a leckében egy tenger térképével dolgozol. A `#` szárazföld, a `.` víz, a szigetek pedig a vízszintesen vagy függőlegesen összefüggő földmezők csoportjai.

## A mátrix beolvasása

Az első sor két szám: a sorok és az oszlopok száma. A térképet elég sztringek listájaként tárolnod: a `terkep[i][j]` az `i`. sor `j`. karaktere, mindkét index 0-tól indul. A kimenetben viszont a feladat általában 1-től számoz, ezért átváltáskor mindig `-1`, illetve `+1` kell.

```python
with open("terkep.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
meret = sorok[0].split()
n = int(meret[0])
m = int(meret[1])
terkep = sorok[1:1 + n]
print(terkep[0][2])
```

```csharp
using System;
using System.IO;

class Program
{
    static void Main()
    {
        string[] sorok = File.ReadAllLines("terkep.txt");
        string[] meret = sorok[0].Split(' ');
        int n = int.Parse(meret[0]);
        int m = int.Parse(meret[1]);
        string[] terkep = new string[n];
        for (int i = 0; i < n; i++)
        {
            terkep[i] = sorok[i + 1];
        }
        Console.WriteLine(terkep[0][2]);
    }
}
```

Próbáld ki: írd ki a térkép utolsó sorának utolsó karakterét.

## Sorok, oszlopok, szomszédok

A mátrixos feladatok három alapműveletre épülnek:

- **Sor szerint:** egy ciklus, a `terkep[i]` egy teljes sor (`count("#")` megszámolja a földmezőket).
- **Oszlop szerint:** a külső ciklus az oszlopot, a belső a sort járja: `terkep[i][j]`, `i` változik.
- **Szomszéd:** a négy irányt az `(i - 1, j)`, `(i + 1, j)`, `(i, j - 1)`, `(i, j + 1)` mezők adják. **Mindig a határt ellenőrizd először**, és csak utána olvasd ki a mezőt, különben a program a térképen kívülre indexel és hibával áll le.

Az első sorban és oszlopban, illetve az utolsóban kevesebb szomszédja van egy mezőnek. Ez a leggyakoribb rejtett teszt: egy sarokmező vagy egy egysoros térkép.

## A rekurzió

Egy függvény **rekurzív**, ha saját magát hívja. Hasonlít a két tükör közötti végtelen képhez: a feladatot önmagához hasonló, kisebb feladatra vezeted vissza. Két dolog kell hozzá: egy **alapeset**, ahol a függvény már nem hívja magát, és egy **lépés**, amely kisebb feladatra bontja a problémát.

```python
def faktorialis(k):
    if k <= 1:
        return 1
    return k * faktorialis(k - 1)

print(faktorialis(5))
```

```csharp
using System;

class Program
{
    static int Faktorialis(int k)
    {
        if (k <= 1)
        {
            return 1;
        }
        return k * Faktorialis(k - 1);
    }

    static void Main()
    {
        Console.WriteLine(Faktorialis(5));
    }
}
```

A kimenet `120`. Az `5!` a `4!`-ra, az pedig a `3!`-ra vezet vissza, egészen az alapesetig (`1!`). Ha az alapesetet elfelejted, a függvény végtelenül hívja magát, és a program összeomlik.

## Területbejárás rekurzióval

A sziget méretét így gondold végig: ha egy földmezőn állsz, a sziget mérete **1 plusz** az, ahány új mezőt a négy szomszéd felől még elérsz. A már bejárt mezőket meg kell jelölni, különben két szomszédos mező örökké egymásra hívna. Az alapesetek: a mező a térképen kívül van, víz, vagy már jártál ott.

```python
def sziget_meret(i, j, latott):
    if i < 0 or i >= n or j < 0 or j >= m:
        return 0
    if terkep[i][j] != "#" or latott[i][j]:
        return 0
    latott[i][j] = True
    return (1 + sziget_meret(i - 1, j, latott) + sziget_meret(i + 1, j, latott)
            + sziget_meret(i, j - 1, latott) + sziget_meret(i, j + 1, latott))
```

```csharp
static int SzigetMeret(int i, int j, bool[,] latott)
{
    if (i < 0 || i >= n || j < 0 || j >= m)
    {
        return 0;
    }
    if (terkep[i][j] != '#' || latott[i, j])
    {
        return 0;
    }
    latott[i, j] = true;
    return 1 + SzigetMeret(i - 1, j, latott) + SzigetMeret(i + 1, j, latott)
        + SzigetMeret(i, j - 1, latott) + SzigetMeret(i, j + 1, latott);
}
```

A C# változatban a `terkep`, `n` és `m` osztályszintű (`static`) mező, hogy a függvény is lássa őket. A szigetek megszámlálásához járd végig a teljes térképet: ha olyan földmezőt találsz, amely még nincs bejárva, új sziget kezdődik. Hívd meg rá a függvényt, ami az egész szigetet bejárja és megjelöli, a számlálót pedig növeld eggyel. Ugyanez a minta a "legnagyobb sziget" kereséséhez is jó: a visszatérési érték a méret.

Próbáld ki: a szomszédokat átlósan is hozzávéve nézd meg, hogyan változik a szigetek száma. Ez mutatja meg, miért kell pontosan elolvasnod a feladat szomszédsági szabályát.

## A feladatsor haladása

A hét részfeladat nehezedik: beolvasás és számlálás, soronkénti és oszloponkénti vizsgálat, szomszédok, majd a rekurzív sziget, végül fájlba írás. Az első négyet rekurzió nélkül is megoldod, a pontok nagy része tehát ott keresendő.

## Gyakori hibák

- **Határellenőrzés nélküli indexelés.** A `terkep[i - 1][j]` az `i = 0` esetben Pythonban a *legutolsó* sort adja (negatív index), nem hibát: csendben rossz választ kapsz.
- **Hiányzó alapeset.** A rekurzió nem áll meg, és a program "maximum recursion depth" vagy veremtúlcsordulás hibával leáll.
- **Elfelejtett jelölés.** Ha a bejárt mezőt nem jelölöd meg, a függvény a szomszédok között oda-vissza ugrál.
- **Sor és oszlop felcserélése.** A kimenetben `sor oszlop` sorrend van, a mátrixban `terkep[sor][oszlop]`. Ellenőrizd egy kis példán.
- **Egy- vagy nullás méret.** Egysoros térképen az oszloponkénti vizsgálat is jó marad, ha a határt mindig megnézed.
- **Új jelölőtábla hiánya.** Ha ugyanazt a `latott` táblát újra felhasználod egy második bejáráshoz, a függvény mindenhol nullát ad.

## Összefoglalás

- A táblázatos adatot sztringlistában vagy mátrixban tárold; az indexek 0-tól indulnak, a kimenet gyakran 1-től számoz.
- Szomszédvizsgálatnál mindig a határt ellenőrizd először.
- A rekurziónak alapesete és kisebb feladatra bontó lépése van; a bejárt elemeket jelöld meg.
- Szigetszámlálásnál a nem bejárt földmezőnél új terület kezdődik, a függvény a méretet adja vissza.
- A rejtett tesztek között ott a csupa víz, a csupa föld és az egysoros térkép.
