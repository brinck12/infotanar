/**
 * A tablazatos ertekelo (WP3) kiegeszito fixture-jei: egy "teljes" munkafuzet
 * xlsx es ods formatumban, amely minden vizsgalattipus (rendezes, keplet,
 * szamformatum, diagram, nyomtatasi terulet, oszlop/sor, felteteles formazas)
 * adatat tartalmazza.
 *
 *   cd tests && npx tsx fixtures/files/spreadsheet/generate.ts
 *
 * A tartalom (a `Adatok` munkalapon):
 *
 *        A       B     C (rejtett)     D
 *   1  Név     Pont   Dupla          Összeg
 *   2  Anna    50     =B2*2          =SUM(B2:B6)      150
 *   3  Béla    40     =B3*2          =IF(D2>100,"Sok","Kevés")  Sok
 *   4  Cili    30     =B4*2
 *   5  Dóra    20     =B5*2
 *   6  Ede     10     =B6*2
 *
 *  - A2:A6 szoveg szerint novekvo, B2:B6 szam szerint csokkeno;
 *  - C2:C6 `# ##0 "Ft"` formatum, masolt kepletek (a B oszlopra hivatkoznak);
 *  - A oszlop 20 karakter szeles, a C oszlop rejtett, a 3. sor 30 pont magas;
 *  - nyomtatasi terulet: A1:D10;
 *  - felteteles formazas: B2:B6 > 25 piros kitoltessel, A2:A6 "a" betut tartalmaz;
 *  - egy diagram: oszlopdiagram, "Pontok" cimmel, "Név" / "Pont" tengelycimmel,
 *    2 adatsor, jelmagyarazat, adatfeliratok.
 * A masodik munkalap neve `Összesítő`.
 *
 * A fajlok valodi OOXML/ODF csomagok, de csak PHP-vel olvastuk be oket; sem
 * Excelben, sem LibreOffice-ban nem nyitottuk meg.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { zipArchive, type ZipEntry } from '../../../src/support/zip'

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
const SHEET_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'
const CONTENT_TYPES_NS = 'http://schemas.openxmlformats.org/package/2006/content-types'
const CHART_NS = 'http://schemas.openxmlformats.org/drawingml/2006/chart'
const DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const SPREADSHEET_DRAWING_NS = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'

const NAMES = ['Anna', 'Béla', 'Cili', 'Dóra', 'Ede'] as const
const POINTS = [50, 40, 30, 20, 10] as const

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------

function sharedStrings(): { xml: string; index: Map<string, number> } {
  const list = ['Név', 'Pont', 'Dupla', 'Összeg', ...NAMES, 'Összesen']
  const index = new Map(list.map((text, position) => [text, position]))
  const items = list.map((text) => `<si><t>${text}</t></si>`).join('')
  return {
    xml: `${XML}<sst xmlns="${SHEET_NS}" count="${list.length}" uniqueCount="${list.length}">${items}</sst>`,
    index,
  }
}

function adatokSheet(strings: Map<string, number>): string {
  const text = (address: string, value: string): string => `<c r="${address}" t="s"><v>${String(strings.get(value))}</v></c>`

  const rows = [
    `<row r="1">${text('A1', 'Név')}${text('B1', 'Pont')}${text('C1', 'Dupla')}${text('D1', 'Összeg')}</row>`,
    ...NAMES.map((name, index) => {
      const row = index + 2
      const shared = index === 0 ? `<f t="shared" ref="C2:C6" si="0">B2*2</f>` : `<f t="shared" si="0"/>`
      let extra = ''
      if (row === 2) extra = '<c r="D2"><f>SUM(B2:B6)</f><v>150</v></c>'
      if (row === 3) extra = '<c r="D3" t="str"><f>IF(D2&gt;100,"Sok","Kevés")</f><v>Sok</v></c>'
      const attributes = row === 3 ? ' ht="30" customHeight="1"' : ''
      return (
        `<row r="${row}"${attributes}>${text(`A${row}`, name)}<c r="B${row}"><v>${String(POINTS[index])}</v></c>` +
        `<c r="C${row}" s="1">${shared}<v>${String((POINTS[index] ?? 0) * 2)}</v></c>${extra}</row>`
      )
    }),
  ].join('')

  return (
    `${XML}<worksheet xmlns="${SHEET_NS}" xmlns:r="${REL_NS}"><dimension ref="A1:D6"/>` +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    '<cols><col min="1" max="1" width="20.7109375" customWidth="1"/><col min="3" max="3" width="9.140625" hidden="1" customWidth="1"/></cols>' +
    `<sheetData>${rows}</sheetData>` +
    '<conditionalFormatting sqref="B2:B6"><cfRule type="cellIs" dxfId="0" priority="1" operator="greaterThan"><formula>25</formula></cfRule></conditionalFormatting>' +
    '<conditionalFormatting sqref="A2:A6"><cfRule type="containsText" priority="2" operator="containsText" text="a"><formula>NOT(ISERROR(SEARCH("a",A2)))</formula></cfRule></conditionalFormatting>' +
    '<drawing r:id="rId1"/></worksheet>'
  )
}

function chartXml(): string {
  const title = (text: string): string => `<c:title><c:tx><c:rich><a:bodyPr/><a:p><a:r><a:t>${text}</a:t></a:r></a:p></c:rich></c:tx></c:title>`
  const series = (index: number): string =>
    `<c:ser><c:idx val="${String(index)}"/><c:order val="${String(index)}"/><c:val><c:numRef><c:f>Adatok!$B$2:$B$6</c:f></c:numRef></c:val></c:ser>`

  return (
    `${XML}<c:chartSpace xmlns:c="${CHART_NS}" xmlns:a="${DRAWING_NS}"><c:chart>${title('Pontok')}<c:autoTitleDeleted val="0"/><c:plotArea>` +
    `<c:barChart><c:barDir val="col"/><c:grouping val="clustered"/>${series(0)}${series(1)}` +
    '<c:dLbls><c:showLegendKey val="0"/><c:showVal val="1"/><c:showCatName val="0"/><c:showSerName val="0"/><c:showPercent val="0"/></c:dLbls>' +
    '<c:axId val="1"/><c:axId val="2"/></c:barChart>' +
    `<c:catAx><c:axId val="1"/><c:axPos val="b"/>${title('Név')}<c:crossAx val="2"/></c:catAx>` +
    `<c:valAx><c:axId val="2"/><c:axPos val="l"/>${title('Pont')}<c:crossAx val="1"/></c:valAx>` +
    '</c:plotArea><c:legend><c:legendPos val="r"/></c:legend></c:chart></c:chartSpace>'
  )
}

function drawingXml(): string {
  return (
    `${XML}<xdr:wsDr xmlns:xdr="${SPREADSHEET_DRAWING_NS}" xmlns:a="${DRAWING_NS}" xmlns:r="${REL_NS}" xmlns:c="${CHART_NS}">` +
    '<xdr:twoCellAnchor><xdr:from><xdr:col>5</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>1</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:from>' +
    '<xdr:to><xdr:col>12</xdr:col><xdr:colOff>0</xdr:colOff><xdr:row>15</xdr:row><xdr:rowOff>0</xdr:rowOff></xdr:to>' +
    '<xdr:graphicFrame macro=""><xdr:nvGraphicFramePr><xdr:cNvPr id="2" name="Diagram 1"/><xdr:cNvGraphicFramePr/></xdr:nvGraphicFramePr>' +
    '<xdr:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/></xdr:xfrm>' +
    '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="rId1"/></a:graphicData></a:graphic>' +
    '</xdr:graphicFrame><xdr:clientData/></xdr:twoCellAnchor></xdr:wsDr>'
  )
}

function xlsx(): Buffer {
  const strings = sharedStrings()
  const relationship = (id: string, type: string, target: string): string => `<Relationship Id="${id}" Type="${REL_NS}/${type}" Target="${target}"/>`

  const entries: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      data:
        `${XML}<Types xmlns="${CONTENT_TYPES_NS}">` +
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
        '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        '<Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>' +
        '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>' +
        '<Override PartName="/xl/charts/chart1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>' +
        '</Types>',
    },
    {
      name: '_rels/.rels',
      data: `${XML}<Relationships xmlns="${PACKAGE_REL_NS}">${relationship('rId1', 'officeDocument', 'xl/workbook.xml')}</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      data:
        `${XML}<workbook xmlns="${SHEET_NS}" xmlns:r="${REL_NS}">` +
        '<sheets><sheet name="Adatok" sheetId="1" r:id="rId1"/><sheet name="Összesítő" sheetId="2" r:id="rId2"/></sheets>' +
        '<definedNames><definedName name="_xlnm.Print_Area" localSheetId="0">Adatok!$A$1:$D$10</definedName></definedNames>' +
        '</workbook>',
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        `${XML}<Relationships xmlns="${PACKAGE_REL_NS}">` +
        relationship('rId1', 'worksheet', 'worksheets/sheet1.xml') +
        relationship('rId2', 'worksheet', 'worksheets/sheet2.xml') +
        relationship('rId3', 'styles', 'styles.xml') +
        relationship('rId4', 'sharedStrings', 'sharedStrings.xml') +
        '</Relationships>',
    },
    { name: 'xl/worksheets/sheet1.xml', data: adatokSheet(strings.index) },
    {
      name: 'xl/worksheets/_rels/sheet1.xml.rels',
      data: `${XML}<Relationships xmlns="${PACKAGE_REL_NS}">${relationship('rId1', 'drawing', '../drawings/drawing1.xml')}</Relationships>`,
    },
    {
      name: 'xl/worksheets/sheet2.xml',
      data: `${XML}<worksheet xmlns="${SHEET_NS}"><sheetData><row r="1"><c r="A1" t="s"><v>${String(strings.index.get('Összesen'))}</v></c></row></sheetData></worksheet>`,
    },
    { name: 'xl/drawings/drawing1.xml', data: drawingXml() },
    {
      name: 'xl/drawings/_rels/drawing1.xml.rels',
      data: `${XML}<Relationships xmlns="${PACKAGE_REL_NS}">${relationship('rId1', 'chart', '../charts/chart1.xml')}</Relationships>`,
    },
    { name: 'xl/charts/chart1.xml', data: chartXml() },
    {
      name: 'xl/styles.xml',
      data:
        `${XML}<styleSheet xmlns="${SHEET_NS}">` +
        '<numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0\\ &quot;Ft&quot;"/></numFmts>' +
        '<fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts>' +
        '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
        '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
        '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
        '<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
        '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>' +
        '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
        '<dxfs count="1"><dxf><fill><patternFill><bgColor rgb="FFFF0000"/></patternFill></fill></dxf></dxfs>' +
        '</styleSheet>',
    },
    { name: 'xl/sharedStrings.xml', data: strings.xml },
  ]

  return zipArchive(entries)
}

// ---------------------------------------------------------------------------
// ODS
// ---------------------------------------------------------------------------

const ODF_NS =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ' +
  'xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" ' +
  'xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" ' +
  'xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" ' +
  'xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0" ' +
  'xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" ' +
  'xmlns:chart="urn:oasis:names:tc:opendocument:xmlns:chart:1.0" ' +
  'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
  'xmlns:calcext="urn:org:documentfoundation:names:experimental:calc:xmlns:calcext:1.0" ' +
  'xmlns:of="urn:oasis:names:tc:opendocument:xmlns:of:1.2"'

const ODS_MIME = 'application/vnd.oasis.opendocument.spreadsheet'

function ods(): Buffer {
  const text = (value: string): string => `<table:table-cell office:value-type="string"><text:p>${value}</text:p></table:table-cell>`
  const number = (value: number, attributes = ''): string =>
    `<table:table-cell${attributes} office:value-type="float" office:value="${String(value)}"><text:p>${String(value)}</text:p></table:table-cell>`

  const rows = [
    `<table:table-row>${text('Név')}${text('Pont')}${text('Dupla')}${text('Összeg')}</table:table-row>`,
    ...NAMES.map((name, index) => {
      const row = index + 2
      const points = POINTS[index] ?? 0
      let extra = ''
      if (row === 2) extra = number(150, ' table:formula="of:=SUM([.B2:.B6])"')
      if (row === 3) extra = `<table:table-cell table:formula="of:=IF([.D2]&gt;100;&quot;Sok&quot;;&quot;Kevés&quot;)" office:value-type="string" office:string-value="Sok"><text:p>Sok</text:p></table:table-cell>`
      const style = row === 3 ? ' table:style-name="ro1"' : ''
      return `<table:table-row${style}>${text(name)}${number(points)}${number(points * 2, ` table:style-name="ce1" table:formula="of:=[.B${String(row)}]*2"`)}${extra}</table:table-row>`
    }),
  ].join('')

  const chart =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    `<office:document-content ${ODF_NS} office:version="1.2">` +
    '<office:automatic-styles>' +
    '<style:style style:name="ch1" style:family="chart"><style:chart-properties chart:data-label-number="value"/></style:style>' +
    '<style:style style:name="ch2" style:family="chart"><style:chart-properties chart:vertical="false"/></style:style>' +
    '</office:automatic-styles>' +
    '<office:body><office:chart><chart:chart chart:class="chart:bar">' +
    '<chart:title><text:p>Pontok</text:p></chart:title><chart:legend chart:legend-position="end"/>' +
    '<chart:plot-area chart:style-name="ch2">' +
    '<chart:axis chart:dimension="x" chart:name="primary-x"><chart:title><text:p>Név</text:p></chart:title></chart:axis>' +
    '<chart:axis chart:dimension="y" chart:name="primary-y"><chart:title><text:p>Pont</text:p></chart:title></chart:axis>' +
    '<chart:series chart:style-name="ch1" chart:values-cell-range-address="Adatok.B2:Adatok.B6"/>' +
    '<chart:series chart:style-name="ch1" chart:values-cell-range-address="Adatok.B2:Adatok.B6"/>' +
    '</chart:plot-area></chart:chart></office:chart></office:body></office:document-content>'

  const entries: ZipEntry[] = [
    { name: 'mimetype', data: ODS_MIME, store: true },
    {
      name: 'META-INF/manifest.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        '<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">' +
        `<manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="${ODS_MIME}"/>` +
        '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' +
        '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>' +
        '<manifest:file-entry manifest:full-path="Object 1/content.xml" manifest:media-type="text/xml"/>' +
        '</manifest:manifest>',
    },
    {
      name: 'content.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        `<office:document-content ${ODF_NS} office:version="1.2">` +
        '<office:automatic-styles>' +
        '<number:currency-style style:name="N1"><number:number number:decimal-places="0" number:min-integer-digits="1" number:grouping="true"/>' +
        '<number:text> </number:text><number:currency-symbol>Ft</number:currency-symbol></number:currency-style>' +
        '<style:style style:name="ce1" style:family="table-cell" style:parent-style-name="Default" style:data-style-name="N1"/>' +
        '<style:style style:name="co1" style:family="table-column"><style:table-column-properties style:column-width="3.837cm"/></style:style>' +
        '<style:style style:name="co2" style:family="table-column"><style:table-column-properties style:column-width="2.258cm"/></style:style>' +
        '<style:style style:name="ro1" style:family="table-row"><style:table-row-properties style:row-height="1.058cm" style:use-optimal-row-height="false"/></style:style>' +
        '<style:style style:name="cond1" style:family="table-cell"><style:table-cell-properties fo:background-color="#ff0000"/></style:style>' +
        '<style:style style:name="cond2" style:family="table-cell"><style:table-cell-properties fo:background-color="#ffff00"/></style:style>' +
        '</office:automatic-styles>' +
        '<office:body><office:spreadsheet>' +
        '<table:table table:name="Adatok" table:print-ranges="Adatok.A1:Adatok.D10">' +
        '<table:shapes><draw:frame draw:name="Diagram 1"><draw:object xlink:href="./Object 1" xlink:type="simple"/></draw:frame></table:shapes>' +
        '<table:table-column table:style-name="co1"/>' +
        '<table:table-column table:style-name="co2"/>' +
        '<table:table-column table:style-name="co2" table:visibility="collapse" table:number-columns-repeated="1"/>' +
        '<table:table-column table:style-name="co2" table:number-columns-repeated="1020"/>' +
        '<calcext:conditional-formats>' +
        '<calcext:conditional-format calcext:target-range-address="Adatok.B2:Adatok.B6"><calcext:condition calcext:value="cell-content()&gt;25" calcext:apply-style-name="cond1" calcext:base-cell-address="Adatok.B2"/></calcext:conditional-format>' +
        '<calcext:conditional-format calcext:target-range-address="Adatok.A2:Adatok.A6"><calcext:condition calcext:value="contains-text(&quot;a&quot;)" calcext:apply-style-name="cond2" calcext:base-cell-address="Adatok.A2"/></calcext:conditional-format>' +
        '</calcext:conditional-formats>' +
        rows +
        '</table:table>' +
        '<table:table table:name="Összesítő"><table:table-column/>' +
        `<table:table-row>${text('Összesen')}</table:table-row></table:table>` +
        '</office:spreadsheet></office:body></office:document-content>',
    },
    {
      name: 'styles.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>\n' +
        `<office:document-styles ${ODF_NS} office:version="1.2">` +
        '<office:styles><style:style style:name="Default" style:family="table-cell"/></office:styles>' +
        '</office:document-styles>',
    },
    { name: 'Object 1/content.xml', data: chart },
  ]

  return zipArchive(entries)
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Kiegeszito fixture-ok: magyar rendezes, ellenseges sor, stilusok a styles.xml-ben
// ---------------------------------------------------------------------------

/** Legkisebb munkafuzet egyetlen munkalappal; a cellak szovege beagyazott (inlineStr). */
function miniXlsx(sheetData: string): Buffer {
  return zipArchive([
    {
      name: '[Content_Types].xml',
      data:
        `${XML}<Types xmlns="${CONTENT_TYPES_NS}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        '<Default Extension="xml" ContentType="application/xml"/>' +
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
    },
    {
      name: '_rels/.rels',
      data: `${XML}<Relationships xmlns="${PACKAGE_REL_NS}"><Relationship Id="rId1" Type="${REL_NS}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      data: `${XML}<workbook xmlns="${SHEET_NS}" xmlns:r="${REL_NS}"><sheets><sheet name="Munka1" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data: `${XML}<Relationships xmlns="${PACKAGE_REL_NS}"><Relationship Id="rId1" Type="${REL_NS}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    },
    { name: 'xl/worksheets/sheet1.xml', data: `${XML}<worksheet xmlns="${SHEET_NS}"><sheetData>${sheetData}</sheetData></worksheet>` },
  ])
}

