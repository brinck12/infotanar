/**
 * A tests/fixtures/files binaris fixture-jainak eloallitasa.
 *
 *   cd tests && npm run fixtures
 *
 * A fajlok verziokezeltek; ez a szkript arra valo, hogy ujra eloallithatok es
 * bovithetok legyenek (nincs hozza LibreOffice vagy Office). A kimenet bajtra
 * determinisztikus: valtozatlan szkript valtozatlan fajlokat ad.
 *
 * A fajlok valodi, a programokkal megnyithato OOXML/ODF csomagok, a
 * legkevesebb resszel, ami az ertekelohoz kell. A tartalmukat a
 * backend/database/seeders/ApiTestSeeder.php ertekelolapja varja el
 * (5. feladat), a nevuket es a vart pontszamokat a src/data/seed.ts rogziti:
 * a harmat egyutt kell modositani.
 *
 * Uj fixture: uj bejegyzes a FILES listaban. Mas csomagok a sajat mappajukba
 * (fixtures/files/<terulet>/) tegyek a sajatjukat, sajat generatorral, amely
 * innen a segedfuggvenyeket atveheti.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { zipArchive, type ZipEntry } from '../../src/support/zip'

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'

// ---------------------------------------------------------------------------
// XLSX (SpreadsheetML)
// ---------------------------------------------------------------------------

const SHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const CONTENT_TYPES_NS = 'http://schemas.openxmlformats.org/package/2006/content-types'

interface SheetVariant {
  /** A B2 cella erteke (szamformatum: 0.00, beepitett numFmtId 2). */
  b2: number
  /** A B3 cella: keplet a gyorsitotarazott ertekkel, vagy sima allando. */
  b3: { formula: string; value: number } | { value: number }
}

/** Az A1:A5 tartomany; az osszege 42, ezert a SUM(A1:A5) gyorsitotarazott erteke is 42. */
const COLUMN_A = [10, 8, 12, 7, 5] as const

function xlsx(variant: SheetVariant): Buffer {
  const b3 = 'formula' in variant.b3 ? `<f>${variant.b3.formula}</f><v>${variant.b3.value}</v>` : `<v>${variant.b3.value}</v>`

  const rows = COLUMN_A.map((value, index) => {
    const row = index + 1
    const extra =
      row === 1
        ? '<c r="B1" t="s"><v>0</v></c>' // megosztott szoveg: "Összeg"
        : row === 2
          ? `<c r="B2" s="1"><v>${variant.b2}</v></c>`
          : row === 3
            ? `<c r="B3">${b3}</c>`
            : ''
    return `<row r="${row}"><c r="A${row}"><v>${value}</v></c>${extra}</row>`
  }).join('')

  const entries: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      data:
        `${XML}<Types xmlns="${CONTENT_TYPES_NS}">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data:
        `${XML}<Relationships xmlns="${PACKAGE_REL_NS}">` +
        `<Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/>` +
        '</Relationships>',
    },
    {
      name: 'xl/workbook.xml',
      data:
        `${XML}<workbook xmlns="${SHEET_NS}" xmlns:r="${REL_NS}">` +
        '<sheets><sheet name="Munka1" sheetId="1" r:id="rId1"/></sheets>' +
        '</workbook>',
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        `${XML}<Relationships xmlns="${PACKAGE_REL_NS}">` +
        `<Relationship Id="rId1" Type="${REL_NS}/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="${REL_NS}/styles" Target="styles.xml"/>` +
        `<Relationship Id="rId3" Type="${REL_NS}/sharedStrings" Target="sharedStrings.xml"/>` +
        '</Relationships>',
    },
    {
      name: 'xl/worksheets/sheet1.xml',
      data: `${XML}<worksheet xmlns="${SHEET_NS}"><dimension ref="A1:B5"/><sheetData>${rows}</sheetData></worksheet>`,
    },
    {
      name: 'xl/styles.xml',
      data:
        `${XML}<styleSheet xmlns="${SHEET_NS}">` +
        '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2">' +
        '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        // A beepitett 2-es szamformatum: "0.00" (a fajlban nincs kulon numFmt bejegyzes).
        '<xf numFmtId="2" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
        '</cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
        '</styleSheet>',
    },
    {
      name: 'xl/sharedStrings.xml',
      data: `${XML}<sst xmlns="${SHEET_NS}" count="1" uniqueCount="1"><si><t>Összeg</t></si></sst>`,
    },
  ]

  return zipArchive(entries)
}

