---
slug: a-rekurzio-fogalma
title: A rekurzió fogalma
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mit jelent, hogy egy függvény önmagát hívja?

Eddig a függvények más függvényeket hívtak. A **rekurzió** azt jelenti, hogy egy függvény saját magát hívja meg, kisebb feladattal. Az érettségin emelt szinten két dolgot kérnek: meg kell tudni magyarázni, mi a rekurzió, és meg kell tudni írni egy rekurzív algoritmust egy mondatszerű leírásból.

Hasonlat: a matrjoska bábu. Kinyitod a nagyot, benne van egy kisebb, azt is kinyitod, és így tovább, amíg a legkisebbhez nem érsz, amelyik már nem nyílik. Ott megállsz, és visszafelé lépsz ki a bábuk között.

## A két kötelező rész

Minden rekurzív függvénynek két része van.

- **Alapeset**: az a legkisebb feladat, amelyet már közvetlenül meg tudsz oldani, hívás nélkül. Ez állítja meg a rekurziót.
- **Rekurzív hívás**: a függvény önmagát hívja, de **kisebb** feladattal, vagyis az alapeset felé haladva.

Ha az alapeset hiányzik, vagy a hívás nem közelít hozzá, a függvény sosem áll meg.

::: python

Visszaszámlálás rekurzióval:

```python
def visszaszamol(n):
    if n == 0:          # alapeset
        print("Indulas!")
    else:
        print(n)
        visszaszamol(n - 1)   # rekurzív hívás

visszaszamol(3)
```

:::

::: csharp

Visszaszámlálás rekurzióval:

```csharp
using System;

class Program
{
    static void Visszaszamol(int n)
    {
        if (n == 0)             // alapeset
        {
            Console.WriteLine("Indulas!");
        }
        else
        {
            Console.WriteLine(n);
            Visszaszamol(n - 1);    // rekurzív hívás
        }
    }

    static void Main()
    {
        Visszaszamol(3);
    }
}
```

:::

Kimenet: `3`, `2`, `1`, `Indulas!` külön sorokban. Próbáld ki, majd írd át úgy, hogy 5-ről induljon.

## A hívási lánc

A `visszaszamol(3)` meghívja a `visszaszamol(2)`-t, az a `visszaszamol(1)`-et, az pedig a `visszaszamol(0)`-t. Ez a **hívási lánc**. Amíg a legbelső hívás be nem fejeződik, a külsők mind **várakoznak**: mindegyikük a hívás után folytatná a munkáját.

A várakozó hívások adatait (paraméter, helyi változók) a számítógép egy **verem** nevű tárterületen tárolja. Minden új hívás egy új réteget tesz a verem tetejére, a befejezett hívás leveszi a legfelsőt. Az egyszerre várakozó hívások legnagyobb száma a **veremmélység**. A `visszaszamol(3)` legnagyobb mélysége 4 hívás (3, 2, 1, 0). A verem mérete véges, ezért a nagyon mély rekurzió hibával leáll.

## Mi történik visszafelé?

A rekurzív hívás **után** írt utasítások csak a visszalépéskor futnak le, fordított sorrendben.

::: python

```python
def be_ki(n):
    if n > 0:
        print("be", n)
        be_ki(n - 1)
        print("ki", n)

be_ki(3)
```

:::

::: csharp

```csharp
static void BeKi(int n)
{
    if (n > 0)
    {
        Console.WriteLine("be " + n);
        BeKi(n - 1);
        Console.WriteLine("ki " + n);
    }
}
```

:::

A kimenet: `be 3`, `be 2`, `be 1`, `ki 1`, `ki 2`, `ki 3`. A "be" sorok lefelé, a "ki" sorok visszafelé jönnek: a legutoljára hívott fejeződik be elsőnek.

## Visszatérési értékkel

A rekurzió igazi haszna, ha a függvény **értéket ad vissza**, és a külső hívás a belső eredményéből számolja a sajátját. Például az `1 + 2 + ... + n` összeg: ha az `n-1`-ig tartó összeget ismerjük, csak `n`-et kell hozzáadni. Az alapeset az `n = 0`, ahol az összeg 0.

::: python

```python
def osszeg(n):
    if n == 0:
        return 0
    return n + osszeg(n - 1)

print(osszeg(4))   # 10
```

:::

::: csharp

```csharp
static int Osszeg(int n)
{
    if (n == 0)
    {
        return 0;
    }
    return n + Osszeg(n - 1);
}
```

:::

Az `osszeg(4)` kiszámítása: `4 + osszeg(3)`, abban `3 + osszeg(2)`, aztán `2 + osszeg(1)`, `1 + osszeg(0)`, végül `0`. Visszafelé összeadva: `1`, `3`, `6`, `10`.

## Gyakori hibák

- **Hiányzó alapeset**: a függvény sosem áll meg, a verem betelik, a program hibával leáll (Pythonban `RecursionError`, C#-ban verem-túlcsordulás).
- **Rossz irányba lépő hívás**: `osszeg(n + 1)` sosem ér el a 0-hoz.
- **Az alapeset eredménye rossz**: az összegnél a 0 helyett 1 elrontja az összes értéket.
- A `return` elhagyása: a belső eredmény elvész.

## Összefoglalás

- A rekurzió: a függvény önmagát hívja kisebb feladattal.
- Kell hozzá **alapeset** és **rekurzív hívás**, amely az alapeset felé halad.
- A hívási lánc tagjai várnak a verem rétegein; a veremmélység a várakozó hívások száma.
- A hívás utáni utasítások visszafelé, fordított sorrendben futnak le.
