---
slug: css-alapok
title: CSS alapok
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Szerkezet és kinézet szétválasztása

Eddig a HTML-lel a weblap **szerkezetét** írtad le: mi cím, mi bekezdés, mi lista. A **kinézetet**, azaz a színeket, betűket, térközöket a **CSS** (Cascading Style Sheets, lépcsőzetes stíluslapok) adja meg. A két nyelv szándékosan külön van: a HTML a tartalom, a CSS a megjelenés. Így egyetlen stíluslappal az egész webhely kinézetét egyszerre változtathatod.

Az érettségi követelménye: értened kell a CSS használatának alapelveit, be kell tudnod állítani a weblap kapcsolatát a CSS-fájllal, tudnod kell CSS-kódot a HTML-fájlon belül és önálló fájlban is elhelyezni, és módosítanod kell tudni a formázást végző kódot.

## A CSS szabály felépítése

A CSS **szabályokból** áll. Egy szabály megmondja, melyik elemekre vonatkozik (**kijelölő**, selector), és mit változtat rajtuk (**deklarációk**):

```css
p {
  color: darkblue;
  font-size: 18px;
}
```

- `p`: a kijelölő, az összes `<p>` elemre vonatkozik.
- `{ ... }`: a deklarációs blokk.
- `color: darkblue;`: egy deklaráció, a **tulajdonság** (`color`), kettőspont, az **érték** (`darkblue`) és záró **pontosvessző**.

Megjelenés: az oldal összes bekezdése sötétkék, 18 képpontos betűkkel jelenik meg. Több deklaráció is állhat egy szabályban, mindegyiket pontosvessző zárja. A megjegyzés CSS-ben `/* ... */`.

## A CSS elhelyezése: három módszer

A CSS-t háromféleképpen kapcsolhatod a HTML-hez.

### 1. Külső stíluslap (önálló fájl)

A CSS-t egy külön `.css` fájlba írod, és a HTML `<head>` részében hivatkozol rá a `<link>` elemmel. **Ez az ajánlott módszer**, mert több oldal is használhatja ugyanazt a fájlt.

`stilus.css`:

```css
body {
  background-color: #f5f5dc;
  font-family: Arial, sans-serif;
}
```

`index.html`:

```html
<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <title>Külső stíluslap</title>
  <link rel="stylesheet" href="stilus.css">
</head>
<body>
  <h1>Üdvözöllek!</h1>
  <p>Ez a szöveg Arial betűvel, bézs háttéren jelenik meg.</p>
</body>
</html>
```

A `rel="stylesheet"` jelzi, hogy a hivatkozott fájl stíluslap; a `href` a fájl relatív útvonala (lásd a hivatkozásokról tanultakat). A `<link>` üres elem, nincs záró címkéje.

### 2. Belső stíluslap (`<style>` elem)

A CSS a HTML-fájl `<head>` részében, egy `<style>` elemben áll. Egyetlen oldal formázására jó.

```html
<head>
  <meta charset="UTF-8">
  <title>Belső stíluslap</title>
  <style>
    h1 {
      color: crimson;
    }
  </style>
</head>
```

### 3. Soron belüli stílus (`style` attribútum)

Egyetlen elem formázása közvetlenül a címkében:

```html
<p style="color: green; font-size: 20px;">Ez a bekezdés zöld.</p>
```

Ezt csak ritkán használd: a kód nehezen módosítható, és minden elemet külön kell átírni. Ha több helyen is szükséges a stílus, a külső vagy belső stíluslapot válaszd.

Ha ugyanarra az elemre több helyről is érkezik formázás, a **közelebbi** és **specifikusabb** nyer, azonos erősségnél pedig a **később** írt. A soron belüli stílus a legerősebb.

## Színek és betűk

**Színek** megadása:

- Névvel: `red`, `darkblue`, `lightgray`.
- Hexadecimális kóddal: `#ff0000` (vörös), `#336699`; a három számpár a vörös, zöld, kék összetevő.
- `rgb()` függvénnyel: `rgb(255, 0, 0)`.

A színhez két alap tulajdonság tartozik: `color` (a szöveg színe) és `background-color` (a háttér színe).

**Betű** tulajdonságok:

| Tulajdonság | Példa | Hatása |
|---|---|---|
| `font-family` | `Arial, sans-serif` | betűtípus (tartalék sorral) |
| `font-size` | `18px` | betűméret |
| `font-weight` | `bold` | vastagság |
| `font-style` | `italic` | dőlt |
| `text-align` | `center` | igazítás (left, center, right, justify) |
| `text-decoration` | `underline` / `none` | aláhúzás |
| `line-height` | `1.5` | sorköz |

