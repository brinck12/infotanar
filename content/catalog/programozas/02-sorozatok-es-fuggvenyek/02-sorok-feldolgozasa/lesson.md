---
slug: sorok-feldolgozasa
title: Sorok feldolgozása
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Egy sor, sok adat

Az érettségi feladatokban az adatok gyakran **egyetlen sorban** érkeznek: `12 7 30 5` vagy `Kiss Anna;17;Pécs`. Ha ilyet beolvasol, egyetlen hosszú szöveget kapsz. Ebben a leckében megtanulod **szétvágni** darabokra, a darabokat számmá alakítani, majd szükség esetén újra **összefűzni**.

A szétvágáshoz **elválasztó** karakter kell: ez lehet szóköz, pontosvessző, vessző, bármi, ami az adatok között áll.

## Szétvágás

::: python

A szöveg `split` metódusa listát ad a darabokból. Paraméter nélkül a szóközök (akár több is egymás mellett) mentén vág; paraméterként megadhatsz más elválasztót is.

```python
sor = "alma korte szilva"
szavak = sor.split()
print(szavak)             # ['alma', 'korte', 'szilva']
print(len(szavak))        # 3

adat = "Kiss Anna;17;Pecs"
mezok = adat.split(";")
print(mezok[1])           # 17
```

:::

::: csharp

A `Split` metódus a szöveget tömbbé vágja az elválasztó mentén. Ha több szóköz is lehet egymás mellett, add meg a `StringSplitOptions.RemoveEmptyEntries` beállítást is, így az üres darabok eltűnnek. Ehhez kell a `using System;`, ami eddig is megvolt.

```csharp
string sor = "alma korte szilva";
string[] szavak = sor.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
Console.WriteLine(szavak.Length);   // 3
Console.WriteLine(szavak[0]);       // alma

string adat = "Kiss Anna;17;Pecs";
string[] mezok = adat.Split(';');
Console.WriteLine(mezok[1]);        // 17
```

Ha az elválasztó egyetlen karakter, és nem fordulhat elő egymás mellett kétszer (mint a pontosvessző a tagolt adatnál), elég a `Split(';')`.

:::

Figyeld meg: a darabok mind **szövegek**, akkor is, ha számnak látszanak. Az `17` itt még nem szám.

## Számsorozat egy sorból

Ha a sor számokat tartalmaz, a darabokat egyenként át kell alakítani. Ehhez a lista és a ciklus kell, amit az előző leckében tanultál.

::: python

```python
sor = input()                 # például: 12 7 30 5
szamok = []
for resz in sor.split():
    szamok.append(int(resz))

print(sum(szamok))            # 54, az összeg
```

A `sum(lista)` egy számlista elemeit adja össze. Rövidebben, egy sorban is megteheted az átalakítást: `szamok = list(map(int, sor.split()))`. A `map(int, ...)` az `int` átalakítást alkalmazza minden darabra.

:::

::: csharp

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static void Main()
    {
        string sor = Console.ReadLine();          // például: 12 7 30 5
        string[] reszek = sor.Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
        List<int> szamok = new List<int>();
        foreach (string resz in reszek)
        {
            szamok.Add(int.Parse(resz));
        }

        int osszeg = 0;
        foreach (int szam in szamok)
        {
            osszeg = osszeg + szam;
        }
        Console.WriteLine(osszeg);                // 54
    }
}
```

:::

A fenti bemenetre a kimenet `54`. Próbáld ki más sorokkal is, például egyetlen számmal vagy negatív számokkal.

## Összefűzés

A szétvágás fordítottja az **összefűzés**: egy lista elemeiből egyetlen szöveget építünk, a megadott elválasztóval.

::: python

A `join` az elválasztó szövegen hívódik meg, és **szöveglistát** vár. Számlistánál előbb szöveggé kell alakítani az elemeket: `map(str, szamok)`.

```python
szavak = ["alma", "korte", "szilva"]
print(" ".join(szavak))               # alma korte szilva
print(", ".join(szavak))              # alma, korte, szilva

szamok = [3, 1, 4]
print(" ".join(map(str, szamok)))     # 3 1 4
```

:::

::: csharp

A `string.Join` az első paramétere az elválasztó, a másodiké a lista. Számlistával is működik, nem kell előtte átalakítani.

```csharp
string[] szavak = { "alma", "korte", "szilva" };
Console.WriteLine(string.Join(" ", szavak));     // alma korte szilva
Console.WriteLine(string.Join(", ", szavak));    // alma, korte, szilva

List<int> szamok = new List<int> { 3, 1, 4 };
Console.WriteLine(string.Join(" ", szamok));     // 3 1 4
```

:::

Az összefűzés megmenti attól, hogy ciklussal, szóközöket kézzel kezelve írd ki a számokat. A "számok egy sorban, szóközzel elválasztva" kimenet így egyetlen utasítás.

## Tagolt adat felbontása

Gyakran minden mező más típusú, például `név;kor;város`. Ilyenkor a darabok **helye** (indexe) számít: a nulladik a név, az első a kor.

::: python

```python
adat = input()                # Kiss Anna;17;Pecs
mezok = adat.split(";")
nev = mezok[0]
kor = int(mezok[1])
varos = mezok[2]
print(nev + " jovore " + str(kor + 1) + " eves lesz.")
```

:::

::: csharp

```csharp
string adat = Console.ReadLine();     // Kiss Anna;17;Pecs
string[] mezok = adat.Split(';');
string nev = mezok[0];
int kor = int.Parse(mezok[1]);
string varos = mezok[2];
Console.WriteLine(nev + " jovore " + (kor + 1) + " eves lesz.");
```

:::

Ha a bemenet `Kiss Anna;17;Pecs`, a kimenet `Kiss Anna jovore 18 eves lesz.`

## Gyakori hibák

::: python

1. **Elfelejtett átalakítás.** A `split` után a darabok szövegek: `"3" + "4"` az `34`, nem `7`. Használd az `int(...)` függvényt.
2. **Rossz elválasztó.** Ha a bemenet pontosvesszős, de `split()` paraméter nélkül hívod, egyetlen darabot kapsz.
3. **`join` számlistával.** A `" ".join([1, 2])` hibát ad; előbb `map(str, ...)`.

:::

::: csharp

1. **Elfelejtett átalakítás.** A `Split` után a darabok szövegek: `"3" + "4"` az `34`, nem `7`. Használd az `int.Parse(...)` metódust.
2. **Üres darabok.** Ha két szóköz áll egymás mellett, a `Split(' ')` üres szöveget is ad, az `int.Parse("")` pedig hibával leáll. Használd a `RemoveEmptyEntries` beállítást.
3. **Rossz elválasztó.** Szóköz helyett pontosvesszős bemenetnél a `Split(' ')` egyetlen darabot ad.

:::

## Összefoglalás

::: python

- Szétvágás: `sor.split()` (szóköznél) vagy `sor.split(";")`; az eredmény szöveglista.
- Számmá alakítás ciklusban: `int(resz)`; összeg: `sum(lista)`.
- Összefűzés: `" ".join(szöveglista)`; számokhoz `map(str, szamok)`.

:::

::: csharp

- Szétvágás: `sor.Split(';')` vagy szóköznél `Split(new char[] { ' ' }, StringSplitOptions.RemoveEmptyEntries)`; az eredmény `string[]`.
- Számmá alakítás ciklusban: `int.Parse(resz)`.
- Összefűzés: `string.Join(" ", lista)`; számlistával is működik.

:::

A feladatokban szóközzel és pontosvesszővel tagolt sorokat kell majd feldolgoznod.
