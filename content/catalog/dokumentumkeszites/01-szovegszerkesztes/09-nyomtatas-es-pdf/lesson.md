---
slug: nyomtatas-es-pdf
title: "Nyomtatás, PDF, keresés és nyelvi eszközök"
position: 8
free: false
published: false
reviewed_by:
reviewed_at:
---

A dokumentum elkészülte után két dolog marad: ellenőrizni, hogy hibátlan-e, és előállítani a végleges formát, papíron vagy PDF-fájlban. Ebben a leckében a keresés és csere, a nyelvi ellenőrző eszközök, az elválasztás, a nyomtatásra előkészítés és a PDF-export a téma.

**Érettségi szint:** közép. Ezek az eszközök (keresés és csere, nyelvi segédeszközök, elválasztás, nyomtatás, fájlba nyomtatás) a középszintű követelmények része.

## Keresés és csere

A keresés megtalálja egy szó vagy kifejezés minden előfordulását, a csere pedig ki is cseréli.

- **Word:** Ctrl + F a Navigációs panelhez, Ctrl + H a Csere ablakhoz (Kezdőlap > Szerkesztés > Csere).
- **LibreOffice Writer:** Ctrl + F a keresősávhoz, Ctrl + H a Keresés és csere ablakhoz.

A párbeszédablak "Továbbiak" (Word) vagy "Egyéb beállítások" (Writer) részében hasznos beállítások:

- **Kis- és nagybetűk megkülönböztetése:** a "tavasz" és "Tavasz" külön találat.
- **Csak teljes szavak:** a "kor" keresésnél nem találja meg a "korán" szót.
- **Formázás keresése és cseréje:** például minden félkövér szöveget lecserélhetsz dőltre. Word: Formátum gomb; Writer: "Attribútumok" és "Formátum" gombok (az utóbbi a bekezdésstílusokat).
- **Speciális jelek:** Wordben a Speciális gomb alatt bekezdésjel (^p), tabulátor (^t) található; Writerben a reguláris kifejezések (például `$` a bekezdés végén) engedélyezhetők.

**Példa:** a szövegben "tavaszi" szó helyett "őszi" szerepeljen mindenhol: Keresett szöveg: tavaszi, Csere erre: őszi, Az összes cseréje. A program kiírja, hány cserét végzett.

**Hasznos trükk:** dupla szóközök eltüntetése: Keresett: két szóköz, Csere erre: egy szóköz, ismételd, amíg nem talál többet.

## Helyesírás-ellenőrzés és nyelvi eszközök

A program a nem ismert szavakat **piros hullámos** aláhúzással, a nyelvtani gyanús helyeket **kék vagy zöld** aláhúzással jelzi. Jobb gombbal a javaslatok közül választhatsz, vagy a szót felvetheted a szótárba (a "Hozzáadás a szótárhoz"), illetve elnémíthatod ("Mindet kihagyja").

- **Word:** Korrektúra > Nyelvi ellenőrzés (F7). A nyelv beállítása: Korrektúra > Nyelv > Nyelvi ellenőrzés nyelvének beállítása.
- **Writer:** Eszközök > Helyesírás-ellenőrzés (F7). A nyelv: Eszközök > Nyelv.

Fontos, hogy a szöveg **nyelve** megfelelő legyen: ha a szöveg angol, magyarra állított ellenőrzés mindent hibásnak jelöl. A nyelvet a kijelölt szövegre külön állíthatod (Word: alsó állapotsorban a nyelv gombon; Writer: Eszközök > Nyelv > Kijelölés).

Egyéb nyelvi segédeszközök:

- **Szinonimaszótár:** Word: Korrektúra > Szinonimaszótár (Shift + F7); Writer: Eszközök > Nyelv > Szinonimaszótár (Ctrl + F7).
- **Szószámlálás:** Word: Korrektúra > Szószámlálás, vagy az állapotsor; Writer: Eszközök > Szószámlálás. A karakterek, szavak, bekezdések és oldalak számát adja meg.
- **Automatikus javítás:** a gyakori elütéseket javítja ("hogyha" stb.), a beállítást itt találod: Word: Fájl > Beállítások > Nyelvi ellenőrzés > Automatikus javítás beállításai; Writer: Eszközök > Automatikus javítás beállításai.

A nyelvi ellenőrzés nem tévedhetetlen: egy létező, de rossz szó ("kérem" helyett "kérek") nem hullámos. A végső szöveget mindig olvasd át.

## Elválasztás

Az elválasztás a sor végén lévő szavakat szótagolva két sorra bontja, így a szöveg szebben tördelődik, különösen sorkizárt és keskeny hasábos szövegnél. Magyar szövegnél a program a magyar elválasztási szabályokat használja, ha a nyelv megfelelően be van állítva.

- **Word:** Elrendezés > Oldalbeállítás > Elválasztás > Automatikus (vagy Kézi, ahol minden szónál te döntesz; vagy Elválasztási beállítások, ahol megadhatod a szomszédos elválasztott sorok maximális számát).
- **Writer:** Eszközök > Nyelv > Elválasztás (automatikus elválasztás) vagy bekezdéstulajdonságoknál Szövegfolyam fül > Automatikus elválasztás.

A **feltételes kötőjel** (Word: Ctrl + kötőjel; Writer: Ctrl + kötőjel) csak akkor látszik, ha a szó sorvégen áll. Egyes szavakat nem szabad elválasztani; az ilyen szóközt **nem törő szóköz** (Ctrl + Shift + szóköz) vagy **nem törő kötőjel** tartja egyben.

