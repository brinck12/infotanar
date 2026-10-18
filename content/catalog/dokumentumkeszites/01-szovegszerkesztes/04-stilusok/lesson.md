---
slug: stilusok
title: "Stílusok"
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

Képzeld el, hogy egy 30 oldalas dolgozatban minden alcím 14 pontos, félkövér, zöld, és a főnök most azt kéri, legyen mindegyik 16 pontos és kék. Kézzel százszor kellene módosítanod. A **stílus** ezt egyetlen módosításra egyszerűsíti: a formázási tulajdonságok névvel ellátott csomagja, amelyet több szövegrészre alkalmazhatsz, és ha megváltoztatod, mindenhol egyszerre módosul.

**Érettségi szint:** a stílusok alkalmazása és módosítása közép; új stílus létrehozása, a stílus tulajdonságainak beállítása és a stílushierarchia **emelt** szintű anyag. Az érintett szakaszoknál jelölve van.

## Mi az a stílus?

A stílus két fajtája fontos:

- **Bekezdésstílus**: a teljes bekezdésre vonatkozik, és tartalmazza a karakterformázást (betűtípus, méret) és a bekezdésformázást (igazítás, térköz, behúzás) is. Ilyen a "Címsor 1", a "Normál", a "Szövegtörzs".
- **Karakterstílus**: csak a kijelölt karakterekre vonatkozik, például egy "Kiemelés" nevű stílus, amely a szó betűit dőlté és színessé teszi.

Minden dokumentum kész stílusokkal indul. A legfontosabbak:

| Stílus | Mire való |
|---|---|
| Normál (Writerben: Alapértelmezett bekezdésstílus / Szövegtörzs) | a szövegtest alapja |
| Címsor 1, 2, 3 (Writerben: Címsor 1, 2, 3) | a szerkezet szintjei: fejezet, alfejezet, szakasz |
| Cím | a dokumentum címe |
| Idézet | idézetek |
| Lábjegyzet, Élőfej, Élőláb | a megfelelő részek automatikus stílusai |

## Stílus alkalmazása (közép)

1. Állítsd a kurzort a bekezdésbe (vagy jelöld ki a karaktereket).
2. Válaszd ki a stílust.

- **Word:** Kezdőlap > Stílusok csoport, a stílusgaléria. A teljes ablak: Stílusok ablaktábla (Ctrl + Alt + Shift + S).
- **LibreOffice Writer:** a Bekezdésstílus mező az eszköztáron, vagy a Stílusok oldalsáv (F11), vagy Formátum > Stílusok.

Fontos, hogy a **címsorokhoz a Címsor stílusokat** használd, ne a kézzel nagyított betűket. Csak így tud a program tartalomjegyzéket készíteni (lásd a 8. leckét), és csak így jelenik meg a dokumentum szerkezete a Navigációs ablakban.

**Próbáld ki:** írj egy dokumentumot két fejezettel és két-két alfejezettel. A fejezetcímek kapják a Címsor 1, az alfejezetek a Címsor 2 stílust. Nyisd meg a Navigációs ablakot (Word: Nézet > Navigációs ablak; Writer: Nézet > Navigátor, F5), és nézd meg, hogy a címsorokból fa épül.

## Stílus módosítása (közép)

Egy stílus módosítása az összes ezzel a stílussal formázott szövegre hat.

- **Word:** kattints a jobb egérgombbal a stílusra a galériában > Módosítás. A megnyíló ablakban megadhatod a betűtípust, méretet, színt, a bekezdés igazítását, a sorközt. A "Formátum" gomb alatt további beállításokat találsz (Bekezdés, Tabulátorok, Szegély).
- **Writer:** a Stílusok oldalsávon jobb gomb a stílusra > Módosítás.

Módosítsd például a Címsor 1 stílust: 18 pont, félkövér, sötétkék, 12 pont térköz előtte és 6 pont utána. Minden fejezetcím egyszerre ilyen lesz.

Gyakori hiba: a stílusnak megfelelő szöveget kézzel átformázod (például a címet pirosra színezed). Ez a **közvetlen formázás**, amely felülírja a stílust, és később nem módosul a stílussal. Ha vissza akarod állítani a stílust, jelöld ki a szöveget, és alkalmazd újra a stílust, vagy használd a formázás törlését (Word: Ctrl + szóköz karakterformázásra; Ctrl + Q bekezdésformázásra).

## Új stílus létrehozása (emelt)

Ha a kész stílusok nem elegendők, saját stílust is készíthetsz, például "Megjegyzés" nevűt, amely dőlt, szürke hátterű és bekezdés körül szegélyes.

