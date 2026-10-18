---
slug: idozitett-emelt-feladat
title: Időzített emelt feladat
position: 5
free: false
published: false
reviewed_by:
reviewed_at:
---

## Egy teljes feladatsor, órával a kezedben

Eddig részfeladatonként gyakoroltál. Az érettségin viszont egyben kapod meg az egészet: egy adatfájlt és hét-nyolc részfeladatot, **100 perc** alatt, összesen **50 pontért**. Ez a lecke ezt a helyzetet gyakoroltatja. A tartalma egy teljes, időzítésre szánt feladatsor egy városi könyvtár kölcsönzési adataival: minden részfeladat külön feladat a platformon, a pontszámuk együtt 50.

A cél nem az, hogy mindent tudj, hanem hogy **a 100 percet jól oszd be**. Állíts be időzítőt, és ne nézz bele a mintamegoldásba, amíg le nem telt az idő.

## A pontozás

| Részfeladat | Téma | Pont |
|---|---|---|
| 1 | beolvasás, első adat | 3 |
| 2 | a leghosszabb kölcsönzés | 5 |
| 3 | egy könyv kölcsönzései, átlag | 6 |
| 4 | a késések | 6 |
| 5 | a legaktívabb olvasó | 7 |
| 6 | kölcsönzések hónaponként | 8 |
| 7 | késések fájlba | 9 |
| 8 | legtöbb egyszerre kölcsönzött könyv | 6 |

A pontok összege 50. A vizsgán a pont a *részfeladatonként* kapott részeredményekből áll össze: ha a program fut, de a kimenet fele hibás, akkor is járhat pont. A gyakorlóplatformon viszont egy feladat csak akkor zöld, ha az összes teszt átmegy, ezért a hibákat itt is teljesen ki kell javítanod.

## Az időbeosztás

100 perc alatt nagyjából így érdemes haladni:

- **0–5 perc:** olvasd végig a teljes feladatsort, a fájl felépítését és a kimeneti mintákat. Ne kezdj kódolni.
- **5–15 perc:** a beolvasás és az első részfeladat. Ezt rekordba és listába tedd, mert a többi feladat erre épül.
- **15–65 perc:** a 2–6. részfeladat. Itt jön a pontok nagy része; egy-egy feladat legfeljebb 10 perc.
- **65–90 perc:** a 7. és 8. részfeladat, a nehezebbek.
- **90–100 perc:** ellenőrzés a lenti listával, formázás, a kimenet átolvasása.

Ha egy részfeladat 10 percnél tovább elakaszt, **ugorj tovább**. A következő részfeladat ritkán függ az előzőtől, a kihagyott pontokat a végén még pótolhatod.

## Az adatfájl

A `kolcsonzes.txt` első sora fejléc, utána tabulátorral tagolt sorok: `olvaso`, `kod`, `ki`, `be`. A `ki` és a `be` az év napjának sorszáma. Egy kölcsönzés időtartama `be - ki`, a határidő 14 nap. A beolvasás mintája:

```python
class Kolcsonzes:
    def __init__(self, olvaso, kod, ki, be):
        self.olvaso = olvaso
        self.kod = kod
        self.ki = ki
        self.be = be

with open("kolcsonzes.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
kolcsonzesek = []
for sor in sorok[1:]:
    r = sor.split("\t")
    kolcsonzesek.append(Kolcsonzes(r[0], r[1], int(r[2]), int(r[3])))
```

```csharp
using System;
using System.Collections.Generic;
using System.IO;

class Kolcsonzes
{
    public string Olvaso;
    public string Kod;
    public int Ki;
    public int Be;
}

class Program
{
    static void Main()
    {
        string[] sorok = File.ReadAllLines("kolcsonzes.txt");
        List<Kolcsonzes> kolcsonzesek = new List<Kolcsonzes>();
        for (int i = 1; i < sorok.Length; i++)
        {
            string[] r = sorok[i].Split('\t');
            Kolcsonzes k = new Kolcsonzes();
            k.Olvaso = r[0];
            k.Kod = r[1];
            k.Ki = int.Parse(r[2]);
            k.Be = int.Parse(r[3]);
            kolcsonzesek.Add(k);
        }
        Console.WriteLine(kolcsonzesek.Count);
    }
}
```

Ez a beolvasás szinte ugyanaz, mint a fájl-és-rekord leckében. Minden részfeladat elejére másold be, mert a platformon minden feladat külön program.

## Ellenőrző lista

Mielőtt egy részfeladatot késznek mondasz, menj végig ezen:

1. **Elolvastad újra a feladatot?** A sorszámmal kezdődő `N. feladat` sor, a kérdések szövege, a kimeneti formátum betűre pontosan egyezik.
2. **Üres eset.** Mi történik, ha nincs találat (nincs ilyen könyv, nincs késés)? A feladat megadja a kiírandó üzenetet.
3. **Holtverseny.** Az első vagy az utolsó számít? Szigorú (`>`) vagy nem szigorú (`>=`) összehasonlítás kell?
4. **Határesetek.** A pontosan 14 napos kölcsönzés nem késés. A hónaphatár (31., 32., 59., 60. nap) és az év utolsó napja (365) a megfelelő hónapba esik?
5. **Formázás.** Két tizedesjegy (`12.20`, nem `12.2`), tizedespont, nincs felesleges szóköz vagy üres sor.
6. **Fájlba írás.** A kimeneti fájl sorai a kért sorrendben és elválasztóval vannak, és a program visszaolvassa, nem a memóriabeli listát írja ki.
7. **Nincs ékezet** a kimenetben, és a kérdés külön sorba kerül, csak utána olvasol be.
8. **Lefuttattad a saját mintával,** és egy szélsőséges adattal is (egyetlen sor a fájlban)?

## Gyakori hibák

- **Túl sok idő az elején.** A szépítésre, a változónevek finomítására a végén van idő, nem az első negyedórában.
- **Megoldás beolvasás nélkül.** Az egész feladatsor a beolvasásra épül; ha az nem működik, semmi más sem fog.
- **Kihagyott részfeladat.** Egy részleges, de futó program is pontot ér, ezért ne hagyj üresen semmit.
- **Beolvasott érték sztringként marad.** A napok `int`-ek: összehasonlítás és kivonás előtt alakítsd át őket.
- **Hónap kiszámítása kézzel kimásolva.** Írj egyszer függvényt, és használd újra mindenhol.
- **Utolsó percben átírás.** A 95. percben ne írj át működő megoldást; inkább olvasd át a kimenetet.

## Összefoglalás

- Az emelt gyakorlati vizsga 100 perc, hét-nyolc részfeladat, 50 pont.
- Az első öt percben csak olvass és tervezz; a beolvasás kerüljön rekordba és listába.
- Egy részfeladatra legfeljebb 10 percet szánj, utána lépj tovább.
- Minden részfeladat végén ellenőrizd az üres esetet, a holtversenyt, a határeseteket és a formázást.
- Az utolsó 10 perc az ellenőrzésé: olvasd át a kimeneteket a feladat szövegével együtt.
