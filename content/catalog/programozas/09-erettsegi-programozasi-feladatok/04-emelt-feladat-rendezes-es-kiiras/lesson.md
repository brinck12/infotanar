---
slug: emelt-feladat-rendezes-es-kiiras
title: "Emelt feladat: rendezés és kiírás"
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Rangsor, és ami utána jön: fájlba írás

Az emelt feladatok utolsó részfeladatai gyakran így szólnak: *"Rendezd az adatokat ... szerint, és írd a `valami.txt` fájlba."* Ebben a leckében egy iskolai programozóverseny csapataival gyakorlod ezt. A `csapatok.txt` fejlécsoros, tabulátorral tagolt fájl: csapatnév, város, megoldott feladatok száma, büntetőpercek.

A rangsor szabálya: **több megoldott feladat előrébb visz; egyenlő megoldásnál a kevesebb büntetőperc**. A szabályt a feladat szövege adja, a programodnak pontosan azt kell követnie. A beolvasás a rekordos minta, ismerős:

```python
class Csapat:
    def __init__(self, nev, varos, megoldott, buntetes):
        self.nev = nev
        self.varos = varos
        self.megoldott = megoldott
        self.buntetes = buntetes

with open("csapatok.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
csapatok = []
for sor in sorok[1:]:
    r = sor.split("\t")
    csapatok.append(Csapat(r[0], r[1], int(r[2]), int(r[3])))
```

```csharp
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

class Csapat
{
    public string Nev;
    public string Varos;
    public int Megoldott;
    public int Buntetes;
}

class Program
{
    static void Main()
    {
        string[] sorok = File.ReadAllLines("csapatok.txt");
        List<Csapat> csapatok = new List<Csapat>();
        for (int i = 1; i < sorok.Length; i++)
        {
            string[] r = sorok[i].Split('\t');
            Csapat c = new Csapat();
            c.Nev = r[0];
            c.Varos = r[1];
            c.Megoldott = int.Parse(r[2]);
            c.Buntetes = int.Parse(r[3]);
            csapatok.Add(c);
        }
        Console.WriteLine(csapatok.Count);
    }
}
```

## Rendezés több szempont szerint

A rendezéshez nem kell saját rendezőalgoritmust írnod: a nyelv beépített rendezését használd, és mondd meg neki, **mi alapján** rendezzen. Ezt hívjuk **rendezési kulcsnak**.

Pythonban a `sorted` kulcsfüggvényt vár. Ha a kulcs egy **pár**, előbb az első, egyenlőségnél a második elem dönt. A "csökkenő" sorrendet a szám ellentettjével érheted el (mínusz előjel):

```python
rangsor = sorted(csapatok, key=lambda c: (-c.megoldott, c.buntetes))
for c in rangsor:
    print(c.nev, c.megoldott, c.buntetes)
```

C#-ban a LINQ `OrderByDescending` és `ThenBy` metódusa teszi ugyanezt. Ehhez kell a `using System.Linq;`.

```csharp
List<Csapat> rangsor = csapatok.OrderByDescending(c => c.Megoldott).ThenBy(c => c.Buntetes).ToList();
foreach (Csapat c in rangsor)
{
    Console.WriteLine(c.Nev + " " + c.Megoldott + " " + c.Buntetes);
}
```

A `lambda c: ...` és a `c => ...` egy apró, névtelen függvény, amelyet a rendezés minden elemre meghív, és az eredménye a kulcs. Nem kell többet tudnod róla: a mintát másold, és írd át a mezőket.

**Stabilitás.** A Python `sorted` és a LINQ `OrderBy` **stabil**: az egyenlő kulcsú elemek az eredeti, vagyis fájlbeli sorrendben maradnak. Ez azért fontos, mert a feladat szövege gyakran ezt írja elő ("holtversenynél a fájlban előbb szereplő"). Vigyázz: a C# `List.Sort()` **nem** stabil, ne azt használd erre.

**Szöveg szerinti rendezés.** A névsor ékezetmentes nevekre a karakterkód-sorrend: Pythonban a szöveg maga a kulcs, C#-ban `ThenBy(v => v, StringComparer.Ordinal)` adja ezt, függetlenül a gép nyelvi beállításától.

## Helyezés holtversennyel

Az "1., 2., 3." sorszámozás egyszerű: a rendezett lista indexe plusz egy. A **versenyhelyezés** (1, 2, 2, 4) viszont azt kéri, hogy az egyenlő eredményt elérők ugyanazt a helyet kapják, a következő pedig az őt megillető pozíciót. A kód:

```python
hely = 1
for i in range(len(rangsor)):
    c = rangsor[i]
    if i > 0 and (c.megoldott != rangsor[i - 1].megoldott or c.buntetes != rangsor[i - 1].buntetes):
        hely = i + 1
    print(hely, c.nev)
```

```csharp
int hely = 1;
for (int i = 0; i < rangsor.Count; i++)
{
    Csapat c = rangsor[i];
    if (i > 0 && (c.Megoldott != rangsor[i - 1].Megoldott || c.Buntetes != rangsor[i - 1].Buntetes))
    {
        hely = i + 1;
    }
    Console.WriteLine(hely + " " + c.Nev);
}
```