// ---------------------------------------------------------------------------
// ODS (OpenDocument Spreadsheet): ugyanaz a tartalom, mint a jo xlsx-ben
// ---------------------------------------------------------------------------

const ODF_NS =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
  'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" ' +
  'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" ' +
  'xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0" ' +
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" ' +
  'xmlns:of="urn:oasis:names:tc:opendocument:xmlns:of:1.2"'

const ODS_MIME = 'application/vnd.oasis.opendocument.spreadsheet'

function ods(): Buffer {
  const number = (value: number, attributes = '', shown = String(value)): string =>
    `<table:table-cell${attributes} office:value-type="float" office:value="${value}"><text:p>${shown}</text:p></table:table-cell>`

  const rows = COLUMN_A.map((value, index) => {
    const row = index + 1
    const extra =
      row === 1
        ? '<table:table-cell office:value-type="string"><text:p>Összeg</text:p></table:table-cell>'
        : row === 2
          ? number(42, ' table:style-name="ce1"', '42,00')
          : row === 3
            ? number(42, ' table:formula="of:=SUM([.A1:.A5])"')
            : ''
    return `<table:table-row>${number(value)}${extra}</table:table-row>`
  }).join('')

  const entries: ZipEntry[] = [
    // Az ODF eloirasa: a mimetype az elso bejegyzes, tomorites nelkul.
    { name: 'mimetype', data: ODS_MIME, store: true },
    {
      name: 'META-INF/manifest.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">' +
        `<manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="${ODS_MIME}"/>` +
        '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' +
        '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>' +
        '</manifest:manifest>',
    },
    {
      name: 'content.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        `<office:document-content ${ODF_NS} office:version="1.2">` +
        '<office:automatic-styles>' +
        // Ket tizedesjegy: az xlsx "0.00" formatumanak megfeleloje.
        '<number:number-style style:name="N2"><number:number number:decimal-places="2" number:min-decimal-places="2" number:min-integer-digits="1"/></number:number-style>' +
        '<style:style style:name="ce1" style:family="table-cell" style:parent-style-name="Default" style:data-style-name="N2"/>' +
        '</office:automatic-styles>' +
        '<office:body><office:spreadsheet>' +
        `<table:table table:name="Munka1"><table:table-column table:number-columns-repeated="2"/>${rows}</table:table>` +
        '</office:spreadsheet></office:body>' +
        '</office:document-content>',
    },
    {
      name: 'styles.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        `<office:document-styles ${ODF_NS} office:version="1.2">` +
        '<office:styles><style:style style:name="Default" style:family="table-cell"/></office:styles>' +
        '</office:document-styles>',
    },
  ]

  return zipArchive(entries)
}

// ---------------------------------------------------------------------------
// DOCX (WordprocessingML)
// ---------------------------------------------------------------------------

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

/** Lapmeret es margo twipben (1 cm = 567 twip, 1 huvelyk = 1440 twip). */
interface PageSetup {
  width: number
  height: number
  margin: number
}

const A4: PageSetup = { width: 11906, height: 16838, margin: 1417 } // 210 x 297 mm, 2,5 cm margo
const LETTER: PageSetup = { width: 12240, height: 15840, margin: 1440 } // 8,5 x 11 huvelyk, 1 huvelyk margo

