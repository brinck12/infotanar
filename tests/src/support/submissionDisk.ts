/**
 * A teszt-backend `submission-files` privat tarolojanak tartalma a lemezen (a privateDisk.ts
 * testvere az `exercise-files` tarolohoz). A backend konyvtarat a TEST_BACKEND_PATH adja
 * (alapertelmezes: ../backend).
 */
import { existsSync, mkdirSync, readdirSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

const BACKEND_PATH = process.env.TEST_BACKEND_PATH ?? '../backend'
const PRIVATE_ROOT = resolve(BACKEND_PATH, 'storage', 'app', 'private')
const SUBMISSIONS = join(PRIVATE_ROOT, 'submission-files')

/** Egy felhasznalo beadasi mappaja (`u{id}`). */
export function userSubmissionDir(userId: number): string {
  return join(SUBMISSIONS, `u${String(userId)}`)
}

export function submissionFileExists(relativePath: string): boolean {
  return existsSync(join(SUBMISSIONS, relativePath))
}

/** Sor nelkuli fajlt hoz letre a beadasi taroloban, `ageDays` napos modositasi idovel. */
export function plantSubmissionFile(relativePath: string, ageDays: number): void {
  const target = join(SUBMISSIONS, relativePath)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, 'arva')
  const when = new Date(Date.now() - ageDays * 86_400_000)
  utimesSync(target, when, when)
}

/** Fajlt hoz letre a feladatfajlok tarolojaban (szerzoi tartalom), csatolmany nelkul. */
export function plantExerciseFile(relativePath: string): string {
  const target = join(PRIVATE_ROOT, 'exercise-files', relativePath)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, 'arva')
  return target
}

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

/** Egy felhasznalo beadasi fajljai (abszolut utvonalak). */
export function submissionFilesOf(userId: number): string[] {
  const directory = userSubmissionDir(userId)
  return existsSync(directory) ? walk(directory) : []
}

/** Teszt utani takaritas: a felhasznalo beadasi mappaja. */
export function removeUserSubmissionDir(userId: number): void {
  rmSync(userSubmissionDir(userId), { recursive: true, force: true })
}