/** A: magyar ABC szerint rendezett (cs, gy, sz, zs onallo betu, az ekezet masodlagos), B: az ASCII-sorrend, ami magyarul hibas. */
const HUNGARIAN_ORDER = ['Cukor', 'Csaba', 'Dóra', 'Eper', 'Épület', 'Géza', 'Gyula', 'Szel', 'Szél', 'Zoltán', 'Zsolt']
const ASCII_ORDER = ['Csaba', 'Cukor', 'Dóra', 'Eper', 'Épület', 'Géza', 'Gyula', 'Szel', 'Szél', 'Zoltán', 'Zsolt']

function hungarianXlsx(): Buffer {
  const text = (address: string, value: string): string => `<c r="${address}" t="inlineStr"><is><t>${value}</t></is></c>`
  const rows = HUNGARIAN_ORDER.map((name, index) => {
    const row = String(index + 1)
    return `<row r="${row}">${text(`A${row}`, name)}${text(`B${row}`, ASCII_ORDER[index] ?? '')}</row>`
  })
  return miniXlsx(rows.join(''))
}

/**
 * Ellenseges fajl: egyetlen sorban negyedmillio ures cella (`<c s="N"/>`). Egy sor, mert a sor egyben kerul
 * a memoriaba, ha az olvaso nem szamolja a cellakat. A veletlen stilusindex miatt a zip-arany joval a 200-as
 * hatar alatt van, a zip-vedelem tehat atengedi, a cellakeret viszont megallitja.
 */
