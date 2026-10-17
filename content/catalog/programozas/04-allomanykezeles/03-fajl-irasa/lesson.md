---
slug: fajl-irasa
title: Fájl írása
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Eredmény a képernyő helyett fájlba

A feladatok gyakran azt kérik, hogy az eredményt ne a képernyőre, hanem egy **fájlba** írd: például a szűrt adatokat egy új állományba, vagy egy összesítő táblázatot. Az írás ugyanaz a gondolat, mint a `print`, csak a kimenet célja más: egy fájl.

Az InfoTanár oldalon a program csak a képernyőre írt kimenetét ellenőrizzük. Ezért a gyakorlófeladatokban a program előbb **kiírja a fájlt, majd visszaolvassa**, és a visszaolvasott sorokat a képernyőre is kiírja. Ez jó gyakorlat az írás ellenőrzésére a valódi életben is.

## Írás megnyitása

::: python

A `open` második paramétere a megnyitás módja. A `"w"` (write) írásra nyit: ha a fájl még nem létezik, létrehozza, ha létezik, **teljesen felülírja**.

```python
with open("kimenet.txt", "w", encoding="utf-8") as f:
    f.write("elso sor\n")
    f.write("masodik sor\n")
```

A `write` nem tesz magától sortörést; a sor végére neked kell odaírni a `"\n"` jelet. Ha elfelejted, az egész szöveg egyetlen sorba kerül.

:::

::: csharp

A `StreamWriter` osztály ír fájlba. A `using` blokk végén a fájl automatikusan bezáródik. A `WriteLine` a `Console.WriteLine` testvére: a szöveg után sortörést ír. Ha a fájl már létezik, a `StreamWriter` **felülírja**.

```csharp
using (StreamWriter iro = new StreamWriter("kimenet.txt"))
{
    iro.WriteLine("elso sor");
    iro.WriteLine("masodik sor");
}
```

:::

Fontos: a fájl akkor van készen, ha az írást **bezártad** (a `with` / `using` blokk véget ért). Ha előtte olvasnád vissza, lehet, hogy még nincs minden a lemezen.

## Visszaolvasás ellenőrzéshez

A visszaolvasás ugyanúgy megy, ahogy az előző leckékben tanultad:

::: python

```python
with open("kimenet.txt", encoding="utf-8") as f:
    for sor in f:
        print(sor.rstrip("\n"))
```

:::

::: csharp

```csharp
foreach (string sor in File.ReadAllLines("kimenet.txt"))
{
    Console.WriteLine(sor);
}
```

:::

A program tehát a fájl tartalmát két lépésben állítja elő és mutatja meg: írás, majd olvasás.

## Tabulátorral tagolt kimenet

Ha táblázatot írsz, a mezőket tabulátorral fűzd össze, ahogy a bemeneti fájloknál láttad. A számokat előbb szöveggé kell alakítani.

::: python

A `"\t".join(lista)` a lista szövegeit tabulátorral fűzi össze. A listaelemeknek szövegnek kell lenniük, a számokat `str(...)` alakítja át.

```python
with open("tabla.txt", "w", encoding="utf-8") as f:
    f.write("szam\tnegyzet\n")
    for i in range(1, 4):
        f.write("\t".join([str(i), str(i * i)]) + "\n")
```

:::

::: csharp

A `string.Join("\t", ...)` a megadott értékeket tabulátorral fűzi össze, és a számokat magától szöveggé alakítja.

```csharp
using (StreamWriter iro = new StreamWriter("tabla.txt"))
{
    iro.WriteLine("szam\tnegyzet");
    for (int i = 1; i < 4; i++)
    {
        iro.WriteLine(string.Join("\t", i, i * i));
    }
}
```

:::

A fájl tartalma:

```
szam<TAB>negyzet
1<TAB>1
2<TAB>4
3<TAB>9
```

## Szűrés új fájlba

Gyakori feladat: egy fájl bizonyos sorait másold át egy másikba. Olvasd be az eredeti sorokat, nyisd meg az új fájlt írásra, és minden sorról döntsd el, kell-e. A fejlécet általában a ciklus előtt, külön másolod át.

::: python

```python
with open("be.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
with open("ki.txt", "w", encoding="utf-8") as ki:
    ki.write(sorok[0] + "\n")
    for sor in sorok[1:]:
        if int(sor.split("\t")[1]) >= 50:
            ki.write(sor + "\n")
```

:::

::: csharp

```csharp
string[] sorok = File.ReadAllLines("be.txt");
using (StreamWriter ki = new StreamWriter("ki.txt"))
{
    ki.WriteLine(sorok[0]);
    for (int i = 1; i < sorok.Length; i++)
    {
        if (int.Parse(sorok[i].Split('\t')[1]) >= 50)
        {
            ki.WriteLine(sorok[i]);
        }
    }
}
```

:::

## Hozzáfűzés a fájl végére

Ha a fájl már létezik, és meg akarod tartani a tartalmát, **hozzáfűzni** kell, nem felülírni.

::: python

Az `"a"` (append) mód a fájl végére ír.

```python
with open("naplo.txt", "a", encoding="utf-8") as f:
    f.write("uj bejegyzes\n")
```

:::

::: csharp

A `File.AppendAllText` a megadott szöveget a fájl végére írja (a sortörést magadnak kell megadni).

```csharp
File.AppendAllText("naplo.txt", "uj bejegyzes\n");
```

:::

## Gyakori hibák

- **Felülírás véletlenül.** `"w"` móddal a fájl régi tartalma elvész. Ha meg akarod tartani, használj `"a"` módot.
- **Hiányzó sortörés.** Pythonban a `write` után kell a `"\n"`. Enélkül minden egy sorba kerül.
- **Visszaolvasás az írás lezárása előtt.** Előbb zárd be a fájlt (a `with` / `using` blokk végén), utána nyisd meg olvasásra.
- **Szám írása szövegként.** Pythonban a `write` csak szöveget fogad: `f.write(i)` hiba, `f.write(str(i))` jó.
- **Ugyanazon a néven olvasol és írsz.** Ha a bemeneti fájlt `"w"` móddal nyitod meg, mielőtt beolvastad, a tartalma már eltűnt. Előbb olvass be, utána írj, és más néven írj, ha az eredetit meg akarod tartani.

## Összefoglalás

- Írásra `open(nev, "w")` (felülír), C#-ban `StreamWriter` nyit; hozzáfűzni `"a"` móddal, illetve `File.AppendAllText` hívással lehet.
- A fájl lezárás után teljes; a `with` és a `using` ezt automatikusan elintézi.
- A Pythonban `write` után sortörést (`"\n"`) kell írni, C#-ban a `WriteLine` ír sortörést.
- A tabulátoros kimenetet `"\t".join(...)` / `string.Join("\t", ...)` állítja össze.
- Ellenőrzéshez olvasd vissza a megírt fájlt, és írd ki.
