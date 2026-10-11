/**
 * A teszt-backend privat fajltarolojanak (exercise-files) tartalma a lemezen.
 * A backend konyvtarat a TEST_BACKEND_PATH adja (alapertelmezes: ../backend),
 * a Playwright a tests/ mappabol fut.
 */
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const BACKEND_PATH = process.env.TEST_BACKEND_PATH ?? '../backend'
const DISK_ROOT = resolve(BACKEND_PATH, 'storage', 'app', 'private', 'exercise-files')

function walk(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

/** Az osszes fajl a tarolon (abszolut utvonalak). */
export function exerciseFilesOnDisk(): Set<string> {
  return existsSync(DISK_ROOT) ? new Set(walk(DISK_ROOT)) : new Set()
}

/** Az `elotte` allapothoz kepest uj fajlok. */
export function newFilesSince(before: Set<string>): string[] {
  return [...exerciseFilesOnDisk()].filter((path) => !before.has(path))
}
