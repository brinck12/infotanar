---
slug: kulturalt-adatbevitel
title: Kulturált adatbevitel
position: 5
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi az a kulturált adatbevitel?

Eddigi programjaid csendben vártak a bemenetre: a felhasználó nem tudta, mit kell begépelnie. Az érettségi programozási feladatokban viszont **kulturált** programot kell írnod: a program elmondja, mit vár, és ha hibás adatot kap, nem omlik össze. Ennek három eleme van: **kiírt kérdés** a bekérés előtt, jól olvasható kimenet, és (nem kötelezően) a bemenet ellenőrzése.

Az érettségin a feladatokat sorszámmal jelzik (`2. feladat`), és a vizsgázó programjának is ezt kell kiírnia a megfelelő rész előtt. Ebben a leckében mindezt megtanulod.

## Kérdés kiírása a bekérés előtt

::: python

Az `input` kaphat egy szöveget, amit a bekérés előtt kiír, és a kurzor ugyanabban a sorban marad.

```python
nev = input("Adja meg a nevet: ")
print("Udvozlom, " + nev + "!")
```

:::

::: csharp

A `Console.WriteLine` sort törne a kiírás végén; a **`Console.Write`** nem, így a kurzor a kérdés után marad, ahol a felhasználó begépelheti a választ.

```csharp
Console.Write("Adja meg a nevet: ");
string nev = Console.ReadLine();
Console.WriteLine("Udvozlom, " + nev + "!");
```

:::

Ha lefuttatod, a képernyőn így néz ki (az `Anna` a felhasználó gépelése):

```
Adja meg a nevet: Anna
Udvozlom, Anna!
```

Fontos tudnivaló a feladatok tesztelésénél: a **bevitt érték nem szerepel a program kimenetében**, csak az, amit a program maga írt ki. Ezért a teszt kimenetében a kérdés és a rákövetkező kiírás egy sorba kerül: `Adja meg a nevet: Udvozlom, Anna!`. Ez rendben van: a programod ugyanazt írja ki, mint a fenti képernyőn, csak a begépelt `Anna` nem látszik.

## A feladat sorszámának kiírása

Az érettségi feladatok több részből állnak; mindegyik része előtt ki kell írni a sorszámát. Ez egyszerű kiírás:

::: python

```python
print("1. feladat")
nev = input("Adja meg a nevet: ")
print("Udvozlom, " + nev + "!")

print("2. feladat")
szam = int(input("Adja meg a szamot: "))
print("A szam negyzete:", szam * szam)
```

:::

::: csharp

```csharp
Console.WriteLine("1. feladat");
Console.Write("Adja meg a nevet: ");
string nev = Console.ReadLine();
Console.WriteLine("Udvozlom, " + nev + "!");

Console.WriteLine("2. feladat");
Console.Write("Adja meg a szamot: ");
int szam = int.Parse(Console.ReadLine());
Console.WriteLine("A szam negyzete: " + szam * szam);
```

:::

Az ékezetet a kimenetben a vizsgán is elfogadják nélküle ("az ékezetmentes kiírás is elfogadott"), ezért mi is ékezet nélkül írunk a példáinkban.

## A bemenet ellenőrzése (érvényesítés)

Mi van, ha a felhasználó életkornak `-5`-öt ír? A program ilyenkor **ellenőrizheti** az értéket, és újra megkérdezheti. Ez a már ismert `while` ciklus és a `break`:

::: python

```python
while True:
    kor = int(input("Adja meg az eletkorat (0-120): "))
    if 0 <= kor <= 120:
        break
    print("Hibas adat!")
print("Elfogadva:", kor, "ev")
```

A `while True` végtelen ciklus, amelyből a `break` lép ki, amikor az érték jó.

:::

::: csharp

```csharp
int kor;
while (true)
{
    Console.Write("Adja meg az eletkorat (0-120): ");
    kor = int.Parse(Console.ReadLine());
    if (kor >= 0 && kor <= 120)
    {
        break;
    }
    Console.WriteLine("Hibas adat!");
}
Console.WriteLine("Elfogadva: " + kor + " ev");
```

A `while (true)` végtelen ciklus, amelyből a `break` lép ki, amikor az érték jó.

:::

Ha a bemenet `-5`, `200`, `30`, akkor kétszer látod a `Hibas adat!` üzenetet, aztán a `30` elfogadott. A fenti ellenőrzés a **tartományt** nézi. Az érettségi nem mindig követeli meg ezt, de ha a feladat kimondja, hogy a bemenet hibás lehet, a programnak kezelnie kell.

