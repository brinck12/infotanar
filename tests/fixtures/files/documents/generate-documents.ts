/**
 * A dokumentum-vizsgalatok (WP4) fixture-jeinek eloallitasa.
 *
 *   cd tests && npx tsx fixtures/files/documents/generate-documents.ts
 *
 * Bajtra determinisztikus (zipArchive). A fajlokat soha nem nyitottuk meg Wordben
 * vagy LibreOffice-ban: a backend olvasoja ertelmezi oket. A tartalmuk es a vart
 * ertekek a specs/api/checks-documents.spec.ts tablazataiban vannak.
 *
 * pw-dok-minta.docx / .odt : gazdag minta (bekezdesek sorszama a specben)
 * pw-dok-letter.docx / .odt: Letter lap, egy bekezdes
 * pw-dok-serult.docx       : zip, de nincs word/document.xml
 * pw-dok-doctype.docx      : a document.xml DOCTYPE-ot tartalmaz
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { zipArchive, type ZipEntry } from '../../../src/support/zip'

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
const PNG = readFileSync(join(__dirname, '..', 'pw-minta.png'))

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const REL = 'http://schemas.openxmlformats.org/package/2006/relationships'
const WP = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'
const A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const PIC = 'http://schemas.openxmlformats.org/drawingml/2006/picture'

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

function docxPackage(documentXml: string, extra: ZipEntry[] = []): Buffer {
  const parts: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      data: `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
    },
    {
      name: '_rels/.rels',
      data: `${XML}<Relationships xmlns="${REL}"><Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`,
    },
    { name: 'word/document.xml', data: documentXml },
    ...extra,
  ]
  return zipArchive(parts)
}

const run = (text: string, rPr = '') => `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}<w:t xml:space="preserve">${text}</w:t></w:r>`
const para = (runs: string, pPr = '') => `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${runs}</w:p>`

function drawing(kind: 'inline' | 'anchor', cm: [number, number], alt: string, id: number): string {
  const cx = cm[0] * 360000
  const cy = cm[1] * 360000
  const graphic = `<a:graphic><a:graphicData uri="${PIC}"><pic:pic><pic:nvPicPr><pic:cNvPr id="${id}" name="kep${id}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId9"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic>`
  const docPr = `<wp:docPr id="${id}" name="Kep ${id}"${alt ? ` descr="${alt}"` : ''}/>`
  if (kind === 'inline') {
    return `<w:r><w:drawing><wp:inline><wp:extent cx="${cx}" cy="${cy}"/>${docPr}${graphic}</wp:inline></w:drawing></w:r>`
  }
  return `<w:r><w:drawing><wp:anchor behindDoc="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:wrapSquare wrapText="bothSides"/>${docPr}${graphic}</wp:anchor></w:drawing></w:r>`
}

const cell = (text: string, tcPr = '') => `<w:tc>${tcPr ? `<w:tcPr>${tcPr}</w:tcPr>` : ''}${para(run(text))}</w:tc>`

function sectPr(w: number, h: number, margins: [number, number, number, number], cols = 1, extra = ''): string {
  const orient = w > h ? ' w:orient="landscape"' : ''
  return `<w:sectPr>${extra}<w:pgSz w:w="${w}" w:h="${h}"${orient}/><w:pgMar w:top="${margins[0]}" w:right="${margins[3]}" w:bottom="${margins[1]}" w:left="${margins[2]}" w:header="708" w:footer="708" w:gutter="0"/><w:cols w:num="${cols}" w:space="708"/></w:sectPr>`
}

const STYLES = `${XML}<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:b/><w:sz w:val="32"/><w:color w:val="FF0000"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Idezet"><w:name w:val="Idézet"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="center" w:pos="2835"/></w:tabs><w:spacing w:line="300" w:lineRule="exact"/><w:ind w:left="567"/></w:pPr><w:rPr><w:i/><w:color w:val="808080"/></w:rPr></w:style>
<w:style w:type="character" w:styleId="Kiemeles"><w:name w:val="Kiemelés"/><w:rPr><w:b/><w:u w:val="single"/></w:rPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/></w:tblBorders></w:tblPr></w:style>
</w:styles>`

const NUMBERING = `${XML}<w:numbering xmlns:w="${W}"><w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val=""/></w:lvl><w:lvl w:ilvl="1"><w:numFmt w:val="bullet"/><w:lvlText w:val="o"/></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/></w:lvl><w:lvl w:ilvl="1"><w:numFmt w:val="lowerLetter"/><w:lvlText w:val="%2)"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num></w:numbering>`

const SETTINGS = `${XML}<w:settings xmlns:w="${W}"><w:autoHyphenation/></w:settings>`

const THEME = `${XML}<a:theme xmlns:a="${A}"><a:themeElements><a:fontScheme name="PW"><a:majorFont><a:latin typeface="Cambria"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme></a:themeElements></a:theme>`

function sampleDocx(): Buffer {
  const body = [
    // 1
    para(run('Első fejezet'), '<w:pStyle w:val="Heading1"/>'),
    // 2
    para(
      run('Közvetlen formázás', '<w:rFonts w:ascii="Verdana" w:hAnsi="Verdana"/><w:b/><w:i/><w:u w:val="single"/><w:color w:val="0000FF"/><w:sz w:val="28"/>'),
      '<w:tabs><w:tab w:val="left" w:pos="1134"/><w:tab w:val="right" w:leader="dot" w:pos="6803"/></w:tabs><w:spacing w:before="120" w:after="240" w:line="360" w:lineRule="auto"/><w:ind w:left="567" w:firstLine="709"/><w:jc w:val="both"/>'
    ),
    // 3
    para(run('Elválasztás tiltva ') + run('kiemelt', '<w:rStyle w:val="Kiemeles"/>'), '<w:suppressAutoHyphens/>'),
    // 4
    para(run('Második fejezet'), '<w:pStyle w:val="Heading1"/><w:pageBreakBefore/>'),
    // 5
    para(run('Idézet szöveg'), '<w:pStyle w:val="Idezet"/>'),
    // 6
    para(run('Felsorolás elem'), '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'),
    // 7
    para(run('Számozott alelem'), '<w:numPr><w:ilvl w:val="1"/><w:numId w:val="2"/></w:numPr>'),
    // 8, 9, 10, 11
    para(run('felső index', '<w:vertAlign w:val="superscript"/>')),
    para(run('alsó index', '<w:vertAlign w:val="subscript"/>')),
    para(run('kiskapitális', '<w:smallCaps/>')),
    para(run('Téma betű', '<w:rFonts w:asciiTheme="minorHAnsi" w:hAnsiTheme="minorHAnsi"/>')),
    // 12, 13
    para(drawing('inline', [8, 4], 'Minta ábra', 1)),
    para(run('Körbefuttatott kép') + drawing('anchor', [3, 3], '', 2)),
    // 14-19: 1. tablazat (3x2, TableGrid, 12 cm, kozepre, sorok 1 cm)
    `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="6803" w:type="dxa"/><w:jc w:val="center"/></w:tblPr><w:tblGrid><w:gridCol w:w="3400"/><w:gridCol w:w="3403"/></w:tblGrid>` +
      [
        `<w:tr><w:trPr><w:trHeight w:val="567"/></w:trPr>${cell('A1', '<w:shd w:val="clear" w:fill="D9D9D9"/>')}${cell('B1')}</w:tr>`,
        `<w:tr><w:trPr><w:trHeight w:val="567"/></w:trPr>${cell('A2')}${cell('B2')}</w:tr>`,
        `<w:tr><w:trPr><w:trHeight w:val="567"/></w:trPr>${cell('A3')}${cell('B3')}</w:tr>`,
      ].join('') +
      `</w:tbl>`,
    // 20-25: 2. tablazat (2x3, keret nelkul)
    `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/></w:tblPr><w:tblGrid><w:gridCol w:w="2000"/><w:gridCol w:w="2000"/><w:gridCol w:w="2000"/></w:tblGrid>` +
      `<w:tr>${cell('C1')}${cell('C2')}${cell('C3')}</w:tr><w:tr>${cell('D1')}${cell('D2')}${cell('D3')}</w:tr></w:tbl>`,
    // 26: az 1. szakasz vege (alapertelmezett: uj oldalon kezdodik)
    para(run('Az első szakasz vége'), sectPr(11906, 16838, [1417, 1134, 1701, 1134], 1)),
    // 27
    para(run('Két hasábos rész')),
    // 2. szakasz: fekvo, 2 hasab, folyamatos
    sectPr(16838, 11906, [1417, 1134, 1701, 1134], 2, '<w:type w:val="continuous"/>'),
  ].join('')

  const documentXml = `${XML}<w:document xmlns:w="${W}" xmlns:r="${R}" xmlns:wp="${WP}" xmlns:a="${A}" xmlns:pic="${PIC}"><w:body>${body}</w:body></w:document>`
  return docxPackage(documentXml, [
    { name: 'word/styles.xml', data: STYLES },
    { name: 'word/numbering.xml', data: NUMBERING },
    { name: 'word/settings.xml', data: SETTINGS },
    { name: 'word/theme/theme1.xml', data: THEME },
    { name: 'word/media/image1.png', data: PNG },
    {
      name: 'word/_rels/document.xml.rels',
      data: `${XML}<Relationships xmlns="${REL}"><Relationship Id="rId9" Type="${R}/image" Target="media/image1.png"/></Relationships>`,
    },
  ])
}

function letterDocx(): Buffer {
  const body = `${para(run('Letter lap'))}${sectPr(12240, 15840, [1440, 1440, 1440, 1440])}`
  return docxPackage(`${XML}<w:document xmlns:w="${W}"><w:body>${body}</w:body></w:document>`)
}

function doctypeDocx(): Buffer {
  const doc = `${XML}<!DOCTYPE w:document [<!ENTITY x "y">]><w:document xmlns:w="${W}"><w:body>${para(run('&x;'))}</w:body></w:document>`
  return docxPackage(doc)
}

function brokenDocx(): Buffer {
  return zipArchive([{ name: '[Content_Types].xml', data: `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>` }])
}

// ---------------------------------------------------------------------------
// ODT
// ---------------------------------------------------------------------------

const NS =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" office:version="1.3"'

function odtPackage(content: string, styles: string, withPicture: boolean): Buffer {
  const entries: ZipEntry[] = [
    { name: 'mimetype', data: 'application/vnd.oasis.opendocument.text', store: true },
    {
      name: 'META-INF/manifest.xml',
      data: `${XML}<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/></manifest:manifest>`,
    },
    { name: 'content.xml', data: content },
    { name: 'styles.xml', data: styles },
  ]
  if (withPicture) entries.push({ name: 'Pictures/image1.png', data: PNG })
  return zipArchive(entries)
}

function layout(name: string, w: string, h: string, orient: string, margins: [string, string, string, string], cols = 1): string {
  return `<style:page-layout style:name="${name}"><style:page-layout-properties fo:page-width="${w}" fo:page-height="${h}" style:print-orientation="${orient}" fo:margin-top="${margins[0]}" fo:margin-bottom="${margins[1]}" fo:margin-left="${margins[2]}" fo:margin-right="${margins[3]}"><style:columns fo:column-count="${cols}" fo:column-gap="1.25cm"/></style:page-layout-properties></style:page-layout>`
}

const ODT_FONTS =
  '<office:font-face-decls><style:font-face style:name="Times New Roman" svg:font-family="&apos;Times New Roman&apos;"/><style:font-face style:name="Arial" svg:font-family="Arial"/><style:font-face style:name="Verdana" svg:font-family="Verdana"/></office:font-face-decls>'

function sampleOdt(): Buffer {
  const styles = `${XML}<office:document-styles ${NS}>${ODT_FONTS}<office:styles>
<style:default-style style:family="paragraph"><style:paragraph-properties fo:hyphenate="true"/><style:text-properties style:font-name="Times New Roman" fo:font-size="12pt"/></style:default-style>
<style:style style:name="Standard" style:family="paragraph" style:class="text"/>
<style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:margin-top="12pt" fo:margin-bottom="6pt"/><style:text-properties style:font-name="Arial" fo:font-size="16pt" fo:font-weight="bold" fo:color="#ff0000"/></style:style>
<style:style style:name="Idezet" style:display-name="Idézet" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:margin-left="1cm" fo:line-height="15pt"><style:tab-stops><style:tab-stop style:position="5cm" style:type="center"/></style:tab-stops></style:paragraph-properties><style:text-properties fo:font-style="italic" fo:color="#808080"/></style:style>
<style:style style:name="Kiemeles" style:display-name="Kiemelés" style:family="text"><style:text-properties fo:font-weight="bold" style:text-underline-style="solid"/></style:style>
<text:list-style style:name="Felsorolas"><text:list-level-style-bullet text:level="1" text:bullet-char="•"/><text:list-level-style-bullet text:level="2" text:bullet-char="o"/></text:list-style>
<text:list-style style:name="Szamozas"><text:list-level-style-number text:level="1" style:num-suffix="." style:num-format="1"/><text:list-level-style-number text:level="2" style:num-suffix=")" style:num-format="a"/></text:list-style>
</office:styles><office:automatic-styles>${layout('pm1', '21cm', '29.7cm', 'portrait', ['2.5cm', '2cm', '3cm', '2cm'])}${layout('pm2', '29.7cm', '21cm', 'landscape', ['2.5cm', '2cm', '3cm', '2cm'], 2)}</office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="pm1"/><style:master-page style:name="Fekvo" style:page-layout-name="pm2"/></office:master-styles></office:document-styles>`

  const cellBorder = 'fo:border="0.5pt solid #000000"'
  const content = `${XML}<office:document-content ${NS}>${ODT_FONTS}<office:automatic-styles>
<style:style style:name="PDirect" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:text-align="justify" fo:margin-top="6pt" fo:margin-bottom="12pt" fo:line-height="150%" fo:margin-left="1cm" fo:text-indent="1.25cm"><style:tab-stops><style:tab-stop style:position="2cm" style:type="left"/><style:tab-stop style:position="12cm" style:type="right" style:leader-style="dotted" style:leader-text="."/></style:tab-stops></style:paragraph-properties></style:style>
<style:style style:name="TDirect" style:family="text"><style:text-properties style:font-name="Verdana" fo:font-size="14pt" fo:font-weight="bold" fo:font-style="italic" style:text-underline-style="solid" fo:color="#0000ff"/></style:style>
<style:style style:name="PNoHyph" style:family="paragraph" style:parent-style-name="Standard"><style:paragraph-properties fo:hyphenate="false"/></style:style>
<style:style style:name="PBreak" style:family="paragraph" style:parent-style-name="Heading_20_1"><style:paragraph-properties fo:break-before="page"/></style:style>
<style:style style:name="TSuper" style:family="text"><style:text-properties style:text-position="super 58%"/></style:style>
<style:style style:name="TSub" style:family="text"><style:text-properties style:text-position="sub 58%"/></style:style>
<style:style style:name="TCaps" style:family="text"><style:text-properties fo:font-variant="small-caps"/></style:style>
<style:style style:name="TTheme" style:family="text"><style:text-properties fo:font-family="Calibri"/></style:style>
<style:style style:name="PLandscape" style:family="paragraph" style:parent-style-name="Standard" style:master-page-name="Fekvo"/>
<style:style style:name="fr1" style:family="graphic"><style:graphic-properties style:wrap="parallel"/></style:style>
<style:style style:name="Table1" style:family="table"><style:table-properties style:width="12cm" table:align="center"/></style:style>
<style:style style:name="Table1.Row" style:family="table-row"><style:table-row-properties style:row-height="1cm"/></style:style>
<style:style style:name="Table1.Cell" style:family="table-cell"><style:table-cell-properties ${cellBorder}/></style:style>
<style:style style:name="Table1.Head" style:family="table-cell"><style:table-cell-properties fo:background-color="#d9d9d9" ${cellBorder}/></style:style>
<style:style style:name="Table2" style:family="table"><style:table-properties style:width="10cm" table:align="left"/></style:style>
<style:style style:name="Sect1" style:family="section"><style:section-properties><style:columns fo:column-count="3" fo:column-gap="0.5cm"/></style:section-properties></style:style>
</office:automatic-styles><office:body><office:text>
<text:h text:style-name="Heading_20_1" text:outline-level="1">Első fejezet</text:h>
<text:p text:style-name="PDirect"><text:span text:style-name="TDirect">Közvetlen formázás</text:span></text:p>
<text:p text:style-name="PNoHyph">Elválasztás tiltva <text:span text:style-name="Kiemeles">kiemelt</text:span></text:p>
<text:h text:style-name="PBreak" text:outline-level="1">Második fejezet</text:h>
<text:p text:style-name="Idezet">Idézet szöveg</text:p>
<text:list text:style-name="Felsorolas"><text:list-item><text:p text:style-name="Standard">Felsorolás elem</text:p></text:list-item></text:list>
<text:list text:style-name="Szamozas"><text:list-item><text:list><text:list-item><text:p text:style-name="Standard">Számozott alelem</text:p></text:list-item></text:list></text:list-item></text:list>
<text:p><text:span text:style-name="TSuper">felső index</text:span></text:p>
<text:p><text:span text:style-name="TSub">alsó index</text:span></text:p>
<text:p><text:span text:style-name="TCaps">kiskapitális</text:span></text:p>
<text:p><text:span text:style-name="TTheme">Téma betű</text:span></text:p>
<text:p><draw:frame draw:name="Kep1" text:anchor-type="as-char" svg:width="8cm" svg:height="4cm"><draw:image xlink:href="Pictures/image1.png"/><svg:desc>Minta ábra</svg:desc></draw:frame></text:p>
<text:p>Körbefuttatott kép<draw:frame draw:name="Kep2" draw:style-name="fr1" text:anchor-type="paragraph" svg:width="3cm" svg:height="3cm"><draw:image xlink:href="Pictures/image1.png"/></draw:frame></text:p>
<table:table table:name="Tabla1" table:style-name="Table1"><table:table-column table:number-columns-repeated="2"/>
<table:table-row table:style-name="Table1.Row"><table:table-cell table:style-name="Table1.Head"><text:p>A1</text:p></table:table-cell><table:table-cell table:style-name="Table1.Cell"><text:p>B1</text:p></table:table-cell></table:table-row>
<table:table-row table:style-name="Table1.Row"><table:table-cell table:style-name="Table1.Cell"><text:p>A2</text:p></table:table-cell><table:table-cell table:style-name="Table1.Cell"><text:p>B2</text:p></table:table-cell></table:table-row>
<table:table-row table:style-name="Table1.Row"><table:table-cell table:style-name="Table1.Cell"><text:p>A3</text:p></table:table-cell><table:table-cell table:style-name="Table1.Cell"><text:p>B3</text:p></table:table-cell></table:table-row></table:table>
<table:table table:name="Tabla2" table:style-name="Table2"><table:table-column table:number-columns-repeated="3"/>
<table:table-row><table:table-cell><text:p>C1</text:p></table:table-cell><table:table-cell><text:p>C2</text:p></table:table-cell><table:table-cell><text:p>C3</text:p></table:table-cell></table:table-row>
<table:table-row><table:table-cell><text:p>D1</text:p></table:table-cell><table:table-cell><text:p>D2</text:p></table:table-cell><table:table-cell><text:p>D3</text:p></table:table-cell></table:table-row></table:table>
<text:p text:style-name="PLandscape">Két hasábos rész</text:p>
<text:section text:style-name="Sect1" text:name="Hasab"><text:p>Három hasábos szakasz</text:p></text:section>
</office:text></office:body></office:document-content>`
  return odtPackage(content, styles, true)
}

function letterOdt(): Buffer {
  const styles = `${XML}<office:document-styles ${NS}><office:styles><style:style style:name="Standard" style:family="paragraph"/></office:styles><office:automatic-styles>${layout('pm1', '21.59cm', '27.94cm', 'portrait', ['2.54cm', '2.54cm', '2.54cm', '2.54cm'])}</office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="pm1"/></office:master-styles></office:document-styles>`
  const content = `${XML}<office:document-content ${NS}><office:body><office:text><text:p>Letter lap</text:p></office:text></office:body></office:document-content>`
  return odtPackage(content, styles, false)
}

/**
 * LibreOffice-fele "Converted1" sorrend: a styles.xml elso mesteroldala (Standard, A4) nincs hasznalatban,
 * a tartalom az elso bekezdesen (vagy az elso tablazat stilusan) valaszt masik mesteroldalt (Letter, 2 hasab).
 * A tablazat: az 1. tablazat 1 sor, benne beagyazott 2x2 tablazat; a 2. tablazat 3 sor.
 */
