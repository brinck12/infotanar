---
slug: fuggvenyek
title: Függvények
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért kell a függvény?

Képzeld el, hogy egy programban háromszor kell kiszámolnod egy szám négyzetét. Háromszor leírhatod a szorzást, de ha később kiderül, hogy valami mást kellett volna számolnod, mindhárom helyen javítanod kell. Ennél jobb megoldás: a számítást **egyszer** megírod, nevet adsz neki, és a nevével hívod meg. Ezt hívjuk **függvénynek** (vagy **eljárásnak**, lásd lentebb).

A függvény olyan, mint egy kis gép: bedobsz valamit (a **paramétert**), a gép dolgozik, és kiad valamit (a **visszatérési értéket**).

## Függvény írása és hívása

::: python

A függvényt a `def` szóval hozod létre. Az első sor a név és a paraméterek (zárójelben), kettősponttal zárul; a törzs behúzott. A `return` adja vissza az eredményt, és ki is lép a függvényből.

```python
def negyzet(x):
    return x * x

print(negyzet(5))        # 25
a = negyzet(3) + 1       # 10
```

A függvényt a használata **előtt** kell definiálni (a fájlban feljebb).

:::

::: csharp

C#-ban a függvény a `Program` osztályon belüli `static` metódus. Az elején megadod a visszatérési érték típusát, aztán a nevet és a paramétereket típussal együtt. A `return` adja vissza az eredményt, és ki is lép a metódusból. Ez egy teljes program:

```csharp
using System;

class Program
{
    static int Negyzet(int x)
    {
        return x * x;
    }

    static void Main()
    {
        Console.WriteLine(Negyzet(5));   // 25
        int a = Negyzet(3) + 1;          // 10
        Console.WriteLine(a);
    }
}
```

A metódusok sorrendje az osztályban tetszőleges.

:::

A `x` a **paraméter**: a függvény belső neve a bemenetre. Híváskor a zárójelbe írt érték (az **argumentum**, például az `5`) kerül bele. Több paraméter esetén vesszővel választod el őket.

## Több paraméter, logikai visszatérési érték

A függvény bármilyen típust visszaadhat, akár igaz/hamis értéket is. Az ilyen függvény neve gyakran kérdés, és az elágazásban közvetlenül használható.

::: python

```python
def max2(a, b):
    if a > b:
        return a
    return b

def paros(x):
    return x % 2 == 0

print(max2(4, 9))        # 9
if paros(10):
    print("paros")
```

:::

::: csharp

```csharp
static int Max2(int a, int b)
{
    if (a > b)
    {
        return a;
    }
    return b;
}

static bool Paros(int x)
{
    return x % 2 == 0;
}

// a Main-ben:
// Console.WriteLine(Max2(4, 9));   // 9
// if (Paros(10)) { Console.WriteLine("paros"); }
```

:::

Figyeld meg, hogy a `max2` második `return`-je mellett nincs `else`: ha az első feltétel teljesül, a függvény már a `return` után kilépett.

## Eljárás és függvény

Nem minden alprogram ad vissza értéket. Ha csak **csinál valamit** (például kiír), de nem számol ki egy értéket a hívónak, azt **eljárásnak** nevezzük. A **függvény** viszont értéket ad vissza.

::: python

Pythonban az eljárásnak egyszerűen nincs `return`-je (valójában `None`-t ad vissza, de ezzel nem kell törődnöd).

```python
def koszon(nev):
    print("Szia, " + nev + "!")

koszon("Anna")
```

:::

::: csharp

C#-ban az eljárás visszatérési típusa `void`, vagyis "semmi". Ezt már ismered: a `Main` is ilyen.

```csharp
static void Koszon(string nev)
{
    Console.WriteLine("Szia, " + nev + "!");
}

// a Main-ben: Koszon("Anna");
```

:::

## Helyi és globális változó

Ami a függvényben jön létre, az **helyi változó**: csak ott él, kívülről nem látszik, és a függvény végén megszűnik. Így két függvény használhatja ugyanazt a nevet anélkül, hogy összekeverednének.

::: python