## Amikor nem is szám a bemenet

Az `int(...)` és az `int.Parse(...)` **hibával leáll**, ha a szöveg nem szám (például `abc`). A kulturált program ezt is kezeli.

::: python

A `try` blokkba írod a kockázatos részt, az `except ValueError` ágba pedig azt, ami hiba esetén történjen.

```python
szoveg = input("Adjon meg egy egesz szamot: ")
try:
    szam = int(szoveg)
    print("A duplaja:", szam * 2)
except ValueError:
    print("Ez nem egesz szam!")
```

:::

::: csharp

Az **`int.TryParse`** nem áll le hibával: igaz/hamis értéket ad vissza arról, sikerült-e az átalakítás, az eredményt pedig az `out` paraméterbe teszi.

```csharp
Console.Write("Adjon meg egy egesz szamot: ");
string szoveg = Console.ReadLine();
int szam;
if (int.TryParse(szoveg, out szam))
{
    Console.WriteLine("A duplaja: " + szam * 2);
}
else
{
    Console.WriteLine("Ez nem egesz szam!");
}
```

:::

Az `abc` bemenetre `Ez nem egesz szam!` a válasz, a `21`-re `A duplaja: 42`.

## Egy kérdező függvény

A "kérdez, ellenőriz, újra kérdez" ismétlődik, ezért érdemes **függvénybe** tenni. Így a program többi része rövid és áttekinthető marad.

::: python

```python
def beker(kerdes, also, felso):
    while True:
        szoveg = input(kerdes)
        try:
            szam = int(szoveg)
            if also <= szam <= felso:
                return szam
        except ValueError:
            pass
        print("Hibas adat!")

kor = beker("Eletkor (0-120): ", 0, 120)
print("Elfogadva:", kor)
```

A `pass` azt jelenti: nem csinál semmit. A függvény csak akkor lép ki a `return`-nel, ha a szám megfelel; minden más esetben kiírja a hibát, és újra kérdez.

:::

::: csharp

```csharp
using System;

class Program
{
    static int Beker(string kerdes, int also, int felso)
    {
        while (true)
        {
            Console.Write(kerdes);
            int szam;
            if (int.TryParse(Console.ReadLine(), out szam))
            {
                if (szam >= also && szam <= felso)
                {
                    return szam;
                }
            }
            Console.WriteLine("Hibas adat!");
        }
    }

    static void Main()
    {
        int kor = Beker("Eletkor (0-120): ", 0, 120);
        Console.WriteLine("Elfogadva: " + kor);
    }
}
```

A metódus csak akkor lép ki a `return`-nel, ha a szám megfelel; minden más esetben kiírja a hibát, és újra kérdez.

:::

## Gyakori hibák

::: python

1. **Kérdés nélküli `input()`.** A felhasználó nem tudja, mit várunk tőle. Mindig írd ki, mit kérsz.
2. **Elfelejtett `break`.** Az érvényesítő ciklus soha nem ér véget.
3. **Túl széles `except`.** Írd ki pontosan: `except ValueError`, hogy a többi hibát ne nyeld le.
4. **A feladat sorszáma eltér.** A kimenet legyen pontosan `2. feladat` (szám, pont, szóköz, szó), kisbetűvel.

:::

::: csharp

1. **`Console.WriteLine` a kérdésnél.** Az a következő sorba teszi a kurzort. Használj `Console.Write`-ot.
2. **`int.Parse` érvénytelen szövegre.** Hibával leáll; ha a bemenet hibás lehet, használd az `int.TryParse`-t.
3. **Elfelejtett `break` vagy `return`.** Az érvényesítő ciklus soha nem ér véget.
4. **A feladat sorszáma eltér.** A kimenet legyen pontosan `2. feladat` (szám, pont, szóköz, szó), kisbetűvel.

:::

## Összefoglalás

::: python

- Kérdés kiírása: `input("Kerdes: ")`.
- Feladat sorszáma: `print("2. feladat")`.
- Érvényesítés: `while True` + `break`; nem szám bemenet: `try` / `except ValueError`.

:::

::: csharp

- Kérdés kiírása: `Console.Write("Kerdes: ")`, aztán `Console.ReadLine()`.
- Feladat sorszáma: `Console.WriteLine("2. feladat")`.
- Érvényesítés: `while (true)` + `break`; nem szám bemenet: `int.TryParse(szoveg, out szam)`.

:::

A feladatokban érettségi stílusú, több részes programokat írsz. Ez a modul utolsó leckéje: kész vagy a következő modulra.