function manyEmptyCellsXlsx(): Buffer {
  let seed = 12345
  const cells: string[] = []
  for (let index = 0; index < 250_000; index++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    cells.push(`<c s="${String(seed % 10)}"/>`)
  }
  return miniXlsx(`<row r="1">${cells.join('')}</row>`)
}

/** Ellenseges ods: huszszor ismetelt, nem ures cella egyetlen sorban (cellankent 16384-re vagott ismetlessel kb. 330 ezer cella). */
function manyRepeatedCellsOds(): Buffer {
  const cells = '<table:table-cell office:value-type="float" office:value="1" table:number-columns-repeated="1000000"/>'.repeat(20)
  return odsPackage(`<table:table table:name="Munka1"><table:table-row>${cells}</table:table-row></table:table>`, '', '')
}

/** Ellenseges ods: egyetlen sorban 210 ezer ures, stilusos cella (rovid `t:` eloteggel, hogy a resz 8 MB alatt maradjon). */
function manyEmptyCellsOds(): Buffer {
  let seed = 4321
  const cells: string[] = []
  for (let index = 0; index < 210_000; index++) {
    seed = (seed * 1103515245 + 12345) % 2147483648
    cells.push(`<t:table-cell t:style-name="c${String(seed % 10)}"/>`)
  }
  const styles = Array.from({ length: 10 }, (_, index) => `<style:style style:name="c${String(index)}" style:family="table-cell"/>`).join('')
  return odsPackage(`<table:table table:name="Munka1"><t:table-row>${cells.join('')}</t:table-row></table:table>`, styles, '')
}

