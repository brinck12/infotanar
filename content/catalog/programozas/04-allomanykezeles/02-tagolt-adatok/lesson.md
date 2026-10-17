---
slug: tagolt-adatok
title: Tagolt adatok
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Egy sorban több adat

Egy valódi adatfájl sora ritkán egyetlen érték. Egy tanulót a neve, az osztálya és a pontszáma együtt jellemez; egy eladást a termék, a darabszám és az ár. Ezeket a **mezőket** egy elválasztó karakter választja el egymástól. Az érettségin leggyakrabban a **tabulátor** (a `Tab` billentyű karaktere) az elválasztó, de gyakori a pontosvessző (`;`) is, ilyen a `.csv` fájl.

Egy `tanulok.txt` fájl így nézhet ki (a `<TAB>` a tabulátor helyét jelöli):

```
nev<TAB>osztaly<TAB>pont
Anna<TAB>9a<TAB>78
Bela<TAB>9b<TAB>55
```

Az első sor sokszor **fejléc**: az oszlopok nevét tartalmazza, nem adatot. A feldolgozásnál ezt ki kell hagyni.

## Sor szétvágása mezőkre

::: python

A `split` a szöveget az elválasztónál darabokra vágja, és listát ad vissza. A tabulátor jele a szövegben `"\t"`.

```python
sor = "Anna\t9a\t78"
mezok = sor.split("\t")
print(mezok[0])
print(mezok[2])
```

Kimenet: `Anna`, majd `78`. A mezők sorszámozása 0-tól indul, ahogy a listáknál megszoktad.

:::

::: csharp

A `Split` a szöveget az elválasztónál darabokra vágja, és `string[]` tömböt ad vissza. A tabulátor jele a szövegben `'\t'`.

```csharp
string sor = "Anna\t9a\t78";
string[] mezok = sor.Split('\t');
Console.WriteLine(mezok[0]);
Console.WriteLine(mezok[2]);
```

Kimenet: `Anna`, majd `78`. A mezők sorszámozása 0-tól indul, ahogy a tömböknél megszoktad.

:::

Pontosvesszős fájlnál csak az elválasztó változik: `split(";")`, illetve `Split(';')`.

## A fejléc átugrása

A fejléc a fájl első sora, azaz a lista 0. eleme. Az adatsorok az 1. indextől kezdődnek.

::: python

```python
with open("tanulok.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
for sor in sorok[1:]:
    mezok = sor.split("\t")
    print(mezok[0] + ": " + mezok[2])
```

A `sorok[1:]` az első elem utáni összes elemet adja (szeletelés).

:::

::: csharp

```csharp
string[] sorok = File.ReadAllLines("tanulok.txt");
for (int i = 1; i < sorok.Length; i++)
{
    string[] mezok = sorok[i].Split('\t');
    Console.WriteLine(mezok[0] + ": " + mezok[2]);
}
```

A ciklus 0 helyett 1-ről indul, így a fejlécet kihagyja.

:::

## Mezők átalakítása számmá

A mezők szövegek. Ha számolni akarsz velük, mezőnként át kell alakítani őket: Pythonban `int(...)`, C#-ban `int.Parse(...)`. A szöveges mezőket (név, osztály) nem kell átalakítani.

::: python

```python
osszeg = 0
for sor in sorok[1:]:
    mezok = sor.split("\t")
    osszeg += int(mezok[2])
print("Pontok osszege:", osszeg)
```

:::

::: csharp

```csharp
int osszeg = 0;
for (int i = 1; i < sorok.Length; i++)
{
    string[] mezok = sorok[i].Split('\t');
    osszeg += int.Parse(mezok[2]);
}
Console.WriteLine("Pontok osszege: " + osszeg);
```

:::

Ez az **oszlopösszeg**: az oszlop minden értékét hozzáadod egy összegző változóhoz. Ha két oszlopot kell összeszorozni (például darab és ár), soronként számold ki a szorzatot, és azt add az összeghez.

## Maximum és szűrés tagolt adatokon

A programozási tételek itt is működnek, csak most egy-egy **sorhoz** több adat tartozik. Maximumkeresésnél a legnagyobb értéken kívül jegyezd meg a hozzá tartozó nevet vagy dátumot is. Ha egy másik oszlop alapján kell szűrni (például egy osztályra), az `if` feltételben azt a mezőt vizsgáld.

::: python

```python
legjobb_nev = ""
legjobb_pont = -1
for sor in sorok[1:]:
    mezok = sor.split("\t")
    if mezok[1] == "9a" and int(mezok[2]) > legjobb_pont:
        legjobb_pont = int(mezok[2])
        legjobb_nev = mezok[0]
print(legjobb_nev, legjobb_pont)
```

:::

::: csharp

```csharp
string legjobbNev = "";
int legjobbPont = -1;
for (int i = 1; i < sorok.Length; i++)
{
    string[] mezok = sorok[i].Split('\t');
    if (mezok[1] == "9a" && int.Parse(mezok[2]) > legjobbPont)
    {
        legjobbPont = int.Parse(mezok[2]);
        legjobbNev = mezok[0];
    }
}
Console.WriteLine(legjobbNev + " " + legjobbPont);
```

:::

A kezdőérték (`-1`) azért biztonságos, mert a pontszám nem lehet negatív: az első találat mindenképp felülírja. Holtversenynél a `>` jel miatt az marad, aki előbb szerepel a fájlban.

## Gyakori hibák

- **Rossz elválasztó.** Ha a fájl pontosvesszős, de te tabulátorra vágsz, minden sor egyetlen mezőből áll, és az `mezok[1]` hibát dob. Nézd meg a fájlt, mielőtt kódolsz.
- **A fejléc feldolgozása.** Az `int("pont")` hibát dob. Mindig hagyd ki az első sort.
- **Eggyel elcsúszott index.** A mezők 0-tól számozódnak: a harmadik mező a `mezok[2]`.
- **Átalakítás kimaradt.** A szövegek összehasonlítása másképp működik, mint a számoké: `"9" > "10"` igaz (betűrend szerint), pedig a számok közül a 9 kisebb.
- **Szóköz a mezőben.** Ha a név két szóból áll (`Kiss Peter`), a `split()` paraméter nélkül szétvágná; ezért adj meg mindig elválasztót: `split("\t")`.

## Összefoglalás

- A tagolt fájl sorai mezőkből állnak; az elválasztó leggyakrabban tabulátor (`\t`) vagy pontosvessző.
- A `split("\t")` / `Split('\t')` a sort mezőkre vágja; az indexelés 0-tól indul.
- A fejléc az első sor: az adatsorok az 1. indextől kezdődnek.
- A számmezőket átalakítás után lehet összeadni, összehasonlítani.
- A programozási tételek (összegzés, maximum, szűrés) soronként több mezőt kezelve is ugyanúgy működnek.
