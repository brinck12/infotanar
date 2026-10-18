---
slug: tesztelese-es-nyomkovetes
title: Tesztelés és nyomkövetés
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Honnan tudod, hogy a program jó?

Az, hogy a program lefut és egy példára jó eredményt ad, még nem jelenti, hogy helyes. A **tesztelés** célja, hogy hibát találj, mielőtt más találná meg. Az érettségin is előfordul, hogy a megoldásodat a javítókulcs több bemenettel futtatja, és a rejtett esetek között szélsőségesek is vannak.

## Mintaadatok

Először mindig próbáld ki a feladat leírásában szereplő példát. Utána válassz **saját** adatokat, amelyekhez fejben vagy papíron is ki tudod számolni a helyes választ. Egy jó teszt három dolgot ad meg: a bemenetet, az elvárt kimenetet, és azt, hogy mit ellenőriz.

## Szélső esetek

A hibák nagy része a "szélen" bújik meg. Mindig gondold végig:

- **üres bemenet**: `N = 0`, üres lista, üres szöveg;
- **egyetlen elem**: `N = 1`; a maximum, a minimum és az összeg ugyanaz;
- **negatív számok**: csupa negatív lista, ahol a 0-ról indított maximum hibás;
- **ismétlődő értékek**: több azonos legnagyobb elem;
- **a határok**: a legnagyobb és a legkisebb megengedett érték;
- **a feltétel pontosan a határon**: `>` helyett `>=` hibája csak az egyenlőnél látszik.

Egy példa az üres esetre: az átlag `összeg / darab`, ami `N = 0`-nál nullával osztás. Ezt külön kell kezelni.

::: python

```python
n = int(input())
if n == 0:
    print("nincs adat")
else:
    osszeg = 0
    for _ in range(n):
        osszeg += int(input())
    print(osszeg / n)
```

:::

::: csharp

```csharp
int n = int.Parse(Console.ReadLine());
if (n == 0)
{
    Console.WriteLine("nincs adat");
}
else
{
    int osszeg = 0;
    for (int i = 0; i < n; i++)
    {
        osszeg += int.Parse(Console.ReadLine());
    }
    Console.WriteLine((double)osszeg / n);
}
```

:::

## Nyomkövetési táblázat

Ha nem érted, mit csinál egy program, vagy keresed a hibát, **nyomkövetési táblázatot** készíthetsz: soronként leírod, hogyan változnak a változók. Az érettségin ezt papíron kérik. Példa az összegzésre, bemenet: `3`, `5`, `-2`, `4`.

| lépés | `i` | `szam` | `osszeg` |
|---|---|---|---|
| kezdet | | | 0 |
| 1 | 1 | 5 | 5 |
| 2 | 2 | -2 | 3 |
| 3 | 3 | 4 | 7 |

Az oszlopok a figyelt változók; minden sor egy ciklusmag-lefutás utáni állapot. A táblázat utolsó sora adja az eredményt. Ha az eredmény eltér a vártól, megkeresheted az első sort, ahol a változó értéke nem az, amit gondoltál: ott a hiba.

Programban is kiírhatod a változókat a ciklusban (ez a "kiíratásos hibakeresés"):

::: python

```python
print(i, szam, osszeg)
```

:::

::: csharp

```csharp
Console.WriteLine(i + " " + szam + " " + osszeg);
```

:::

## Hibás program javítása

Tipikus hibák és felismerésük:

- **Rossz kezdőérték**: a maximum 0-ról indul, ezért negatív számoknál 0-t ad. Teszt: csupa negatív lista.
- **Eggyel elcsúszó ciklus**: az utolsó elem kimarad. Teszt: egy- és kételemű lista.
- **Nullával osztás**: üres adatnál. Teszt: `N = 0`.
- **Rossz összehasonlítás**: `>` vagy `>=`. Teszt: ismétlődő értékek.

Javítás előtt mindig **reprodukáld** a hibát egy konkrét bemenettel, javítás után pedig futtasd újra az összes korábbi tesztet.

## Gyakori hibák

- Csak a feladat példájával tesztelsz.
- A szélső esetek kimaradnak (üres, egy elem, csupa negatív).
- Javítás után nem futtatod újra a régi teszteket, és közben mást rontasz el.
- A nyomkövetésnél a ciklusváltozó vagy a kezdőérték sora kimarad.

## Összefoglalás

- Teszteld a mintaadattal, majd saját adatokkal, majd a szélső esetekkel.
- Szélső eset: üres, egyelemű, csupa negatív, ismétlődő érték, határérték.
- A nyomkövetési táblázat sorról sorra mutatja a változók értékét; a hibát az első váratlan érték jelzi.
