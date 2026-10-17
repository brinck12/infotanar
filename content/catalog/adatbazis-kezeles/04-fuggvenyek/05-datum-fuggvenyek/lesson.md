---
slug: datum-fuggvenyek
title: Dátumok részei
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Hogyan néz ki egy dátum?

Az érettségi feladatokban gyakran kell például az évet kinyerni egy dátumból, vagy megnézni, hogy egy fuvar este indult-e. Ehhez először tudni kell, milyen alakban van a dátum az adatbázisban.

Az adatbázis a dátumot mindig **év-hónap-nap** sorrendben tárolja, kötőjelekkel:

- `DATE` típus: csak dátum, például `2008-05-14`.
- `DATETIME` típus: dátum és időpont együtt, például `2025-03-02 22:10:00` (óra:perc:másodperc).

A hónap és a nap mindig **két jegyű**: `05`, nem `5`. A dátumot a lekérdezésben aposztrófok közé írod: `'2008-05-14'`.

A példákban ez a két tábla szerepel.

A `tanulo` tábla:

| `id` | `nev` | `szuletes` |
|---|---|---|
| 1 | Kiss Anna | 2008-05-14 |
| 2 | Nagy Béla | 2009-11-02 |
| 3 | Tóth Csaba | 2008-12-30 |

A `fuvar` tábla:

| `id` | `rendszam` | `indulas` |
|---|---|---|
| 1 | ABC-123 | 2025-03-02 07:45:00 |
| 2 | DEF-456 | 2025-03-02 22:10:00 |
| 3 | ABC-123 | 2025-03-09 18:30:00 |

## YEAR, MONTH, DAY: a dátum három része

Három függvény veszi ki a dátumból a részeit, és **számot** ad vissza:

- `YEAR(dátum)`: az év, például `2008`.
- `MONTH(dátum)`: a hónap száma, `1` és `12` között.
- `DAY(dátum)`: a nap száma a hónapban.

```sql
SELECT nev, YEAR(szuletes) AS ev, MONTH(szuletes) AS honap, DAY(szuletes) AS nap
FROM tanulo;
```

Mit csinál? Minden tanuló születési dátumát három részre bontja:

| `nev` | `ev` | `honap` | `nap` |
|---|---|---|---|
| Kiss Anna | 2008 | 5 | 14 |
| Nagy Béla | 2009 | 11 | 2 |
| Tóth Csaba | 2008 | 12 | 30 |

Figyeld meg: a `05` hónap itt `5` lett, mert számot kaptál, nem szöveget.

**Próbáld ki:** írd ki a tanulók nevét és csak a születési évüket.

## Szűrés a dátum egy része alapján

A függvény a `WHERE`-ben is jó. Kik születtek 2008-ban?

```sql
SELECT nev, szuletes
FROM tanulo
WHERE YEAR(szuletes) = 2008;
```

| `nev` | `szuletes` |
|---|---|
| Kiss Anna | 2008-05-14 |
| Tóth Csaba | 2008-12-30 |

A `YEAR` számot ad, ezért a `2008` nem kerül aposztrófba.

Kik születtek **decemberben**, bármelyik évben?

```sql
SELECT nev, szuletes
FROM tanulo
WHERE MONTH(szuletes) = 12;
```

| `nev` | `szuletes` |
|---|---|
| Tóth Csaba | 2008-12-30 |

**Próbáld ki:** keresd meg azokat, akik a hónap 2. napján születtek (`DAY`).

## Számolás az évvel: kor

Mivel az `YEAR` szám, számolhatsz vele. A kor (nagyjából) a mostani év mínusz a születési év. Ha az év 2025:

```sql
SELECT nev, 2025 - YEAR(szuletes) AS kor
FROM tanulo;
```

| `nev` | `kor` |
|---|---|
| Kiss Anna | 17 |
| Nagy Béla | 16 |
| Tóth Csaba | 17 |

Ez csak az évek különbsége: nem nézi, hogy a szülinap elmúlt-e már. A feladat szövege megmondja, ha így kell számolni. A pontosabb korhoz a következő leckében tanult `DATEDIFF` kell.

## HOUR, MINUTE, SECOND: az időpont részei

Ha a mező `DATETIME`, az időpont részeit is kiveheted:

- `HOUR(időpont)`: az óra, `0` és `23` között.
- `MINUTE(időpont)`: a perc.
- `SECOND(időpont)`: a másodperc.

```sql
SELECT id, HOUR(indulas) AS ora, MINUTE(indulas) AS perc
FROM fuvar;
```

| `id` | `ora` | `perc` |
|---|---|---|
| 1 | 7 | 45 |
| 2 | 22 | 10 |
| 3 | 18 | 30 |

Keressük az **esti** fuvarokat, vagyis amelyek 18:00-kor vagy később indultak:

```sql
SELECT id, rendszam
FROM fuvar
WHERE HOUR(indulas) >= 18;
```

| `id` | `rendszam` |
|---|---|
| 2 | DEF-456 |
| 3 | ABC-123 |

Az óra 24 órás: este 10 az `22`, nem `10`. Éjfél után az óra `0`, ezért az éjszakai időszak két feltétel: `HOUR(indulas) >= 22 OR HOUR(indulas) < 6`.

**Próbáld ki:** keresd meg a délelőtt (12 óra előtt) induló fuvarokat.

## Dátum összehasonlítása függvény nélkül

Mivel a dátum év-hónap-nap sorrendű, a betűrend megegyezik az időrenddel. Ezért két dátumot közvetlenül is összehasonlíthatsz, aposztróffal:

```sql
SELECT nev, szuletes
FROM tanulo
WHERE szuletes >= '2009-01-01';
```

| `nev` | `szuletes` |
|---|---|
| Nagy Béla | 2009-11-02 |

Az `ORDER BY szuletes` is időrendbe teszi a sorokat. Ha egy-egy dátumtól kezdve kérdezel, ez a legegyszerűbb forma. Ha az év egy bizonyos részére (hónapra, órára) kérdezel, a függvény kell.

## Gyakori hibák

- **A hónap szöveg helyett szám.** `MONTH(szuletes) = 5` a helyes, nem `= '05'`.
- **Aposztróf a számnál.** Az `YEAR(...) = '2008'` valószínűleg működik, de a számot számként írd: `= 2008`.
- **Dátum aposztróf nélkül.** A `szuletes >= 2009-01-01` kivonást számol (2007), nem dátumot. Mindig `'2009-01-01'`.
- **`HOUR` csak időponthoz.** Ha a mező `DATE` (nincs benne idő), az `HOUR` nem ad értelmes számot.
- **Egyjegyű hónap a szövegben.** A dátum szövegben mindig `2009-01-05`, nem `2009-1-5`.

## Összefoglalás

| Függvény | Mit ad | Példa (`'2025-03-02 22:10:00'`) | Eredmény |
|---|---|---|---|
| `YEAR(d)` | az évet | `YEAR(indulas)` | `2025` |
| `MONTH(d)` | a hónap számát | `MONTH(indulas)` | `3` |
| `DAY(d)` | a napot | `DAY(indulas)` | `2` |
| `HOUR(d)` | az órát (0–23) | `HOUR(indulas)` | `22` |
| `MINUTE(d)` | a percet | `MINUTE(indulas)` | `10` |
| `SECOND(d)` | a másodpercet | `SECOND(indulas)` | `0` |

Mindegyik **számot** ad, ezért számolhatsz vele és a `WHERE`-ben is jó. A dátum egészét aposztróffal, `ÉÉÉÉ-HH-NN` alakban írd.
