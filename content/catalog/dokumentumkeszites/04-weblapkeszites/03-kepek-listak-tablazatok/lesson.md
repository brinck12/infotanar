---
slug: kepek-listak-tablazatok
title: Képek, listák és táblázatok
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Nem csak szöveg

A weblap tartalmában a szöveg mellett képek, felsorolások és táblázatok is szerepelnek. A követelmény szerint tudnod kell a nem szöveges elemeket (képet) és a listák és táblázatok szerkezetét felépíteni, a címkék fontosabb jellemzőivel együtt. Ebben a leckében a `<img>`, a listák (`<ul>`, `<ol>`, `<li>`) és a táblázat (`<table>`, `<tr>`, `<th>`, `<td>`) elemeit tanulod meg, a cellaösszevonással együtt.

## Kép beszúrása

A képet az `<img>` elem helyezi el. Üres elem, tehát nincs záró címkéje, és az adatait attribútumok adják:

```html
<img src="kepek/balaton.jpg" alt="A Balaton naplementekor" width="400">
```

- `src` (source): a képfájl **elérési útja**, általában relatív (lásd az előző leckét).
- `alt` (alternatív szöveg): a kép **szöveges leírása**. Ha a kép nem tölt be, ez jelenik meg; a képernyőolvasó ezt olvassa fel; a keresők is ezt használják. **Kötelező megadni**, és legyen leíró.
- `width` és `height`: a kép szélessége és magassága pixelben. Elég az egyiket megadni, a másik az arányból adódik, így a kép nem torzul. (A méretezést később CSS-sel is megteheted.)
- `title`: a kép fölé vitt egér mellett megjelenő buboréknyi szöveg.

Megjelenés: a Balaton-kép 400 képpont szélesen jelenik meg a szöveg sorában. Ha a fájl nem található, a böngésző a kép helyén a "A Balaton naplementekor" szöveget mutatja.

Webes használatra a **JPG** (fotókhoz), a **PNG** (átlátszóságot igénylő, éles rajzokhoz) és a **GIF** formátum alkalmas. A képeket gyűjtsd egy `kepek` nevű mappába. Ne használj ékezetes, szóközös fájlnevet (`balaton_naplemente.jpg` jó, `Balaton naplemente.JPG` rossz).

Kép is lehet hivatkozás, ha az `<a>` elembe teszed:

```html
<a href="latnivalok.html"><img src="kepek/tihany.jpg" alt="Tihanyi apátság" width="200"></a>
```

## Felsorolás és számozott lista

Kétféle lista van:

- `<ul>` (unordered list): **számozatlan** (pontozott) lista.
- `<ol>` (ordered list): **számozott** lista.

Mindkettőben a **listaelemek** `<li>` elemek. A `<li>` csak lista (`<ul>` vagy `<ol>`) közvetlen gyereke lehet.

```html
<h2>Bevásárlólista</h2>
<ul>
  <li>kenyér</li>
  <li>tej</li>
  <li>alma</li>
</ul>

<h2>Palacsinta elkészítése</h2>
<ol>
  <li>Keverd el a lisztet a tejjel.</li>
  <li>Add hozzá a tojást.</li>
  <li>Süsd ki a masszát.</li>
</ol>
```

Megjelenés: az első lista elemei fekete pontokkal, a másodiké 1., 2., 3. számokkal indul, behúzva. A számozást az `<ol>` attribútumaival módosíthatod: `type="a"` betűs, `start="5"` az 5-től induló számozás.

Listák **egymásba ágyazhatók**: az alpont listája a szülő `<li>` elemen **belül** van.

```html
<ul>
  <li>Gyümölcsök
    <ul>
      <li>alma</li>
      <li>körte</li>
    </ul>
  </li>
  <li>Zöldségek</li>
</ul>
```

Az alpontok kisebb körrel, beljebb jelennek meg.

## Táblázat

A táblázat az adatok **sorokba és oszlopokba** rendezésére való. Elemei:

- `<table>`: a táblázat.
- `<tr>` (table row): egy sor.
- `<th>` (table header): fejléc cella (alapból félkövér, középre igazított).
- `<td>` (table data): adatcella.
- `<caption>`: a táblázat címe (a `<table>` első gyereke).

```html
<table border="1">
  <caption>Tavak mérete</caption>
  <tr>
    <th>Tó</th>
    <th>Terület (km²)</th>
  </tr>
  <tr>
    <td>Balaton</td>
    <td>592</td>
  </tr>
  <tr>
    <td>Velencei-tó</td>
    <td>26</td>
  </tr>
</table>
```

