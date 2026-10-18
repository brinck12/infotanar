---
slug: tipikus-kerdesek-es-valaszok
title: "Tipikus kérdések és válaszok"
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Hogyan használd ezt a leckét?

A bizottság a megoldásod után néhány kérdést tesz fel, hogy lássa, mennyire értesz a mögöttes elmélethez. A hivatalos kérdések nem nyilvánosak, az itt szereplők **saját gyakorló kérdések**. Olvasd el a kérdést, mondd el hangosan a saját válaszod, és csak utána nézd meg a mintát. A válaszok szándékosan rövidek: 20–40 másodperc alatt elmondhatók.

## Programozási tételek

**Mi az összegzés tétele?**
Egy sorozat elemeit összeadjuk. Az összeget nullára állítom, majd ciklussal minden elemet hozzáadok. Ha feltétel is van, csak a megfelelő elemeket adom hozzá.

**Mi a különbség a megszámlálás és az összegzés között?**
Megszámlálásnál a feltételnek megfelelő elemek *darabszámát* adjuk meg, a számláló eggyel nő. Összegzésnél az elemek *értékét* adjuk össze.

**Hogyan működik a maximumkiválasztás?**
Az első elemet tekintem legnagyobbnak, majd végigmegyek a többin, és ha nagyobbat találok, felülírom. Egy ciklus, tehát az idő arányos az elemszámmal. Üres sorozatra nincs értelme, ezért azt külön kell kezelni.

**Mi az eldöntés és mi a keresés?**
Az eldöntés azt állapítja meg, hogy van-e a sorozatban a feltételnek megfelelő elem (igen/nem válasz). A keresés ezen felül megadja, hol van az első ilyen elem. Mindkettő megáll az első találatnál.

**Mikor használjuk a szétválogatást?**
Ha az elemeket egy feltétel alapján két vagy több csoportba kell tenni, például páros és páratlan számok külön listába.

## Rendezés

**Hogyan működik a cserélő (buborék) rendezés?**
Az egymás melletti elemeket összehasonlítja, és ha rossz a sorrend, megcseréli. Ezt addig ismétli, amíg minden elem a helyére nem kerül. Két egymásba ágyazott ciklus, ezért elemszám növekedésével a lépések négyzetesen nőnek.

**Mi a beszúró rendezés lényege?**
A lista elejét rendezettnek tekintem, és a következő elemet mindig a rendezett részben a helyére szúrom be, mint amikor kártyát rendezel a kezedben.

**Miért rendezünk?**
A rendezett adatban gyorsabb a keresés (bináris keresés), könnyebb a csoportosítás és az áttekintés. Mellette a Python `sort()` vagy a C# `Array.Sort` beépített, gyorsabb megoldás, a feladat szövege mondja meg, szabad-e használni.

**Mi a bináris keresés feltétele?**
A sorozatnak rendezettnek kell lennie. Minden lépésben a középső elemmel hasonlítok, és a keresési tartomány felét eldobom.

## Rekurzió

**Mi a rekurzió?**
Olyan függvény, amely önmagát hívja. Kell hozzá **alapeset** (ami nem hív tovább) és **lépés** (kisebb feladatra visszavezetés).

**Példa?**
A faktoriális: `f(0) = 1`, `f(n) = n * f(n-1)`. Az alapeset a 0, a lépés eggyel kisebb számra hívja újra.

**Mi a rekurzió veszélye?**
Ha nincs alapeset vagy nem közeledik hozzá, végtelen hívás lesz, a verem megtelik és a program hibával leáll. Nagy mélységnél lassabb és több memóriát használ, mint a ciklus.

**Mikor jobb a rekurzió?**
Természetesen rekurzív szerkezeteknél: fa, Hanoi tornyai, mélységi bejárás. Egyszerű számolásnál a ciklus általában egyszerűbb.

## Adatszerkezetek

**Mi a különbség a lista (tömb) és a szótár között?**
A listában az elemekre sorszám (index) szerint hivatkozunk, a szótárban kulcs szerint (például név szerint). A szótárban a kulcs szerinti keresés gyors.

**Mi a halmaz?**
Elemek rendezetlen gyűjteménye, amelyben minden elem legfeljebb egyszer szerepel. Jó duplikátumok kiszűrésére és tartalmazás-vizsgálatra.

**Mi a verem és a sor?**
A verem (LIFO) az utolsónak betett elemet adja vissza először, mint egy tányérhalom. A sor (FIFO) az elsőnek betett elemet adja vissza először, mint a boltban a sorban állás.

**Mikor használnál rekordot vagy osztályt?**
Ha több, összetartozó adatot kell egy egységben kezelni, például egy tanuló nevét és pontszámát.

## Hibakezelés és tesztelés

**Mi a különbség a szintaktikai és a logikai hiba között?**
A szintaktikai hibát a fordító vagy értelmező jelzi (elírás, hiányzó zárójel). A logikai hiba esetén a program lefut, de rossz eredményt ad, ezt teszteléssel találjuk meg.

**Mit tegyünk, ha a program nem a várt eredményt adja?**
Kiíratom a közbenső értékeket, követési táblázatot készítek, ellenőrzöm a ciklushatárokat és a feltételeket, majd kis adattal újra tesztelem.

**Miért kell tesztelni szélső esetekkel?**
Mert a hibák többsége ott jelentkezik: üres bemenet, egyetlen elem, nulla, negatív szám.

## Gyakori hibák

- **Túl hosszú válasz**: két-három mondat elég, aztán várd meg a következő kérdést.
- **Definíció példa nélkül**: mindig adj egy egyszerű példát.
- A fogalmak felcserélése: verem és sor, szótár és lista, eldöntés és keresés.
- Azt mondod, "nem tudom", és befejezed. Mondd el, mit tudsz, és hogyan kezdenél hozzá.
- A bonyolultságot "gyorsnak" vagy "lassúnak" nevezed, anélkül hogy az elemszámhoz kötnéd.

## Összefoglalás

- A tételek mindegyikéhez tudd a **nevet**, az **ötletet**, egy **példát** és a **határesetet**.
- Rendezéseknél a cserélő és a beszúró a két alap, kimondva a négyzetes jelleg.
- A rekurzió két alkotóeleme: alapeset és lépés.
- Adatszerkezetek: lista, szótár, halmaz, verem, sor, rekord.
- Röviden és pontosan válaszolj, a példák segítenek a megértésben.
