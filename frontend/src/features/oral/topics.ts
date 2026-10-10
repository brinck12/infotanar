import type { IconName } from '../../shared/ui/Icon'

export interface OralTopic {
  slug: string
  title: string
  icon: IconName
  /**
   * Vázlatpontok az A) rész kifejtéséhez. HELYKITÖLTŐ: általános vázlat a
   * követelmények témakörei alapján, nem a hivatalos tételsor szövege.
   */
  outline: ReadonlyArray<string>
  /** A B) rész programozási feladata és egy mintamegoldása (Python 3). */
  task: { statement: string; solution: string }
}

/** Az emelt szintű szóbeli pontozása (30 pont); forrás: az Oktatási Hivatal vizsgaleírása. */
export const ORAL_SCORING: ReadonlyArray<{ criterion: string; points: number; selfAssessed: boolean }> = [
  { criterion: 'Tartalom, A) feladat', points: 8, selfAssessed: false },
  { criterion: 'Tartalom, B) feladat', points: 10, selfAssessed: false },
  { criterion: 'Logikai felépítés', points: 4, selfAssessed: true },
  { criterion: 'Kifejezőkészség, szaknyelv', points: 4, selfAssessed: true },
  { criterion: 'Kommunikatív készség', points: 4, selfAssessed: true },
]

/** Felkészülési és felelési idő percben. */
export const ORAL_MINUTES = { preparation: 30, answer: { kozep: 15, emelt: 20 } } as const

export const ORAL_TOPICS: ReadonlyArray<OralTopic> = [
  {
    slug: 'szovegszerkesztes',
    title: 'Szövegszerkesztés',
    icon: 'doc',
    outline: [
      'A szövegszerkesztő programok feladata és típusai',
      'A dokumentum egységei: karakter, bekezdés, szakasz, oldal',
      'Karakter- és bekezdésformázás, stílusok',
      'Táblázatok, képek és más objektumok a szövegben',
      'Tabulátorok, felsorolás és számozás',
      'Élőfej, élőláb, oldalszámozás, tartalomjegyzék',
    ],
    task: {
      statement: 'Egy szövegben számold meg, hány szó van, és írd ki a leghosszabb szót is. A szöveget a program elején add meg.',
      solution: 'szoveg = "az alma piros es a korte sarga"\nszavak = szoveg.split()\nleghosszabb = szavak[0]\nfor szo in szavak:\n    if len(szo) > len(leghosszabb):\n        leghosszabb = szo\nprint(len(szavak), leghosszabb)',
    },
  },
  {
    slug: 'grafika-es-kepszerkesztes',
    title: 'Számítógépes grafika és képszerkesztés',
    icon: 'image',
    outline: [
      'Pixelgrafika és vektorgrafika: mi a különbség, mikor melyiket használjuk',
      'Felbontás, színmélység, színmodellek (RGB, CMYK)',
      'Képformátumok és tömörítés (veszteséges, veszteségmentes)',
      'Rétegek, átlátszóság, kijelölés',
      'Alapvető képműveletek: vágás, átméretezés, színkorrekció',
      'Vektoros alakzatok, görbék, logikai műveletek',
    ],
    task: {
      statement: 'Egy kép pixeleinek szürkeárnyalatos értékei (0–255) egy listában vannak. Írd ki a legvilágosabb pixel értékét és a helyét.',
      solution: 'pixelek = [12, 200, 45, 255, 90]\nlegnagyobb = 0\nfor i in range(1, len(pixelek)):\n    if pixelek[i] > pixelek[legnagyobb]:\n        legnagyobb = i\nprint(pixelek[legnagyobb], legnagyobb + 1)',
    },
  },
  {
    slug: 'bemutatokeszites',
    title: 'Bemutatókészítés',
    icon: 'slides',
    outline: [
      'A bemutató célja és fajtái',
      'Diák felépítése: elrendezés, minta, tervezés',
      'Szöveg, kép, ábra és hang a diákon',
      'Animáció és áttűnés',
      'A bemutató megjelenítése és előadása',
    ],
    task: {
      statement: 'Egy lista számait add össze, de csak azokat, amelyek párosak. Írd ki az összeget és azt is, hány páros szám volt.',
      solution: 'szamok = [4, 7, 10, 3, 8]\nosszeg = 0\ndb = 0\nfor s in szamok:\n    if s % 2 == 0:\n        osszeg += s\n        db += 1\nprint(osszeg, db)',
    },
  },
  {
    slug: 'publikalas-a-vilaghalon',
    title: 'Publikálás a világhálón',
    icon: 'globe',
    outline: [
      'A weboldal felépítése: HTML a szerkezet, CSS a megjelenés',
      'Alapvető HTML-elemek: címsor, bekezdés, lista, kép, táblázat, hivatkozás',
      'Stílusok megadása: elem, osztály és azonosító szerint',
      'Weboldalak összekapcsolása, fájlszerkezet, relatív és abszolút hivatkozás',
      'Közzététel: tárhely, domain, a böngésző és a szerver szerepe',
      'Szerzői jog és akadálymentesség a weben',
    ],
    task: {
      statement: 'Egy listában weboldalak látogatószámai vannak. Döntsd el, volt-e olyan oldal, amelyet ezernél többen néztek meg, és ha igen, írd ki az első ilyen sorszámát.',
      solution: 'latogatok = [320, 870, 1540, 90, 2100]\nhely = -1\nfor i in range(len(latogatok)):\n    if latogatok[i] > 1000:\n        hely = i\n        break\nif hely == -1:\n    print("Nem volt ilyen oldal")\nelse:\n    print("Volt, sorszama:", hely + 1)',
    },
  },
  {
    slug: 'tablazatkezeles',
    title: 'Táblázatkezelés',
    icon: 'sheet',
    outline: [
      'A táblázatkezelő feladata, a munkafüzet és a munkalap',
      'Cellatípusok: szám, szöveg, dátum, képlet',
      'Relatív, abszolút és vegyes hivatkozás',
      'Függvények: összegzés, feltételes és kereső függvények',
      'Rendezés, szűrés, feltételes formázás',
      'Diagramtípusok és mikor melyiket választjuk',
    ],
    task: {
      statement: 'Egy listában napi hőmérsékletek vannak. Válogasd ki a fagypont alatti értékeket, és írd ki, hány ilyen nap volt.',
      solution: 'homerseklet = [3, -2, 0, -5, 7, -1]\nfagyos = []\nfor h in homerseklet:\n    if h < 0:\n        fagyos.append(h)\nprint(fagyos, len(fagyos))',
    },
  },
  {
    slug: 'adatbazis-kezeles',
    title: 'Adatbázis-kezelés',
    icon: 'db',
    outline: [
      'Az adatbázis és az adatbázis-kezelő rendszer fogalma',
      'Tábla, rekord, mező, adattípusok',
      'Elsődleges és idegen kulcs, a táblák kapcsolata',
      'Lekérdezések: szűrés, rendezés, csoportosítás, összesítés',
      'Több tábla összekapcsolása',
      'Adatbevitel, űrlap, jelentés',
    ],
    task: {
      statement: 'Diákok jegyei egy listában vannak. Számold ki az átlagot egy tizedesre kerekítve, és írd ki, hány jegy jobb az átlagnál.',
      solution: 'jegyek = [5, 3, 4, 2, 5, 4]\nosszeg = 0\nfor j in jegyek:\n    osszeg += j\natlag = round(osszeg / len(jegyek), 1)\njobb = 0\nfor j in jegyek:\n    if j > atlag:\n        jobb += 1\nprint(atlag, jobb)',
    },
  },
]
