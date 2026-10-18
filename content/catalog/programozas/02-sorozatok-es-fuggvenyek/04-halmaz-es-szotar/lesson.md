---
slug: halmaz-es-szotar
title: Halmaz és szótár
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Amikor a lista nem elég

A lista sorrendben tárolja az elemeket, és ugyanaz az érték többször is szerepelhet benne. Sokszor viszont más kell:

- csak azt akarod tudni, **milyen különböző** értékek fordultak elő (ez a **halmaz**);
- vagy minden értékhez egy másik adatot akarsz társítani, például minden szóhoz azt, hányszor szerepelt (ez a **szótár**).

Mindkettővel gyorsan eldönthető, hogy egy érték szerepel-e már benne.

## Halmaz

A halmaz minden értéket **legfeljebb egyszer** tárol. Ha ugyanazt kétszer teszed bele, a második hozzáadás nem csinál semmit. A halmaz elemeinek nincs sorszáma, nincs "első" vagy "harmadik" elem.

::: python

A `set()` üres halmazt hoz létre. Az `add` adja hozzá az elemet, az `in` kérdezi meg, benne van-e, a `len` pedig a méretét adja.

```python
latott = set()
latott.add(5)
latott.add(7)
latott.add(5)               # már benne volt, nem változik
print(len(latott))          # 2
print(7 in latott)          # True
print(9 in latott)          # False
```

:::

::: csharp

A halmaz típusa a `HashSet<T>` (a `using System.Collections.Generic;` kell hozzá). Az `Add` adja hozzá az elemet, a `Contains` kérdezi meg, benne van-e, a `Count` a méretét adja.

```csharp
HashSet<int> latott = new HashSet<int>();
latott.Add(5);
latott.Add(7);
latott.Add(5);                              // már benne volt, nem változik
Console.WriteLine(latott.Count);            // 2
Console.WriteLine(latott.Contains(7));      // True
Console.WriteLine(latott.Contains(9));      // False
```

:::

Tipikus használat: egyedi elemek számolása. Ha egy lista minden elemét a halmazba teszed, a halmaz mérete a különböző értékek száma.

## Tartalmazás-vizsgálat és "láttam-e már"

Az "ez az érték már előfordult-e?" kérdés ciklusban a leggyakoribb halmazos feladat: minden érkező elemnél megnézed, szerepel-e már, majd beteszed.

::: python

```python
szavak = ["alma", "korte", "alma"]
latott = set()
for szo in szavak:
    if szo in latott:
        print(szo, "mar volt")
    else:
        print(szo, "uj")
        latott.add(szo)
```

:::

::: csharp

```csharp
string[] szavak = { "alma", "korte", "alma" };
HashSet<string> latott = new HashSet<string>();
foreach (string szo in szavak)
{
    if (latott.Contains(szo))
    {
        Console.WriteLine(szo + " mar volt");
    }
    else
    {
        Console.WriteLine(szo + " uj");
        latott.Add(szo);
    }
}
```

:::

A kimenet: `alma uj`, `korte uj`, `alma mar volt`. Listában is megvizsgálhatnád a `in` / `Contains` segítségével, de a halmaz ugyanezt sokkal gyorsabban teszi nagy adatnál is.

## Szótár

A szótár **kulcs–érték párokat** tárol, mint egy valódi szótár: a kulcs a szó, az érték a magyarázat. A kulcs egyedi; ha ugyanazzal a kulccsal új értéket adsz, az felülírja a régit. A kulcs alapján azonnal megtalálod az értéket.

::: python

A szótárat kapcsos zárójellel (`{}`) hozod létre. Az értéket a `szotar[kulcs]` éri el és állítja be; a `kulcs in szotar` a kulcs meglétét vizsgálja.

```python
kor = {}
kor["Anna"] = 17
kor["Bela"] = 16
kor["Anna"] = 18                 # felülírja a régit
print(kor["Anna"])               # 18
print("Cili" in kor)             # False
print(len(kor))                  # 2
```

:::

::: csharp

A szótár típusa `Dictionary<kulcstípus, értéktípus>`. Az értéket a `szotar[kulcs]` éri el és állítja be; a `ContainsKey(kulcs)` a kulcs meglétét vizsgálja, a `Count` a párok számát adja.

```csharp
Dictionary<string, int> kor = new Dictionary<string, int>();
kor["Anna"] = 17;
kor["Bela"] = 16;
kor["Anna"] = 18;                           // felülírja a régit
Console.WriteLine(kor["Anna"]);             // 18
Console.WriteLine(kor.ContainsKey("Cili")); // False
Console.WriteLine(kor.Count);               // 2
```

