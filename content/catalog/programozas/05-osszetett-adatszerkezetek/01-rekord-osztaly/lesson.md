---
slug: rekord-osztaly
title: Rekord és osztály
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Egy adat, több mező

Eddig egy változóban egy érték élt: egy szám, egy szöveg. Az életben az adatok gyakran **összetartoznak**: egy könyvnek van címe, oldalszáma és ára, egy diáknak neve, osztálya és átlaga. Ha ezeket külön változókban tartod (`cim1`, `oldal1`, `ar1`, `cim2`, ...), a program hamar követhetetlen lesz. Ilyenkor egyetlen, több mezős adattípust készítünk: ez a **rekord**. A rekord mezői névvel érhetők el, és minden mezőnek saját típusa van.

Az érettségi emelt szintű programozási feladatai szinte mindig rekordokra épülnek: a fájl minden sora egy rekord, a feladat pedig a rekordok feldolgozása.

## Rekord készítése

::: python

Pythonban a rekordot a `dataclass` adja. A `class` után a mezők nevét és típusát írod, a Python pedig magától elkészíti a konstruktort (az `@dataclass` sor teszi ezt). A típusjelölés (`str`, `int`) dokumentáció: a Python nem kényszeríti ki, de a program olvashatóbb tőle.

```python
from dataclasses import dataclass

@dataclass
class Konyv:
    cim: str
    oldal: int
    ar: int

k = Konyv("Egri csillagok", 520, 3990)
print(k.cim, k.oldal, k.ar)
k.ar = 4200
print(k.ar)
```

Kimenet:

```
Egri csillagok 520 3990
4200
```

A mezőt ponttal éred el (`k.cim`), és ugyanígy át is írhatod (`k.ar = 4200`).

:::

::: csharp

C#-ban a rekord egy `class`, amelynek mezői `public` láthatóságúak. A példányt a `new` készíti, a mezőket a kapcsos zárójelben is megadhatod.

```csharp
using System;

class Konyv
{
    public string Cim;
    public int Oldal;
    public int Ar;
}

class Program
{
    static void Main()
    {
        var k = new Konyv { Cim = "Egri csillagok", Oldal = 520, Ar = 3990 };
        Console.WriteLine(k.Cim + " " + k.Oldal + " " + k.Ar);
        k.Ar = 4200;
        Console.WriteLine(k.Ar);
    }
}
```

Kimenet:

```
Egri csillagok 520 3990
4200
```

A mezőt ponttal éred el (`k.Cim`), és ugyanígy át is írhatod. C#-ban a mezőnevet nagybetűvel szokás kezdeni.

:::

Próbáld ki: készíts `Diak` rekordot `nev`, `osztaly` és `atlag` mezővel, és írd ki egy példány adatait.

## Metódus: a rekord tud valamit

Az osztály nem csak adatot tárol, hanem **metódust** is kaphat: olyan függvényt, amely a saját mezőivel dolgozik. Így a számítás ott van, ahol az adat.

::: python

A metódus első paramétere a `self`: az a példány, amelyen a metódust meghívták.

```python
@dataclass
class Teglalap:
    a: int
    b: int

    def terulet(self):
        return self.a * self.b

t = Teglalap(3, 4)
print(t.terulet())
```

:::

::: csharp

A metódus közvetlenül használja a mezőket, külön `self` nincs.

```csharp
class Teglalap
{
    public int A;
    public int B;

    public int Terulet()
    {
        return A * B;
    }
}

// a Main-ben:
var t = new Teglalap { A = 3, B = 4 };
Console.WriteLine(t.Terulet());
```

:::

Mindkét esetben a kimenet `12`.

## Rekord a bemenetből

A feladatokban az adat szövegként érkezik, a rekordot neked kell összerakni. A tipikus lépések: beolvasod a sort, felbontod, a darabokat a megfelelő típusra alakítod, és példányt készítesz.

::: python

```python
sor = "Egri csillagok;520;3990"
resz = sor.split(";")
k = Konyv(resz[0], int(resz[1]), int(resz[2]))
```

:::

::: csharp

```csharp
string sor = "Egri csillagok;520;3990";
string[] resz = sor.Split(';');
var k = new Konyv { Cim = resz[0], Oldal = int.Parse(resz[1]), Ar = int.Parse(resz[2]) };
```

:::

Figyelj arra, hogy a szám típusú mezőt számmá kell alakítani; a szövegként tárolt `"520"` nem összehasonlítható és nem összeadható számként.

## Adatmodell a feladat szövegéből

Mielőtt kódolsz, döntsd el, milyen rekord kell. Három kérdés segít:

1. **Mi egy rekord?** (egy könyv, egy befizetés, egy tanuló)
2. **Milyen mezői vannak?** A szövegben felsorolt adatok: név, oldalszám, ár.
3. **Mi a mező típusa?** Amivel számolni kell, az szám (`int`); ami csak név vagy azonosító, az szöveg.

Egy példa: "Egy bankszámlához tartozik az egyenleg; pénzt be lehet fizetni, és ki lehet venni, de csak ha van elég fedezet." Itt a rekord a `Szamla`, egy mezője az `egyenleg`, és két művelete (metódusa) van: `befizet` és `kivesz`. A `kivesz` visszaadhatja, hogy sikerült-e.

## Gyakori hibák

- Elfelejted a beolvasott szám típusát átalakítani (`int(...)`, `int.Parse(...)`).
- Pythonban az `@dataclass` sort vagy a `from dataclasses import dataclass` importot kihagyod.
- Pythonban a metódusból kimarad a `self`, vagy a mezőt `self.` nélkül próbálod elérni.
- C#-ban a mező nem `public`, ezért a `Main` nem éri el.
- Két példányt egyformának hiszel: a rekord változó egy példányra mutat, a másolás külön lépés.

## Összefoglalás

- A rekord több, összetartozó mezőt fog össze egy névvel ellátott adattípusba.
- Python: `@dataclass`; C#: `class` publikus mezőkkel.
- A mezőket ponttal éred el; a metódus a rekord saját adataival dolgozik.
- A bemenet sorából `split` és típusátalakítás után lesz rekord.
- A modellt a feladat szövegéből építsd: mi a rekord, mik a mezői, mi a típusuk.
