---
slug: rekurzio-szovegen-es-listan
title: Rekurzió szövegen és listán
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Rekurzió szövegen és listán

A szöveg és a lista is természetes módon bomlik "első elem + a többi" részre. A rekurzió itt azt jelenti, hogy az első elemmel foglalkozol, a maradékot pedig ugyanilyen feladatként átadod önmagadnak. Az alapeset általában az **üres** (vagy egyelemű) szöveg illetve lista.

## Palindrom

Egy szöveg palindrom, ha visszafelé olvasva is ugyanaz (például `level`, `kajak`). Rekurzív gondolat: ha az első és az utolsó karakter különbözik, nem palindrom. Ha egyeznek, a kettő közötti résznek is palindromnak kell lennie. Alapeset: a 0 vagy 1 hosszú szöveg mindig palindrom.

::: python

A szeletelés (`s[1:-1]`) az első és utolsó karakter nélküli részt adja.

```python
def palindrom(s):
    if len(s) <= 1:
        return True
    if s[0] != s[-1]:
        return False
    return palindrom(s[1:-1])
```

:::

::: csharp

A `Substring(1, s.Length - 2)` az első és utolsó karakter nélküli részt adja.

```csharp
static bool Palindrom(string s)
{
    if (s.Length <= 1)
    {
        return true;
    }
    if (s[0] != s[s.Length - 1])
    {
        return false;
    }
    return Palindrom(s.Substring(1, s.Length - 2));
}
```

:::

## Lista összege

Egy lista összege az első elem és a többi elem összege. Alapeset: az üres lista összege 0. Ahelyett, hogy minden hívásban új listát másolnál, elég egy **indexet** átadni: "az `i`-edik elemtől a végéig".

::: python

```python
def osszeg(lista, i):
    if i == len(lista):
        return 0
    return lista[i] + osszeg(lista, i + 1)

print(osszeg([4, 1, 5], 0))   # 10
```

:::

::: csharp

```csharp
static int Osszeg(int[] lista, int i)
{
    if (i == lista.Length)
    {
        return 0;
    }
    return lista[i] + Osszeg(lista, i + 1);
}
```

:::

## Lista maximuma

A lista maximuma az első elem és a **maradék** maximuma közül a nagyobb. Az alapeset itt az **utolsó elem** (egyelemű maradék), mert az üres listának nincs maximuma.

::: python

```python
def maximum(lista, i):
    if i == len(lista) - 1:
        return lista[i]
    return max(lista[i], maximum(lista, i + 1))
```

:::

::: csharp

```csharp
static int Maximum(int[] lista, int i)
{
    if (i == lista.Length - 1)
    {
        return lista[i];
    }
    return Math.Max(lista[i], Maximum(lista, i + 1));
}
```

:::

## Mondatszerű rekurzív leírás kódolása

Az érettségin a rekurzív algoritmust gyakran szavakkal adják meg, és neked kell programmá alakítanod. Olvasd ki belőle az alapesetet és a rekurzív esetet. Példa:

> `Fordit(s)`: Ha `s` hossza legfeljebb 1, az eredmény maga `s`. Különben az eredmény: `Fordit` a második karaktertől a végéig tartó részre, és mögé írva `s` első karaktere.

Az alapeset az 1-nél nem hosszabb szöveg; a rekurzív eset a szöveg farkának megfordítása, utána a levágott első karakter. A `kutya` megfordítása: `Fordit("utya") + "k"`, ahol `Fordit("utya") = Fordit("tya") + "u"`, és így tovább, végül az eredmény `aytuk`. Rajzold fel a hívási láncot, mielőtt kódolsz.

## Több hívás egy lépésben: Hanoi tornyai

Három rúd van (A, B, C). Az A rúdon `n` korong van, kicsitől nagyig. Egyszerre egy korongot mozgathatsz, nagyobbat kisebbre tenni nem szabad. A cél: mindet átvinni C-re. A gondolat: `n-1` korongot átviszel B-re, az utolsót A-ról C-re teszed, majd az `n-1` korongot B-ről C-re viszed. A feladat tehát két kisebb, azonos feladatra bomlik, az alapeset pedig a 0 korong (nincs teendő).

## Gyakori hibák

- A palindromnál elég a `hossz <= 1` alapeset, ez a páros és a páratlan hosszú szót is kezeli.
- A maximumnál az üres lista külön kezelés nélkül hibát okoz; nézd meg, mit ír a feladat.
- A szeletelésnél eggyel eltolt index.
- Új lista létrehozása minden hívásban lassú; az indexes megoldás gyorsabb.

## Összefoglalás

- Szövegnél és listánál az alapeset az üres vagy egyelemű eset.
- A rekurzív eset az első elemmel dolgozik, a többit átadja önmagának.
- Mondatszerű leírásból először az alapesetet és a rekurzív esetet jelöld ki, aztán kódolj.