:::

Olyan kulcsra, amely nincs a szótárban, nem kérdezhetsz rá közvetlenül: hibával leáll a program. Előbb mindig ellenőrizd, benne van-e.

## Gyakoriság számlálása

A szótár legkedveltebb használata: megszámolni, **melyik érték hányszor** fordul elő. A kulcs az érték, a szótár értéke a darabszám. Ha először látod, 1-et írsz be; ha már láttad, eggyel növeled.

::: python

```python
szavak = ["alma", "korte", "alma", "alma"]
db = {}
for szo in szavak:
    if szo in db:
        db[szo] = db[szo] + 1
    else:
        db[szo] = 1

for szo in sorted(db):
    print(szo + ": " + str(db[szo]))
```

A szótárban a kulcsok bejárásához a `for kulcs in szotar` elég. A `sorted(szotar)` ábécé (vagy szám) szerint rendezett kulcslistát ad.

:::

::: csharp

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        string[] szavak = { "alma", "korte", "alma", "alma" };
        Dictionary<string, int> db = new Dictionary<string, int>();
        foreach (string szo in szavak)
        {
            if (db.ContainsKey(szo))
            {
                db[szo] = db[szo] + 1;
            }
            else
            {
                db[szo] = 1;
            }
        }

        List<string> kulcsok = new List<string>(db.Keys);
        kulcsok.Sort();
        foreach (string szo in kulcsok)
        {
            Console.WriteLine(szo + ": " + db[szo]);
        }
    }
}
```

A `db.Keys` a kulcsok gyűjteménye; a `new List<string>(db.Keys)` listát készít belőlük, a `Sort()` pedig ábécébe rendezi.

:::

A kimenet:

```
alma: 3
korte: 1
```

Miért érdemes rendezni a kulcsokat? A szótár bejárási sorrendjére nem szabad építeni. Ha mindig ugyanazt a kimenetet szeretnéd, rendezd őket.

## Mikor melyiket?

- Sorrend és sorszám kell: **lista**.
- Csak "benne van-e" és egyedi elemek kellenek: **halmaz**.
- Az értékhez valami más adat tartozik (darabszám, név, pontszám): **szótár**.

## Gyakori hibák

::: python

1. **Nem létező kulcs lekérdezése.** A `db["dinnye"]` hibával leáll, ha nincs ilyen kulcs. Előbb kérdezd meg: `"dinnye" in db`.
2. **Üres halmaz `{}`-lel.** A `{}` üres **szótár**, az üres halmaz a `set()`.
3. **Számolás a kezdőérték nélkül.** `db[szo] = db[szo] + 1` az első előfordulásnál hibás, mert még nincs ilyen kulcs. Ezért kell az `else` ág, amely 1-re állítja.
4. **Rendezés nélküli kiírás.** Ha számít a kimenet sorrendje, használd a `sorted(...)` függvényt.

:::

::: csharp

1. **Nem létező kulcs lekérdezése.** A `db["dinnye"]` hibával leáll, ha nincs ilyen kulcs. Előbb kérdezd meg: `db.ContainsKey("dinnye")`.
2. **Hiányzó `using`.** A `HashSet` és a `Dictionary` használatához `using System.Collections.Generic;` kell.
3. **Számolás a kezdőérték nélkül.** `db[szo] = db[szo] + 1` az első előfordulásnál hibás, mert még nincs ilyen kulcs. Ezért kell az `else` ág, amely 1-re állítja.
4. **Rendezés nélküli kiírás.** Ha számít a kimenet sorrendje, rendezd a kulcsokat a `Sort()` metódussal.

:::

## Összefoglalás

::: python

- Halmaz: `set()`, `add`, `x in halmaz`, `len`; minden érték legfeljebb egyszer.
- Szótár: `{}`, `szotar[kulcs] = ertek`, `kulcs in szotar`, `len`; bejárás: `for kulcs in sorted(szotar)`.
- Gyakoriság: ha a kulcs már benne van, növeld, különben 1.

:::

::: csharp

- Halmaz: `HashSet<T>`, `Add`, `Contains`, `Count`; minden érték legfeljebb egyszer.
- Szótár: `Dictionary<K, V>`, `szotar[kulcs] = ertek`, `ContainsKey`, `Count`; rendezett bejárás: `new List<K>(szotar.Keys)` + `Sort()`.
- Gyakoriság: ha a kulcs már benne van, növeld, különben 1.

:::

A feladatokban egyedi elemeket számolsz, "láttam-e már" kérdésekre felelsz, és gyakorisági táblát készítesz.