## Nyomtatásra előkészítés

Mielőtt nyomtatsz, nézd meg, hogyan fog kinézni a lap.

- **Word:** Fájl > Nyomtatás: jobbra a nyomtatási kép látható.
- **Writer:** Fájl > Nyomtatási kép, vagy Fájl > Nyomtatás.

Ellenőrizd:

1. **Lapméret és tájolás**, a margók beleférnek-e a nyomtató nyomtatható területébe.
2. **Oldaltörések:** nem maradt-e a cím az oldal alján, nem szakadt-e szét egy táblázat.
3. **Élőfej, élőláb, oldalszámok**.
4. **Nyomtatási beállítások:** a nyomtató, a példányszám, a nyomtatandó oldalak (például "1-3, 5" vagy "csak a páros oldalak"), az egy lapra nyomtatott oldalak száma, az egy- vagy kétoldalas nyomtatás, a színes vagy fekete-fehér.
5. A **háttérszínek és -képek** nyomtatódnak-e (lásd az oldalbeállításról szóló leckét).

## PDF-fájl készítése

A PDF olyan rögzített elrendezésű fájl, amely minden gépen ugyanúgy jelenik meg. Hivatalos dokumentumok beadására és megosztására ez a leggyakoribb forma.

- **Word:** Fájl > Mentés másként > Fájltípus: PDF; vagy Fájl > Exportálás > PDF/XPS létrehozása. A Beállítások gombbal megadható az oldaltartomány, a könyvjelzők létrehozása a címsorokból, az "Optimalizálás" (szabványos nyomtatáshoz vagy minimális méretre).
- **Writer:** Fájl > Exportálás PDF-ként. Az ablakban az Általános fülön az oldaltartomány, a képtömörítés, a **könyvjelzők exportálása** (a címsorokból), a Kezdeti nézet és a Biztonság fül (jelszavas védelem).

A "Nyomtatás PDF-be" is használható: ha a nyomtatók között van "Microsoft Print to PDF", a nyomtatás parancs fájlt hoz létre. Az exportálás viszont több lehetőséget ad (könyvjelzők, hivatkozások megőrzése).

Vizsgán a PDF-et megadott névvel és helyre kell elmenteni, ezért a fájlnevet gondosan add meg, és nyisd meg a kész fájlt, hogy ellenőrizd az oldalszámot és a tartalmat.

## Gyakorold

1. **Csere.** Egy szövegben a "Budapesten" szót kell "Szegeden"-re cserélni, de csak ott, ahol kis b-vel kezdődik? Hogyan teszed? *Megoldás:* Csere ablak, "Kis- és nagybetűk megkülönböztetése" bekapcsolva; keresett: Budapesten (a nagybetűs változat nem érintett, mert a kis-nagybetű számít); csere: Szegeden. Győződj meg arról, hogy a "Csak teljes szavak" is be van kapcsolva.
2. **Nyelv.** A magyar szövegben egy angol idézet minden szava piros hullámos. Mit teszel? *Megoldás:* jelöld ki az idézetet, és állítsd a nyelvét angolra; ekkor az ellenőrző angolul vizsgálja.
3. **Részleges nyomtatás.** A 8 oldalas dokumentumból az 1. és 4–6. oldalt kell kinyomtatni. *Megoldás:* Nyomtatás > Oldalak: 1,4-6.
4. **PDF könyvjelzőkkel.** Készíts PDF-et, amelyben a címsorokból könyvjelzők lesznek. *Megoldás:* Word: Mentés másként > PDF > Beállítások > "Könyvjelzők létrehozása címsorokból"; Writer: Exportálás PDF-ként > "Vázlat exportálása könyvjelzőként".

## Gyakori hibák

- **Rossz nyelvbeállítás.** A magyar szöveg angolra állított ellenőrzése sok hamis hibát jelez.
- **Az összes cseréje átgondolás nélkül.** A csere más szavakba is belenyúlhat (például a "kor" a "korán"-ban); használd a "Csak teljes szavak" opciót és ellenőrizd.
- **Kézi sortörés elválasztás helyett.** A sor végén Enterrel vagy kötőjellel tört szó a későbbi módosításnál rossz helyre kerül; használj automatikus elválasztást.
- **PDF ellenőrzés nélkül.** Nyisd meg az exportált fájlt, hogy minden oldal, hivatkozás és kép megjelenjen.
- **Elfelejtett nyomtatási kép.** Egy hibás oldaltörés csak itt látszik.

## Összefoglalás

- Keresés: Ctrl + F, csere: Ctrl + H; kis-nagybetű és csak teljes szó beállítható, formázás is cserélhető.
- A nyelvi ellenőrzés a szöveg nyelvétől függ; a piros hullám helyesírást, a kék/zöld nyelvtant jelez; szinonimaszótár és szószámlálás is van.
- Az elválasztás automatikusan vagy kézzel kapcsolható be; a feltételes kötőjel csak sorvégen látszik.
- Nyomtatás előtt a nyomtatási kép ellenőrzése: méret, tájolás, oldaltörés, élőfej, oldalszám.
- PDF: Word Mentés másként vagy Exportálás, Writer Exportálás PDF-ként; könyvjelzők a címsorokból.
- Érettségi szint: közép.