- **Word:** formázz meg egy bekezdést a kívánt módon, majd Stílusok galéria > Stílus létrehozása (vagy a Stílusok ablaktábla alján az Új stílus gomb). Add meg a nevét, a típusát (bekezdés, karakter, kapcsolt), az **alapját** (melyik stílusból származik) és a **következő bekezdés stílusát**.
- **Writer:** formázd meg a bekezdést, majd Stílusok oldalsáv > "Új stílus a kijelölésből" gomb; vagy jobb gomb > Új, és a párbeszédablakban beállítod a tulajdonságokat.

A stílus beállításaiban az alábbiakat érdemes tudni:

- **Alap (Word) / Alapja (Writer):** a stílus kiindulópontja. Az új stílus ennek tulajdonságait örökli, és csak azokat írja felül, amelyeket megváltoztattál.
- **Következő stílus:** az Enter után kezdődő bekezdés stílusa. Címsor után például a Szövegtörzs jön, így nem kell kézzel váltogatni.
- **Automatikus frissítés:** ha be van kapcsolva, a stílus magától módosul, amikor egy vele formázott szöveget átformázol. Véletlen módosítás ellen érdemes kikapcsolva hagyni.

## Stílushierarchia (emelt)

A stílusok **egymásból származnak**: az alapstílust módosítva a belőle származtatott stílusok is változnak, kivéve azt a tulajdonságot, amelyet a leszármazott maga felülírt.

Példa: legyen a "Normál" stílus betűtípusa Georgia, 11 pont. A "Megjegyzés" stílus alapja a Normál, ezért szintén Georgia, 11 pontos, de dőlt és szürke hátterű. Ha a Normál betűtípusát Cambriára cseréled, a Megjegyzés is Cambria lesz, de dőlt és szürke marad. Ha viszont a Megjegyzés stílusban kifejezetten Arialt adtál meg, az Arial marad.

Ebből következik a jó gyakorlat: az **általános tulajdonságokat** (betűtípus, alapméret, nyelv) az alapstílusban állítsd be, a **különleges** eltéréseket a leszármazottakban. A címsorok is hierarchikusak: a Címsor 1 > Címsor 2 > Címsor 3 szintek a tartalomjegyzék szintjeit is megadják.

## Gyakorold

1. **Címsor módosítása.** Módosítsd a Címsor 1 stílust 20 pontosra, félkövérre, sötétzöld színre. *Megoldás:* Word: jobb gomb a Címsor 1-en > Módosítás > betűméret 20, félkövér, szín sötétzöld > OK. Az összes Címsor 1-es bekezdés egyszerre átformálódik.
2. **Szövegtörzs egységesítése.** Egy dokumentumban a bekezdések különböző betűtípusúak, mert kézzel formáztad őket. Hogyan teszed egységessé? *Megoldás:* jelöld ki a teljes szöveget, alkalmazd a Normál (Szövegtörzs) stílust; ha kell, töröld a közvetlen formázást (Word: Ctrl + szóköz), majd a Normál stílus módosításával állítsd be a kívánt betűtípust.
3. **Új stílus (emelt).** Hozz létre "Figyelmeztetés" nevű bekezdésstílust: félkövér, piros betű, sárga háttér, keret, a következő stílusa Normál. *Megoldás:* formázz meg egy bekezdést, Stílus létrehozása, név: Figyelmeztetés; Módosítás > Következő bekezdés stílusa: Normál.
4. **Hierarchia (emelt).** A "Dőlt idézet" stílus alapja Normál. Mi történik vele, ha a Normál betűméretét 12 pontra állítod? *Megoldás:* a Dőlt idézet is 12 pontos lesz, ha a betűméretét nem írtuk felül benne; a dőlt jelleg megmarad.

## Gyakori hibák

- **Kézzel nagyított "címsor".** Nem épül belőle tartalomjegyzék, és nem szerkeszthető egyetlen módosítással.
- **Közvetlen formázás stílus fölött.** A stílus módosítása nem hat azokra a szövegrészekre, amelyeket kézzel felülformáztál.
- **Rossz címsorszint.** A Címsor 2 nem következhet közvetlenül a Címsor 4-re: a szinteket sorban használd.
- **Új stílus az alapok nélkül.** Ha nem választasz alapot, az új stílus nem követi a Normál módosításait.
- **Másik dokumentumból beillesztett szöveg.** Magával hozhatja a saját stílusát vagy formázását; beillesztés után ellenőrizd, melyik stílust kapta.

## Összefoglalás

- A stílus a formázás névvel ellátott csomagja: módosítva az összes alkalmazásánál egyszerre változik.
- Bekezdésstílus a bekezdésre, karakterstílus a kijelölt szövegre vonatkozik.
- Közép: stílus alkalmazása és módosítása (Word: Kezdőlap > Stílusok; Writer: F11).
- Emelt: új stílus létrehozása, alap és következő stílus beállítása, stílushierarchia (öröklődés).
- A címsorokhoz mindig Címsor stílust használj, ez a tartalomjegyzék alapja.
