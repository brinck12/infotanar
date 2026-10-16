# Katalógus-ellenőrzés kiadás előtt (`catalog:verify`)

Mit csinál: minden **publikált** feladat mintamegoldását lefuttatja a saját tesztesetein (a rejtetteken is), ugyanazzal a `SolutionEvaluator`-ral, mint a diák beadását. Semmit nem tárol, felhasználó nincs. Ha bármelyik feladat nem megy át teljesen, a kilépési kód nem nulla, és a hibás feladat tesztesetenként kilistázva szerepel.

Mikor futtasd: minden kiadás (deploy) előtt, és ha a Judge0 vagy a nyelvi csomagok változtak. Hibás elvárt kimenet a diákot rosszra tanítja, és nem különböztethető meg a diák hibájától.

## Előfeltétel: valódi Judge0

A Judge0 csak a szerver localhostján érhető el. Helyi futtatáshoz nyiss alagutat, és hagyd nyitva:

```bash
ssh -N -L 2358:localhost:2358 <user>@<szerver>
```

A `backend/.env`-ben legyen `JUDGE0_AUTH_TOKEN`. A szerveren közvetlenül futtatható (ott nem kell alagút).

## Futtatás

```bash
cd backend
php artisan catalog:verify                     # minden publikált feladat
php artisan catalog:verify --track=python-alapok   # egy tanulási út (slug vagy azonosító)
php artisan catalog:verify --exercise=12       # egy feladat (piszkozat is lehet)
php artisan catalog:verify --json              # géppel olvasható kimenet (CI, naplózás)
php artisan catalog:verify --track=python-alapok --drafts   # a nem publikált feladatokat is
php artisan catalog:verify --track=python-alapok --drafts --negative
```

Opciók:

- `--drafts`: a **nem publikált** (piszkozat) feladatokat is ellenőrzi, `--track` és `--exercise` mellett is. Nélküle csak a publikált feladatok futnak.
- `--negative`: az **üres programot** is lefuttatja minden nyelven, és ha az minden teszten átmegy, a feladat hibás. Ez a túl engedékeny elvárt kimenet (például üres vagy mindent elfogadó) ellen véd, amit a mintamegoldás futtatása egyedül nem vesz észre.

## Munkamenet új tartalomnál

1. `php artisan catalog:import` a fájlokból piszkozatként tölti be a feladatokat (`published: false`).
2. `php artisan catalog:verify --track=<slug> --drafts --negative`: zöld futásig javítsd a mintamegoldást vagy az elvárt kimenetet.
3. Állítsd a feladatot `published: true`-ra a forrásfájlban.
4. Futtasd újra a `catalog:import`-ot, ez publikálja.

Kimenet feladatonként: `OK`, `HIBA` (okkal és tesztesetenként), `KIHAGY` (böngészős feladat: a szerver nem ellenőrzi). Hibánál a kilépési kód 1.

## Mit számít hibának

- **Hiányzik a mintamegoldás.** Kódfeladatnál a `sample_solutions` mezőben legalább egy engedélyezett nyelven kell megoldás (az admin felületen a feladat szerkesztőjében). Fájlfeladatnál a `sample_solution` szerepű feltöltött fájl.
- **Hiányzik egy engedélyezett nyelv mintamegoldása.** Az `allowed_languages` minden nyelvéhez (`python`, `csharp`, `sql`) kell mintamegoldás; az üzenet megnevezi a hiányzó nyelv(ek)et. Ez mindig érvényes, a kapcsolóktól függetlenül.
- `--negative` mellett: az üres program is átmegy minden teszten.
- Nincs teszteset (kódfeladat) vagy nincs értékelőlap-pont (fájlfeladat).
- Bármelyik teszteset nem `elfogadva` (rossz kimenet, fordítási hiba, futásidejű hiba, időtúllépés, szabálysértés).
- Fájlfeladatnál a mintamegoldás nem kapja meg a teljes automatikus pontszámot az értékelőlapon.
- Judge0 nem elérhető: a tesztesetek rendszerhibát jeleznek, a parancs hibával áll le (ilyenkor előbb az alagutat/Judge0-t nézd).

## Hibajavítás

1. Nyisd meg a feladatot az adminban, és a Mintamegoldás fülön az „Ellenőrzés (minden teszteset)” gombbal (`POST /admin/exercises/{id}/verify`) nézd meg a nyelvenkénti és tesztesetenkénti eredményt (a rejtett tesztesetnél csak a siker látszik). A gomb a legutóbb mentett mintamegoldást futtatja.
2. Javítsd a hibás elvárt kimenetet vagy a mintamegoldást, majd futtasd újra `--exercise=<id>`-val.
3. Csak zöld futás után adj ki.

## Publikálási kapu

Ugyanezek a szabályok az admin felületen is érvényesek: kódfeladat mintamegoldás és legalább egy nyilvános teszteset nélkül, fájlfeladat mintamegoldás-fájl nélkül vagy az értékelőlapot el nem érő mintamegoldással, illetve üres lecke (nincs jegyzet, létező videó vagy feladat) nem publikálható (422, magyar hibaüzenettel). A kapu a kódfeladat mintamegoldását nem futtatja (ahhoz Judge0 kell), azt a `catalog:verify` teszi.
