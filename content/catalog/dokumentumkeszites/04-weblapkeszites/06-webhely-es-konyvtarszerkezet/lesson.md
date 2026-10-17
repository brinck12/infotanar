---
slug: webhely-es-konyvtarszerkezet
title: Webhely és könyvtárszerkezet
position: 5
free: false
published: false
reviewed_by:
reviewed_at:
---

## Több fájl, egy webhely

Egy **webhely** (website) nem egyetlen fájl: több HTML-oldal, egy vagy több stíluslap, képek tartoznak hozzá, és mindezek hivatkoznak egymásra. Az érettségin a követelmény szerint a webhely fájljait **célszerűen kialakított mapparendszerbe** kell szervezned, és a különböző állományok kapcsolatát (hivatkozások, kép, stíluslap) helyesen kell megadnod. Ebben a leckében a korábbi tudást egy teljes mini webhelyben foglaljuk össze, lépésről lépésre.

## A könyvtárszerkezet

A jó szerkezet átlátható: a HTML-oldalok a gyökérmappában, a többi fájltípus saját almappában.

```text
balaton/
  index.html
  latnivalok.html
  stilus/
    stilus.css
  kepek/
    balaton.jpg
    tihany.jpg
```

Szabályok:

- Egy fő mappa (`balaton`) tartalmaz mindent; ezt másolod át a tárhelyre.
- A kezdőlap neve `index.html`: a webszerver ezt adja vissza, ha csak a mappa címét kéri a látogató.
- A fájl- és mappanevek **kisbetűsek**, **ékezet nélküliek**, **szóköz nélküliek** (használj `_` vagy `-` jelet). A webszervereken a kis- és nagybetű számít.
- A képek, stíluslapok külön mappában vannak.
- A fájlok kiterjesztése hozzájuk illő: `.html`, `.css`, `.jpg`, `.png`.

## A feladat

Gyakorlásképp készíts el egy két oldalas Balaton-webhelyet. A követelmények:

1. Két oldal: `index.html` (kezdőlap) és `latnivalok.html`.
2. Az oldalak ugyanazt a külső stíluslapot használják: `stilus/stilus.css`.
3. A kezdőlapon: főcím, bevezető bekezdés, egy kép, és hivatkozás a látnivalók oldalra.
4. A látnivalók oldalon: egy lista és egy táblázat; hivatkozás vissza a kezdőlapra; oldalon belüli hivatkozás egy szakaszra; egy külső hivatkozás.
5. A stíluslap: háttérszín, betűtípus, címek színe, a bekezdések térköze, a táblázat keretei.

## 1. lépés: a mappák

Hozd létre a `balaton` mappát, benne a `stilus` és a `kepek` almappát. A két képet (például `balaton.jpg`, `tihany.jpg`) másold a `kepek` mappába. A kódszerkesztőben nyisd meg a `balaton` mappát, és hozd létre a fájlokat.

## 2. lépés: a kezdőlap (`index.html`)

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <title>Balaton</title>
  <link rel="stylesheet" href="stilus/stilus.css">
</head>
<body>
  <header>
    <h1>A Balaton</h1>
    <nav>
      <a href="index.html">Kezdőlap</a> |
      <a href="latnivalok.html">Látnivalók</a>
    </nav>
  </header>
  <main>
    <p class="bevezeto">A Balaton Közép-Európa legnagyobb tava, a <strong>magyar tenger</strong>.</p>
    <img src="kepek/balaton.jpg" alt="A Balaton partja naplementekor" width="500">
    <p>Nyáron fürdőzők, télen korcsolyázók érkeznek a partjára.</p>
  </main>
  <footer>
    <p>Készítette: Kovács Anna</p>
  </footer>
</body>
</html>
```

Figyeld meg a relatív útvonalakat: a `stilus/stilus.css` és a `kepek/balaton.jpg` az `index.html`-hez képest egy mappával lejjebb van, ezért van a `stilus/` és `kepek/` előtag. A `latnivalok.html` ugyanabban a mappában van, ezért csak a fájlnév áll a hivatkozásban.

## 3. lépés: a látnivalók oldal (`latnivalok.html`)

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <title>Látnivalók a Balatonnál</title>
  <link rel="stylesheet" href="stilus/stilus.css">
</head>
<body>
  <header>
    <h1>Látnivalók</h1>
    <nav>
      <a href="index.html">Kezdőlap</a> |
      <a href="latnivalok.html">Látnivalók</a> |
      <a href="#adatok">Ugrás az adatokhoz</a>
    </nav>
  </header>
  <main>
    <h2>Érdemes megnézni</h2>
    <ul>
      <li>Tihanyi apátság</li>
      <li>Szigligeti vár</li>
      <li>Badacsonyi borvidék</li>
    </ul>
    <img src="kepek/tihany.jpg" alt="A tihanyi apátság a vízről nézve" width="300">

    <h2 id="adatok">Adatok</h2>
    <table>
      <caption>A Balaton adatai</caption>
      <tr>
        <th>Adat</th>
        <th>Érték</th>
      </tr>
      <tr>
        <td>Terület</td>
        <td>592 km²</td>
      </tr>
      <tr>
        <td>Átlagos mélység</td>
        <td>3,2 m</td>
      </tr>
    </table>
    <p>Bővebben: <a href="https://hu.wikipedia.org/wiki/Balaton" target="_blank">a Balaton a Wikipédián</a></p>
  </main>
  <footer>
    <p>Készítette: Kovács Anna</p>
  </footer>
</body>
</html>
```

