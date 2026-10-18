---
slug: html-alapok-es-szerkezet
title: HTML alapok és szerkezet
position: 0
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mi az a weblap?

A weblap egy egyszerű **szöveges fájl**, amelyet a böngésző (Chrome, Firefox, Edge) megjelenít. A fájl **HTML** (HyperText Markup Language, hipertext jelölőnyelv) nyelven íródik: a szöveget **címkékkel** (tag) látjuk el, és a címke megmondja, mi a szöveg szerepe: cím, bekezdés, lista, hivatkozás. A böngésző a címkék alapján rajzolja ki az oldalt.

Az érettségin kódszerkesztővel (Notepad++, Visual Studio Code) kell weblapot készítened. Nem szerkesztőprogramban "rajzolod" az oldalt, hanem a kódot írod. A fájl kiterjesztése `.html`, és **UTF-8** kódolással kell menteni, különben az ékezetes betűk elromlanak. Ebben a leckében megismered a HTML-dokumentum vázát és a legfontosabb szerkezeti elemeket.

## A címkék és az elemek

A legtöbb címke **párban** áll: nyitó és záró címke között van a tartalom. A záró címke ugyanaz, mint a nyitó, csak a név előtt `/` jel van.

```html
<p>Ez egy bekezdés.</p>
```

A nyitó címke, a tartalom és a záró címke együtt az **elem**. Néhány elemnek nincs tartalma és nincs záró címkéje (például `<br>`, `<hr>`, `<img>`), ezeket **üres elemnek** hívjuk.

A címkék tulajdonságait **attribútumokkal** adjuk meg, amelyek a nyitó címkében állnak, `név="érték"` formában:

```html
<html lang="hu">
```

Az attribútum értékét idézőjelbe tesszük. A címkék és attribútumok neve kisbetűvel írandó. Az elemek egymásba ágyazhatók, de **szabályosan**: amit utoljára nyitottál, azt zárd be először.

```html
<p>Ez <strong>fontos</strong> szöveg.</p>
```

A rossz beágyazás: `<p>Ez <strong>fontos</p></strong>`. Ezt kerüld.

## A HTML-dokumentum váza

Minden weblap ugyanilyen vázzal kezdődik:

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <title>Az első weblapom</title>
</head>
<body>
  <h1>Üdv a weblapomon!</h1>
  <p>Ez az első bekezdés.</p>
</body>
</html>
```

Soronként:

- `<!DOCTYPE html>`: megmondja a böngészőnek, hogy HTML5 dokumentumról van szó. Mindig az első sor, és nem elem, ezért nincs záró párja.
- `<html lang="hu">`: a gyökérelem, a teljes dokumentumot tartalmazza. A `lang="hu"` attribútum a dokumentum nyelve (magyar).
- `<head>`: a fejrész. A **nem megjelenő**, az oldalra vonatkozó adatok helye.
  - `<meta charset="UTF-8">`: a karakterkódolás. Ez teszi lehetővé az ékezetes betűket. A fájlt is UTF-8-ban kell menteni.
  - `<title>`: az oldal címe, amit a böngészőfül mutat. Nem az oldalon látható cím.
- `<body>`: a törzs. Minden, ami **megjelenik** az oldalon, ide kerül.

A behúzás (a sorok bal oldali szóköze) nem kötelező, a böngészőnek mindegy, de **olvashatóbbá** teszi a kódot. Az egymásba ágyazott elemeket húzd beljebb két vagy négy szóközzel.

Az eredmény: a böngésző az oldalon egy nagy "Üdv a weblapomon!" címet és alatta a bekezdést mutatja, a fül szövege pedig "Az első weblapom". A böngésző a fájlban lévő sortöréseket és több egymás utáni szóközt **egyetlen szóközként** kezeli, tehát az oldal tördelését a címkék határozzák meg.

## Címek és bekezdések

A címek hat szintje a `<h1>` ... `<h6>`. A `<h1>` a legfontosabb, ebből oldalanként általában **egy** van. A `<h2>` az alcím, a `<h3>` az alalcím és így tovább. A szintek hierarchikusak: ne ugorj `<h1>`-ről `<h4>`-re csak azért, mert az kisebb betűt ad. A betűméretet majd a CSS-szel állítod, a cím szintje a **szerkezetet** jelöli.

A bekezdés a `<p>` elem. Minden önálló gondolat külön bekezdésbe kerüljön.

```html
<h1>Balaton</h1>
<h2>Fekvése</h2>
<p>A Balaton Közép-Európa legnagyobb tava.</p>
<h2>Látnivalók</h2>
<p>Siófok, Tihany és Keszthely a leglátogatottabb helyek.</p>
```

Megjelenés: egy nagy "Balaton" cím, alatta egy kisebb "Fekvése" alcím a bekezdéssel, majd a "Látnivalók" alcím a saját bekezdésével. A bekezdések között automatikus térköz van.

## Szemantikus szerkezet

A **szemantikus** elemek az oldal részeinek **szerepét** nevezik meg, nem csupán a kinézetüket. A böngésző és a keresők is használják ezeket. A legfontosabbak:

| Elem | Szerepe |
|---|---|
| `<header>` | az oldal vagy szakasz fejléce (cím, logó) |
| `<nav>` | navigáció, menü (hivatkozások csoportja) |
| `<main>` | az oldal fő tartalma (oldalanként egy) |
| `<section>` | tematikus szakasz, általában saját címmel |
| `<article>` | önállóan is értelmezhető tartalom (cikk, bejegyzés) |
| `<aside>` | mellékes tartalom, oldalsáv |
| `<footer>` | az oldal vagy szakasz lábléce (szerző, elérhetőség) |
| `<div>` | általános, jelentés nélküli doboz csoportosításra |

Példa egy oldal vázára:

```html
<body>
  <header>
    <h1>Balaton útikalauz</h1>
    <nav>
      <p>Kezdőlap | Látnivalók | Kapcsolat</p>
    </nav>
  </header>
  <main>
    <section>
      <h2>Látnivalók</h2>
      <p>Tihanyi apátság, szigligeti vár.</p>
    </section>
    <section>
      <h2>Szállás</h2>
      <p>Kempingek és panziók a part mentén.</p>
    </section>
  </main>
  <footer>
    <p>Készítette: Kovács Anna</p>
  </footer>
