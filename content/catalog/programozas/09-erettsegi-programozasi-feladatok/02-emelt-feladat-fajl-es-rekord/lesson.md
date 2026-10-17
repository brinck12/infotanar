---
slug: emelt-feladat-fajl-es-rekord
title: "Emelt feladat: fájl és rekord"
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Az emelt szintű feladat felépítése

Az emelt szintű programozási feladat **6–8 részfeladatból** áll, és egy 100 perces gyakorlati vizsga része. Az első két-három részfeladat rövid és kevés pontot ér: beolvasás, első adat kiírása, egyszerű számolás. A közepe már tételeket épít össze, az utolsó pedig a leggondolkodtatóbb: kimutatás, több szempontú keresés vagy fájlba írás. A pontok nagy részét a feladat első kétharmada adja, ezért a sorrendet érdemes követni, és elakadás esetén továbblépni.

Ebben a leckében egy atlétikai verseny eredményeivel dolgozol. A feladat jellegzetessége, hogy **egy sor egy eredmény**, és egy versenyző több sorban is szerepelhet. Ilyenkor a legtermészetesebb adatmodell a rekord, vagyis a saját osztály.

## Rekord és lista

Az eredményeket egy `Eredmeny` osztály példányaiban tárold, a példányokat pedig egy listában. A fájl beolvasását érdemes a program elejére tenni.

```python
class Eredmeny:
    def __init__(self, nev, orszag, tav, ido):
        self.nev = nev
        self.orszag = orszag
        self.tav = tav
        self.ido = ido

with open("verseny.txt", encoding="utf-8") as f:
    sorok = f.read().splitlines()
eredmenyek = []
for sor in sorok[1:]:
    r = sor.split("\t")
    eredmenyek.append(Eredmeny(r[0], r[1], int(r[2]), float(r[3])))
```

```csharp
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

class Eredmeny
{
    public string Nev;
    public string Orszag;
    public int Tav;
    public double Ido;
}

class Program
{
    static void Main()
    {
        string[] sorok = File.ReadAllLines("verseny.txt");
        List<Eredmeny> eredmenyek = new List<Eredmeny>();
        for (int i = 1; i < sorok.Length; i++)
        {
            string[] r = sorok[i].Split('\t');
            Eredmeny e = new Eredmeny();
            e.Nev = r[0];
            e.Orszag = r[1];
            e.Tav = int.Parse(r[2]);
            e.Ido = double.Parse(r[3], CultureInfo.InvariantCulture);
            eredmenyek.Add(e);
        }
        Console.WriteLine(eredmenyek.Count);
    }
}
```

A tizedestört beolvasásánál figyelj: a fájlban **pont** van. Pythonban a `float` ezt elfogadja, C#-ban az `InvariantCulture` nélkül egy magyar nyelvű gépen a `double.Parse` a vesszőt várná, és a pontot hibának vagy ezres elválasztónak venné.

## Az egyes részfeladatok típusai

A hat-nyolc részfeladat szinte mindig a következő típusokból kerül ki:

- **Beolvasás-ellenőrzés:** hány sor van, mi az első adat.
- **Keresés vagy kiválogatás bevitel alapján:** a felhasználó megad egy nevet vagy kódot, és kiírod a hozzá tartozó adatokat. Ha nincs találat, külön üzenet kell.
- **Megszámlálás, különböző elemek:** itt a halmaz (`set` / `HashSet`) segít.
- **Szűrt minimum vagy maximum:** csak egy távot vagy csoportot vizsgálsz. Az "eddigi legjobb" kezdetben üres.
- **Átlag:** összeg és darabszám; üres csoportnál ne oszts nullával.
- **Csoportonkénti legjobb:** szótár, amelynek kulcsa a csoport, értéke az eddigi legjobb rekord.
- **Fájlba írás:** az eredményt a kért formában fájlba írod; a gyakorlóplatformon ezt a fájlt visszaolvasva a képernyőre is kiírod.

## Gyakori pontvesztések

- **Nincs kezelve az üres eset.** A rejtett tesztek között van olyan adat, amelyben nincs 100 méteres eredmény, vagy nincs ilyen nevű versenyző. A feladat szövegének ilyenkor mindig megadja a kiírandó üzenetet.
- **Holtverseny.** A feladat megmondja, melyik számít. A `<` szigorú összehasonlítás az elsőt, a `<=` az utolsót tartja meg.
- **Név és kód összetévesztése.** A név szóközt tartalmazhat: a teljes sort kell beolvasnod (`input()` / `ReadLine`), nem a szóközig tartó részt.
- **Rossz tizedesformázás.** A két tizedesjegy kötelező, `11.5` helyett `11.50`. Az átlag kerekítését a formázás végzi.
- **Szótár sorrendje C#-ban.** Ha az "első előfordulás" sorrendje számít, tarts külön listát a kulcsokról.
- **A fájl nem visszaolvasva.** A kimeneti fájl tartalmát a feladat kéri kiírni; ilyenkor olvasd vissza a fájlt, ne a memóriabeli listát írd ki, így azt is ellenőrzöd, hogy a fájl valóban jó lett.

## Összefoglalás

- Az emelt feladat 6–8 részfeladatot tartalmaz; a pontok többségét az első kétharmad adja, ott ne veszíts.
- Ha egy sor egy "dolog" több mezővel, rekordot (osztályt) és listát használj.
- A típusfeladatok: kiválogatás, megszámlálás, szűrt szélsőérték, átlag, csoportonkénti legjobb, fájlba írás.
- Kezeld az üres esetet és a holtversenyt a feladat szövege szerint.
- Tizedestörtnél C#-ban `InvariantCulture`, kiíráskor két tizedesjegy.
