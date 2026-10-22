# Heti ritmus és kedves emlékeztető: terv

Állapot: **jóváhagyásra vár** (2026-10-22). Ami a felhasználó szava, azt jelölöm; minden más **az én döntésem** (jelölve: *[döntésem]*), a felhasználó felülbírálhatja.

## Miért

A diákok tanulása szezonális és határidős (egy vizsgaidőpont), a felhasználók többsége tizenéves. A Duolingo-féle napi „széria” erős megtartó eszköz, de a megszakadt hosszú széria szégyent és lemorzsolódást okoz (Yu-kai Chou elemzése), és a hozzá tartozó emlékeztetők a lemaradóra nyomást tesznek. **A felhasználó kifejezetten kérte: legyünk kedvesek, ne tegyünk rájuk több stresszt.** Ezért nem széria, hanem heti ritmus: látják, mikor tanultak, ha akarnak, hetente kapnak egy összefoglalót. Elveszíteni nincs mit.

## Célok

- A diák egy pillantással látja, mely napokon tanult ezen a héten, és ez jó érzést ad.
- Opcionális, hetente egyszer érkező, ünneplő hangú e-mail összefoglaló.
- A funkció soha nem szidja, nem fenyegeti és nem nógatja a diákot.

## Nem célok és anti-célok (mitől lenne kudarc, még ha működik is)

- **Nincs napi széria, nincs futó szám** (a felhasználó döntése: „csak a heti ritmussáv, szám nélkül”). Nincs nullázódó számláló, nincs „megszakadt” képernyő.
- Nincs „veszíthetsz” vagy „lemaradtál” szöveg, bűntudatkeltő hangnem, eszkalálódó emlékeztető.
- Nincs ranglista, nincs fizetős vagy játékpénzes „fagyasztás”, nincs push értesítés.
- Anti-cél: ha egy diák kevesebbet tanul egy héten, ettől rosszabbul érezze magát. Az üres hét üres marad, semmit nem mondunk róla.

## Amit a diák lát

**Heti ritmussáv** *[döntésem a részletekre]*: hét kis jel (hétfőtől vasárnapig, magyar idő szerint) az aktuális hétre; azokon a napokon kitöltött, amelyeken tanult. Szám nincs. Ahol a diák megadta a heti óraszámát az onboardingban (`1-2`, `3-4`, `5+`), a sáv egy halk célt is jelöl (2, 3, illetve 4 aktív nap), és a cél elérésekor egy rövid, ünneplő mondat jelenik meg („Megvan a heti ritmusod”). A cél el nem érésekor semmi nem jelenik meg. Cél nélkül (nincs megadott óraszám) csak a sáv látszik.

- **Mi számít tanulási napnak** *[döntésem]*: egy lecke teljesítése vagy egy feladat beadása (`lesson_completions.completed_at`, `submissions.created_at`) az adott magyar naptári napon. Gyakorló vizsgaprobálkozás nem számít bele a v1-ben.
- **Hol látszik** *[döntésem]*: a haladás oldalon (`/haladas`) és a tanulási út tetején, egy kis kártyán. Nem modal, nem banner.
- **Adatforrás:** csak a már meglévő táblák; új tábla az aktivitáshoz nem kell. A fiók törlésekor a teljesítések törlődnek, a beadások leválnak a felhasználóról, tehát a sáv nem őriz többet a fiók megszűnése után.

## Az e-mail összefoglaló

- **Alapból kikapcsolt, kérésre bekapcsolható** *[döntésem]*: a fiók oldalon egy „Értesítések” rész kapcsolóval, és a ritmuskártyán egyszer, szerényen felkínálva („Kérsz hetente egy rövid összefoglalót e-mailben?”). Nincs előre bepipálva.
- **Mikor és mit** *[döntésem]*: vasárnap 17:00-kor (Europe/Budapest), csak ha a héten volt tanulási nap és az e-mail-cím megerősített. A tartalom: hány napon tanult, mit fejezett be (leckék, feladatok), egy link a folytatáshoz. **Aki egy héten nem tanult, nem kap levelet**: nincs mit ünnepelni, és így a lemaradó automatikusan *kevesebb* levelet kap, nem többet. Külön „figyelmeztető” vagy „hiányzol” levél nincs.
- **Korlát:** legfeljebb egy levél hetente, soha nem több. Nincs olvasásmérés (nincs követőpixel).
- **Leiratkozás** *[döntésem]*: minden levélben egyetlen kattintásos leiratkozás (aláírt link, megerősítő gombbal egy oldalon, hogy a levélszűrők ne iratkoztassák le véletlenül), plusz a `List-Unsubscribe` fejléc. A fiók oldalon bármikor kikapcsolható.
- **Hozzájárulás** *[döntésem, a builder véglegesítse a jogásszal]*: a bekapcsolás hozzájárulásként rögzül (`RecordConsent`, új `ConsentType`), mert a levél nem szükséges a szolgáltatáshoz. A `docs/privacy/ropa.md` és az adatkezelési tájékoztató frissítése szükséges.

## Kényszerek

- Előfeltétel az e-mailhez: valódi levelezés és domain (jelenleg nincs). A ritmussáv ettől független, azonnal használható.
- Magyar szöveg, `lang/hu/*.php`, `shared/ui` komponensek és tokenek, Larastan `max`, `docs:endpoints`, új migráció (meglévőt nem szerkesztünk), a repo meglévő rétegzése (Action, Resource, FormRequest, ütemezett Job a `routes/console.php`-ban, mint a `SendRenewalReminders`).
- A fiók törlésekor a kapcsoló és a küldési időbélyeg is törlődik.
- A tesztet a felhasználó írja (állandó megállapodás); a builder megmondja, mely viselkedéseket kell lefedni.

## A builderre hagyott részletek

- Pontos adatmodell az e-mail beállításhoz (új oszlopok a `users` táblán vagy külön tábla), az aktivitás-lekérdezés alakja és indexei, a végpont neve és formája (`GET /progress/activity`-szerű).
- A sáv vizuális kidolgozása a tokenekkel, a „megvan a ritmusod” szöveg pontos magyarítása.
- A hét határa és az időzóna-kezelés tesztelhető megvalósítása.

## Későbbre halasztva

- Választható tanulási napokra szóló, szelíd e-mail emlékeztető (csak bekapcsolva, ugyanazokkal a korlátokkal).
- A vizsgáig hátralévő idő említése az összefoglalóban, ha segít.
- Előző hetek áttekintése, push értesítés (PWA után).

## Források

Duolingo streak-tervezés: Lenny's Newsletter interjú; nogood.io esettanulmány; a streak szorongás és a „recovery” ötletek: Yu-kai Chou elemzései. A bizonyíték nagyrészt másodlagos; a heti célok előnyéről szóló állítás egy appgyártó marketingje, nem vettem alapul.
