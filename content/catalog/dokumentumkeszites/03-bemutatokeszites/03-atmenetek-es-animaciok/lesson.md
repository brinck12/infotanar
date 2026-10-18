---
slug: atmenetek-es-animaciok
title: Áttűnések és animációk
position: 2
free: false
published: false
reviewed_by:
reviewed_at:
---

## Mozgás a bemutatóban

Eddig a diák álló lapok voltak. Két eszközzel élővé teheted őket: az **áttűnéssel** (átmenettel), ami azt szabályozza, hogyan vált egyik diáról a másikra a kép, és az **animációval**, ami egy dián belül az elemek megjelenését, eltűnését vagy mozgását vezérli. A követelmény szerint az áttűnéseket és animációkat szerkeszteni kell tudnod, és használnod kell a **vetítés beállításait** is. A lecke a három témát veszi sorra.

Az alapszabály: a mozgás a mondanivalót szolgálja. Ha egy elem azért pörög be, mert látványos, a hallgató a mozgást nézi, nem téged.

## Áttűnés (átmenet)

Az áttűnés két dia között játszódik le. Beállítás:

- PowerPoint: **Áttűnések** lap.
- Impress: **Diaváltás** (Slide Transition) panel az oldalsávon.

Menete:

1. Jelöld ki a diát (vagy több diát a bélyegképek között, Ctrl+kattintással, vagy az összeset Ctrl+A).
2. Válassz egy hatást: például Áttűnés (Fade), Eltolás (Push), Törlés (Wipe).
3. Állítsd be az **időtartamot** (például 0,5–1 másodperc).
4. Állítsd be, mikor lépjen tovább: **kattintásra** vagy **automatikusan** egy megadott idő után.
5. Ha az egész bemutatón azonos hatást akarsz, használd az **Alkalmaz mindenre** (Apply to All Slides) gombot.

Szabály: egy bemutatóban **egyféle, visszafogott** áttűnést használj. Ha minden dia más hatással érkezik, az zavaró. Az áttűnés a témaváltást jelzi, ezért a legjobb, ha az egységes hatás mellett csak a szakaszváltás (például az összefoglaló dia) kap más hatást.

A diák váltásakor hangot is rendelhetsz hozzá, de ezt jobb elkerülni.

## Animáció

Az animáció egyetlen elemre vonatkozik: szövegre, képre, alakzatra, diagramra. Kiválasztása:

- PowerPoint: **Animációk** lap, **Animáció hozzáadása**.
- Impress: **Animáció** panel, **Hatás hozzáadása**.

Az animáció négy csoportja:

| Típus | Mit csinál | Példa |
|---|---|---|
| **Megjelenés** (belépő) | az elem megjelenik a dián | szövegdoboz beúszik |
| **Kiemelés** | a látható elemet kiemeli | kép egy pillanatra kinagyodik |
| **Eltűnés** (kilépő) | az elem eltűnik | figyelmeztetés kiúszik |
| **Mozgásútvonal** | az elem a megadott pályán halad | nyíl elmegy A pontból B-be |

Egy szöveges felsorolásnál gyakori kívánalom, hogy a pontok **egyenként, kattintásra** jelenjenek meg. Ezt a **Hatás beállításai, Szövegmozgatás: bekezdésenként** beállítással éred el. Így a hallgató csak azt látja, amiről épp beszélsz.

## Az animáció időzítése

Minden animációnak három időbeli tulajdonsága van:

- **Indítás:** mikor kezdődik.
  - **Kattintásra** (On Click): te vezérled.
  - **Az előzővel együtt** (With Previous): egyszerre indul az előző elemmel.
  - **Az előző után** (After Previous): akkor indul, amikor az előző befejeződött.
- **Időtartam:** meddig tart (pl. 0,5 mp).
- **Késleltetés:** mennyit vár az indítás előtt.

A sorrendet az **Animációs ablaktáblán** (PowerPoint: Animációs ablaktábla; Impress: az Animáció panel listája) láthatod és húzással módosíthatod.

Példa: egy dián a cím rögtön látszik, a bal oldali kép beúszik kattintásra, a mellette lévő felirat a képpel együtt jelenik meg, utána két másodperccel pedig egy kiemelő nyíl következik.

| Sorszám | Elem | Hatás | Indítás |
|---|---|---|---|
| 1 | Kép | Beúszás | Kattintásra |
| 2 | Felirat | Beúszás | Az előzővel együtt |
| 3 | Nyíl | Kiemelés | Az előző után, késleltetés 2 mp |

