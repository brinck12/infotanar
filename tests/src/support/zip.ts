import { deflateRawSync } from 'node:zlib'

/**
 * Minimalis zip-iro fuggoseg nelkul: a binaris fixture-ok generalasahoz
 * (fixtures/files/generate.ts) es a tesztekben memoriaban osszerakott
 * archivumokhoz (pl. zip-bomba, hianyos csomag).
 *
 * A kimenet bajtra determinisztikus: a bejegyzesek a megadott sorrendben
 * kovetkeznek, az idobelyeg rogzitett. Zip64-et nem tud (4 GB es 65535
 * bejegyzes alatt), a teszteknek ennyi boven eleg.
 */
export interface ZipEntry {
  /** Utvonal a csomagon belul, `/` elvalasztoval. */
  name: string
  data: Buffer | string
  /**
   * Tomorites nelkul tarolva. Az ODF csomag `mimetype` bejegyzesenek igy,
   * es elsokent kell allnia.
   */
  store?: boolean
}

const LOCAL_HEADER = 0x04034b50
const CENTRAL_HEADER = 0x02014b50
const END_OF_CENTRAL_DIRECTORY = 0x06054b50

/** "A kicsomagolashoz szukseges verzio": 2.0 (deflate). */
const VERSION = 20
/** 11. bit: a nevek UTF-8 kodolasuak. */
const FLAG_UTF8 = 0x0800
const METHOD_STORE = 0
const METHOD_DEFLATE = 8

/** Rogzitett idobelyeg (2026-01-01 00:00), hogy ujrageneralaskor ne valtozzon a fajl. */
const DOS_TIME = 0
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** Zip archivum a memoriaban, a megadott bejegyzesekkel es sorrendben. */
export function zipArchive(entries: ZipEntry[]): Buffer {
  const localParts: Buffer[] = []
  const centralParts: Buffer[] = []
  let offset = 0

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8')
    const content = typeof entry.data === 'string' ? Buffer.from(entry.data, 'utf8') : entry.data
    const method = entry.store ? METHOD_STORE : METHOD_DEFLATE
    const packed = entry.store ? content : deflateRawSync(content, { level: 9 })
    const checksum = crc32(content)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(LOCAL_HEADER, 0)
    local.writeUInt16LE(VERSION, 4)
    local.writeUInt16LE(FLAG_UTF8, 6)
    local.writeUInt16LE(method, 8)
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(packed.length, 18)
    local.writeUInt32LE(content.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)

    const central = Buffer.alloc(46)
    central.writeUInt32LE(CENTRAL_HEADER, 0)
    central.writeUInt16LE(VERSION, 4)
    central.writeUInt16LE(VERSION, 6)
    central.writeUInt16LE(FLAG_UTF8, 8)
    central.writeUInt16LE(method, 10)
    central.writeUInt16LE(DOS_TIME, 12)
    central.writeUInt16LE(DOS_DATE, 14)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(packed.length, 20)
    central.writeUInt32LE(content.length, 24)
    central.writeUInt16LE(name.length, 28)
    // Extra mezo, megjegyzes, lemezszam, belso es kulso attributum: mind 0.
    central.writeUInt32LE(offset, 42)

    localParts.push(local, name, packed)
    centralParts.push(central, name)
    offset += local.length + name.length + packed.length
  }

  const centralDirectory = Buffer.concat(centralParts)

  const end = Buffer.alloc(22)
  end.writeUInt32LE(END_OF_CENTRAL_DIRECTORY, 0)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralDirectory.length, 12)
  end.writeUInt32LE(offset, 16)

  return Buffer.concat([...localParts, centralDirectory, end])
}
