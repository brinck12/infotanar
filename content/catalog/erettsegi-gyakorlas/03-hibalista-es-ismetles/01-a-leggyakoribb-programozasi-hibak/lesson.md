---
slug: a-leggyakoribb-programozasi-hibak
title: A leggyakoribb programozási hibák
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért érdemes hibákat javítani?

Az érettségin a program ritkán azért ad kevesebb pontot, mert nehéz a feladat, hanem mert egy apró hiba bennmaradt. Ugyanazok a hibák térnek vissza újra és újra. Ebben a leckében hat tipikus hibát kell megtalálnod és kijavítanod: minden feladatban kapsz egy hibás programot, a te dolgod a hiba megkeresése. Ha a hibákat felismered, a saját programodban is hamar észreveszed őket.

## A hibakereső módszer

1. **Futtasd le a példa bemenetre**, és vesd össze a kimenetet a vártal. Mi tér el: hiányzik valami, más az érték, vagy hibaüzenettel leáll?
2. **Szűkítsd a helyet.** Írj ki köztes értékeket (a változó értékét a ciklus belsejében), vagy kövesd végig papíron egy kis bemenettel.
3. **Egyszerre egy dolgot javíts**, és futtasd újra.
4. **Próbáld ki a szélső eseteket**: egyetlen elem, csupa negatív szám, pont a határérték.

## A hat leggyakoribb hiba

**Szöveg a szám helyett.** Az `input()` és a `Console.ReadLine()` mindig szöveget ad. Szövegként a `"9"` nagyobb, mint a `"10"`, mert az első karaktereket hasonlítja össze. Számhoz előbb alakítsd át: `int(...)`, illetve `int.Parse(...)`.

**Egészosztás.** Két egész szám hányadosa C#-ban egész szám (`7 / 2` értéke `3`), Pythonban a `//` jel is ezt teszi. Ha tizedestörtet akarsz, az egyik oldal legyen valós (`7 / 2` Pythonban, `(double)7 / 2` C#-ban), és a kiíráskor add meg a tizedesek számát (`:.2f`, illetve `ToString("F2", CultureInfo.InvariantCulture)`).

**Rossz összehasonlítás a határon.** A "legalább" jelentése `>=`, a "több mint" jelentése `>`. A hiba csak akkor látszik, ha van pontosan a határértékkel megegyező adat, ezért mindig tesztelj határértéket.

**Kis- és nagybetű.** Az `A` és az `a` két külön karakter. Ha a szöveg elemzésénél nem számít a különbség, alakítsd át egységesre (`lower()`, `ToLower()`).

**Az összegző változó rossz helyen kap kezdőértéket.** Ha soronként külön összegre van szükség, az összeg kezdőértékét (`osszeg = 0`) a külső ciklus **belsejébe** kell tenni, különben az előző sorok összege továbbmegy.

**Egy elemmel túl a lista végén.** Ha a ciklusban az `i + 1`-edik elemet is használod, a ciklusnak eggyel korábban kell véget érnie (`range(n - 1)`, `i < n - 1`). A listák indexelése 0-tól `n - 1`-ig tart; az `n`-edik index már kívül van, és hibaüzenet lesz belőle.

## Hogyan dolgozz a feladatokkal?

Mindegyik feladatban a kezdő kód egy hibás programot tartalmaz. Először futtasd le a példa bemenetre, és figyeld meg, mi a baj. Utána keresd meg a hibás sort, és javítsd ki **a legkisebb szükséges módosítással**: nem kell az egész programot átírni. A rejtett tesztek a szélső eseteket is ellenőrzik, ezért nem elég, ha a példára jó lesz.

## Gyakori hibák a hibajavításnál

- Több dolgot is átírsz egyszerre, és már nem tudod, melyik javított.
- A példa kimenetére "ráigazítod" a programot, de a rejtett esetekre nem jó.
- Elfelejted újra lefuttatni a javítás után.
- A kimenet formátuma nem egyezik pontosan (például `4.5` a `4.50` helyett).

## Összefoglalás

A tipikus programozási hibák: szöveg a szám helyett, egészosztás, rossz határösszehasonlítás, kis- és nagybetű, rossz helyen nullázott összegző, és az index túllépése. Futtass, vesd össze, szűkíts, javíts egyet, majd tesztelj újra, a szélső esetekkel együtt.
