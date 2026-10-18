---
slug: kodmodositas-es-ertelmezes
title: "Kódmódosítás és értelmezés"
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Ismeretlen kód a szóbelin

A B) feladat gyakori eleme, hogy nem te írod a kódot, hanem kapsz egyet: meg kell értened, meg kell magyaráznod, és át kell alakítanod. A bizottság ezzel azt nézi, hogy valóban érted a programozást, nem csak betanult mintákat másolsz. Ez a lecke egy biztos módszert ad az ismeretlen kód elolvasására. A hivatalos feladatok nem nyilvánosak, a példák saját készítésűek.

## 1. lépés: nézd meg a szerkezetet

Mielőtt a részletekbe merülnél, keresd meg:

- a **bemenetet**: honnan jönnek az adatok (beolvasás, lista, fájl)?
- a **kimenetet**: mit ír ki a program?
- a **változókat**: melyik mire való (számláló, összeg, legnagyobb, jelző)?
- a **ciklusokat és feltételeket**: hányszor fut a ciklus, mikor áll meg?

Példa kód (Python és C# alakban is):

```python
szamok = [4, 9, 2, 7, 12, 5]
db = 0
for x in szamok:
    if x % 2 == 0:
        db += 1
print(db)
```

```csharp
using System;

class Program
{
    static void Main()
    {
        int[] szamok = { 4, 9, 2, 7, 12, 5 };
        int db = 0;
        foreach (int x in szamok)
        {
            if (x % 2 == 0)
            {
                db++;
            }
        }
        Console.WriteLine(db);
    }
}
```

Elemzés: a `db` számláló, az `x % 2 == 0` a páros számok feltétele, tehát a program a páros számokat számolja meg. Ez egy **megszámlálás**. A kimenet 3 (4, 2 és 12).

## 2. lépés: követési táblázat (trace table)

Ha nem látod át a működést, **kézzel kövesd végig** a változók értékét lépésenként.

| Lépés | x | x % 2 == 0 | db |
|---|---|---|---|
| kezdet | | | 0 |
| 1. | 4 | igaz | 1 |
| 2. | 9 | hamis | 1 |
| 3. | 2 | igaz | 2 |
| 4. | 7 | hamis | 2 |
| 5. | 12 | igaz | 3 |
| 6. | 5 | hamis | 3 |

A kimenet: 3. A táblázat mutatja a bizottságnak, hogy módszeresen gondolkodsz. Egy papírlapon vagy a képernyőn is megteheted, de mondd ki közben, mit csinálsz.

## 3. lépés: mit csinál a program egy mondatban?

"A program megszámolja, hány páros szám van a listában." Ez a mondat a legfontosabb része az értelmezésnek. Ha nem megy, a változók nevéből és a követési táblázatból bontsd ki.

Ne a kódot fordítsd le szóról szóra ("ciklus x-szel, ha x maradék 2 egyenlő 0, akkor"), hanem az **értelmét** mondd.

## 4. lépés: módosítás

Tipikus módosítási kérések a fenti kódra:

- **Feltétel módosítása**: "Csak az 5-nél nagyobb páros számokat számold." Új feltétel: `x % 2 == 0 and x > 5` (C#: `x % 2 == 0 && x > 5`). Eredmény: csak a 12 felel meg, vagyis 1.
- **Más tétel**: "Add össze a páros számokat." A számláló helyett összeg: `osszeg += x`. Eredmény: 18.
- **Kimenet módosítása**: "Írd ki a páros számokat is." A feltételen belül `print(x)`.
- **Bemenet módosítása**: "A számokat a felhasználó adja meg." A lista helyett beolvasás.

Módosításnál mindig három dolgot tegyél: (1) mondd el, mit akarsz változtatni, (2) csináld meg a legkisebb változtatással, (3) teszteld, hogy a régi viselkedés nem romlott el.

## 5. lépés: tipikus kérdések és válaszok

**Mi történik, ha a lista üres?**
A ciklus egyszer sem fut le, a számláló nulla marad, tehát 0-t ír ki. Hibát nem ad.

**Mi történik, ha negatív szám is van a listában?**
A `-4 % 2` Pythonban 0, tehát páros; C#-ban is 0. A negatív páros számot is számolja. (Páratlannál C#-ban a maradék -1, Pythonban 1, ezért a `x % 2 == 1` feltétel C#-ban negatív páratlanra hibás: jobb a `x % 2 != 0`.)

**Miért jó ez az algoritmus?**
Egyszer megy végig a listán, ezért gyors, és nem módosítja az adatokat.

**Mit módosítanál a programon, hogy több feltételt is kezeljen?**
A feltételt bővíteném logikai operátorral (`and`/`&&`, `or`/`||`), vagy elágazást tennék a ciklusba.

## Gyakori hibák

- **Nem követed végig**: "szerintem ez ..." tipp helyett készíts követési táblázatot.
- A **határeset** elhagyása: üres lista, azonos elemek, első vagy utolsó elem.
- Módosításkor az egész programot átírod, ahelyett hogy a szükséges sort cserélnéd.
- Az operátor összekeverése: `=` és `==`, `>` és `>=`, `and` és `or`.
- Egy-eltérés (off-by-one) hiba a ciklushatárnál: `range(1, n)` az `n`-et már nem tartalmazza.
- A módosítás után nem futtatod újra a tesztet.

## Összefoglalás

- Ismeretlen kódnál először a szerkezetet nézd: bemenet, kimenet, változók, ciklus.
- A követési táblázat biztos módszer, ha elakadsz.
- Mondd el egy mondatban, mit csinál a program, és nevezd meg a tételt.
- Módosításnál a legkisebb változtatás a legjobb, utána teszteld.
- Készülj a szélsőséges esetekre: üres lista, negatív szám, azonos elemek.
