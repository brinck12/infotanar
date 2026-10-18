---
slug: kozep-szintu-feladat
title: Középszintű feladat lépésről lépésre
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mit várhatsz a középszintű programozási feladattól?

A középszintű érettségi programozási feladata nem kér sok újdonságot: **egy adatfájl**, amelyet be kell olvasnod, és **négy-öt részfeladat**, amelyek a már ismert programozási tételeket (összegzés, megszámlálás, maximumkiválasztás, kiválogatás) kérik számon. A részfeladatok egymásra épülnek, de külön-külön is pontot érnek: ha az egyik nem megy, a következőt még megoldhatod.

Ebben a leckében egy időjárási adatsor feladatát oldod meg lépésről lépésre. Mind az öt részfeladat ugyanazt a `homerseklet.txt` fájlt használja. Mivel a gyakorlóplatform minden feladatot külön futtat, minden megoldásnak újra be kell olvasnia az adatokat; az érettségin ez egyetlen program lenne, itt a beolvasó részt a kezdőkód már tartalmazza.

## Hogyan olvasd a feladatszöveget?

Az érettségi szövege mindig ugyanabból a három részből áll. Olvasd el őket ebben a sorrendben:

1. **A helyzet leírása és a fájl szerkezete.** Itt derül ki, hogy melyik oszlop mit jelent, mi az elválasztó (általában tabulátor), van-e fejléc, vagy szerepel-e az első sorban a sorok száma. Jegyezd fel magadnak: hány mező van egy sorban, melyik szöveg, melyik szám.
2. **A részfeladatok sorszámmal.** Minden részfeladatnál aláhúzhatod az igét: *számold meg*, *keresd meg*, *írd ki*, *kérd be*. Ez árulja el a programozási tételt.
3. **A mintakimenet.** A kimeneti formát betűre pontosan kövesd, a szóközt és az írásjeleket is. Ha a minta `Csapadekos napok: 5` sort mutat, akkor a te sorod is pontosan így kezdődjön.

A feladatszöveg ritkán mond ki mindent: ha például nem szól a holtversenyről, de a minta alapján dönteni kell, a korábbi elemet szokás választani. Itt a leírás mindig megmondja.

## A megoldás menete

Egy fájlos feladatot érdemes mindig ugyanabban a sorrendben megoldani:

1. Olvasd be a fájlt a program elején, **egyszer**, és tárold listában. A számokat azonnal alakítsd át számmá.
2. Írd ki a részfeladat sorszámát (`1. feladat`), mielőtt bármi mást kiírnál.
3. Ha a feladat bevitelt kér, **előbb írd ki a kérdést**, és csak utána olvass be.
4. Azonosítsd a tételt, és írd meg a ciklust.
5. Írd ki az eredményt a megadott formában.
6. Futtasd le a mintaadattal, és vesd össze a kimenetet a feladat mintájával betűről betűre.

Az alábbi beolvasás a leckében szereplő fájlra működik: az első sorban a napok száma áll, a többi sort tabulátornál darabolod mezőkre.

```python
with open("homerseklet.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
db = int(sorok[0])
napok = []
for sor in sorok[1:]:
    r = sor.split("\t")
    napok.append((int(r[0]), int(r[1]), int(r[2]), int(r[3])))
```

```csharp
using System;
using System.IO;

class Program
{
    static void Main()
    {
        string[] sorok = File.ReadAllLines("homerseklet.txt");
        int db = int.Parse(sorok[0]);
        int[][] napok = new int[db][];
        for (int i = 0; i < db; i++)
        {
            string[] r = sorok[i + 1].Split('\t');
            napok[i] = new int[] { int.Parse(r[0]), int.Parse(r[1]), int.Parse(r[2]), int.Parse(r[3]) };
        }
        Console.WriteLine("Napok szama: " + db);
    }
}
```

Próbáld ki a saját gépeden: tegyél a program mellé egy kis `homerseklet.txt` fájlt, és nézd meg, hogy a beolvasott lista elemszáma egyezik-e az első sorban álló számmal.

## A részfeladatok felismerése

A feladatsor nehézsége emelkedik, de a tételek ismerősek:

- **Első kiírás** (1. részfeladat): csak a beolvasást ellenőrzi, a legkönnyebb pontok. Ne hagyd ki!
- **Maximum** (2.): a legmelegebb nap. Tárold a legjobb nap *teljes adatát*, mert a sorszámát is ki kell írni.
- **Megszámlálás és összegzés** (3.): csapadékos napok és átlag. Az átlag az összeg osztva a darabszámmal; a két tizedesjegyre kerekítést a formázott kiírás végzi (`:.2f`, illetve `ToString("F2", CultureInfo.InvariantCulture)`).
- **Keresés bevitel alapján** (4.): a felhasználó adja meg, melyik napot keresed.
- **Kiválogatás fájlba** (5.): a feltételnek megfelelő napokat fájlba írod. A feladat itt is a képernyőn ellenőrzött, ezért olvasd vissza és írd ki a fájlt.

## Gyakori pontvesztések

- **Hiányzó sorszám.** A `1. feladat` sor kimarad, vagy más formában szerepel.
- **Elírt kiírás.** `Atlagos csapadek` helyett `Atlag csapadek`: a formát a mintából másold.
- **Egész osztás.** C#-ban két `int` osztása egész eredményt ad; az átlaghoz legalább az egyik tagot alakítsd `double`-lé.
- **A fejléc vagy az első sor feldolgozása.** Itt az első sor a napok száma, nem adat: kezdd a ciklust a másodiktól.
- **Ékezetes kimenet.** A tesztek ékezetmentes kimenetet várnak: írj `Atlagos csapadek` sort, ne `Átlagos csapadék` sort.
- **A kérdés a beolvasás után.** Ha a kérdést nem írod ki, a felhasználó nem tudja, mit kell megadnia.
- **Csak a mintán működő megoldás.** A rejtett tesztek más adattal futnak, akár egyetlen nap adatával: a program ne támaszkodjon arra, hogy a legmelegebb nap a sor közepén van, vagy hogy mindig van fagyos nap.

## Összefoglalás

- Egy közép-szintű programozási feladat egy fájl köré épül, 4–5 részfeladattal, amelyek ismert tételeket kérnek.
- Olvasd el a fájl leírását, a részfeladatot és a mintakimenetet; a formát betűre pontosan kövesd.
- Olvasd be az adatot egyszer, alakítsd számmá, és minden részfeladatot a sorszám kiírásával kezdj.
- A fájlba írt kimenetet olvasd vissza, mert csak a képernyőre írt szöveg számít.
- Teszteld szélső adattal is: egy nap, nincs fagyos nap, holtverseny.
