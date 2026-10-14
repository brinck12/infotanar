import { inflateRawSync } from 'node:zlib'

// A Judge0 `additional_files` mezoje: base64-elt zip, amit a valodi Judge0 a
// program munkakonyvtaraba csomagol ki. A mock ugyanezt memoriaban teszi meg,
// hogy a tesztek a tenylegesen elkuldott fajlneveket es tartalmakat lassak.
//
// Csak annyit tud, amennyit a PHP ZipArchive ir: tarolt (0) es deflate (8)
// bejegyzesek, zip64 es titkositas nelkul.

const END_OF_CENTRAL_DIRECTORY = Buffer.from([0x50, 0x4b, 0x05, 0x06])
const CENTRAL_HEADER = 0x02014b50
const METHOD_STORED = 0

/** A mezo erteke hianyzik vagy ures: a keresben nem volt adatfajl. */
export function hasAdditionalFiles(value: unknown): value is string {
  return typeof value === 'string' && value !== ''
}

/** A zip bejegyzesei fajlnev szerint. Hibas zipre kivetelt dob (a mock 500-at ad). */
export function readAdditionalFiles(base64: string): Map<string, Buffer> {
  const archive = Buffer.from(base64, 'base64')
  const end = archive.lastIndexOf(END_OF_CENTRAL_DIRECTORY)
  if (end < 0) throw new Error('additional_files is not a zip archive')

  const files = new Map<string, Buffer>()
  const entryCount = archive.readUInt16LE(end + 10)
  let offset = archive.readUInt32LE(end + 16)

  for (let index = 0; index < entryCount; index++) {
    if (archive.readUInt32LE(offset) !== CENTRAL_HEADER) throw new Error('additional_files has a broken central directory')

    const method = archive.readUInt16LE(offset + 10)
    const compressedSize = archive.readUInt32LE(offset + 20)
    const nameLength = archive.readUInt16LE(offset + 28)
    const extraLength = archive.readUInt16LE(offset + 30)
    const commentLength = archive.readUInt16LE(offset + 32)
    const localHeader = archive.readUInt32LE(offset + 42)
    const name = archive.toString('utf8', offset + 46, offset + 46 + nameLength)

    // A helyi fejlec nev- es extra-hossza elterhet a kozponti konyvtaretol.
    const dataStart = localHeader + 30 + archive.readUInt16LE(localHeader + 26) + archive.readUInt16LE(localHeader + 28)
    const data = archive.subarray(dataStart, dataStart + compressedSize)

    files.set(name, method === METHOD_STORED ? data : inflateRawSync(data))
    offset += 46 + nameLength + extraLength + commentLength
  }

  return files
}
