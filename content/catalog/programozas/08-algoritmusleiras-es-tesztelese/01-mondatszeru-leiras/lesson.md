---
slug: mondatszeru-leiras
title: Mondatszerű leírás
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi az a mondatszerű leírás?

Az érettségin az algoritmusokat gyakran nem programkóddal, hanem **mondatszerű leírással** adják meg: a lépéseket magyar szavakkal, szigorú szerkezetben írják le. Ebben a leckében megtanulod olvasni. A leírás nem függ a programnyelvtől: ugyanazt az algoritmust Pythonban és C#-ban is le tudod kódolni. (Folyamatábrával itt nem foglalkozunk.)

Az alábbi jelölést használjuk a tananyagban. Az érettségi leírások részletei kicsit eltérhetnek, de a gondolatmenet ugyanez.

| Jelölés | Jelentése |
|---|---|
| `Be: x` | az `x` változó értékének beolvasása |
| `Ki: kifejezés` | a kifejezés értékének kiírása |
| `x := kifejezés` | értékadás: `x` megkapja a kifejezés értékét |
| `Ciklus i := 1-től N-ig` ... `Ciklus vége` | számlálós ciklus, `i` felveszi az 1, 2, ..., N értékeket |
| `Ciklus amíg feltétel` ... `Ciklus vége` | feltételes ciklus, amíg a feltétel igaz |
| `Elágazás` ... `Elágazás vége` | feltételtől függő végrehajtás |

## Egy teljes példa

```text
Algoritmus Osszeg
  Be: N
  osszeg := 0
  Ciklus i := 1-től N-ig
    Be: szam
    osszeg := osszeg + szam
  Ciklus vége
  Ki: osszeg
Algoritmus vége
```

Olvasd el soronként: beolvassa, hány szám lesz, az összeget nullára állítja, `N`-szer beolvas egy számot és hozzáadja az összeghez, végül kiírja az összeget. Ez az **összegzés tétele**, amelyet már ismersz.

A **behúzás** számít: ami egy ciklus vagy elágazás belsejében van, az beljebb kezdődik. A `Ciklus vége` és `Elágazás vége` sor jelzi, hol zárul a szerkezet.

## Elágazás a leírásban

```text
Elágazás
  szam > 0 esetén: db := db + 1
  különben: Ki: szam
Elágazás vége
```

Az `esetén` után a feltétel igaz ága áll, a `különben` ág nem kötelező. Pythonban ez `if` ... `else`, C#-ban `if` ... `else`.

## Fordítás kódra: szó szerint, sorról sorra

A leírás soronként átírható kóddá. Egy kis fordítótábla:

::: python

| Leírás | Python |
|---|---|
| `Be: N` | `n = int(input())` |
| `x := x + 1` | `x = x + 1` |
| `Ciklus i := 1-től N-ig` | `for i in range(1, n + 1):` |
| `Ciklus amíg x > 1` | `while x > 1:` |
| `Ki: x` | `print(x)` |

A Python `range(1, n + 1)` az 1-től `n`-ig tartó számokat adja (a felső határ nem tartozik bele, ezért kell a `+ 1`).

:::

::: csharp

| Leírás | C# |
|---|---|
| `Be: N` | `int n = int.Parse(Console.ReadLine());` |
| `x := x + 1` | `x = x + 1;` |
| `Ciklus i := 1-től N-ig` | `for (int i = 1; i <= n; i++)` |
| `Ciklus amíg x > 1` | `while (x > 1)` |
| `Ki: x` | `Console.WriteLine(x);` |

:::

## Mit csinál az algoritmus? Nyomkövetés fejben

Ha egy leírásból nem látszik rögtön a cél, kövesd végig kis adattal. Példa:

```text
Algoritmus Rejtely
  Be: N
  db := 0
  Ciklus amíg N > 1
    Elágazás
      N páros esetén: N := N / 2
      különben: N := 3 * N + 1
    Elágazás vége
    db := db + 1
  Ciklus vége
  Ki: db
Algoritmus vége
```

Legyen `N = 6`. A lépések: 6, 3, 10, 5, 16, 8, 4, 2, 1. Ez 8 lépés, tehát `db = 8`. Az algoritmus azt számolja, hány lépésben jut el a szám 1-ig ezzel a szabállyal (ez a híres Collatz-sejtés lépésszáma). Az írásban nem kellene kitalálni a nevét; elég, ha pontosan követed a változók értékét.

## Gyakori hibák

- A ciklus határának eltévesztése: az `1-től N-ig` **mindkét végpontot** tartalmazza.
- Az értékadás (`:=`) és az egyenlőség-vizsgálat összekeverése.
- A behúzás figyelmen kívül hagyása: ugyanaz a sor a cikluson belül vagy kívül nagyon mást jelent.
- A `Ki:` sor ciklusba vagy ciklus utánra tétele.
- Az elágazás `különben` ágának kifelejtése a kódból.

## Összefoglalás

- A mondatszerű leírás nyelvfüggetlen, szigorú szerkezetű lépéssorozat: `Be`, `Ki`, `:=`, `Ciklus`, `Elágazás`.
- A behúzás mutatja, mi tartozik a ciklushoz vagy elágazáshoz.
- Soronként lefordítható kódra; ha nem érted, mit csinál, kövesd végig kis adattal.
