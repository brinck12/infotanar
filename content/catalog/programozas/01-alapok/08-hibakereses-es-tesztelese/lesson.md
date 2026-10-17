---
slug: hibakereses-es-tesztelese
title: Hibakeresés és tesztelés
position: 7
free: false
published: false
reviewed_by:
reviewed_at:
---

## A hiba nem szégyen

Minden programozó ír hibás programot, a gyakorlott programozók is naponta. A különbség az, hogy ők tudják, hogyan kell megtalálni és kijavítani a hibát. Ebben a leckében három dolgot tanulsz meg: milyen fajta hibák vannak, hogyan találj ki jó teszteket, és hogyan követheted végig kézzel a program működését. A feladatok ezúttal hibás programokat adnak: a te dolgod a javítás.

## A hibák három fajtája

**Szintaktikai hiba.** A program "nyelvtanilag" rossz: hiányzik egy zárójel, rossz a behúzás, elgépelted az utasítás nevét. A program el sem indul, vagy fordítási hibát kapsz. Ez a legkönnyebb eset, mert a gép megmondja, melyik sorban akadt el.

**Futási hiba.** A program elindul, de menet közben összeomlik, mert olyat kér, ami nem lehetséges: nullával osztás, hibás szám beolvasása, nem létező index.

::: python

Pythonban ilyenkor a hibaüzenet (a *traceback*) megmondja a hiba nevét és a sort, például `ZeroDivisionError` (nullával osztás), `ValueError` (például `int("abc")`), `IndexError` (nem létező index).

:::

::: csharp

C#-ban futás közben kivétel keletkezik, amely megmondja a hiba nevét, például `DivideByZeroException` (egész számok nullával osztása), `FormatException` (például az `int.Parse("abc")`), `IndexOutOfRangeException` (nem létező index).

:::

**Logikai hiba.** A program lefut, nem omlik össze, de **rossz eredményt ad**. Ez a legalattomosabb hiba, mert senki sem szól róla: neked kell észrevenned, hogy a válasz nem az, amit vártál. A gyakori okok: eggyel elcsúszott határ, rossz összehasonlító jel, rossz kezdőérték, kimaradt frissítés.

## Mit tegyél hiba esetén?

1. **Reprodukáld.** Keress olyan bemenetet, amelyre biztosan hibás a program.
2. **Szűkítsd.** Melyik sorig jó még a program, és melyik sortól rossz?
3. **Gyanakodj egy dologra, javíts egyet.** Ha egyszerre többet írsz át, nem fogod tudni, melyik segített.
4. **Próbáld újra** az eredeti bemenettel, és a többi teszttel is.

## Tesztadatok: mit próbálj ki?

Egy program attól még nem jó, hogy egyetlen példára működik. A jó tesztadatok három csoportba esnek:

- **Tipikus eset**, amilyenre a feladat számít (például `5`).
- **Szélső esetek**: a legkisebb, a legnagyobb, az üres, az egyelemű. Itt bukik el a legtöbb program: nulla, negatív szám, egyetlen szám, üres szöveg, `1`.
- **Különleges esetek**: amikor a program más ágon halad, például az `if` mindkét ága, a ciklus nulla lefutással.

Egy példa: egy program az `n` szám osztóinak számát adja meg. Tesztelendő például `1` (egyetlen osztó), egy prím (`7`), egy négyzetszám (`16`) és egy "szép" szám (`12`). A négyzetszám azért érdekes, mert ott egy osztópár két fele megegyezik. Mielőtt futtatsz, **jósold meg a kimenetet**: ha előre kiszámolod, mit kell kapnod, azonnal látod az eltérést.

## Kimenetjóslás

Vizsgán is gyakori kérdés: "Mit ír ki a program ezekre az adatokra?" Ilyenkor ne a megérzésedre hagyatkozz, hanem kövesd végig lépésről lépésre.

::: python

```python
szam = 5
osszeg = 0
while szam > 0:
    osszeg = osszeg + szam
    szam = szam - 2
print(osszeg)
```

:::

::: csharp

```csharp
var szam = 5;
var osszeg = 0;
while (szam > 0)
{
    osszeg = osszeg + szam;
    szam = szam - 2;
}
Console.WriteLine(osszeg);
```

:::

## Kézi nyomkövetés táblázattal

A **nyomkövető táblázat** (vagy "asztali teszt") minden változónak ad egy oszlopot, és soronként beírjuk az értéküket minden lépés után. Az előző program:

| Lépés | `szam` | `osszeg` | `szam > 0`? |
|---|---|---|---|
| kezdet | 5 | 0 | igen |
| 1. kör után | 3 | 5 | igen |
| 2. kör után | 1 | 8 | igen |
| 3. kör után | -1 | 9 | nem |

A feltétel a negyedik sorban lett hamis, a ciklus véget ért, a kiírt érték `9`. Ha a táblázatot gondosan építed, a hibák szinte maguktól kiugranak. Próbáld ki: töltsd ki ugyanezt a táblázatot a `szam = 6` kezdőértékre is.

## A hibakereső (debugger)

A kézi nyomkövetést a fejlesztőkörnyezet is el tudja végezni helyetted: ez a **hibakereső** (angolul *debugger*). A lényege:

- **Töréspont** (*breakpoint*): kijelölsz egy sort, és a program ott megáll futás közben.
- **Léptetés**: onnan soronként haladhatsz tovább, és minden lépés után látod, mit csinált az utasítás.
- **Változók figyelése**: egy ablakban látod minden változó aktuális értékét, tehát a nyomkövető táblázatot a gép tölti ki.

::: python

Pythonban a hibakereső a legtöbb szerkesztőben (például a VS Code-ban vagy a Thonnyban) egy gombnyomásra indul: a sor melletti margóra kattintva teszel töréspontot, majd a "Debug" indítással futtatod a programot.

:::

::: csharp

C#-ban a Visual Studióban az `F9` billentyű tesz töréspontot a kijelölt sorra, az `F5` hibakeresővel indítja a programot, az `F10` pedig soronként lépked.

:::

Az érettségin nincs szükség a hibakeresőre, de a gyakorlás során nagyon sokat segít, mert látod, hol tér el a program működése attól, amit gondoltál. Ha nincs kéznél, a változók értékét ideiglenes kiírással is megnézheted, de ezeket a végleges programból töröld.

## Gyakori hibák

1. **Csak egyetlen teszttel próbálod ki a programot.** A szélső esetek nélkül a hiba észrevétlen marad.
2. **Egyszerre több dolgot javítasz.** Ha nem működik, nem fogod tudni, melyik változtatás hozott javulást vagy rontást.
3. **Nem jósolod meg előre a kimenetet.** Ha csak a program válaszát nézed, könnyen elhiszed, hogy az a jó.
4. **A hibaüzenetet nem olvasod el.** A hibaüzenet megmondja a hiba fajtáját és a sor számát: ez a legjobb kiindulópont.

## Összefoglalás

- Háromféle hiba van: szintaktikai (a program el sem indul), futási (menet közben összeomlik) és logikai (rossz eredményt ad).
- Jó tesztadatok: tipikus, szélső és különleges esetek; az eredményt előre jósold meg.
- A nyomkövető táblázat soronként mutatja a változók értékét.
- A hibakereső töréspontokkal és léptetéssel végzi el ugyanezt.
- Javítsd egyszerre egy hibát, és minden javítás után futtasd újra az összes tesztet.
