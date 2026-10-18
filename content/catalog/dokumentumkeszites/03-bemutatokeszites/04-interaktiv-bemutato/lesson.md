---
slug: interaktiv-bemutato
title: Interaktív bemutató
position: 3
free: false
published: false
reviewed_by:
reviewed_at:
---

## Amikor te döntöd el, merre menjen a bemutató

Az eddigi bemutatók **lineárisak** voltak: az első diától az utolsóig, egymás után. Az **interaktív bemutató** viszont ugrálhat: a néző vagy az előadó egy gombra kattintva eljut egy másik diára, egy weboldalra vagy egy fájlhoz. Ilyen például egy kvíz, egy menüs tájékoztató vagy egy kiállítási kioszk. A követelmény szerint tudnod kell **interaktív bemutatót létrehozni**. Ez a lecke az emelt szintű feladatok tipikus eszközeit mutatja be: hivatkozásokat, műveleti gombokat és a tartalomjegyzék-diát.

## Hivatkozás szövegre és képre

A hivatkozás egy szöveghez, képhez vagy alakzathoz rendelt cél. Létrehozása:

1. Jelöld ki az elemet (szöveget vagy objektumot).
2. **Beszúrás, Hivatkozás** (Ctrl+K) mindkét programban.
3. Válaszd ki a célt.

A cél lehet:

- **Másik dia ebben a bemutatóban** (PowerPoint: Hely a dokumentumban; Impress: Dokumentum, majd Célhely).
- **Weboldal** (a teljes webcím, `https://...`).
- **Fájl** (más dokumentum).
- **E-mail cím**.

Vetítés közben a hivatkozásra kattintva a cél nyílik meg. A hivatkozás szövege a téma színével jelenik meg, aláhúzva; a látogatott hivatkozás színe is változik. Ha az alakzatot (nem a benne lévő szöveget) hivatkozzák, az egész alakzat kattintható lesz, ami nagyobb célpont a kattintáshoz.

Fontos, hogy a hivatkozott dia **létezzen**: ha később törlöd vagy átrendezed, a hivatkozás nem a várt helyre mutat. A hivatkozást a bemutató véglegesítése után ellenőrizd.

## Műveleti gomb

A **műveleti gomb** (Action Button) egy előre elkészített alakzat, amelyhez beépített művelet tartozik: *Vissza, Előre, Kezdőlap (első dia), Utolsó dia, Információ, Hang, Film*.

- PowerPoint: **Beszúrás, Alakzatok, Műveleti gombok** (a lista alján). Rajzolás után megjelenik a **Műveletbeállítás** ablak.
- Impress: **Diavetítés, Interakció** (vagy: jobb gomb az objektumon, Interakció).

A **Műveletbeállítás** ablakban a következőket lehet megadni:

- **Kattintásra** vagy **egérmutató fölé vitelre** történjen a művelet.
- A művelet: *hivatkozás a következő / előző / első / utolsó diára*, *adott diára*, *program futtatása*, *hang lejátszása*.

Tipikus feladat: "Készíts a bemutató minden diájára egy Vissza a tartalomjegyzékhez gombot a jobb alsó sarokba." Ezt **nem diánként kézzel** teszed, hanem a **diamintában** egyszer helyezed el a gombot (lásd az előző leckét), és így minden dián megjelenik. A diamintában elhelyezett gomb a vetítésben működik.

Egy műveleti gomb tehát két dolgot csinál: kinézete (alakzat) és viselkedése (művelet). Mindkettőt módosíthatod: a viselkedést a Műveletbeállításban, a megjelenést az alakzat formázásával.

## A tartalomjegyzék-dia

A tartalomjegyzék-dia egy menü: a témák neve **hivatkozás** a megfelelő diákra. Elkészítése lépésről lépésre:

1. Készítsd el a tartalmi diákat, például: *3. dia: Energia*, *4. dia: Víz*, *5. dia: Hulladék*.
2. Szúrj be egy új diát a második helyre, címe: *Tartalom*.
3. Írd fel a témák nevét felsorolásként (vagy gombokként): Energia, Víz, Hulladék.
4. Jelöld ki a **Energia** szót, Beszúrás, Hivatkozás, Hely a dokumentumban, válaszd a 3. diát. Ugyanígy a másik kettőt is a saját diájukra.
5. Minden tartalmi dián helyezz el egy **Vissza a tartalomjegyzékhez** gombot, ami a 2. diára ugrik.
6. Próbáld ki a vetítésben: a tartalomról el lehet jutni minden diára, és vissza.

