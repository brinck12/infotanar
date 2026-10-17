---
slug: szoveges-elemek-es-hivatkozasok
title: Szöveges elemek és hivatkozások
position: 1
free: false
published: false
reviewed_by:
reviewed_at:
---

## Szöveg kiemelése, sortörés, vonal

Az előző leckében megtanultad a cím és a bekezdés elemet. Most a szövegen belüli jelöléseket és a hivatkozásokat vesszük sorra. A **hivatkozás** (link) a web lényege: egy kattintással másik oldalra vagy az oldal egy másik részére jutunk. Az érettségi követelménye, hogy külső, webhelyen belüli és oldalon belüli hivatkozást is létre tudj hozni, és értsd az **abszolút** és **relatív** hivatkozás különbségét.

## Kiemelések

A szövegen belüli elemek a bekezdés egy részét jelölik meg:

| Elem | Jelentése | Alap megjelenés |
|---|---|---|
| `<strong>` | fontos szöveg | félkövér |
| `<em>` | hangsúlyos szöveg | dőlt |
| `<b>` | félkövér, jelentés nélkül | félkövér |
| `<i>` | dőlt, jelentés nélkül | dőlt |
| `<u>` | aláhúzott | aláhúzott |
| `<mark>` | kiemelt (kiemelőtollal) | sárga háttér |
| `<sup>` / `<sub>` | felső / alsó index | kisebb, feljebb / lejjebb |
| `<small>` | kisebb betűméret | kisebb |

A `<strong>` és `<em>` a szöveg **jelentését** adja meg (a képernyőolvasó is hangsúlyozza), ezért szövegfontosság jelzésére ezeket használd. A `<b>` és `<i>` csak a kinézetről szól.

```html
<p>A víz képlete H<sub>2</sub>O, a négyzet területe a<sup>2</sup>.
A <strong>figyelmeztetést</strong> mindenki <em>figyelmesen</em> olvassa el!</p>
```

Megjelenés: "A víz képlete H₂O, a négyzet területe a²." Majd a "figyelmeztetést" félkövéren, a "figyelmesen" dőlten.

## Sortörés és vízszintes vonal

A `<br>` új sort kezd a bekezdésen belül, üres elem, nincs záró címkéje. Versnél, címnél használd, ahol a sortörés a tartalom része.

```html
<p>Kossuth Lajos utca 5.<br>
Szeged<br>
6720</p>
```

A `<hr>` vízszintes vonalat húz, a témaváltást jelöli. Szintén üres elem.

```html
<p>Az első rész vége.</p>
<hr>
<p>A második rész kezdete.</p>
```

Ne használj sok `<br>`-t térköz létrehozására (`<br><br><br>`). A térközt a CSS adja majd meg. A `<br>` csak valódi sortörésre való.

## Hivatkozás: az `<a>` elem

A hivatkozás az `<a>` (anchor, "horgony") elem, a cél a `href` attribútumban van, a kattintható szöveg az elem tartalma:

```html
<a href="https://www.oktatas.hu">Oktatási Hivatal</a>
```

Megjelenés: az "Oktatási Hivatal" szöveg kék színű és aláhúzott, kattintásra a megadott oldalra visz. Látogatás után a szín lila lesz.

A célt szokták új lapon megnyitni, ezt a `target="_blank"` attribútummal kéred:

```html
<a href="https://www.oktatas.hu" target="_blank">Oktatási Hivatal (új lapon)</a>
```

A hivatkozás tartalma lehet szöveg és kép is (a képről a következő leckében). A hivatkozás szövege legyen **beszédes**: "Letöltés" helyett "A 2024-es követelmény letöltése", ne "kattints ide".

## Hivatkozástípusok

Három fajta hivatkozást különböztetünk meg.

### 1. Külső hivatkozás

Másik **webhely** oldalára mutat, ezért a teljes webcímet (`https://...`) tartalmazza.

```html
<a href="https://hu.wikipedia.org/wiki/Balaton">A Balaton a Wikipédián</a>
```

### 2. Webhelyen belüli hivatkozás

Ugyanazon a webhelyen belüli **másik oldalra** mutat. Itt a fájl nevét vagy útvonalát adod meg:

```html
<a href="latnivalok.html">Látnivalók</a>
```

### 3. Oldalon belüli hivatkozás

Ugyanazon az **oldalon** egy másik pontra ugrik. Két lépésből áll: a célelemnek kell egy egyedi azonosító (`id`), a hivatkozás pedig `#` jellel és az azonosítóval hivatkozik rá.

```html
<p><a href="#szallas">Ugrás a szálláshoz</a></p>

<h2 id="latnivalok">Látnivalók</h2>
<p>Tihanyi apátság...</p>

<h2 id="szallas">Szállás</h2>
<p>Panziók és kempingek...</p>
```