Megjelenés: egy két oszlopos, három soros rács; az első sor félkövér fejléc ("Tó" és "Terület (km²)"), alatta a két tó adatai. A `border="1"` csak egy gyors keretet ad a kipróbáláshoz; a táblázat kinézetét valójában a CSS-szel adjuk meg (a későbbi leckékben `border` tulajdonsággal).

Szabály: a táblázat **minden sorában ugyanannyi cella** legyen (az összevonásokat leszámítva). A táblázatot ne használd az oldal elrendezésére, csak valódi adatok rendezésére.

## Cellák összevonása

Egy cella több oszlopot vagy sort is elfoglalhat:

- `colspan="2"`: a cella **két oszlop** szélességű.
- `rowspan="2"`: a cella **két sor** magasságú.

```html
<table border="1">
  <tr>
    <th rowspan="2">Tantárgy</th>
    <th colspan="2">Jegyek</th>
  </tr>
  <tr>
    <th>Félév</th>
    <th>Év vége</th>
  </tr>
  <tr>
    <td>Matematika</td>
    <td>4</td>
    <td>5</td>
  </tr>
</table>
```

Megjelenés: a bal oldali "Tantárgy" cella két sor magas; a "Jegyek" cella két oszlop széles, alatta a "Félév" és "Év vége". A harmadik sor a tantárgy nevét és a két jegyet adja. A második sorba csak **két** cella kerül, mert a harmadik helyet a bal oldali `rowspan` már elfoglalja. Ez az összevonás leggyakoribb hibája: a sorok celláit mindig számold meg.

## Gyakorold

1. Szúrj be egy `kepek/macska.png` képet 300 képpont szélesen, megfelelő alternatív szöveggel.

   *Megoldás:*

   ```html
   <img src="kepek/macska.png" alt="Egy szürke macska az ablakpárkányon" width="300">
   ```

2. Készíts számozott listát a következő három lépéshez: "Nyisd meg a fájlt", "Szerkeszd", "Mentsd".

   *Megoldás:*

   ```html
   <ol>
     <li>Nyisd meg a fájlt</li>
     <li>Szerkeszd</li>
     <li>Mentsd</li>
   </ol>
   ```

3. Készíts táblázatot két oszloppal (Név, Kor), fejléccel és két sorral (Anna, 15; Béla, 16).

   *Megoldás:*

   ```html
   <table border="1">
     <tr><th>Név</th><th>Kor</th></tr>
     <tr><td>Anna</td><td>15</td></tr>
     <tr><td>Béla</td><td>16</td></tr>
   </table>
   ```

4. Egy táblázat első sorában egyetlen "Órarend" cím legyen két oszlop szélességben, alatta "Hétfő" és "Kedd" fejlécek. Hogyan?

   *Megoldás:*

   ```html
   <table border="1">
     <tr><th colspan="2">Órarend</th></tr>
     <tr><th>Hétfő</th><th>Kedd</th></tr>
   </table>
   ```

## Gyakori hibák

- **Hiányzó `alt`**: a kép elérhetetlen a képernyőolvasónak, és hibás betöltésnél üres marad.
- **Rossz `src` útvonal**, kis- és nagybetű eltérés vagy rossz mappa: a kép "törött" ikonnal jelenik meg.
- **Mindkét méret megadása** az aránytól eltérően, ezért a kép torzul.
- **`<li>` a listán kívül**, vagy az alpont listája a `<li>` mellett (nem benne).
- **Rossz cellaszám** egy sorban (főleg `colspan` / `rowspan` után), ezért a táblázat "szétesik".
- **`<td>` `<th>` helyett** a fejlécben, ezért a fejléc nincs jelölve.
- **Táblázat az oldal tördelésére** adatok helyett.
- **Képfájl más mappában marad**, mint amit a `src` megad: a webhely másik gépen nem működik.

## Összefoglalás

- A kép: `<img src="..." alt="...">`, üres elem; az `alt` kötelező, a `width` / `height` méretez.
- Lista: `<ul>` (pontozott), `<ol>` (számozott), elemei `<li>`; az alpont lista a `<li>`-n belül van.
- Táblázat: `<table>`, `<tr>`, `<th>` (fejléc), `<td>` (adat), `<caption>` (cím).
- Összevonás: `colspan` (oszlopok), `rowspan` (sorok); mindig ellenőrizd a sorok cellaszámát.
- A formázás (keret, szín) a CSS dolga; a HTML a szerkezetet adja.

**Érettségi szint:** a nem szöveges elemek, listák és táblázatok megadása **közép- és emelt szinten** egyaránt követelmény; emelten gyakoribb az összevont cellás, összetettebb táblázat és az egymásba ágyazott lista.