</body>
```

A megjelenésben ezek az elemek még (alapból) nem különböznek a sima bekezdéstől, a hasznuk a szerkezet. Ha az elemek csoportosításához nincs megfelelő szemantikus elem, használj `<div>`-et. A `<div>` önmagában semmit nem jelent, csak a CSS-sel formázható doboz.

## Megjegyzés a kódban

A kódban magyarázatot `<!-- ... -->` jelek közé írhatsz. A böngésző ezt nem jeleníti meg.

```html
<!-- Itt kezdődik a menü -->
```

## Gyakorold

1. Írd meg a minimális HTML5-dokumentumot, amelynek a címe "Receptek", és az oldalon egy `<h1>Receptek</h1>` cím áll.

   *Megoldás:*

   ```html
   <!DOCTYPE html>
   <html lang="hu">
   <head>
     <meta charset="UTF-8">
     <title>Receptek</title>
   </head>
   <body>
     <h1>Receptek</h1>
   </body>
   </html>
   ```

2. Egy oldalon a "Süteményeim" főcím alatt két alcím áll ("Palacsinta", "Gesztenyés"), mindegyik alatt egy mondattal. Hogyan jelölnéd?

   *Megoldás:* Egy `<h1>Süteményeim</h1>`, két `<h2>` alcím, mindegyik után egy `<p>`.

3. Melyik elembe kerül a böngészőfülön látható szöveg, és melyikbe az oldalon látható?

   *Megoldás:* A fülön látható a `<head>` alatti `<title>`, az oldalon láthatók a `<body>` elemei.

4. Mi a hiba: `<p>Ez <em>kiemelt</p></em> szöveg</p>`?

   *Megoldás:* Rossz a beágyazás sorrendje: az `<em>` nyílt meg utoljára, ezért azt kell először zárni: `<p>Ez <em>kiemelt</em> szöveg</p>`.

## Gyakori hibák

- **Hiányzó `<!DOCTYPE html>`**, ezért a böngésző "régi módban" jelenít meg.
- **Hiányzó `<meta charset="UTF-8">`** vagy rossz kódolású fájl: az ékezetes betűk helyén furcsa jelek jelennek meg.
- **Nem lezárt elem**, vagy rossz sorrendű lezárás.
- **Szöveg a `<head>`-ben**, ami nem jelenik meg, mert a megjelenő tartalom a `<body>`-ba való.
- **Címek a kinézet miatt**: a `<h3>`-at azért használják, mert kisebb a betűje. A szintet a szerkezet dönti el, a méretet a CSS.
- **Több sor és szóköz a szövegben** azt gondolva, hogy a böngésző is így mutatja. A tördelést címkékkel kell megadni.
- **Idézőjel hiánya** az attribútumértéknél vagy "csavaros" idézőjel (", ") az egyenes (") helyett: szövegszerkesztőből másolt kódban gyakori.

## Összefoglalás

- A HTML címkékkel jelöli a szöveg szerepét; az elem nyitó és záró címkéből és tartalomból áll, az attribútum a nyitó címkében van.
- A dokumentum váza: `<!DOCTYPE html>`, `<html lang="hu">`, `<head>` (`<meta charset="UTF-8">`, `<title>`) és `<body>`.
- Címek: `<h1>`–`<h6>` hierarchikusan; bekezdés: `<p>`.
- Szemantikus elemek: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`; általános doboz: `<div>`.
- A fájl `.html`, UTF-8 kódolású.

**Érettségi szint:** a HTML-dokumentum szerkezeti elemeinek ismerete és a weblap kódszerkesztővel való elkészítése **közép- és emelt szinten** egyaránt követelmény; emelt szinten a feladat több elemet és összetettebb szerkezetet kér.
