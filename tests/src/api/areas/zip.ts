/**
 * Zip-alapu feltoltesek a fajlbeadas-tesztekhez: a generalt, veszelyes csomagok.
 * A zip-iro maga a ../../support/zip.ts.
 */
import { zipArchive } from '../../support/zip'

/**
 * Zip-bomba: egyetlen, kicsomagolva 20 MB-os, de par KB-ra tomorodo bejegyzes.
 * A feltoltes merete kicsi (a PHP 2 MB-os korlata alatt), a tomorites aranya
 * viszont messze a 200-as hatar folott van.
 */
export function zipBomb(): Buffer {
  return zipArchive([{ name: 'xl/workbook.xml', data: Buffer.alloc(20 * 1024 * 1024, 0x20) }])
}
