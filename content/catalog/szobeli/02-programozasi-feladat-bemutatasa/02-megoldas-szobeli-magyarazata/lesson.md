---
slug: megoldas-szobeli-magyarazata
title: "A megoldás szóbeli magyarázata"
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Miért külön készség a magyarázat?

Egy program lehet hibátlan, ha nem tudod elmagyarázni, a bizottság nem látja, hogy érted. A B) rész 10 pontja a megoldás tartalmára jár, de a logikai felépítés, a szaknyelv és a kommunikáció pontjai a magyarázatból jönnek. Ez a lecke egy bevált, ötlépéses magyarázati sémát ad.

## Az ötlépéses séma

**1. A feladat saját szavakkal (15 mp).** "A feladat az volt, hogy ... " Ne olvasd fel a szöveget, foglald össze.

**2. Bemenet és kimenet.** Mit olvas be a program (honnan, milyen típusban), mit ír ki. Példa: "A program egész számokat olvas be nullával lezárva, és kiírja az átlagukat."

**3. A megoldás ötlete és a tétel neve.** Egy-két mondatban az alapgondolat. Példa: "Ez egy összegzés és megszámlálás: végigmegyek a számokon, minden elemet hozzáadok az összeghez, és közben számolom az elemeket."

**4. A lépések végigvezetése a kódon.** Ne sorról sorra olvasd, hanem blokkonként: inicializálás, ciklus, feltétel, kiírás. Mondd el, melyik változó mire való.

**5. Bemutatás tesztadaton.** Futtasd a programot mintaadattal, majd egy határesettel. Mondd ki előre, mit vársz, és vesd össze az eredménnyel.

## Programozási tétel megnevezése

A tételek neve segít a szaknyelvi pontoknál is. Röviden:

- **Összegzés**: elemek összeadása egy ciklussal.
- **Megszámlálás**: a feltételnek megfelelő elemek számolása.
- **Eldöntés**: van-e olyan elem, amelyre igaz a feltétel (a lineáris keresés rokona).
- **Keresés**: az első feltételnek megfelelő elem megtalálása.
- **Kiválasztás**: amikor biztosan van ilyen elem, és az indexét keressük.
- **Maximum- és minimumkiválasztás**: a legnagyobb vagy legkisebb elem (vagy indexe).
- **Szétválogatás, kiválogatás**: az elemek szétosztása feltétel szerint két vagy több listába.
- **Rendezés**: elemek sorrendbe állítása (például cserélő, beszúró vagy kiválasztó rendezés).

## A bonyolultság hétköznapi nyelven

Nem kell képletet mondanod, de érdemes érzékeltetni, **hogyan nő a munka az adatok számával**.

- Egy ciklus egyszer végigmegy az n elemen: "az idő arányosan nő az adatok számával" (lineáris).
- Két egymásba ágyazott ciklus: "ha az elemszám a tízszeresére nő, a lépések száma a százszorosára" (négyzetes), például a cserélő rendezés.
- Bináris keresés rendezett listában: "minden lépéssel felezem a keresési tartományt, ezért ezer elemhez is csak kb. tíz lépés kell" (logaritmikus).

Ha a bizottság rákérdez, elég a **következő mondat**: "A ciklus egyszer megy végig az elemeken, tehát a futásidő az elemek számával arányos."

## Példa magyarázat

Feladat: kiírni a lista legnagyobb elemét és a helyét.

```text
legnagyobb = lista[0]
hely = 0
ciklus i = 1-től a lista hossza - 1-ig:
    ha lista[i] > legnagyobb:
        legnagyobb = lista[i]
        hely = i
kiír legnagyobb, hely
```

Minta magyarázat: "Ez egy maximumkiválasztás. Feltételezem, hogy az első elem a legnagyobb, majd végigmegyek a többin, és ha nagyobbat találok, felülírom a legnagyobbat és a helyét. A ciklus egyszer fut végig, tehát az idő a lista hosszával arányos. Teszteltem három elemmel, ahol a legnagyobb a közepén van, azzal, ahol az első, és egyetlen elemű listával: az első elem egyedüli esetben önmagát adja. Üres lista esetén a program hibát adna, ezért ezt külön kezelni kell."

Figyeld meg: a magyarázat megnevezi a tételt, elmondja az ötletet, jelzi a bonyolultságot, teszteket említ és a határeseti hibát is felismeri.

## Tesztadatok kiválasztása

Három csoportból válassz:

- **Tipikus**: átlagos, "normális" adat.
- **Szélső**: egy elem, két azonos legnagyobb elem, minden elem azonos, negatív számok, nulla.
- **Hibás vagy váratlan**: üres lista, rossz típusú bevitel (ha a feladat kezeli).

Mondd ki: "Három teszteset: tipikus, szélső és hibás bemenet." Ez önmagában is mutatja a tudatosságot.

## Gyakori hibák

- **Sorról sorra felolvasás**: nem magyarázat, nem mutat megértést.
- A tétel neve nem hangzik el, vagy rossz: "ez egy rendezés", miközben maximumkiválasztás.
- Nem mondod ki előre a várt kimenetet, így a futtatás "csak úgy" történik.
- Mentegetőzés ("nem tudom, jó-e"). Inkább: "Itt egy hibalehetőséget látok: ...".
- Túl gyors beszéd, vagy a monitor felé fordulva, a bizottság felé nem.
- A szaknyelv pontatlan: "változó, amiben a dolog van" helyett "számláló", "összeg", "ciklusváltozó".

## Összefoglalás

- Öt lépés: feladat, bemenet-kimenet, ötlet és tétel, a kód végigvezetése, teszt.
- Nevezd meg a programozási tételt, és használj szaknyelvet.
- A bonyolultságot egy mondatban, köznyelven is el tudod mondani.
- Válassz tipikus, szélső és hibás tesztet, és mondd ki előre, mit vársz.
- Beszélj a bizottsághoz, ne a képernyőhöz.
