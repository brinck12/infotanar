/**
 * A valodi backend fixture adatai, amelyeket a
 * backend/database/seeders/ApiTestSeeder.php hoz letre minden API
 * tesztfuttatas elott (migrate:fresh). Ha a seeder valtozik, ezt is
 * frissiteni kell.
 */
export const SEEDED = {
  topic: { slug: 'pw-teszt-temakor', publishedTaskCount: 3 },
  tasks: {
    main: 'PW teszt: Összegzés',
    csharpOnly: 'PW teszt: Csak C# feladat',
    advanced: 'PW teszt: Emelt szintű feladat',
    unpublished: 'PW teszt: Nem publikus feladat',
  },
  /**
   * A nem publikus feladat azonositoja szandekosan rogzitett: sosem
   * jelenik meg listaban, igy nem kereshetunk ra cimmel.
   */
  unpublishedTaskId: 2,
  /**
   * Piszkozat (nem publikalt) track-ben levo, onmagaban publikalt lecke es feladat; a seeder utolso elemei.
   * Az azonositokat cim alapjan kell kikeresni (src/support/reliability.ts).
   */
  draftTrackTask: 'PW teszt: Piszkozat track feladata',
  /** A fo feladat tesztesetei: 2 nyilvanos + 2 rejtett. */
  mainTask: { exampleCount: 2, hiddenCount: 2, pythonStarter: 'print()\n' },
  /** Rogzitett, megerositett fiokok; a jelszavuk a DEFAULT_PASSWORD. Az admin az egyetlen admin. */
  accounts: { admin: 'admin@infotanar.test', student: 'student@infotanar.test' },

  /**
   * Tipusos feladatok: a track masodik modulja. A feladat es a leckeje azonos
   * azonositot kap (5..9), mind kozepszintu es publikalt. A regi fixture-ok
   * (1..4. feladat, `topic`) ettol fuggetlenek es valtozatlanok.
   */
  typed: {
    topic: { slug: 'pw-tipusos-temakor', name: 'PW teszt típusos témakör', publishedTaskCount: 5 },

    /** Tablazatos fajlfeladat ingyenes leckeben, 10 pontos ertekelolappal es mintakeppel. */
    sheetUpload: {
      id: 5,
      lessonId: 5,
      title: 'PW teszt: Táblázat feltöltés',
      kind: 'sheet_upload',
      free: true,
      spec: {
        steps: ['Rendezd a táblázatot.'],
        deliverable: 'tabla',
        accepted_extensions: ['.xlsx', '.ods'],
        software: ['Excel'],
        exam_reference: null,
        exam_points: 10,
        /** Diaknak soha nem megy ki. */
        raw_points: 10,
      },
      /** Az ertekelolap pontjai sorrendben (rubric_items id 1..4); az utolso kezi. */
      rubric: [
        { id: 1, group: 'Képletek', label: 'A B2 cella értéke 42', check_type: 'cell_value', property: 'Munka1!B2', expected: '42', points: 4, mode: 'auto', hint: 'A B2 cellában 42-nek kell állnia.' },
        { id: 2, group: 'Képletek', label: 'A B3 cellában SZUM függvény áll', check_type: 'cell_formula', property: 'Munka1!B3', expected: 'fn:SZUM', points: 3, mode: 'auto', hint: 'A B3 cellába a SZUM függvénnyel számolj.' },
        { id: 3, group: 'Formázás', label: 'A B2 cella két tizedesjegyet mutat', check_type: 'number_format', property: 'Munka1!B2', expected: '0,00', points: 2, mode: 'auto', hint: 'Állíts be két tizedesjegyet a B2 cellán.' },
        { id: 4, group: 'Formázás', label: 'A táblázat megjelenése egyezik a mintával', check_type: 'manual', property: '', expected: '', points: 1, mode: 'manual', hint: 'Hasonlítsd a mintához.' },
      ],
      rubricTotal: 10,
      manualItemId: 4,
      /** A mintakep (csatolmany): 1x1 keppontos PNG. */
      sampleImage: { attachmentId: 1, name: 'minta.png', size: 70 },
      /**
       * A fixture fajlok vart eredmenye (fixtures/files): pontszam a kezi pont
       * megjelolese elott, es csoportonkent. A megoldottsag kuszobe 80% = 8 pont.
       */
      expected: {
        ok: { score: 9, groups: { Képletek: 7, Formázás: 2 } },
        okWithManualMark: { score: 10 },
        wrong: { score: 2, groups: { Képletek: 0, Formázás: 2 }, failingItemIds: [1, 2] },
      },
    },

    /** Szoveges fajlfeladat FIZETOS leckeben: zarolasi szcenariokhoz (elofizetes nelkul 403). */
    docUpload: {
      id: 6,
      lessonId: 6,
      title: 'PW teszt: Szöveg feltöltés',
      kind: 'doc_upload',
      free: false,
      acceptedExtensions: ['.docx'],
      rubric: [{ id: 5, group: 'Oldalbeállítás', label: 'A lapméret A4', check_type: 'page_setup', property: 'page_size', expected: 'A4', points: 2, mode: 'auto', hint: 'Állítsd a lapméretet A4-re.' }],
      rubricTotal: 2,
    },

    /** Weboldal-feladat: a bongeszo ellenoriz, a szerveren nincs beadas es nincs allapot. */
    web: {
      id: 7,
      lessonId: 7,
      title: 'PW teszt: Weboldal',
      kind: 'web',
      free: true,
      fileName: 'index.html',
      check: { id: 1, label: 'Az oldal címe „PW teszt”', points: 1, hint: 'Írd be a címet a title elembe.', type: 'title', value: 'PW teszt' },
    },

    /** Reszfeladatos Python kodfeladat egy nyilvanos tesztesettel es egy forrasfajllal. */
    subtasks: {
      id: 8,
      lessonId: 8,
      title: 'PW teszt: Részfeladatok',
      kind: 'code',
      free: true,
      language: 'python',
      subtasks: [
        { number: 1, label: 'Darabszám', points: 2 },
        { number: 2, label: 'Összeg', points: 3 },
      ],
      maxPoints: 5,
      expectedStdout: '1. feladat\n3\n2. feladat\n6\n',
      /** A forrasfajl (csatolmany) es a tartalma. */
      source: { attachmentId: 2, name: 'adatok.txt', size: 6, content: '1\n2\n3\n' },
    },

    /** Bongeszos tablazatos gyakorlo. */
    sheetBrowser: {
      id: 9,
      lessonId: 9,
      title: 'PW teszt: Táblázat böngészőben',
      kind: 'sheet_browser',
      free: true,
      columns: 3,
      rows: 5,
      cells: { A1: '10', A2: '20' },
      check: { id: 1, label: 'Az A3 cellában képlet áll', type: 'has_formula', cell: 'A3' },
    },
  },

  /** Gyakorlo vizsgak. A reszek `order` erteke 1-tol indul (position + 1). */
  exams: {
    /** Publikalt, idozitheto vizsga ket resszel es forras-zippel. */
    main: {
      id: 1,
      title: 'PW teszt vizsga',
      session: '2026-05',
      level: 'kozep',
      minutes: 30,
      points: 20,
      parts: [
        /** Fajlos resz: az 5. feladat (tablazat feltoltes). */
        { id: 1, order: 1, key: 'tablazat', name: 'Táblázatkezelés', exerciseId: 5, points: 10, minutes: 15 },
        /** Szerkesztos resz: a 8. feladat (reszfeladatok). */
        { id: 2, order: 2, key: 'programozas', name: 'Algoritmizálás és programozás', exerciseId: 8, points: 10, minutes: 15 },
      ],
      sourceZip: { attachmentId: 3, name: 'forrasok.zip' },
    },
    /**
     * 0 perces vizsga (az API ilyet nem enged letrehozni): a teszt-backend
     * EXAMS_GRACE_SECONDS=0 beallitasaval egy probalkozas azonnal lejar, igy az
     * idotullepes varakozas nelkul tesztelheto.
     */
    expired: {
      id: 2,
      title: 'PW teszt vizsga (lejárt)',
      session: '2026-10',
      level: 'kozep',
      minutes: 0,
      points: 10,
      parts: [{ id: 3, order: 1, key: 'tablazat', name: 'Táblázatkezelés', exerciseId: 5, points: 10, minutes: 15 }],
    },
    /** Nem publikus, resz nelkul: diaknak 404, adminnak 200. */
    unpublished: { id: 3, title: 'PW teszt vizsga (nem publikus)', session: '2027-05', level: 'kozep', minutes: 30, points: 10 },
  },
} as const

