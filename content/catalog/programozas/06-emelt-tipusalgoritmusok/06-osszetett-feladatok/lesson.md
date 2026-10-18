---
slug: osszetett-feladatok
title: Összetett feladatok
position: 5
free: false
published: false
reviewed_by:
reviewed_at:
---

## Tételek egymásba építése

Az emelt érettségi programozási feladatai hosszú, több részfeladatból álló fájlfeldolgozások, amelyekben **a tanult tételek egymásra épülnek**: az egyik részfeladat eredményét a másik felhasználja. Ritkán kell új algoritmust kitalálnod; azt kell felismerned, melyik tételek és hogyan kapcsolódnak. A hozzávezető út:

1. **Modell:** milyen rekord, milyen lista?
2. **Tétel:** melyik ismert tétel (összegzés, megszámlálás, eldöntés, kiválasztás, maximum, kiválogatás, szétválogatás, rendezés, metszet, unió) a feladat magja?
3. **Mondatszerű leírás:** írd le a megoldást kódmentesen, majd kódold.
4. **Szélső esetek:** egy elem, minden elem egyforma, nincs találat.

Ebben a leckében három, gyakran visszatérő szerkezetet gyakorolsz: leghosszabb szakasz, első küszöbátlépés, szomszédos elemek vizsgálata.

## Leghosszabb szakasz

Kérdés: "melyik a leghosszabb egymás utáni, növekvő számokból álló szakasz?" Egy **szakasz** egymás melletti elemek sorozata. Két tételt építesz egymásba: a **megszámlálás** (az aktuális szakasz hossza) és a **maximumkiválasztás** (a legjobb eddigi szakasz).

> 1. A `hossz` (az aktuális szakasz hossza) legyen 1, a `legjobb` hossz szintén 1, a `legjobb_kezdet` 0.
> 2. A második elemtől az utolsóig, `i`-vel:
>    1. Ha `A[i]` nagyobb, mint `A[i - 1]`, a `hossz` nő eggyel.
>    2. Különben a `hossz` újra 1 lesz.
>    3. Ha a `hossz` nagyobb, mint a `legjobb`: `legjobb` = `hossz`, a `legjobb_kezdet` = `i - hossz + 1`.

A szigorú `>` a legjobb hossznál azt jelenti, hogy egyenlő hosszú szakaszok közül az **első** marad meg.

::: python

```python
a = [3, 5, 6, 2, 4, 7, 9, 1]
hossz = 1
legjobb = 1
kezdet = 0
for i in range(1, len(a)):
    if a[i] > a[i - 1]:
        hossz += 1
    else:
        hossz = 1
    if hossz > legjobb:
        legjobb = hossz
        kezdet = i - hossz + 1
print(legjobb, kezdet)
```

Kimenet: `4 3`: a leghosszabb szakasz a 2 4 7 9, a 3. indextől.

:::

::: csharp

```csharp
int[] a = { 3, 5, 6, 2, 4, 7, 9, 1 };
int hossz = 1;
int legjobb = 1;
int kezdet = 0;
for (int i = 1; i < a.Length; i++)
{
    if (a[i] > a[i - 1])
    {
        hossz++;
    }
    else
    {
        hossz = 1;
    }
    if (hossz > legjobb)
    {
        legjobb = hossz;
        kezdet = i - hossz + 1;
    }
}
Console.WriteLine(legjobb + " " + kezdet);
```

Kimenet: `4 3`: a leghosszabb szakasz a 2 4 7 9, a 3. indextől.

:::

## Első küszöbátlépés

Kérdés: "melyik napon lépte át először a folyó szintje a 300 cm-es árvízvédelmi küszöböt?" Itt a tétel a **kiválasztás vagy keresés** (az első, amely teljesít egy feltételt), de a feltétel **két szomszédos elemre** vonatkozik: az előző nem érte el, az aktuális meghaladja a küszöböt. Ez fontos különbség: ha az első adat már a küszöb fölött van, az nem átlépés, mert nincs előtte mérés.

> 1. Az `i` legyen 1-től az utolsó indexig, amíg még nem találtál átlépést:
>    1. Ha `A[i - 1]` legfeljebb `T` **és** `A[i]` nagyobb `T`-nél, az átlépés helye `i`.

Ha mindet számolni kell, nem állsz meg az elsőnél: ez megszámlálás ugyanazzal a feltétellel.

## Szomszédos elemek

"Melyik két egymás utáni nap között volt a legnagyobb a hőmérséklet-változás?" A **maximumkiválasztás** itt is a mag, de az összehasonlított érték nem az elem, hanem a **szomszédos elemek különbsége** (`abs(A[i] - A[i - 1])`). A bejárás a második elemtől indul. Mindig döntsd el, hogy a megtartott érték a különbség, a pár első vagy a második eleme, és ezt a kimenetben is így add meg.

## A rekordokon futó feladatok

Az érettségi adatai rekordok (nap, érték, név...). A szerkezet ugyanaz: a bejárás a rekordok listáján megy, a vizsgált szám a rekord valamelyik mezője. A "legjobb vétel és eladás" jellegű feladatban a **minimum** és a **maximum** épül egymásba: menet közben a legkisebb eddigi árat tartod nyilván, és minden napot eladási napnak tekintve a nyereség `ar - eddigi_minimum`; ezek maximuma a keresett. Azaz ahelyett, hogy minden párt kipróbálnál (négyzetes), egy bejárással (lineáris) megoldod.

## Gyakori hibák

- A szakasz hosszának nullázása: az új szakasz hossza nem 0, hanem 1 (már az aktuális elem is a szakasz tagja).
- A kezdőindex számítása: `i - hossz + 1`, nem `i - hossz`.
- A szomszédos elemek vizsgálata az első elemnél indul, ezért a `[-1]` index hátulról olvas Pythonban, C#-ban hibát dob.
- A küszöbátlépésnél az első elemet is átlépésnek veszed.
- A szigorú és a nem szigorú összehasonlítás felcserélése: az egyenlő eseteknél más lesz az eredmény.
- Az 1-től és a 0-tól számozás keveredik a kimenetben.

## Összefoglalás

- A nehezebb feladatok a tanult tételek kombinációi: az ismerős részeket kell felismerni.
- Leghosszabb szakasz: megszámlálás + maximum; az új szakasz hossza 1.
- Küszöbátlépés: keresés két szomszédos elemre vonatkozó feltétellel.
- Szomszédos elemek: maximum a különbségeken.
- Legjobb vétel/eladás: futó minimum + maximum egy bejárásban.
