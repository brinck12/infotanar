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
  /** A fo feladat tesztesetei: 2 nyilvanos + 2 rejtett. */
  mainTask: { exampleCount: 2, hiddenCount: 2, pythonStarter: 'print()\n' },
  /** Rogzitett, megerositett fiokok; a jelszavuk a DEFAULT_PASSWORD. Az admin az egyetlen admin. */
  accounts: { admin: 'admin@infotanar.test', student: 'student@infotanar.test' },
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