A függvény "kívülről" olvashat egy változót (ezt **globális** változónak hívjuk), de értéket adni neki csak a `global` szóval lehet. Ezt kerüld: érdemesebb paraméterrel átadni, és `return`-nel visszaadni az adatot.

```python
def duplaz(x):
    eredmeny = x * 2     # helyi változó
    return eredmeny

print(duplaz(4))         # 8
# print(eredmeny)        # hiba: kívülről nem látszik
```

:::

::: csharp

A metódus belsejében létrehozott változó **helyi**, csak ott él. Ha az osztály szintjén, a metódusokon kívül hozol létre egy `static` változót, az **globális** jellegű: minden metódus látja. Ezt kerüld: érdemesebb paraméterrel átadni, és `return`-nel visszaadni az adatot.

```csharp
static int Duplaz(int x)
{
    int eredmeny = x * 2;    // helyi változó
    return eredmeny;
}

// Console.WriteLine(eredmeny);   // hiba: kívülről nem látszik
```

:::

A jó szokás: a függvény **csak a paramétereiből** számoljon, és az eredményt **visszaadja**. Így önmagában megérthető és kipróbálható.

## Program felbontása függvényekre

Egy hosszabb programot érdemes kis függvényekre bontani: egy függvény egy dolgot csinál, és a neve megmondja, mit. Így a fő rész rövid és olvasható lesz.

::: python

```python
def beolvas(n):
    szamok = []
    for i in range(n):
        szamok.append(int(input()))
    return szamok

def osszeg(lista):
    s = 0
    for x in lista:
        s = s + x
    return s

n = int(input())
adatok = beolvas(n)
print(osszeg(adatok))
```

:::

::: csharp

```csharp
using System;
using System.Collections.Generic;

class Program
{
    static List<int> Beolvas(int n)
    {
        List<int> szamok = new List<int>();
        for (int i = 0; i < n; i++)
        {
            szamok.Add(int.Parse(Console.ReadLine()));
        }
        return szamok;
    }

    static int Osszeg(List<int> lista)
    {
        int s = 0;
        foreach (int x in lista)
        {
            s = s + x;
        }
        return s;
    }

    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        List<int> adatok = Beolvas(n);
        Console.WriteLine(Osszeg(adatok));
    }
}
```

:::

Egy lista is lehet paraméter és visszatérési érték. Olvasd el a fő részt: a program menete szinte magyarul olvasható.

## Gyakori hibák

::: python

1. **Elfelejtett `return`.** Ha a függvény kiszámol valamit, de nem adja vissza, a hívó `None`-t kap. A `print` kiír, a `return` visszaad: ez nem ugyanaz.
2. **Hívás zárójel nélkül.** A `negyzet` maga a függvény, a `negyzet(5)` a hívás.
3. **A hívás előtt nincs definiálva.** A `def` sora kerüljön feljebb, mint az első hívás.
4. **Behúzás.** A függvény törzse mind egy szinten legyen behúzva.

:::

::: csharp

1. **Elfelejtett `return`.** A nem `void` metódus minden ágon vissza kell adjon értéket, különben a fordító hibát jelez.
2. **Rossz típus.** A `static int Negyzet(...)` `int`-et ad vissza; ha szöveget próbálsz visszaadni, hiba lesz.
3. **Nem `static`.** A `Main`-ből hívott metódus is `static` kell legyen.
4. **A `Console.WriteLine` és a `return` összekeverése.** A kiírás megmutat valamit, a `return` visszaad egy értéket a hívónak.

:::

## Összefoglalás

::: python

- Függvény: `def nev(parameterek):`, visszaadás: `return ertek`.
- Eljárás: nincs `return`, csak csinál valamit.
- A függvényben létrehozott változó helyi; a függvény paraméterből dolgozzon.

:::

::: csharp

- Függvény: `static tipus Nev(tipus parameter) { ... return ertek; }`.
- Eljárás: `static void Nev(...)`, nincs visszaadott érték.
- A metódusban létrehozott változó helyi; a metódus paraméterből dolgozzon.

:::

A feladatokban saját függvényeket írsz majd, és egy programot részeire bontasz.