function convertedOdt(startsWithTable: boolean): Buffer {
  const styles = `${XML}<office:document-styles ${NS}><office:styles><style:style style:name="Standard" style:family="paragraph"/></office:styles><office:automatic-styles>${layout('pm1', '21cm', '29.7cm', 'portrait', ['2cm', '2cm', '2cm', '2cm'])}${layout('pm2', '21.59cm', '27.94cm', 'portrait', ['2.54cm', '2.54cm', '2.54cm', '2.54cm'], 2)}</office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="pm1"/><style:master-page style:name="Converted1" style:page-layout-name="pm2"/></office:master-styles></office:document-styles>`
  const nested = '<table:table table:name="Beagyazott"><table:table-column table:number-columns-repeated="2"/><table:table-row><table:table-cell><text:p>N1</text:p></table:table-cell><table:table-cell><text:p>N2</text:p></table:table-cell></table:table-row><table:table-row><table:table-cell><text:p>N3</text:p></table:table-cell><table:table-cell><text:p>N4</text:p></table:table-cell></table:table-row></table:table>'
  const tables = `<table:table table:name="T1"${startsWithTable ? ' table:style-name="TableConv"' : ''}><table:table-column/><table:table-row><table:table-cell>${nested}<text:p/></table:table-cell></table:table-row></table:table><table:table table:name="T2"><table:table-column/><table:table-row><table:table-cell><text:p>X1</text:p></table:table-cell></table:table-row><table:table-row><table:table-cell><text:p>X2</text:p></table:table-cell></table:table-row><table:table-row><table:table-cell><text:p>X3</text:p></table:table-cell></table:table-row></table:table>`
  const body = startsWithTable ? `${tables}<text:p>Szöveg</text:p>` : `<text:p text:style-name="PConv">Szöveg</text:p>${tables}`
  const content = `${XML}<office:document-content ${NS}><office:automatic-styles><style:style style:name="PConv" style:family="paragraph" style:parent-style-name="Standard" style:master-page-name="Converted1"/><style:style style:name="TableConv" style:family="table" style:master-page-name="Converted1"/></office:automatic-styles><office:body><office:text>${body}</office:text></office:body></office:document-content>`
  return odtPackage(content, styles, false)
}

const FILES: Record<string, Buffer> = {
  'pw-dok-minta.docx': sampleDocx(),
  'pw-dok-minta.odt': sampleOdt(),
  'pw-dok-letter.docx': letterDocx(),
  'pw-dok-letter.odt': letterOdt(),
  'pw-dok-konvertalt.odt': convertedOdt(false),
  'pw-dok-konvertalt-tabla.odt': convertedOdt(true),
  'pw-dok-serult.docx': brokenDocx(),
  'pw-dok-doctype.docx': doctypeDocx(),
}

mkdirSync(__dirname, { recursive: true })
for (const [name, contents] of Object.entries(FILES)) {
  writeFileSync(join(__dirname, name), contents)
}
