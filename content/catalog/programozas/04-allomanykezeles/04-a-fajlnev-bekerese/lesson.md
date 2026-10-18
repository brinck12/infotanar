---
slug: a-fajlnev-bekerese
title: A fájlnév bekérése
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Melyik fájlt nyissam meg?

Az érettségi fájlos feladatai gyakran így szólnak: *"Kérje be a felhasználótól az autó azonosítóját! A program olvassa be az `azonosító.txt` állományt..."* Itt a fájl neve **nem rögzített**: a program csak futás közben tudja meg, melyik fájlra van szükség. A megoldás egyszerű: a fájlnevet **szövegként állítod össze** a bevitt adatból.

A feladatokban több fájl is lesz a program mellett (például `hetfo.txt`, `kedd.txt`, `szerda.txt`), a bemenet pedig megmondja, melyiket kell olvasni.

## A név összeállítása

A szövegek összefűzését már ismered: `+` operátorral lehet két szöveget egymás után tenni. Ha a bevitel a név eleje, a végére csak a kiterjesztést kell fűzni.

::: python

```python
nap = input()
nev = nap + ".txt"
with open(nev, encoding="utf-8") as f:
    sorok = f.read().splitlines()
print(nev, "sorainak szama:", len(sorok))
```

Ha a bemenet `kedd`, a `nev` értéke `kedd.txt` lesz, és a program ezt a fájlt nyitja meg. Ha a bemenet `szerda`, akkor a `szerda.txt` fájlt.

:::

::: csharp

```csharp
string nap = Console.ReadLine();
string nev = nap + ".txt";
string[] sorok = File.ReadAllLines(nev);
Console.WriteLine(nev + " sorainak szama: " + sorok.Length);
```

Ha a bemenet `kedd`, a `nev` értéke `kedd.txt` lesz, és a program ezt a fájlt nyitja meg. Ha a bemenet `szerda`, akkor a `szerda.txt` fájlt.

:::

Ugyanez működik több bemeneti adatból is: `osztaly + "_" + targy + ".txt"` az `9a_info.txt` nevet adja.

## A bevitel tisztítása

A felhasználó néha szóközt vagy felesleges karaktert is begépel. Érdemes a bevitt szöveget megtisztítani: Pythonban `input().strip()`, C#-ban `Console.ReadLine().Trim()`. Ha a fájlnévben nagy- és kisbetű számít (a szerveren általában számít!), akkor tartsd be a feladat leírását: `A.txt` és `a.txt` két különböző fájl lehet.

## Mi van, ha nincs ilyen fájl?

Ha a felhasználó olyan nevet ad meg, amelyhez nem tartozik fájl, a megnyitás hibával leállítja a programot. Az érettségin ez általában nem szerepel, de jó program ellenőrzi, és szép üzenetet ad.

::: python

Az `os.path.exists` megmondja, létezik-e a fájl. Használatához a program elején kell az `import os`.

```python
import os

nev = input() + ".txt"
if os.path.exists(nev):
    with open(nev, encoding="utf-8") as f:
        print(len(f.read().splitlines()))
else:
    print("Nincs ilyen allomany: " + nev)
```

:::

::: csharp

A `File.Exists` megmondja, létezik-e a fájl.

```csharp
string nev = Console.ReadLine() + ".txt";
if (File.Exists(nev))
{
    Console.WriteLine(File.ReadAllLines(nev).Length);
}
else
{
    Console.WriteLine("Nincs ilyen allomany: " + nev);
}
```

:::

## Olvasás és írás ugyanabból a névből

A bemeneti név az **kimeneti fájl** nevét is megadhatja. Ha a `9a` osztály jegyeit a `9a.txt` tartalmazza, a szűrt eredményt írhatod a `9a_jo.txt` fájlba: `jel + "_jo.txt"`. A két fájl neve tehát ugyanabból a bemenetből készül.

::: python

```python
jel = input()
with open(jel + ".txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
with open(jel + "_jo.txt", "w", encoding="utf-8") as ki:
    for sor in sorok[1:]:
        if int(sor.split("\t")[1]) >= 4:
            ki.write(sor + "\n")
```

:::

::: csharp

```csharp
string jel = Console.ReadLine();
string[] sorok = File.ReadAllLines(jel + ".txt");
using (StreamWriter ki = new StreamWriter(jel + "_jo.txt"))
{
    for (int i = 1; i < sorok.Length; i++)
    {
        if (int.Parse(sorok[i].Split('\t')[1]) >= 4)
        {
            ki.WriteLine(sorok[i]);
        }
    }
}
```

:::

## Hogyan tesztel a rendszer?

A feladathoz mellékelt fájlok a program mellett vannak, a bemenet pedig kiválasztja, melyiket olvasod. A rejtett tesztek **ugyanazon a néven más tartalmú fájlt** is adhatnak: a programod ne az adatok tartalmát, hanem a feladat leírását kövesse. Például ne feltételezd, hogy a `kedd.txt` mindig három sorból áll.

## Gyakori hibák

- **Kimaradt kiterjesztés.** Ha a bemenet `kedd`, a fájl neve `kedd.txt`: a `.txt`-t te teszed hozzá.
- **Felesleges szóköz a névben.** Egy begépelt `kedd ` (szóközzel) nem egyezik a `kedd.txt` fájllal; használj `strip()` / `Trim()` hívást, ha bizonytalan a bemenet.
- **A név és az elérési út összekeverése.** A feladatokban elég a fájl neve; mappákra nem kell hivatkozni.
- **Ellenőrzés nélküli megnyitás.** Ha a feladat szerint a fájl nem biztos, hogy létezik, előbb kérdezd meg az `os.path.exists` / `File.Exists` hívással.
- **Kis- és nagybetű.** Egyes rendszereken a `Kedd.txt` és a `kedd.txt` két különböző fájl.

## Összefoglalás

- A fájlnevet futás közben, a bevitelből és a kiterjesztésből állítod össze szövegösszefűzéssel.
- A bemenetet érdemes `strip()` / `Trim()` hívással megtisztítani.
- A fájl létezését az `os.path.exists` / `File.Exists` mondja meg; a hiányzó fájlt szépen kezeld.
- A kimeneti fájl neve is épülhet a bemenetből (`jel + "_jo.txt"`).
- A tesztek ugyanazon a néven más tartalmat is adhatnak, ezért ne feltételezz fix adatot.
