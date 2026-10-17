---
slug: weblapkeszites-tetel
title: "Weblapkészítés: tételvázlat"
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mit jelent a "publikálás a világhálón" tétel?

A követelmény ezt a témát "publikálás a világhálón" néven említi: azt kell bemutatnod, hogyan készül weblap HTML és CSS segítségével, hogyan kapcsolódnak össze az oldalak, és hogyan kerül fel a tartalom egy webszerverre. A hivatalos tételek nem nyilvánosak, ez a vázlat **saját felkészítő anyag**.

## Kulcsfogalmak és pontos definíciók

- **WWW (világháló)**: hivatkozásokkal összekapcsolt dokumentumok rendszere, amely az interneten működik. Az internet a hálózat, a web az egyik szolgáltatása.
- **HTML (HyperText Markup Language)**: a weboldal szerkezetét leíró jelölőnyelv. Címkék (tagek) jelölik, mi a cím, bekezdés, lista, kép, hivatkozás.
- **CSS (Cascading Style Sheets)**: a megjelenést írja le: színek, betűk, elrendezés, távolságok. A HTML a "mit", a CSS a "hogyan néz ki".
- **Böngésző**: a HTML-t és a CSS-t megjelenítő program. **Webszerver**: a lapokat kiszolgáló gép és program.
- **URL**: egy erőforrás egyedi webcíme (séma, gépnév, útvonal), például `https://pelda.hu/rolunk.html`.
- **HTTP/HTTPS**: a böngésző és a szerver közötti protokoll; a HTTPS titkosított.
- **Hivatkozás (link)**: az `<a href="...">` elem. **Abszolút** hivatkozás teljes URL-t ad, **relatív** hivatkozás az aktuális laphoz képest adja meg a célt (`kepek/macska.jpg`).
- **Reszponzív**: a lap alkalmazkodik a képernyő méretéhez.
- **Domain név**: a gép olvasható neve; a **DNS** fordítja IP-címre.

## A kifejtés javasolt sorrendje

1. **A web működése**: kliens (böngésző) kér, szerver válaszol; URL, HTTP.
2. **HTML váz**: `<!DOCTYPE html>`, `<html>`, `<head>` (címe, kódolás), `<body>`.
3. **Gyakori elemek**: `h1`–`h6`, `p`, `ul/ol/li`, `table`, `img` (alt szöveggel), `a`, `div`, `span`, űrlap (`form`, `input`).
4. **Szemantikus elemek**: `header`, `nav`, `main`, `section`, `footer`.
5. **CSS**: külső, belső és soron belüli stílus; szelektorok (elem, osztály, azonosító); doboz-modell (tartalom, belső margó, szegély, külső margó).
6. **Hivatkozások és oldalstruktúra**: relatív és abszolút, belső horgony, navigációs menü.
7. **Közzététel**: tárhely, FTP/SFTP feltöltés, domain, tesztelés különböző böngészőkben.
8. **Hozzáférhetőség és minőség**: alt szöveg, kontraszt, érvényes HTML, kis képek.

## Egy teljes minta, amit érdemes fejből tudnod

```text
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <title>Az osztályunk</title>
  <link rel="stylesheet" href="stilus.css">
</head>
<body>
  <h1>Üdvözlünk!</h1>
  <p>Ez a <a href="rolunk.html">rólunk</a> oldal.</p>
  <img src="kepek/osztaly.jpg" alt="Az osztály közös fotója">
</body>
</html>
```

A `stilus.css` fájlban például: `p { color: #333; margin: 10px; }` és `.kiemelt { font-weight: bold; }`. Az osztályra `class="kiemelt"` hivatkozik a HTML-ben.

## Szemléltetés a gépen

- Írj egy egyszerű, kétoldalas weblapot szövegszerkesztőben, nyisd meg böngészőben.
- Változtass egy CSS-szabályt (például a címsor színét), frissíts, és mutasd meg a hatást.
- Mutasd a relatív hivatkozást két oldal között, és hogy mi történik, ha elírod az útvonalat (törött kép).
- A böngésző fejlesztői eszközével mutasd meg a doboz-modellt.

## Tipikus bizottsági kérdések és mintaválaszok

**Mi a HTML és mi a CSS feladata?**
A HTML a tartalom szerkezetét és jelentését írja le, a CSS a megjelenését. A kettő szétválasztása azért jó, mert a stílus egy helyen módosítható az egész oldalra.

**Mi a különbség az abszolút és a relatív hivatkozás között?**
Az abszolút hivatkozás a teljes webcímet tartalmazza, a relatív az aktuális laphoz viszonyított útvonalat. Relatívat használunk az azonos webhelyen belül, mert az oldal máshová költöztetve is működik.

**Miért kell az `alt` attribútum a képnél?**
Ha a kép nem tölthető be, vagy a felhasználó képernyőolvasót használ, az alt szöveg adja át a kép tartalmát. A keresők is használják.

**Mi történik, amikor beírok egy webcímet a böngészőbe?**
A DNS lefordítja a nevet IP-címre, a böngésző HTTP(S) kérést küld a szervernek, az elküldi a HTML-fájlt, a böngésző feldolgozza, és kéri a hozzá tartozó CSS-t és képeket.

**Mi a doboz-modell?**
Minden elem egy téglalap: középen a tartalom, körülötte a belső margó (padding), a szegély (border) és a külső margó (margin).

## Gyakori hibák

- A HTML és a CSS feladatának összekeverése ("a HTML színezi a szöveget").
- A weblapot a szövegszerkesztő mentésével készítik, és nem tiszta HTML-t kapnak.
- Abszolút elérési út a saját gépre (`C:\képek\kep.jpg`) kerül a lapba: máshol nem látszik a kép.
- Ékezetes fájlnév, szóköz az útvonalban, kis- és nagybetűk eltérése (szerveren számít!).
- Hiányzó `meta charset`, ezért az ékezetek elromlanak.
- Az internetet és a webet szinonimának tekinted.

## Összefoglalás

- A web kliens-szerver működésű, HTTP(S) protokollal, URL-lel címzett erőforrásokkal.
- HTML = szerkezet, CSS = megjelenés.
- A hivatkozás a web lényege; belső oldalaknál relatív útvonalat használunk.
- A publikálás: feltöltés tárhelyre, majd tesztelés.
- A felelet közben ne csak magyarázz: mutass egy kis lapot és egy stílusmódosítást is.