Ez a szerkezet a **hub and spoke** (agy és küllők) minta: a tartalomjegyzék a közép, a tartalmi diák a küllők. A néző nem téved el, mert bármikor visszatérhet a menühöz.

Egy kvíz is így épül: a kérdés dián három válasz gomb van; a jó válasz a "Helyes!" diára, a rossz válasz a "Próbáld újra!" diára mutat, az pedig vissza a kérdésre.

## Vetítés interaktivitáshoz

Az interaktív bemutatóhoz a **vetítési beállításokban** gyakran a "csak kattintásra váltson" (és ne automatikusan) mód kell, különben a bemutató magától továbblépne, mielőtt a néző választana. A kiosk üzemmódban a diaváltást kikapcsolják, és csak a hivatkozások és gombok mozgatják a nézőt. Ezt a beállítást a feladat előírása adja.

A kész bemutató mentésekor érdemes **vetítési** formátumban is elmenteni (PowerPoint: .ppsx; Impress: .ppsx vagy .pps), így a fájl megnyitása rögtön vetít. Az eredeti szerkeszthető fájlt is tartsd meg.

## Gyakorold

1. Egy 6 diás bemutató 2. diája a tartalomjegyzék. Hogyan hozod létre a "Történelem" bejegyzés hivatkozását a 4. diára?

   *Megoldás:* A "Történelem" szöveg kijelölése, Beszúrás, Hivatkozás (Ctrl+K), Hely a dokumentumban, a 4. dia kiválasztása, OK. Vetítésben ellenőrizd.

2. Minden diára kerüljön egy "Vissza" gomb a jobb alsó sarokba, ami a tartalomjegyzékre (2. dia) ugrik. Mi a leggyorsabb módszer?

   *Megoldás:* Nézet, Diaminta; ott elhelyezel egy alakzatot (vagy műveleti gombot), amelynek a hivatkozása a 2. dia; a mintanézet bezárása. Minden dián megjelenik.

3. Egy kvíz kérdésdiáján három válaszgomb van. Hogyan működik a "jó" és a "rossz" válasz?

   *Megoldás:* A jó válasz gombja a "Helyes!" diára hivatkozik, a rossz válaszok gombjai a "Próbáld újra!" diára; mindkét eredménydián van egy gomb, ami vissza a kérdésre vagy a következő kérdésre ugrik.

4. Mit kell ellenőrizni az interaktív bemutató leadása előtt?

   *Megoldás:* Végigkattintani az összes hivatkozást és gombot a vetítésben; hogy a diaváltás kattintásra vagy a feladat szerint legyen beállítva; hogy ne maradjon céltalan hivatkozás.

## Gyakori hibák

- **Hivatkozás nem a megfelelő diára** mutat, mert később átrendezték a diákat.
- **Nincs visszalépés**: a néző a tartalomjegyzékből bejut egy diára, de onnan nem tud visszamenni.
- **Gomb diánként kézzel** elhelyezve, ezért egy diáról lemarad, vagy máshol van.
- **Szerkesztőnézetben próbálgatják**: a hivatkozás csak a vetítésben működik, ezért ott ellenőrizd.
- **Automatikus diaváltás** marad bekapcsolva, ezért a bemutató elmegy a választás előtt.
- **Túl kicsi gomb**, amit nehéz eltalálni, vagy ami nem látszik a háttéren.
- **A hivatkozás szövege a szövegdobozra, nem a szövegre** van téve, ezért csak a keretre kattintva működik.

## Összefoglalás

- Az interaktív bemutató nem lineáris: a néző hivatkozásokkal és gombokkal lép a diák között.
- Hivatkozás célja lehet másik dia, weboldal, fájl vagy e-mail cím (Beszúrás, Hivatkozás, Ctrl+K).
- A műveleti gomb alakzat és beépített művelet (előző, következő, első, utolsó, adott dia).
- Az ismétlődő gombot a diamintára tedd, nem diánként.
- A tartalomjegyzék-dia a témák hivatkozásaiból áll, és minden tartalmi diáról vissza kell tudni lépni.
- A végén a vetítésben próbálj ki minden hivatkozást.

**Érettségi szint:** az interaktív bemutató létrehozása **emelt szinten** jellemző követelmény, a feladat pontosan megadja a hivatkozási szerkezetet (menü, gombok, kvíz). Középszinten elsősorban a diák elkészítése, formázása, az animáció és a vetítés beállításai a feladat, de az egyszerű hivatkozás ott is előfordulhat.