A hivatkozások három típusa is jelen van: webhelyen belüli (`index.html`), oldalon belüli (`#adatok` az `id="adatok"` címre), külső (a Wikipedia teljes címe).

## 4. lépés: a stíluslap (`stilus/stilus.css`)

```css
body {
  background-color: #f4f8fb;
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
}

h1, h2 {
  color: #1f4e79;
}

header {
  border-bottom: 2px solid #1f4e79;
  margin-bottom: 20px;
}

.bevezeto {
  font-size: 20px;
}

p {
  line-height: 1.5;
  margin: 10px 0;
}

ul li {
  margin-bottom: 6px;
}

table {
  border-collapse: collapse;
}

th, td {
  border: 1px solid #1f4e79;
  padding: 6px 12px;
  text-align: left;
}

th {
  background-color: #cfe2f3;
}

footer {
  border-top: 1px solid gray;
  margin-top: 30px;
  font-size: 14px;
}

footer p {
  color: gray;
}
```

A stíluslap a `stilus` mappában van, ezért **a CSS-en belüli útvonalak a CSS-fájlhoz képest** értendők. Ha a stíluslapban háttérképet adnál meg (`background-image: url("../kepek/hatter.jpg");`), a `..` kellene, mert a `stilus` mappából egy szintet feljebb lépsz. A HTML-ben megadott útvonalak viszont a HTML-fájlhoz viszonyítottak. Ez gyakori tévedés.

A `border-collapse: collapse;` a szomszédos cellák kereteit egyetlen vonallá olvasztja, így a táblázat rendezett.

## 5. lépés: ellenőrzés

Nyisd meg az `index.html`-t a böngészőben, és végigmész a checklisten:

- Az ékezetes betűk helyesek? (Ha nem: `<meta charset="UTF-8">` és a fájl UTF-8 mentése.)
- A stílus érvényesül? (Ha nem: a `<link>` útvonala vagy fájlneve.)
- Minden kép látszik? (Ha nem: a `src` útvonal, a kis-nagybetű.)
- Minden hivatkozás működik oda és vissza?
- Az oldalon belüli hivatkozás a megfelelő címhez görget?
- A fájlnevek kisbetűsek, ékezet és szóköz nélküliek?

A böngészőben az **F12** a fejlesztői eszközöket nyitja, a Konzol és a Hálózat fül jelzi, ha egy fájl nem található. A szerkesztés után mindig **frissítsd** (F5, vagy Ctrl+F5) az oldalt.

## Gyorsellenőrző kérdések

1. Ha a `latnivalok.html` a `balaton/oldalak/` mappában lenne, hogyan hivatkoznál onnan a kezdőlapra?

   *Megoldás:* `href="../index.html"`, mert egy mappával feljebb van.

2. A `latnivalok.html` oldalon a stíluslap hivatkozása mi, ha az oldal az `oldalak` almappában lenne?

   *Megoldás:* `href="../stilus/stilus.css"`.

3. Mit csinál a `#adatok` hivatkozás, és mi kell hozzá?

   *Megoldás:* Az oldalon belül az `id="adatok"` elemhez görget; a célelemen `id="adatok"` attribútumnak kell lennie.

## Gyakori hibák

- **Rossz útvonal a képnél, stíluslapnál**: a leggyakoribb ok a mappaszint rossz számolása.
- **Szóközös, ékezetes vagy nagybetűs fájlnév**, ami a szerveren törik.
- **A stíluslap nincs csatolva** minden oldalon, ezért csak az egyik oldal néz ki jól.
- **Helyi (`C:\...`) útvonal** a hivatkozásokban: csak a saját gépeden működik.
- **A kezdőlap nem `index.html`**, ezért a webszerver nem találja.
- **Nem UTF-8 mentés** vagy hiányzó `meta charset`.
- **Az elkészített oldalt nem próbálják ki**, a hibák csak a leadás után derülnek ki.
- **Az `id` kétszer szerepel**, vagy a hivatkozás neve más, mint az azonosító.

## Összefoglalás

- A webhely fájljait egy gyökérmappában szervezd: HTML-oldalak a gyökérben, `stilus` és `kepek` almappa; a kezdőlap `index.html`.
- A fájlnevek kisbetűsek, ékezet- és szóköz nélküliek.
- A webhelyen belül relatív útvonalakat használj (`kepek/a.jpg`, `../index.html`); a HTML útvonalai a HTML-fájlhoz, a CSS útvonalai a CSS-fájlhoz képest értendők.
- Minden oldal csatolja ugyanazt a külső stíluslapot a `<link>` elemmel.
- A kész oldalt böngészőben ellenőrizd: kódolás, stílus, képek, hivatkozások.

**Érettségi szint:** a könyvtárszerkezet kialakítása, a relatív hivatkozások és a webhely elemeinek kapcsolata **közép- és emelt szinten** is követelmény; emelt szinten a feladat nagyobb webhelyet, több mappaszintet és kevesebb útmutatást ad.
