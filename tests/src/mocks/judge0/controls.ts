// A Judge0 mock (server.ts) vezerlo stringjei a kodfuttatas uj agaihoz:
// reszfeladatok es adatfajlok. A regi ketto (hibas kimenet, elerhetetlen
// szolgaltatas) a src/data/seed.ts JUDGE0_CONTROL objektumaban maradt.
//
// A mock nem futtat kodot: ha a forraskod tartalmazza a stringet, a mock a
// hozza tartozo, rogzitett viselkedest jatssza le.

import { SEEDED } from '../../data/seed'

export const JUDGE0_EXECUTION_CONTROL = {
  /**
   * A 8. fixture feladat (reszfeladatok) felig jo megoldasa: az 1. resz
   * helyes, a 2. resz hibas. A kimenet: SUBTASKS_PARTIAL_STDOUT.
   */
  subtasks: 'PW_JUDGE0_SUBTASKS',
  /**
   * A 8. fixture feladat helyes megoldasa, ami az adatfajlbol szamol: a mock
   * az `additional_files` zipbol kiolvassa az `adatok.txt`-t, es kiirja a
   * szamok darabszamat es osszeget. Fajl nelkul a kimenet a
   * JUDGE0_FILE_OUTPUT megfelelo erteke, tehat a megoldas elbukik.
   */
  requireFile: 'PW_JUDGE0_REQUIRE_FILE',
} as const

/** A `requireFile` program kimenete, ha nem tud szamolni. */
export const JUDGE0_FILE_OUTPUT = {
  /** A keresben nem volt `additional_files` mezo (vagy ures volt). */
  noArchive: 'PW_NO_ADDITIONAL_FILES\n',
  /** Volt zip, de az adatfajl nincs benne. */
  noDataFile: 'PW_DATA_FILE_MISSING\n',
} as const

/** Az adatfajl neve, amit a `requireFile` program megnyit. */
export const DATA_FILE_NAME = SEEDED.typed.subtasks.source.name

/** A `subtasks` program kimenete: a 2. resz erteke 7, pedig 6 az elvart. */
export const SUBTASKS_PARTIAL_STDOUT = '1. feladat\n3\n2. feladat\n7\n'

/** A reszfeladatos fixture kimenete adott szamokra (darabszam, osszeg). */
export function subtasksStdout(numbers: number[]): string {
  const sum = numbers.reduce((total, value) => total + value, 0)
  return `1. feladat\n${String(numbers.length)}\n2. feladat\n${String(sum)}\n`
}
