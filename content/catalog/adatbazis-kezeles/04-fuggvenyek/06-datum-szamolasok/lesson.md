---
slug: datum-szamolasok
title: Számolás dátumokkal
position: 5
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mennyi idő telt el? Mikor lesz?

Az előző leckében a dátum darabjait vetted ki. Most a **dátumok közti számolást** tanulod meg: hány nap telt el két dátum között, melyik dátum lesz 14 nap múlva, milyen napra esik egy dátum, és hogyan írhatod ki szebben.

Mindezt kézzel nagyon nehéz volna kiszámolni (hónapok különböző hosszúak, vannak szökőévek). A függvények mindezt maguktól kezelik.

A példákban ez a `rendeles` tábla szerepel:

| `id` | `vevo` | `rendelve` | `hatarido` | `szallitva` |
|---|---|---|---|---|
| 1 | Kiss Anna | 2025-03-03 | 2025-03-10 | 2025-03-07 |
| 2 | Nagy Béla | 2025-03-08 | 2025-03-15 | 2025-03-17 |
| 3 | Tóth Csaba | 2025-02-26 | 2025-03-05 | NULL |

A `szallitva` oszlop azt mondja meg, mikor szállították ki a rendelést. Tóth Csaba csomagját még nem szállították ki, ezért ott `NULL` áll.

## DATEDIFF: hány nap a különbség?

A `DATEDIFF(későbbi, korábbi)` a két dátum közti **napok számát** adja. A *későbbi* dátumot írd előre.

```sql
SELECT vevo, DATEDIFF(szallitva, rendelve) AS napok
FROM rendeles;
```

Mit csinál? Soronként kivonja a rendelés napját a szállítás napjából, és napokban adja meg:

| `vevo` | `napok` |
|---|---|
| Kiss Anna | 4 |
| Nagy Béla | 9 |
| Tóth Csaba | NULL |

Kiss Anna: március 3-tól március 7-ig 4 nap. Tóth Csabánál nincs szállítási dátum, ezért nincs eredmény sem (`NULL`, vagyis üres).

Ha felcseréled a sorrendet, az eredmény **negatív** lesz: `DATEDIFF(rendelve, szallitva)` Kiss Annánál `-4`.

Fix dátumot is írhatsz bele, aposztrófok között: `DATEDIFF('2025-03-10', '2025-03-03')` az `7`.

**Próbáld ki:** hány nap telt el a rendelés és a határidő között minden rendelésnél?

## ADDDATE: napok hozzáadása

Az `ADDDATE(dátum, napok)` a dátumhoz **hozzáad** annyi napot, amennyit megadsz. A számlát például a rendeléstől számított 14 napon belül kell kifizetni:

```sql
SELECT vevo, ADDDATE(rendelve, 14) AS fizetesi_hatarido
FROM rendeles;
```

| `vevo` | `fizetesi_hatarido` |
|---|---|
| Kiss Anna | 2025-03-17 |
| Nagy Béla | 2025-03-22 |
| Tóth Csaba | 2025-03-12 |

Tóth Csaba rendelése február 26-án volt. A 14 nap átlépi a hónaphatárt, és az eredmény március 12. Ezt a függvény magától helyesen számolja, a szökőévet is.

A `SUBDATE(dátum, napok)` ugyanígy **levon** napokat: `SUBDATE('2025-03-10', 7)` az `2025-03-03`.

**Próbáld ki:** mi lesz a rendelés napja után 30 nappal?

## DAYOFWEEK és DAYNAME: milyen nap volt?

A `DAYNAME(dátum)` a nap **angol nevét** adja. A `DAYOFWEEK(dátum)` pedig a hét napjának **sorszámát**, de figyelem, ez a számozás vasárnappal indul:

| nap | vasárnap | hétfő | kedd | szerda | csütörtök | péntek | szombat |
|---|---|---|---|---|---|---|---|
| `DAYOFWEEK` | 1 | 2 | 3 | 4 | 5 | 6 | 7 |

```sql
SELECT vevo, DAYNAME(rendelve) AS nap, DAYOFWEEK(rendelve) AS sorszam
FROM rendeles;
```

| `vevo` | `nap` | `sorszam` |
|---|---|---|
| Kiss Anna | Monday | 2 |
| Nagy Béla | Saturday | 7 |
| Tóth Csaba | Wednesday | 4 |

Hétvégén lett rendelve? Szombat (7) vagy vasárnap (1):

```sql
SELECT vevo
FROM rendeles
WHERE DAYOFWEEK(rendelve) IN (1, 7);
```

| `vevo` |
|---|
| Nagy Béla |

(Van egy `WEEKDAY` függvény is: ez a hétfőt 0-nak veszi, a vasárnapot 6-nak. Ne keverd a kettőt, mindig nézd meg, melyik szerepel a feladatban.)