A kész animációkat ellenőrizd a **Vetítés** indításával, mert a szerkesztőnézetben nem látszik a tényleges hatás.

## Vetítési beállítások

A bemutató lejátszását a vetítési beállítások szabályozzák:

- PowerPoint: **Diavetítés, Diavetítés beállítása**.
- Impress: **Diavetítés, Diavetítés beállításai**.

Itt a következőket adhatod meg:

- **Mettől meddig:** az összes diát vagy csak egy tartományt vetíti (például 3–7. dia).
- **Vetítés típusa:** az előadó vezérli teljes képernyőn, vagy egy ablakban, vagy **kiosk** üzemmód (felügyelet nélküli, folyamatos).
- **Ismétlés:** a bemutató a végén elölről kezdődik, amíg le nem állítod (Esc).
- **Automatikus váltás** az időzítések szerint, vagy csak kattintásra.
- **Dia elrejtése:** az egyes diákat a vetítésből kiveheted, hogy ne töröld őket (jobb gomb a bélyegképen, Dia elrejtése).
- **Egérmutató** és **toll**: vetítés közben a mutató megjeleníthető vagy elrejthető.

A vetítés indítása: **F5** az elejétől, **Shift+F5** az aktuális diától (PowerPoint; Impressben F5 az elejétől, Shift+F5 az aktuális diától). Kilépés: **Esc**.

A kiosk üzemmód jó példa a beállítások összjátékára: a bemutató automatikusan váltson 5 másodpercenként, ismétlődjön, és a nézők ne tudják elállítani. Ehhez automatikus diaváltást és ismétlést kell beállítanod, az egér-kattintásos váltás kikapcsolva.

## Gyakorold

1. Állíts be az összes diára egyforma, fél másodperces áttűnést, ami kattintásra vált. Hogyan?

   *Megoldás:* Kijelöl minden diát (Ctrl+A a bélyegképek között), hatás kiválasztása (Áttűnés), időtartam 0,5 mp, váltás kattintásra, Alkalmaz mindenre.

2. Egy dián a felsorolás négy pontja egymás után, kattintásra jelenjen meg. Mi a menete?

   *Megoldás:* A szövegdoboz kijelölése, belépő animáció (pl. Beúszás), Hatás beállításai: bekezdésenként; indítás kattintásra.

3. Egy képnek és a leírásának egyszerre kell megjelennie, majd 2 másodperccel utána egy nyílnak. Hogyan állítod az indítást?

   *Megoldás:* A kép: kattintásra; a leírás: az előzővel együtt; a nyíl: az előző után, 2 mp késleltetéssel.

4. A bemutató egy kiállításon fut felügyelet nélkül, folyamatosan. Mit állítasz a vetítési beállításokban?

   *Megoldás:* Kiosk üzemmód (vagy ismétlés ESC-ig), automatikus váltás időzítéssel (pl. 5 mp), kattintásos váltás nélkül.

## Gyakori hibák

- **Minden diának más áttűnés**: zavaros, kevésbé hivatalos hatású.
- **Túl hosszú animáció**, a hallgató vár az információra. Az egyes hatások legyenek rövidek (0,5–1 mp).
- **Rossz indítás**: kattintásra állított elem helyett az "előzővel együtt" kell, vagy fordítva, ezért az elemek egyszerre ugrálnak.
- **Sorrend nem ellenőrzött**: az animációs ablaktáblán a sorrend más, mint a tervezett.
- **A vetítést nem próbálják ki**, így az időzítési hiba csak éles bemutatáskor derül ki.
- **A diát törlik elrejtés helyett**, így az anyag elvész.
- **Hanghatás és villogó animáció**, ami figyelmet von el a tartalomról.

## Összefoglalás

- Az áttűnés a diák közötti váltás, az animáció a dián belüli elemek mozgása.
- Egy bemutatóban egyféle, visszafogott áttűnés legyen; az Alkalmaz mindenre gomb segít.
- Animációtípusok: megjelenés, kiemelés, eltűnés, mozgásútvonal.
- Az időzítés: kattintásra, az előzővel együtt, az előző után, időtartam, késleltetés.
- A vetítési beállításokban a tartomány, a vetítés típusa, az ismétlés és az automatikus váltás adható meg.
- A kész bemutatót mindig vetítsd le a hatások ellenőrzéséhez.

**Érettségi szint:** az áttűnések, animációk szerkesztése és a vetítési beállítások használata **középszinten** is követelmény. Emelt szinten az animációk időzítése is összetettebb lehet (sorrend, indítási módok kombinálása), és a feladatban pontosan megadott beállításokat kell elérned.