function odsPackage(body: string, automaticStyles: string, namedStyles: string, dataStyles = ''): Buffer {
  return zipArchive([
    { name: 'mimetype', data: ODS_MIME, store: true },
    {
      name: 'META-INF/manifest.xml',
      data:
        '<?xml version="1.0" encoding="UTF-8"?>\n<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">' +
        `<manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="${ODS_MIME}"/>` +
        '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' +
        '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/></manifest:manifest>',
    },
    {
      name: 'content.xml',
      data:
        `<?xml version="1.0" encoding="UTF-8"?>\n<office:document-content ${ODF_NS} xmlns:t="urn:oasis:names:tc:opendocument:xmlns:table:1.0" office:version="1.2"><office:automatic-styles>${automaticStyles}</office:automatic-styles>` +
        `<office:body><office:spreadsheet>${body}</office:spreadsheet></office:body></office:document-content>`,
    },
    {
      name: 'styles.xml',
      data: `<?xml version="1.0" encoding="UTF-8"?>\n<office:document-styles ${ODF_NS} office:version="1.2"><office:styles>${dataStyles}${namedStyles}</office:styles></office:document-styles>`,
    },
  ])
}

/**
 * Az 5. feladat jo megoldasa, de a szamformatum (adatstilus) es a cellastilus is a styles.xml-ben el, a
 * content.xml-ben nincs automatikus stilus: igy menti a LibreOffice a nevesitett stilusokat.
 * Vart pontszam: ugyanaz, mint a pw-tabla.ods-e (9).
 */