A `font-family` értékénél vesszővel több betűtípust sorolsz fel: ha az elsőt a gép nem ismeri, a következőt használja. A végén mindig legyen általános család (`serif`, `sans-serif`, `monospace`).

```css
h1 {
  color: #336699;
  font-family: Georgia, serif;
  text-align: center;
}

p {
  font-size: 18px;
  line-height: 1.5;
}
```

## Térközök és keret: a dobozmodell

A böngésző minden elemet **téglalap alakú dobozként** kezel. A doboz négy rétegből áll, belülről kifelé:

1. **tartalom** (a szöveg vagy kép),
2. **padding** (belső térköz a tartalom és a keret között),
3. **border** (keret),
4. **margin** (külső térköz a keret és a szomszéd elem között).

```css
p {
  padding: 10px;
  border: 2px solid #336699;
  margin: 20px;
  background-color: #eef4fa;
}
```

Megjelenés: minden bekezdés körül 2 képpont vastag kék, folytonos keret van, a szöveg és a keret között 10 képpont üres hely, a bekezdés és a szomszédai között pedig 20 képpont. A bekezdés háttere halványkék, és a háttér a paddingra is kiterjed, de a marginra nem.

A **border** rövidített alakja három adatot tartalmaz sorban: vastagság, stílus (`solid` folytonos, `dashed` szaggatott, `dotted` pontozott) és szín. Egy oldalra is megadhatod: `border-bottom: 1px solid gray;`.

A **margin** és **padding** értékeit többféleképp adhatod meg:

- `margin: 10px;` mind a négy oldalon.
- `margin: 10px 20px;` fent-lent 10, jobb-bal 20.
- `margin: 5px 10px 15px 20px;` fent, jobbra, lent, balra (az óramutató járása szerint).
- Egy oldal: `margin-top`, `margin-left`, `padding-bottom` stb.

A méretet megadhatod `width` és `height` tulajdonsággal is, például `width: 50%;` a szülő szélességének fele.

## Gyakorold

1. Állítsd be, hogy az oldal minden `<h1>` címe középre igazított, piros és 36 pixeles legyen.

   *Megoldás:*

   ```css
   h1 {
     text-align: center;
     color: red;
     font-size: 36px;
   }
   ```

2. Egy `stilus.css` fájlt kell csatolnod az `index.html`-hez. Hová és hogyan írod?

   *Megoldás:* A `<head>` részbe: `<link rel="stylesheet" href="stilus.css">`.

3. A bekezdéseknek legyen 1 képpont vastag szürke szaggatott keretük, 8 képpont belső és 15 képpont külső térközük.

   *Megoldás:*

   ```css
   p {
     border: 1px dashed gray;
     padding: 8px;
     margin: 15px;
   }
   ```

4. Melyik módszerrel formáznál egy 10 oldalas webhelyet, és miért?

   *Megoldás:* Külső stíluslappal, mert az egy fájl módosításával az összes oldal kinézetét megváltoztatja; a soron belüli stílus minden elemnél külön átírást igényelne.

## Gyakori hibák

- **Hiányzó pontosvessző** két deklaráció között: a következő sor nem érvényesül.
- **Kettőspont helyett egyenlőségjel** (`color = red`) vagy **hiányzó kapcsos zárójel**.
- **Rossz útvonal** a `<link>` elemben, ezért a stíluslap nem töltődik be, és az oldal formázatlan marad.
- **A `<link>` a `<body>`-ban** vagy a `<style>` a `<head>`-en kívül.
- **A mértékegység hiánya**: `font-size: 18;` hibás, `18px` helyes (a nulla kivétel).
- **Magyar tizedesvessző** a CSS-ben: `1,5` helyett `1.5` kell.
- **Szín- vagy tulajdonságnév elírása** (`colour`, `backgroundcolor`): a böngésző csendben figyelmen kívül hagyja.
- **A margin és a padding összekeverése**: a margin a keret **kívül**, a padding **belül** van.

## Összefoglalás

- A HTML a szerkezetet, a CSS a kinézetet adja; a CSS szabály: kijelölő + `{ tulajdonság: érték; }`.
- Három elhelyezés: külső fájl (`<link rel="stylesheet" href="...">`), belső (`<style>`), soron belüli (`style` attribútum). A külső az ajánlott.
- Szín: `color`, `background-color`; betű: `font-family`, `font-size`, `font-weight`, `text-align`.
- A dobozmodell: tartalom, `padding`, `border`, `margin`.
- A hibás vagy hiányzó pontosvessző és útvonal a leggyakoribb baj.

**Érettségi szint:** a CSS kapcsolata az oldallal, a külső és belső stílus, és a formázó kód módosítása **közép- és emelt szinten** egyaránt követelmény; emelt szinten a feladat egyszerre több tulajdonság pontos beállítását kéri.