A helyezés tehát csak akkor változik, ha az eredmény **különbözik az előzőétől**, és olyankor az új értéke `i + 1`. Négy csapatnál, ha a 2. és 3. egyenlő: 1, 2, 2, 4.

## Eredmény fájlba írása és visszaolvasása

Az érettségi gyakran kéri: "írd az eredményt a `rangsor.txt` fájlba". Ennek két lépése van: **írás**, majd (a gyakorlóplatformon) a fájl tartalmának **visszaolvasása és kiírása**, így biztos lehetsz abban, hogy a fájl valóban jó.

```python
with open("rangsor.txt", "w", encoding="utf-8") as f:
    f.write("1\tAlfa Kod\t7\t210\n")
    f.write("2\tBeta\t5\t100\n")
with open("rangsor.txt", encoding="utf-8") as f:
    print(f.read(), end="")
```

```csharp
List<string> kiir = new List<string>();
kiir.Add("1\tAlfa Kod\t7\t210");
kiir.Add("2\tBeta\t5\t100");
File.WriteAllLines("rangsor.txt", kiir);
foreach (string sor in File.ReadAllLines("rangsor.txt"))
{
    Console.WriteLine(sor);
}
```

Három dolog, amit érdemes észben tartani:

- A `"w"` mód (a C#-ban a `WriteAllLines`) a fájlt **felülírja**, nem hozzáfűz.
- A `\t` tabulátort ír. A feladat pontosan megmondja az elválasztót: ne cseréld szóközre.
- Pythonban a `write` nem tesz sortörést: a `\n`-t te írod a sor végére. A visszaolvasott szöveg kiírásánál az `end=""` azért kell, hogy a végén ne legyen egy üres sor.

## Csoportonkénti összesítés rendezve

Gyakori emelt feladat: "csoportosítsd városonként, és a kimutatást rendezd". Ehhez a **szótár** (`dict` / `Dictionary`) a barátod: a kulcs a város, az érték egy kis lista (csapatok száma, összes megoldás). Először gyűjtesz, utána rendezed a szótár elemeit.

```python
osszes = {}
for c in csapatok:
    if c.varos not in osszes:
        osszes[c.varos] = [0, 0]
    osszes[c.varos][0] += 1
    osszes[c.varos][1] += c.megoldott
lista = sorted(osszes.items(), key=lambda kv: (-kv[1][1], kv[0]))
```

```csharp
Dictionary<string, int[]> osszes = new Dictionary<string, int[]>();
foreach (Csapat c in csapatok)
{
    if (!osszes.ContainsKey(c.Varos))
    {
        osszes[c.Varos] = new int[] { 0, 0 };
    }
    osszes[c.Varos][0]++;
    osszes[c.Varos][1] += c.Megoldott;
}
List<string> varosok = osszes.Keys.OrderByDescending(v => osszes[v][1]).ThenBy(v => v, StringComparer.Ordinal).ToList();
```

Itt `kv` egy kulcs-érték pár: `kv[0]` a város, `kv[1]` az adatlista. A második kulcs (a városnév) azért kell, hogy egyenlő összegnél a sorrend ne a szótár belső sorrendjén múljon.

## Gyakori hibák

- **Rossz irány.** Csökkenő sorrend kell, de növekvő lett: Pythonban a mínusz előjel, C#-ban az `OrderByDescending` hiányzik.
- **Elfelejtett második szempont.** A holtverseny sorrendje a rejtett teszteken eltér.
- **`List.Sort()` C#-ban.** Nem stabil, használd az `OrderBy` / `ThenBy` párost.
- **Helyezés index helyett.** Az 1, 2, 2, 4 helyezéshez nem elég az `i + 1`.
- **Üres sor a kimenet végén.** A fájl tartalmának kiírásakor `end=""`, különben extra sor kerül a végére.
- **Nem a fájlból írod ki.** A feladat azt kéri, hogy a fájl tartalmát írd ki: olvasd vissza.
- **Kisebb adat, mint a kért szám.** Ha az első három csapatot kérik, de csak kettő van, a `min(3, len(...))` véd meg a hibától.

## Összefoglalás

- A rangsorhoz összetett rendezési kulcs kell: `sorted(..., key=lambda c: (-c.a, c.b))` / `OrderByDescending(...).ThenBy(...)`.
- A beépített rendezés stabil (`sorted`, `OrderBy`), a `List.Sort()` nem.
- Versenyhelyezésnél a hely csak az eredmény változásakor lép: `hely = i + 1`.
- Fájlba írás: nyisd írásra, tabulátorral (`\t`) elválasztva, soronként; majd olvasd vissza és írd ki.
- Csoportonkénti kimutatás: szótárban gyűjts, majd rendezd az elemeket két kulccsal.
- A holtverseny, az egyelemű és a kevesebb-mint-kért eset a rejtett tesztek állandó vendége.