function docx(page: PageSetup): Buffer {
  const entries: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      data:
        `${XML}<Types xmlns="${CONTENT_TYPES_NS}">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
        '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>' +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data:
        `${XML}<Relationships xmlns="${PACKAGE_REL_NS}">` +
        `<Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="word/document.xml"/>` +
        '</Relationships>',
    },
    {
      name: 'word/_rels/document.xml.rels',
      data:
        `${XML}<Relationships xmlns="${PACKAGE_REL_NS}">` +
        `<Relationship Id="rId1" Type="${REL_NS}/styles" Target="styles.xml"/>` +
        '</Relationships>',
    },
    {
      name: 'word/document.xml',
      data:
        `${XML}<w:document xmlns:w="${WORD_NS}"><w:body>` +
        '<w:p><w:pPr><w:pStyle w:val="Cmsor1"/></w:pPr><w:r><w:t>PW teszt dokumentum</w:t></w:r></w:p>' +
        '<w:p><w:r><w:t xml:space="preserve">Ez a bekezdés a lapméret vizsgálatához készült.</w:t></w:r></w:p>' +
        '<w:sectPr>' +
        `<w:pgSz w:w="${page.width}" w:h="${page.height}"/>` +
        `<w:pgMar w:top="${page.margin}" w:right="${page.margin}" w:bottom="${page.margin}" w:left="${page.margin}" w:header="708" w:footer="708" w:gutter="0"/>` +
        '</w:sectPr>' +
        '</w:body></w:document>',
    },
    {
      name: 'word/styles.xml',
      data:
        `${XML}<w:styles xmlns:w="${WORD_NS}">` +
        '<w:docDefaults>' +
        '<w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="hu-HU"/></w:rPr></w:rPrDefault>' +
        '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault>' +
        '</w:docDefaults>' +
        '<w:style w:type="paragraph" w:default="1" w:styleId="Norml"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
        '<w:style w:type="paragraph" w:styleId="Cmsor1"><w:name w:val="heading 1"/><w:basedOn w:val="Norml"/><w:next w:val="Norml"/><w:qFormat/>' +
        '<w:pPr><w:keepNext/><w:spacing w:before="240" w:after="0"/><w:outlineLvl w:val="0"/></w:pPr>' +
        '<w:rPr><w:b/><w:sz w:val="32"/></w:rPr>' +
        '</w:style>' +
        '</w:styles>',
    },
  ]

  return zipArchive(entries)
}

// ---------------------------------------------------------------------------
// Egyeb
// ---------------------------------------------------------------------------

/** 1x1 keppontos PNG (ugyanaz, mint a seeder mintakepe). */
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')

const GOOD_SHEET: SheetVariant = { b2: 42, b3: { formula: 'SUM(A1:A5)', value: 42 } }

const FILES: Record<string, Buffer> = {
  // Hibatlan megoldas az 5. feladathoz: B2 = 42 (0.00 formatum), B3 = SUM(A1:A5).
  'pw-tabla-ok.xlsx': xlsx(GOOD_SHEET),
  // Hibas megoldas: B2 = 41, B3 allando (nincs keplet); a szamformatum jo.
  'pw-tabla-rossz.xlsx': xlsx({ b2: 41, b3: { value: 42 } }),
  // A jo megoldas OpenDocument formatumban (a keplet neve itt is angol: SUM).
  'pw-tabla.ods': ods(),
  // Atnevezett szovegfajl: nem zip, a feltoltes elutasitja.
  'pw-serult.xlsx': Buffer.from('Ez nem munkafüzet, csak egy átnevezett szövegfájl.\n', 'utf8'),
  // Ervenyes zip, de nincs benne munkafuzet: a feltoltes atmegy, az ertekeles "failed".
  'pw-ures-zip.xlsx': zipArchive([{ name: 'olvass-el.txt', data: 'Ebben a csomagban nincs munkafüzet.\n' }]),
  // Makros kiterjesztes: mar a kiterjesztes miatt elutasitjuk.
  'pw-makro.xlsm': xlsx(GOOD_SHEET),
  // Sima kiterjesztes, de makrot hordoz (xl/vbaProject.bin): a csomag tartalma miatt utasitjuk el.
  'pw-makro-rejtett.xlsx': zipArchive([
    { name: 'xl/vbaProject.bin', data: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]) },
    { name: 'olvass-el.txt', data: 'Makrót hordozó csomag a feltöltési ellenőrzés tesztjéhez.\n' },
  ]),
  'pw-szoveg-a4.docx': docx(A4),
  'pw-szoveg-letter.docx': docx(LETTER),
  // Admin csatolmanyokhoz: mintakep, forrasfajl es forras-zip.
  'pw-minta.png': PNG_1X1,
  'pw-adatok.txt': Buffer.from('1\n2\n3\n', 'utf8'),
  'pw-forrasok.zip': zipArchive([{ name: 'adatok.txt', data: '1\n2\n3\n' }]),
}

mkdirSync(__dirname, { recursive: true })

for (const [name, contents] of Object.entries(FILES)) {
  writeFileSync(join(__dirname, name), contents)
  console.log(`${name}  ${contents.length} bajt`)
}
