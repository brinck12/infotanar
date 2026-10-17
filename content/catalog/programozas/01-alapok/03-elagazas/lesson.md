---
slug: elagazas
title: Elágazás
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Amikor a program dönt

Eddig minden programunk ugyanazokat a lépéseket hajtotta végre, bármi volt a bemenet. A valódi programok viszont döntenek: ha a felhasználó nagykorú, más üzenetet kap, mint ha nem; ha a jelszó rossz, nem enged be. Az **elágazás** az a szerkezet, amellyel a program a bemenet alapján választ, melyik utasításokat futtassa. Ebben a leckében megtanulod az `if`, az `else` és az `elif` használatát.

## Összehasonlítások

Egy döntés alapja egy **feltétel**: olyan kifejezés, amely vagy igaz, vagy hamis (ez a logikai érték, amelyet az előző leckében említettünk). Feltételt összehasonlítással készítünk:

| Jel | Jelentése |
|---|---|
| `==` | egyenlő |
| `!=` | nem egyenlő |
| `<` | kisebb |
| `>` | nagyobb |
| `<=` | kisebb vagy egyenlő |
| `>=` | nagyobb vagy egyenlő |

Figyelj: az egyenlőség vizsgálata **két** egyenlőségjel (`==`). Az egyetlen `=` értékadás, vagyis egy változó beállítása, az nem összehasonlítás.

::: python

```python
print(5 > 3)       # True
print(5 == 6)      # False
print(10 % 2 == 0) # True
```

:::

::: csharp

```csharp
Console.WriteLine(5 > 3);        // True
Console.WriteLine(5 == 6);       // False
Console.WriteLine(10 % 2 == 0);  // True
```

:::

## Az if utasítás

Az `if` azt mondja: ha a feltétel igaz, futtasd le az alatta lévő utasításokat; ha hamis, hagyd ki őket.

::: python

Pythonban a feltétel után **kettőspont** áll, a hozzá tartozó utasításokat pedig **be kell húzni** (általában 4 szóközzel). A behúzás nem szépítés: abból tudja a gép, mi tartozik az `if`-hez.

```python
kor = int(input())
if kor >= 18:
    print("Nagykoru")
print("Vege")
```

Ha a bemenet `20`, a kimenet `Nagykoru` és `Vege`. Ha `15`, csak `Vege`, mert a behúzott sor kimaradt.

:::

::: csharp

C#-ban a feltételt **zárójelbe** tesszük, a hozzá tartozó utasításokat pedig **kapcsos zárójelek** `{ }` fogják közre. A behúzás itt csak az olvashatóságot segíti, de érdemes mindig rendezetten írni.

```csharp
int kor = int.Parse(Console.ReadLine());
if (kor >= 18)
{
    Console.WriteLine("Nagykoru");
}
Console.WriteLine("Vege");
```

Ha a bemenet `20`, a kimenet `Nagykoru` és `Vege`. Ha `15`, csak `Vege`, mert a kapcsos zárójelen belüli rész kimaradt.

:::

## Az else ág

Gyakran két külön dolgot kell tenni: az egyiket, ha a feltétel igaz, a másikat, ha hamis. Erre való az `else` (magyarul: különben).

::: python

```python
kor = int(input())
if kor >= 18:
    print("Nagykoru")
else:
    print("Kiskoru")
```

:::

::: csharp

```csharp
int kor = int.Parse(Console.ReadLine());
if (kor >= 18)
{
    Console.WriteLine("Nagykoru");
}
else
{
    Console.WriteLine("Kiskoru");
}
```

:::

Pontosan az egyik ág fut le: vagy az `if`-es, vagy az `else`-es, soha nem mindkettő, és soha nem egyik sem.

## Több eset: elif

Mi van, ha kettőnél több eset van? Például egy szám lehet pozitív, negatív vagy nulla. Ilyenkor több feltételt fűzünk egymás után: a gép fentről lefelé haladva megkeresi az **első** igaz feltételt, annak az ágát futtatja le, a többit kihagyja.

::: python

Pythonban a további feltételek kulcsszava az `elif` (az `else if` rövidítése).

