---
slug: kijelolok
title: Kijelölők
position: 4
free: false
published: false
reviewed_by:
reviewed_at:
---

## Melyik elemre vonatkozzon a szabály?

A CSS-szabály első fele, a **kijelölő** (selector) azt adja meg, mely elemeket formázza a szabály. Eddig csak elemnevet használtál (`p`, `h1`), de ez kevés: gyakran csak *egy* bekezdést akarsz kiemelni, vagy csak a menü hivatkozásait. Az érettségi követelménye, hogy kijelölőket tudj használni, és az előre elkészített stílusokkal a weblap elemeit formázd. Ebben a leckében a négy leggyakoribb kijelölőt és a **specifikusság** szabályát tanulod meg.

A példákhoz ezt a HTML-törzset használjuk:

```html
<body>
  <h1 id="focim">Balaton</h1>
  <p class="bevezeto">A Balaton Közép-Európa legnagyobb tava.</p>
  <p>Látnivalók:</p>
  <ul>
    <li class="fontos">Tihany</li>
    <li>Siófok</li>
    <li class="fontos">Keszthely</li>
  </ul>
  <div id="lablec">
    <p>Készítette: <a href="kapcsolat.html">Anna</a></p>
  </div>
</body>
```

## Elemkijelölő

Az **elemkijelölő** egy elem nevével jelöli ki az összes ilyen elemet.

```css
p {
  color: darkgreen;
}
```

Hatása: a példában mind a három `<p>` (a "Balaton Közép-Európa...", a "Látnivalók:" és a "Készítette:") zöld lesz. Az elemkijelölő a legáltalánosabb, a leggyengébb kijelölő.

Több kijelölőt **vesszővel** összefűzhetsz, ha ugyanaz a formázás: ez a **csoportos kijelölő**.

```css
h1, h2, h3 {
  font-family: Georgia, serif;
}
```

## Osztálykijelölő

Ha csak bizonyos elemeket akarsz formázni, adj nekik **osztályt** a `class` attribútummal, a CSS-ben pedig **pont** (`.`) jellel hivatkozz rá. Az osztály **többször**, több elemen is szerepelhet, és egy elemnek több osztálya is lehet (szóközzel elválasztva: `class="fontos kiemelt"`).

```css
.fontos {
  font-weight: bold;
  color: crimson;
}
```

Hatása: a "Tihany" és a "Keszthely" listaelem félkövér és piros, a "Siófok" változatlan. Ha csak a listaelemekre akarod, **elemnév + osztály** kell: `li.fontos`. A `p.bevezeto` csak az olyan bekezdésekre vonatkozik, amelyeknek a `bevezeto` osztálya van.

## Azonosítókijelölő

Az **azonosító** (`id`) **egyetlen** elemet nevez meg az oldalon, ezért értéke **egyedi**. A CSS-ben **kettős kereszt** (`#`) jelöli.

```css
#focim {
  text-align: center;
  color: #336699;
}

#lablec {
  border-top: 1px solid gray;
  font-size: 14px;
}
```

Hatása: a főcím középre igazított kék lesz, a lábléc felett vékony vonal húzódik, és kisebb a betűméret. Az azonosító hivatkozási célnak is jó (`<a href="#lablec">`), amelyet a hivatkozásoknál láttál; ugyanaz az `id` a CSS-ben és a hivatkozásban is használható.

Az osztályt akkor használd, ha **több** elemre vonatkozik a formázás, az azonosítót, ha **egyetlen** elemre.

## Leszármazott kijelölő

A **leszármazott kijelölő** egy elemet annak alapján választ ki, hogy **melyik elemen belül** van. A két kijelölőt **szóköz** választja el: a szülő van elöl, a leszármazott hátul.

```css
#lablec a {
  color: gray;
  text-decoration: none;
}

ul li {
  margin-bottom: 6px;
}
```

Hatása: a `#lablec` elemen belüli hivatkozás szürke és nem aláhúzott lesz, az oldal más hivatkozásai viszont nem változnak. A listaelemek között 6 képpont lesz a térköz. A leszármazott lehet **közvetlen gyerek** vagy mélyebben lévő elem is. Csak a közvetlen gyerekre a `>` jel szolgál: `#lablec > p`.

