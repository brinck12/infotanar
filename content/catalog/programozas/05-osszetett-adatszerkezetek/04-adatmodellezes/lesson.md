---
slug: adatmodellezes
title: Adatmodellezés
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## A szövegből adatmodell

Az érettségi feladat szövege általában nem azt mondja, hogy "készíts egy rekordot három mezővel". Hosszú leírást kapsz egy buszjáratról, egy bajnokságról vagy egy raktárról, és neked kell eldöntened, **milyen adatszerkezetben tárold** a feladathoz szükséges adatokat. A jó modell után a program fele megíródik, a rossz modell minden lépést megnehezít.

A modellezéshez ez a négy lépés elég:

1. **Keresd meg a "dolgokat".** A szövegben az ismétlődő, egyedileg megkülönböztethető dolgok a rekordok: járat, mérkőzés, tétel, tanuló.
2. **Írd fel a mezőiket.** Minden dologról felsorolt adat egy mező.
3. **Add meg a típust.** Amivel számolsz, az szám; ami azonosító vagy név, az szöveg; ami logikai (foglalt/szabad), az `bool`.
4. **Válassz tárolót.** Sok azonos dolog: lista. Azonosító alapján keresett dolgok: szótár. Sor-oszlop rendszerű adat: kétdimenziós szerkezet.

## Típusválasztás: mit mivel?

- **Pénz, darabszám, pontszám:** egész szám (`int`). Egész forintnál ne használj lebegőpontos számot.
- **Azonosító** (cikkszám, rendszám, járatszám): szöveg, még akkor is, ha csak számjegyekből áll. Nem számolsz vele, és az elején lévő nullák számítanak (`007`).
- **Időpont:** a legkényelmesebb **egész számként percben** tárolni (`6:05` → `6 * 60 + 5 = 365`). Így az eltelt idő egy kivonás, az összehasonlítás egy `<`. Kiíráskor visszaalakítod: `perc // 60` és `perc % 60`.
- **Dátum:** ha csak megjelenítésre és összehasonlításra kell, az `2024-03-01` alakú szöveg is jó, mert a szöveges sorrend egyezik az időrendi sorrenddel.
- **Igen/nem jellegű adat:** `bool`, például egy szék foglaltsága.

## Példa: buszjáratok

"Egy kisváros autóbusz-közlekedésének adatai: minden járatnak van száma, indulási és érkezési ideje."

Dolog: a járat. Mezők: szám (szöveg), indulás (perc), érkezés (perc). Mivel a menetidő mindig kiszámítható, nem érdemes külön mezőként tárolni; elég egy metódus.

::: python

```python
from dataclasses import dataclass

def percre(ido):
    resz = ido.split(":")
    return int(resz[0]) * 60 + int(resz[1])

@dataclass
class Jarat:
    szam: str
    indulas: int
    erkezes: int

    def menetido(self):
        return self.erkezes - self.indulas

j = Jarat("12A", percre("6:05"), percre("6:50"))
print(j.menetido())
```

:::

::: csharp

```csharp
using System;

class Jarat
{
    public string Szam;
    public int Indulas;
    public int Erkezes;

    public int Menetido()
    {
        return Erkezes - Indulas;
    }
}

class Program
{
    static int Percre(string ido)
    {
        string[] resz = ido.Split(':');
        return int.Parse(resz[0]) * 60 + int.Parse(resz[1]);
    }

    static void Main()
    {
        var j = new Jarat { Szam = "12A", Indulas = Percre("6:05"), Erkezes = Percre("6:50") };
        Console.WriteLine(j.Menetido());
    }
}
```

:::

A kimenet `45`. Ha az időt szövegként tartanád, a menetidőhöz minden alkalommal újra kellene bontanod.

## Táblázatból rekord, kereséshez szótár

Ha a feladat azonosító alapján kérdez ("mennyi van a 1042-es cikkből?"), a rekordok listája helyett szótárat érdemes építeni: a kulcs az azonosító, az érték a rekord. Így a keresés nem végigjárás, hanem egyetlen lépés.

::: python

```python
keszlet = {}
keszlet["1042"] = Cikk("1042", 12, 350)
if "1042" in keszlet:
    print(keszlet["1042"].db)
```

:::

::: csharp

```csharp
var keszlet = new Dictionary<string, Cikk>();
keszlet["1042"] = new Cikk { Szam = "1042", Db = 12, Ar = 350 };
if (keszlet.ContainsKey("1042"))
{
    Console.WriteLine(keszlet["1042"].Db);
}
```

:::

## Rács: bool vagy szám?

Egy mozi ülésrendje sorokból és székekből áll: a természetes modell egy kétdimenziós `bool` táblázat (`foglalt[sor][szek]`), kezdetben minden `False`. Egy foglalás egyetlen elem átírása, a szabad helyek megszámlálása pedig egy kétszintű bejárás.

## Gyakori hibák

- Olyan adatot is tárolsz, ami kiszámolható (például a menetidőt), és elrontod a szinkront. A kiszámolható adat legyen metódus vagy számítás.
- Az időt szövegként hasonlítod össze: `"9:30" > "10:15"` igaz, mert a szöveges sorrend nem az időrend. Percre alakítsd.
- Az azonosítót számmá alakítod, és az elején lévő nullák elvesznek.
- Listában keresel ott, ahol szótár kellene: működik, de lassú és bőbeszédű.
- A rács indexeit 1-től és 0-tól számozva keveri a program: a bemenet 1-től számoz, a tömb 0-tól.

## Összefoglalás

- Modellezés = dologok, mezők, típusok, tároló.
- Az időt percben, a pénzt egész számként, az azonosítót szövegként tárold.
- Kereséshez szótár, sok azonos dologhoz lista, táblázathoz 2D szerkezet.
- Ami kiszámolható, azt ne tárold külön.