function odsStylesInStylesXml(): Buffer {
  const number = (value: number, attributes = ''): string =>
    `<table:table-cell${attributes} office:value-type="float" office:value="${String(value)}"><text:p>${String(value)}</text:p></table:table-cell>`
  const rows = [10, 8, 12, 7, 5].map((value, index) => {
    const row = index + 1
    const extra =
      row === 1
        ? '<table:table-cell office:value-type="string"><text:p>Összeg</text:p></table:table-cell>'
        : row === 2
          ? number(42, ' table:style-name="Szamok"')
          : row === 3
            ? number(42, ' table:formula="of:=SUM([.A1:.A5])"')
            : ''
    return `<table:table-row>${number(value)}${extra}</table:table-row>`
  })
  const dataStyles =
    '<number:number-style style:name="N2"><number:number number:decimal-places="2" number:min-decimal-places="2" number:min-integer-digits="1"/></number:number-style>'
  const namedStyles =
    '<style:style style:name="Default" style:family="table-cell"/><style:style style:name="Szamok" style:family="table-cell" style:parent-style-name="Default" style:data-style-name="N2"/>'
  return odsPackage(`<table:table table:name="Munka1"><table:table-column table:number-columns-repeated="2"/>${rows.join('')}</table:table>`, '', namedStyles, dataStyles)
}

const FILES: Record<string, Buffer> = {
  'pw-tabla-teljes.xlsx': xlsx(),
  'pw-tabla-teljes.ods': ods(),
  'pw-tabla-magyar.xlsx': hungarianXlsx(),
  'pw-tabla-sok-ures.xlsx': manyEmptyCellsXlsx(),
  'pw-tabla-sok-ures.ods': manyEmptyCellsOds(),
  'pw-tabla-sok-ismetelt.ods': manyRepeatedCellsOds(),
  'pw-tabla-stilus.ods': odsStylesInStylesXml(),
}

const directory = join(__dirname, '..')
mkdirSync(directory, { recursive: true })

for (const [name, contents] of Object.entries(FILES)) {
  writeFileSync(join(directory, name), contents)
  console.log(`${name}  ${String(contents.length)} bajt`)
}