Megjelenés: a "Ugrás a szálláshoz" szövegre kattintva az oldal a "Szállás" címhez görget. Az `id` értéke **egyedi** az oldalon, nem tartalmaz szóközt, és nem kezdődik számmal (javasolt: kisbetűs, ékezet nélküli név).

Egy "Vissza a tetejére" hivatkozás is így készül: a `<body>` elejére vagy a fejlécre teszel `id`-t, és a lap alján oda hivatkozol: `<a href="#fent">Vissza a tetejére</a>`.

## Abszolút és relatív hivatkozás

Ez az érettségi egyik gyakori kérdése.

- **Abszolút** hivatkozás: a **teljes** címet megadja, a protokollal és a gépnévvel együtt. Mindig ugyanoda mutat, függetlenül attól, hol van a hivatkozást tartalmazó fájl. Példa: `https://www.pelda.hu/kepek/balaton.jpg`.
- **Relatív** hivatkozás: a hivatkozást tartalmazó fájl **helyéhez képest** adja meg a célt. Rövidebb, és a webhely akkor is működik, ha áthelyezed másik gépre vagy mappába. Példák:
  - `latnivalok.html`: ugyanabban a mappában lévő fájl.
  - `kepek/balaton.jpg`: egy mappával lejjebb, a `kepek` almappában.
  - `../index.html`: egy mappával feljebb (`..` jelentése: a szülőmappa).

Külső oldalra mindig abszolút hivatkozás kell. A saját webhelyed fájljaira **relatív** hivatkozást használj, mert ha a webhelyet átmásolod (például a tárhelyre), a hivatkozások nem törnek el. Ha a saját oldaladra abszolút, `C:\Users\...` típusú helyi útvonalat írsz, az csak a te gépeden működik.

## Gyakorold

1. Készíts hivatkozást, amely a `https://www.nemzetipark.gov.hu` oldalra mutat, új lapon nyílik meg, és a szövege "Nemzeti parkok".

   *Megoldás:*

   ```html
   <a href="https://www.nemzetipark.gov.hu" target="_blank">Nemzeti parkok</a>
   ```

2. Az `index.html` és a `kapcsolat.html` fájl ugyanabban a mappában van. Írd meg az `index.html`-be a hivatkozást a kapcsolat oldalra.

   *Megoldás:*

   ```html
   <a href="kapcsolat.html">Kapcsolat</a>
   ```

3. Egy hosszú oldalon legyen a tetején egy tartalomjegyzék a "Történet" és "Térkép" szakaszokhoz. Hogyan csinálod?

   *Megoldás:*

   ```html
   <p><a href="#tortenet">Történet</a> | <a href="#terkep">Térkép</a></p>
   <h2 id="tortenet">Történet</h2>
   <p>...</p>
   <h2 id="terkep">Térkép</h2>
   <p>...</p>
   ```

4. Melyik abszolút, melyik relatív: `https://pelda.hu/a.html`, `a.html`, `../a.html`?

   *Megoldás:* Az első abszolút; a második és a harmadik relatív (az utóbbi a szülőmappára mutat).

## Gyakori hibák

- **Hiányzó `https://`** külső hivatkozásnál: `href="www.oktatas.hu"` relatív címnek számít, és hibás oldalra visz.
- **Kis- és nagybetű** eltérés a fájlnévben (`Kapcsolat.html` vs. `kapcsolat.html`): a webszervereken ez számít.
- **A `#` jel hiánya** az oldalon belüli hivatkozásnál, vagy az `id` és a hivatkozás neve nem egyezik.
- **Ugyanaz az `id` kétszer** egy oldalon.
- **Helyi útvonal** (`C:\...` vagy `file:///`) a webhelyen belüli hivatkozásnál.
- **`<br>` sorozat** térköz helyett.
- **Nem beszédes hivatkozásszöveg**: "kattints ide".
- **`<a>` záró címke hiánya**: az egész utána lévő szöveg kattinthatóvá válik.

## Összefoglalás

- Kiemelés: `<strong>` (fontos), `<em>` (hangsúlyos), `<mark>`, `<sub>`, `<sup>`; sortörés `<br>`, vonal `<hr>` (üres elemek).
- A hivatkozás az `<a href="cél">szöveg</a>`; `target="_blank"` új lapon nyitja meg.
- Három fajta: külső (teljes webcím), webhelyen belüli (fájl vagy útvonal), oldalon belüli (`#azonosító`, a célon `id`).
- Abszolút: teljes cím; relatív: az aktuális fájlhoz képest (`kepek/a.jpg`, `../index.html`).
- A saját webhely fájljaira relatív, külső oldalakra abszolút hivatkozást használj.

**Érettségi szint:** a külső, webhelyen belüli és oldalon belüli hivatkozás, valamint az abszolút és relatív hivatkozás megkülönböztetése **közép- és emelt szinten** is követelmény; emelt szinten gyakran egyszerre, egy összetettebb webhelyen kell alkalmazni őket.
