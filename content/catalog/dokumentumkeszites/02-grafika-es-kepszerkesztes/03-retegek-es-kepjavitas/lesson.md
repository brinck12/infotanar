---
slug: retegek-es-kepjavitas
title: Rétegek és képjavítás
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mit tudsz kezdeni egy fényképpel?

A digitális fénykép ritkán tökéletes: sötét, ferde, a kép szélén zavaró tárgy van, vagy egy másik képből kell valamit beletenni. A követelmény szerint tudnod kell **képeket képfeldolgozó programmal megnyitni, módosítani, megadott formátumban menteni**, a kijelölt részt másolni, mozgatni, törölni, másik dokumentumba beilleszteni, emelt szinten pedig **rétegeket használni**. A lecke az eszközöket és a jellemző feladatokat veszi sorra. A programot te választod: Paint.NET, GIMP és Photoshop is ugyanezt tudja, a menük neve más.

## Kijelölés

Mielőtt a kép egy részét módosítod, **ki kell jelölnöd**. A kijelölés (szaggatott, "vonuló hangyák" keret) megmondja a programnak, hogy mire vonatkozik a következő művelet. Ami a kijelölésen kívül van, azt a művelet nem érinti.

Fő kijelölőeszközök:

- **Téglalap és ellipszis:** húzással; Shift lenyomásával négyzet, illetve kör lesz.
- **Szabadkézi (lasszó):** a rajzolt vonal határolja.
- **Varázspálca:** az egyszínű vagy hasonló színű területet jelöli ki egy kattintással. A **tűréshatár** (tolerancia) értéke mondja meg, mennyire eltérő színt is belevesz.
- **Kijelölés bővítése és csökkentése:** Shift (hozzáad) és Ctrl vagy Alt (elvesz) lenyomásával, vagy a mód ikonnal.
- **Mindent kijelöl** (Ctrl+A), **kijelölés megfordítása** (Ctrl+I): ha a hátteret könnyebb kijelölni, mint a tárgyat, jelöld ki a hátteret, majd fordítsd meg.

A kijelölt rész **másolható** (Ctrl+C), **kivágható** (Ctrl+X), **törölhető** (Delete) és **beilleszthető** (Ctrl+V), akár egy másik képbe is. Beillesztéskor a kép a középre kerül, és onnan mozgatható.

## A réteg fogalma

A **réteg** egy átlátszó fólia, amelyre rajzolhatsz. Több fóliát egymásra téve a nézőnek az összes együtt látszik, de te bármelyiket külön módosíthatod, mozgathatod, törölheted anélkül, hogy a többit megrontanád. A legalsó réteg gyakran a "Háttér" (az eredeti fénykép).

Műveletek a rétegekkel (a **Rétegek** panelen, a program ablakában):

- **Új réteg:** Réteg, Új réteg. Az új réteg átlátszó.
- **Láthatóság:** a szem ikonnal ki- és bekapcsolható.
- **Sorrend:** a lista tetején lévő réteg takarja a lentieket. Húzással vagy a nyilakkal helyezheted át.
- **Átlátszóság (átlátszatlanság, opacity):** a csúszkával 0% (teljesen átlátszó) és 100% (teljesen takaró) között.
- **Átnevezés, másolás, törlés, összefésülés** (két réteg eggyé), **lapítás** (az összes réteg egy síkba).
- **Rétegen belüli mozgatás:** a Mozgatás eszközzel az aktív réteg tartalma mozog, a többi nem.

Fontos: a műveletek mindig az **aktív** (kijelölt) rétegre hatnak. A leggyakoribb hiba az, hogy rossz rétegen dolgozol.

A rétegeket **csak a program saját formátuma** (XCF, PSD, PDN) őrzi meg. JPEG-be vagy PNG-be exportálva a kép lapított.

## Próbáld ki: kép beillesztése rétegre

1. Nyiss meg egy tájképet, és egy másik képről jelölj ki egy tárgyat (például egy madarat). Másold.
2. A tájkép dokumentumában használd a **Beillesztés új rétegként** parancsot (GIMP: Szerkesztés, Beillesztés mint, Új réteg; Paint.NET: Szerkesztés, Beillesztés új rétegbe).
3. Mozgasd a madarat a megfelelő helyre. Méretezd az arány megtartásával.
4. Csökkentsd a réteg átlátszatlanságát 60%-ra, majd állítsd vissza.
5. Exportáld PNG-be, a rétegekkel pedig mentsd a saját formátumban.

## Átalakítások

A képen vagy a kijelölésen végezhető alapműveletek:

- **Vágás (kivágás, crop):** a kép szélét levágja, és csak a kijelölt rész marad. A kép méretét változtatja.
- **Forgatás és tükrözés:** 90°-os, 180°-os forgatás, vízszintes vagy függőleges tükrözés. A ferdén fényképezett horizont kiegyenesítéséhez szabad szögű forgatás kell.
- **Méretezés:** lásd az előző leckét, az arányt tartsd meg.
- **Átméretezett kijelölés:** a kijelölt tartalom méretezése, forgatása a Transzformálás eszközzel.

## Képjavítás

A javítás a kép színeit és élességét módosítja. A leggyakoribb eszközök:

- **Fényerő és kontraszt:** a fényerő a kép világosságát emeli vagy csökkenti, a kontraszt a világos és sötét tartomány közti különbséget. Túl sok kontraszt kiégeti a részleteket.
- **Színtónus, telítettség (HSV/HSL):** a telítettség a színek élénkségét változtatja; 0-n a kép szürke lesz.
- **Színegyensúly:** ha a kép sárgás vagy kékes, a színcsatornák eltolásával kijavítható.
- **Szintek és görbék:** haladóbb eszközök a világos, sötét és középtónusok szabályozására.
- **Élesítés és elmosás:** az élesítés a kontúrokat hangsúlyozza, az elmosás (Gauss) lágyítja, például a háttér kiemelés nélkül.
- **Vörösszem-hatás eltávolítása**, **retusálás** (klónozó bélyegző, javítóecset: egy hibás részt a kép egy másik részéről másolt képponttal takar el).
- **Fekete-fehér, szépia, negatív:** gyors színhatások.

Mindig **az eredeti másolatán** dolgozz, vagy használd a Visszavonás (Ctrl+Z) lehetőséget. A beállítások a kijelölésen belülre is korlátozhatók: ha csak az eget kell világosítani, jelöld ki az eget.

## Szöveg a képen

A képre feliratot is tehetsz a **Szöveg** eszközzel. A szöveg külön rétegre kerül, tehát utólag módosítható (betű, méret, szín). Lapításkor képponttá válik, onnantól nem szerkeszthető. Ezért a szöveget a végén lapíts, vagy exportálás előtt ellenőrizd.

## Gyakorold

1. A fénykép sötét. Mi a javítás első lépése?

   *Megoldás:* Fényerő növelése (esetleg a kontraszt finomítása), a Szintek vagy Görbék használata.

2. A kép bal oldalán egy zavaró lámpaoszlop van. Hogyan tüntetnéd el?

   *Megoldás:* Vágással, ha a szélen van; egyébként klónozó bélyegzővel vagy javítóecsettel.

3. Feladat: "Illeszd be a második kép kijelölt részét az első képre úgy, hogy a második kép később külön mozgatható legyen, majd mentsd PNG-ként." Milyen lépések kellenek?

   *Megoldás:* Kijelölés és másolás, beillesztés új rétegként, elhelyezés és méretezés, exportálás PNG-be (lapítva). A rétegekkel a saját formátumot használd, ha a feladat kéri.

4. Mi a különbség az összefésülés és a lapítás között?

   *Megoldás:* Az összefésülés két réteget egyesít, a lapítás az összes réteget egyetlen háttérrétegre.

## Gyakori hibák

- **Rossz réteg az aktív:** a módosítás nem az látszik, amelyiket szerettél volna.
- **Kijelölés nélküli módosítás:** az egész képre hat, nem csak a kívánt részre.
- **Elrejtett réteg:** a láthatóság ki van kapcsolva, ezért az "eltűnt" a beillesztett kép.
- **Lapított szöveg:** a feliratot már nem lehet átírni. Mentsd előtte a rétegekkel.
- **Túl nagy kontraszt vagy élesítés,** amitől a kép műnek hat.
- **A másolatra dolgozás elmaradása:** az eredeti fényképet felülírod.
- **Kép nyújtása:** az arány megtartásához Shiftet nyomj vagy zárd le a láncot.

## Összefoglalás

- Kijelölés nélkül a művelet az egész rétegre hat; a kijelölés másolható, mozgatható, törölhető, beilleszthető.
- A réteg átlátszó fólia: külön szerkeszthető, sorrendje, láthatósága és átlátszatlansága állítható.
- A rétegeket csak a program saját formátuma őrzi, az exportálás lapít.
- Alapműveletek: vágás, forgatás, tükrözés, méretezés.
- Képjavítás: fényerő, kontraszt, telítettség, színegyensúly, élesítés, retusálás.

**Érettségi szint:** a kép megnyitása, kijelölés, másolás, beillesztés, alapjavítások **középszinten** szükségesek. A **rétegek használata emelt szintű** követelmény.