## DATE_FORMAT: szebb kiírás

A `DATE_FORMAT(dátum, minta)` a dátumot a **megadott minta** szerint írja ki. A mintában a `%`-os jelek a dátum részeit jelentik, minden más karakter változatlanul bekerül:

| Jel | Jelentés | Példa |
|---|---|---|
| `%Y` | év, négy jegyű | `2025` |
| `%m` | hónap, két jegyű | `03` |
| `%d` | nap, két jegyű | `03` |
| `%H` | óra (00–23) | `22` |
| `%i` | perc | `10` |
| `%s` | másodperc | `00` |

Fontos: a perc jele `%i`, nem `%m` (az a hónap).

```sql
SELECT vevo, DATE_FORMAT(rendelve, '%Y.%m.%d.') AS datum
FROM rendeles;
```

A mintában a pontok csak írásjelek, szövegként maradnak:

| `vevo` | `datum` |
|---|---|
| Kiss Anna | 2025.03.03. |
| Nagy Béla | 2025.03.08. |
| Tóth Csaba | 2025.02.26. |

Időponttal együtt (ha a mező `DATETIME`): `DATE_FORMAT(indulas, '%Y.%m.%d. %H:%i')` ilyet ad: `2025.03.02. 22:10`.

## A mai nap: CURDATE és NOW

A `CURDATE()` a mai dátumot, a `NOW()` a mostani dátumot és időt adja. Zárójelben nincs semmi. Az eredmény **minden nap más**, ezért a feladatok általában inkább fix dátumot adnak meg, de érdemes ismerni:

```sql
SELECT CURDATE();
```

Pontos kort így lehet számolni: napok száma a mai napig, osztva 365-tel: `DATEDIFF(CURDATE(), szuletes) / 365`.

## Összerakjuk: késett-e a szállítás?

Egy rendelés késett, ha a szállítás napja **későbbi**, mint a határidő. Vagyis a `DATEDIFF(szallitva, hatarido)` pozitív. Tedd az `IF`-be (az előző leckéből):

```sql
SELECT id, vevo, IF(DATEDIFF(szallitva, hatarido) > 0, 'kesett', 'idoben') AS allapot
FROM rendeles
WHERE szallitva IS NOT NULL;
```

A `WHERE szallitva IS NOT NULL` kiszűri a még nem szállított rendeléseket. Ha ezt elhagynád, Tóth Csaba sorában a feltétel nem lenne igaz, és az `IF` hibásan az `idoben` ágat választaná.

| `id` | `vevo` | `allapot` |
|---|---|---|
| 1 | Kiss Anna | idoben |
| 2 | Nagy Béla | kesett |

Kiss Annánál a szállítás 3 nappal a határidő előtt volt (`-3`), Nagy Bélánál 2 nappal utána (`2`).

## Gyakori hibák

- **Felcserélt `DATEDIFF`-sorrend.** A későbbi dátum van elöl. Fordítva a nap negatív.
- **Dátum aposztróf nélkül.** `DATEDIFF('2025-03-10', ...)`, nem `DATEDIFF(2025-03-10, ...)`.
- **A `DAYOFWEEK` vasárnappal kezdődik.** A hétfő a 2, nem az 1.
- **`%m` a perc helyett.** A perc `%i`.
- **`NULL` dátum.** Ha az egyik dátum hiányzik, a `DATEDIFF` eredménye is `NULL`. Szűrd ki az `IS NOT NULL`-lal, vagy kezeld az `IF`-fel.
- **A `NOW()` eredménye változik.** Teszthez fix dátumot használj.

## Összefoglalás

| Függvény | Mit csinál | Példa | Eredmény |
|---|---|---|---|
| `DATEDIFF(a, b)` | napok különbsége `a - b` | `DATEDIFF('2025-03-10', '2025-03-03')` | `7` |
| `ADDDATE(d, n)` | `n` napot hozzáad | `ADDDATE('2025-02-26', 14)` | `2025-03-12` |
| `SUBDATE(d, n)` | `n` napot levon | `SUBDATE('2025-03-10', 7)` | `2025-03-03` |
| `DAYOFWEEK(d)` | a nap sorszáma (1 = vasárnap) | `DAYOFWEEK('2025-03-08')` | `7` |
| `DAYNAME(d)` | a nap angol neve | `DAYNAME('2025-03-08')` | `Saturday` |
| `DATE_FORMAT(d, minta)` | kiírás a minta szerint | `DATE_FORMAT('2025-03-08', '%Y.%m.%d.')` | `2025.03.08.` |
| `CURDATE()` | a mai dátum | | naponta más |

A napok számolását a függvények végzik, te csak a helyes sorrendre és az aposztrófokra figyelj.