```python
n = int(input())
if n > 0:
    print("pozitiv")
elif n < 0:
    print("negativ")
else:
    print("nulla")
```

:::

::: csharp

C#-ban a további feltételek kulcsszava az `else if`.

```csharp
int n = int.Parse(Console.ReadLine());
if (n > 0)
{
    Console.WriteLine("pozitiv");
}
else if (n < 0)
{
    Console.WriteLine("negativ");
}
else
{
    Console.WriteLine("nulla");
}
```

:::

Mivel az első igaz feltétel nyer, a feltételek **sorrendje számít**. Ha pl. életkor szerint sávokat vizsgálsz, haladj az egyik végétől a másik felé: `kor < 6`, aztán `kor < 18`, aztán `kor < 65`; így a későbbi feltételeknek már nem kell az előzőket újra ellenőrizniük.

## Szövegek összehasonlítása

Az `==` szövegekkel is működik: `"igen" == "igen"` igaz. Figyelj a kis- és nagybetűre: `"Igen"` és `"igen"` **nem** egyenlő.

::: python

```python
valasz = input()
if valasz == "igen":
    print("Rendben")
else:
    print("Nem erkezett igen")
```

:::

::: csharp

```csharp
string valasz = Console.ReadLine();
if (valasz == "igen")
{
    Console.WriteLine("Rendben");
}
else
{
    Console.WriteLine("Nem erkezett igen");
}
```

:::

## Egy teljes példa: páros vagy páratlan

Az előző lecke maradékos műveletét használjuk: egy szám páros, ha kettővel osztva a maradék 0.

::: python

```python
n = int(input())
if n % 2 == 0:
    print("paros")
else:
    print("paratlan")
```

:::

::: csharp

```csharp
using System;

class Program
{
    static void Main()
    {
        int n = int.Parse(Console.ReadLine());
        if (n % 2 == 0)
        {
            Console.WriteLine("paros");
        }
        else
        {
            Console.WriteLine("paratlan");
        }
    }
}
```

:::

A `7` bemenetre `paratlan`, a `10` bemenetre `paros` a kimenet.

## Gyakori hibák

::: python

1. **`=` az `==` helyett.** Az `if n = 5:` hiba; összehasonlításhoz `if n == 5:` kell.
2. **Hiányzó kettőspont.** Az `if`, `elif` és `else` sort mindig kettőspont zárja.
3. **Rossz behúzás.** Az egy ághoz tartozó sorok behúzása ugyanannyi legyen; ami nincs behúzva, az nem tartozik az ághoz.
4. **Szöveg összehasonlítása számmal.** Az `input()` szöveg: az `if input() > 5:` hibát ad, előbb alakítsd át `int(...)`-tel.

:::

::: csharp

1. **`=` az `==` helyett.** Az `if (n = 5)` hiba; összehasonlításhoz `if (n == 5)` kell.
2. **Hiányzó zárójel vagy kapcsos zárójel.** A feltétel köré zárójel kell, az ágak köré `{ }`; minden megnyitott zárójelnek legyen párja.
3. **Pontosvessző az `if (...)` után.** A `if (n > 0);` üres ágat jelent, ne tegyél oda pontosvesszőt.
4. **Szöveg összehasonlítása számmal.** A `Console.ReadLine()` szöveg: előbb alakítsd át `int.Parse(...)`-szal.

:::

## Összefoglalás

- Az összehasonlító jelek: `==`, `!=`, `<`, `>`, `<=`, `>=`; az eredmény igaz vagy hamis.
- Az `if` csak igaz feltételnél futtatja az ágát; az `else` a "különben" ág.
- Több esetnél `elif` (Python) vagy `else if` (C#) következik; az első igaz feltétel nyer, ezért a sorrend számít.
- Szövegeket is lehet `==`-vel összehasonlítani, a kis- és nagybetű számít.

::: python

- Pythonban kettőspont és behúzás jelöli az ágat.

:::

::: csharp

- C#-ban a feltétel zárójelben áll, az ágat `{ }` fogja közre.

:::

Jöhetnek a feladatok.