A leszármazott kijelölővel elkerülöd, hogy minden elemnek külön osztályt adj.

## Specifikusság: ki nyer?

Gyakran több szabály is vonatkozik egy elemre, és ezek ütközhetnek. A böngésző a **specifikusság** (mennyire célzott a kijelölő) alapján dönt:

| Kijelölő | Erősség |
|---|---|
| elem (`p`) | leggyengébb |
| osztály (`.fontos`) | erősebb |
| azonosító (`#focim`) | még erősebb |
| soron belüli `style` | a legerősebb |

Összetett kijelölőnél a részek erősségei összeadódnak, így `#lablec a` erősebb, mint `a`. Ha két szabály **azonos erősségű**, a CSS-fájlban **később** írt nyer.

```css
p {
  color: black;
}
.bevezeto {
  color: blue;
}
```

Hatása: a `class="bevezeto"` bekezdés kék, mert az osztály erősebb az elemnél, függetlenül attól, hogy a szabályok milyen sorrendben állnak. A többi bekezdés fekete.

Amikor azt látod, hogy a formázásod "nem hat", nézd meg: nem ír-e felül egy erősebb szabály, nem írtad-e el a kijelölőt, nem hiányzik-e a `.` vagy `#`.

## Gyakorold

A fenti HTML-törzsre írd meg a következő CSS-t.

1. Az összes `<li>` elem betűje legyen 18 képpontos.

   *Megoldás:*

   ```css
   li {
     font-size: 18px;
   }
   ```

2. Csak a `fontos` osztályú elemek kapjanak sárga hátteret.

   *Megoldás:*

   ```css
   .fontos {
     background-color: yellow;
   }
   ```

3. A `#lablec` azonosítójú elemen belüli bekezdés legyen dőlt.

   *Megoldás:*

   ```css
   #lablec p {
     font-style: italic;
   }
   ```

4. Mi lesz a "Tihany" listaelem színe az alábbi két szabállyal, és miért?

   ```css
   .fontos { color: crimson; }
   li { color: black; }
   ```

   *Megoldás:* Piros (crimson), mert az osztálykijelölő specifikusabb, mint az elemkijelölő, a sorrend ezért nem számít.

## Gyakori hibák

- **A `.` vagy `#` jel hiánya**: `fontos { ... }` elemnévnek számít, és nem talál semmit.
- **`.` és `#` felcserélése**: az osztály pontot, az azonosító kettős keresztet kap.
- **Azonos `id` több elemen**: az azonosító egyedi, több elemre osztályt használj.
- **Szóköz a kijelölőben, ahol nem kell**: `li .fontos` (a `li` *belsejében* lévő `.fontos`) mást jelent, mint `li.fontos` (a `fontos` osztályú `li`).
- **A HTML és a CSS nevei nem egyeznek** (kis- és nagybetű, elírás): `class="Fontos"` nem kapja meg a `.fontos` szabályt.
- **Nem várt felülírás**: egy erősebb vagy későbbi szabály semmissé teszi az elsőt.
- **Soron belüli stílus túlzott használata**, amit a CSS-fájlból már nem lehet felülírni.

## Összefoglalás

- Elemkijelölő: `p`; osztálykijelölő: `.nev` (több elemen); azonosítókijelölő: `#nev` (egyetlen elem); leszármazott: `szulo gyerek`.
- Csoportos kijelölő: vesszővel elválasztott kijelölők (`h1, h2`).
- Az osztály a HTML-ben `class="nev"`, az azonosító `id="nev"`.
- Specifikusság: elem < osztály < azonosító < soron belüli stílus; azonos erősségnél a későbbi nyer.
- Hibakereséskor ellenőrizd a jeleket, az elírást és az erősebb szabályokat.

**Érettségi szint:** a kijelölők használata, a meglévő formázó kód módosítása **közép- és emelt szinten** egyaránt követelmény; emelt szinten gyakoribb a leszármazott kijelölő és a specifikusság értése.