/**
 * A fixtures/files binaris fixture-jai (eloallitas: `npm run fixtures`);
 * betoltes: `fixtureFile(FIXTURE_FILES.sheetOk)` (src/data/files.ts).
 */
export const FIXTURE_FILES = {
  /** Hibatlan megoldas az 5. feladathoz: B2 = 42 ("0.00" formatum), B3 = SUM(A1:A5). */
  sheetOk: 'pw-tabla-ok.xlsx',
  /** Hibas megoldas: B2 = 41, a B3 allando (nincs keplet); a szamformatum jo. */
  sheetWrong: 'pw-tabla-rossz.xlsx',
  /** A hibatlan megoldas OpenDocument formatumban. */
  sheetOds: 'pw-tabla.ods',
  /** Atnevezett szovegfajl (nem zip): a feltoltes 422-vel elutasitja. */
  corrupt: 'pw-serult.xlsx',
  /** Ervenyes zip munkafuzet nelkul: a feltoltes atmegy, az ertekeles `failed`. */
  emptyZip: 'pw-ures-zip.xlsx',
  /** Makros kiterjesztes: a kiterjesztes miatt 422. */
  macro: 'pw-makro.xlsm',
  /** .xlsx kiterjesztes, de `xl/vbaProject.bin` van benne: a tartalma miatt 422. */
  hiddenMacro: 'pw-makro-rejtett.xlsx',
  docA4: 'pw-szoveg-a4.docx',
  docLetter: 'pw-szoveg-letter.docx',
  /** Admin csatolmanyokhoz. */
  sampleImage: 'pw-minta.png',
  dataFile: 'pw-adatok.txt',
  sourceZip: 'pw-forrasok.zip',
} as const

/**
 * A teszt-backend kornyezete elter az alapertekektol (config/web-servers.ts),
 * hogy a korlatok varakozas es nagy fajlok nelkul tesztelhetok legyenek.
 */
export const TEST_BACKEND = {
  /** FILETASKS_MAX_DOCUMENT_MB=1: ennel nagyobb xlsx/docx "tul nagy" (422). A PHP sajat korlatja 2 MB. */
  maxDocumentBytes: 1024 * 1024,
  /** EXAMS_GRACE_SECONDS=0: a hatarido utan nincs turelmi ido. */
  examGraceSeconds: 0,
} as const

/**
 * Vezerlo stringek a Judge0 mockhoz (src/mocks/judge0/server.ts): ha a
 * forraskod tartalmazza, a mock a megfelelo hibaagat jatssza le.
 */
export const JUDGE0_CONTROL = {
  forceWrong: 'PW_JUDGE0_FORCE_WRONG',
  forceUnavailable: 'PW_JUDGE0_FORCE_UNAVAILABLE',
} as const

/** Egy "echo" program: a stdin-t irja ki, amit a Judge0 mock mindig elfogad. */
export const ECHO_PROGRAM = 'print(input())'
