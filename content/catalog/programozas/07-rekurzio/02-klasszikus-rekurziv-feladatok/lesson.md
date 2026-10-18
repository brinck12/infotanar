---
slug: klasszikus-rekurziv-feladatok
title: Klasszikus rekurzív feladatok
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## A klasszikusok

A rekurziót mindig ugyanúgy gondold végig: **mi az alapeset**, és **hogyan vezethető vissza a feladat egy kisebbre**. Ebben a leckében öt klasszikus példán gyakorlod.

## Faktoriális

Az `n!` az 1-től `n`-ig terjedő egészek szorzata: `4! = 4 · 3 · 2 · 1 = 24`. A definíció magában hordozza a rekurziót: `n! = n · (n-1)!`, és `0! = 1`.

::: python

```python
def fakt(n):
    if n == 0:
        return 1
    return n * fakt(n - 1)
```

:::

::: csharp

```csharp
static long Fakt(int n)
{
    if (n == 0)
    {
        return 1;
    }
    return n * Fakt(n - 1);
}
```

C#-ban a faktoriális gyorsan nő, ezért `long` típust használunk (20!-ig elfér benne).

:::

## Fibonacci

A Fibonacci-sorozat: `0, 1, 1, 2, 3, 5, 8, 13, ...`. Minden tag az előző kettő összege. Itt **két alapeset** van: `fib(0) = 0` és `fib(1) = 1`. Különben `fib(n) = fib(n-1) + fib(n-2)`.

::: python

```python
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)
```

:::

::: csharp

```csharp
static int Fib(int n)
{
    if (n < 2)
    {
        return n;
    }
    return Fib(n - 1) + Fib(n - 2);
}
```

:::

Itt a hívási lánc **elágazik**: minden hívás két újabbat indít. Ezért a `fib(35)` már érezhetően lassú: ugyanazokat a részeredményeket sokszor újraszámolja. Az iteratív (ciklusos) megoldás itt sokkal gyorsabb; az érettségin mégis a rekurzív változatot kérhetik.

## Hatvány

`a^n = a · a^(n-1)`, az alapeset `a^0 = 1`.

::: python

```python
def hatvany(a, n):
    if n == 0:
        return 1
    return a * hatvany(a, n - 1)
```

:::

::: csharp

```csharp
static long Hatvany(long a, int n)
{
    if (n == 0)
    {
        return 1;
    }
    return a * Hatvany(a, n - 1);
}
```

:::

## Legnagyobb közös osztó

Euklidész algoritmusa rekurzívan szól: `lnko(a, b) = a`, ha `b = 0`; különben `lnko(a, b) = lnko(b, a maradéka b-vel osztva)`. Ez az egyik legrégebbi rekurzív algoritmus. A második paraméter minden lépésben csökken, ezért az alapeset biztosan elérhető.

::: python

```python
def lnko(a, b):
    if b == 0:
        return a
    return lnko(b, a % b)
```

:::

::: csharp

```csharp
static int Lnko(int a, int b)
{
    if (b == 0)
    {
        return a;
    }
    return Lnko(b, a % b);
}
```

:::

## Számjegyösszeg

Egy szám utolsó számjegye az `n % 10`, a maradék a többi számjegy: `n / 10` (egész osztás). Így `szamjegyosszeg(n) = n % 10 + szamjegyosszeg(n / 10)`, és ha `n = 0`, az összeg 0. Például `352` esetén: `2 + 5 + 3 + 0 = 10`.

::: python

```python
def szj(n):
    if n == 0:
        return 0
    return n % 10 + szj(n // 10)
```

:::

::: csharp

```csharp
static int Szj(int n)
{
    if (n == 0)
    {
        return 0;
    }
    return n % 10 + Szj(n / 10);
}
```

:::

## Rekurzió vagy ciklus?

Minden rekurzív algoritmus átírható ciklusra és fordítva. A rekurzió akkor kényelmes, ha a feladat természetesen kisebb részfeladatokra bomlik. A ciklus általában gyorsabb és kevesebb memóriát használ. Az érettségin ott kell rekurziót írnod, ahol a feladat kifejezetten kéri.

## Gyakori hibák

- A Fibonacci második alapesete hiányzik (`fib(1)` nélkül `fib(-1)` felé fut).
- `int` túlcsordulás C#-ban nagy faktoriálisnál; használj `long`-ot.
- A `lnko` paramétereinek felcserélése: `lnko(a % b, b)` nem Euklidész algoritmusa.
- Kimaradó `return` a rekurzív hívás előtt.

## Összefoglalás

- Először az alapeset, aztán a visszavezetés kisebb feladatra.
- Faktoriális: `n · (n-1)!`; Fibonacci: két alapeset és két hívás; hatvány: `a · a^(n-1)`; lnko: `lnko(b, a % b)`; számjegyösszeg: `n % 10 + szj(n / 10)`.
