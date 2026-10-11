/**
 * A bemutato-, vektor-, web- es kepvizsgalatok (WP5) fixture-jei.
 *
 *   cd tests && npx tsx fixtures/files/slides-web/generate.ts
 *
 * A kimenet bajtra determinisztikus. A fajlok a legkevesebb resszel epulnek, amit
 * az ertekelo olvas; PowerPointban, Impressben vagy bongeszoben SOHA nem nyitottuk
 * meg oket, csak a PHP olvasoival ellenoriztuk.
 *
 * Tartalom (a checks-slides-web.spec.ts ezekre epit):
 *  - pw-bemutato.pptx / .odp: 2 dia, 16:9 (33,87 x 19,05 cm), az 1. dia hattere
 *    piros (FF0000), a 2. diae szinatmenet; cim 44 pt, cimbetu Arial; 2. dia
 *    valtasa "fade"; folyamatos ismetles; az 1. dian zold (00B050) teglalap 30%
 *    atlatszosaggal "Zold doboz" szoveggel, ra beuszas (fly in) 0,5 mp
 *    idotartammal, 1 mp kesleltetessel, kattintasra; a 2. dian egy 8 x 4 cm-es
 *    kep "Logo" helyettesito szoveggel.
 *  - pw-rajz.svg: piros teglalap, kek kor 50% atlatszosaggal, "Szia" felirat,
 *    egy 40 x 20 mm-es kep. pw-rajz-doctype.svg: DOCTYPE-pal (olvashatatlan).
 *  - pw-oldal.html: cim, h1, ket bekezdes (egyik .kiemelt), link, 200x100 kep,
 *    stilus @media blokkal es kommenttel. pw-torzs.html: DOCTYPE nelkuli tores.
 *    pw-stilus.css: ugyanaz a stilus onalloan.
 *  - pw-kep-80x40.png: 80 x 40 keppontos png (pHYs: 96 dpi).
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'
import { zipArchive, type ZipEntry } from '../../../src/support/zip'

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
const OUT = dirname(fileURLToPath(import.meta.url))

const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const NS_REL = 'http://schemas.openxmlformats.org/package/2006/relationships'
const NS_CT = 'http://schemas.openxmlformats.org/package/2006/content-types'

function rels(items: [string, string, string][]): string {
  const body = items.map(([id, type, target]) => `<Relationship Id="${id}" Type="${NS_R}/${type}" Target="${target}"/>`).join('')
  return `${XML}<Relationships xmlns="${NS_REL}">${body}</Relationships>`
}

// ---------------------------------------------------------------------------
// PPTX
// ---------------------------------------------------------------------------

const SCHEME = ['dk1:000000', 'lt1:FFFFFF', 'dk2:44546A', 'lt2:E7E6E6', 'accent1:4472C4', 'accent2:ED7D31']
  .map((entry) => {
    const [name, value] = entry.split(':')
    return `<a:${name}><a:srgbClr val="${value}"/></a:${name}>`
  })
  .join('')

const THEME =
  `${XML}<a:theme xmlns:a="${NS_A}" name="PW"><a:themeElements><a:clrScheme name="PW">${SCHEME}</a:clrScheme>` +
  '<a:fontScheme name="PW"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Verdana"/></a:minorFont></a:fontScheme>' +
  '<a:fmtScheme name="PW"><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>' +
  '</a:themeElements></a:theme>'

const MASTER =
  `${XML}<p:sldMaster xmlns:p="${NS_P}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></p:bgPr></p:bg><p:spTree/></p:cSld>` +
  '<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent1" accent4="accent1" accent5="accent1" accent6="accent1" hlink="accent1" folHlink="accent1"/>' +
  '<p:txStyles><p:titleStyle><a:lvl1pPr><a:defRPr sz="4000"><a:latin typeface="+mj-lt"/></a:defRPr></a:lvl1pPr></p:titleStyle>' +
  '<p:bodyStyle><a:lvl1pPr><a:defRPr sz="2800"><a:latin typeface="+mn-lt"/></a:defRPr></a:lvl1pPr></p:bodyStyle></p:txStyles></p:sldMaster>'

const LAYOUT = `${XML}<p:sldLayout xmlns:p="${NS_P}" xmlns:a="${NS_A}"><p:cSld name="Cím és tartalom"><p:spTree/></p:cSld></p:sldLayout>`

function pptxSlide(body: string, background: string, extra = ''): string {
  return (
    `${XML}<p:sld xmlns:p="${NS_P}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><p:cSld>${background}<p:spTree>` +
    '<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>' +
    `${body}</p:spTree></p:cSld>${extra}</p:sld>`
  )
}

const PPTX_TITLE =
  '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Cím"/><p:cNvSpPr/><p:nvPr><p:ph type="title"/></p:nvPr></p:nvSpPr><p:spPr/>' +
  '<p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="hu-HU" sz="4400"/><a:t>Üdvözlet</a:t></a:r></a:p></p:txBody></p:sp>'

const PPTX_BOX =
  '<p:sp><p:nvSpPr><p:cNvPr id="3" name="Doboz"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>' +
  '<p:spPr><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="00B050"><a:alpha val="70000"/></a:srgbClr></a:solidFill></p:spPr>' +
  '<p:txBody><a:bodyPr/><a:p><a:r><a:rPr lang="hu-HU"/><a:t>Zöld doboz</a:t></a:r></a:p></p:txBody></p:sp>'

const PPTX_PICTURE =
  '<p:pic><p:nvPicPr><p:cNvPr id="4" name="Kép" descr="Logo"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr><p:blipFill><a:blip/></p:blipFill>' +
  '<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="2880000" cy="1440000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>'

const PPTX_TIMING =
  '<p:timing><p:tnLst><p:par><p:cTn id="1" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst><p:seq concurrent="1" nextAc="seek"><p:cTn id="2" dur="indefinite" nodeType="mainSeq"><p:childTnLst>' +
  '<p:par><p:cTn id="3" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst><p:par><p:cTn id="4" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>' +
  '<p:par><p:cTn id="5" presetID="2" presetClass="entr" presetSubtype="4" fill="hold" nodeType="clickEffect"><p:stCondLst><p:cond delay="1000"/></p:stCondLst><p:childTnLst>' +
  '<p:set><p:cBhvr><p:cTn id="6" dur="1" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst></p:cTn><p:tgtEl><p:spTgt spid="3"/></p:tgtEl></p:cBhvr></p:set>' +
  '<p:anim calcmode="lin"><p:cBhvr><p:cTn id="7" dur="500" fill="hold"/><p:tgtEl><p:spTgt spid="3"/></p:tgtEl></p:cBhvr></p:anim>' +
  '</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>' +
  '</p:childTnLst></p:cTn></p:seq></p:childTnLst></p:cTn></p:par></p:tnLst></p:timing>'

function pptx(): Buffer {
  const slide1 = pptxSlide(
    PPTX_TITLE + PPTX_BOX,
    '<p:bg><p:bgPr><a:solidFill><a:srgbClr val="FF0000"/></a:solidFill></p:bgPr></p:bg>',
    PPTX_TIMING,
  )
  const slide2 = pptxSlide(
    PPTX_PICTURE,
    '<p:bg><p:bgPr><a:gradFill><a:gsLst><a:gs pos="0"><a:srgbClr val="FFFFFF"/></a:gs><a:gs pos="100000"><a:srgbClr val="4472C4"/></a:gs></a:gsLst></a:gradFill></p:bgPr></p:bg>',
    '<p:transition spd="med"><p:fade/></p:transition>',
  )
  const entries: ZipEntry[] = [
    {
      name: '[Content_Types].xml',
      data:
        `${XML}<Types xmlns="${NS_CT}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
        '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/></Types>',
    },
    { name: '_rels/.rels', data: rels([['rId1', 'officeDocument', 'ppt/presentation.xml']]) },
    {
      name: 'ppt/presentation.xml',
      data:
        `${XML}<p:presentation xmlns:p="${NS_P}" xmlns:a="${NS_A}" xmlns:r="${NS_R}"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` +
        '<p:sldIdLst><p:sldId id="256" r:id="rId2"/><p:sldId id="257" r:id="rId3"/></p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>',
    },
    {
      name: 'ppt/_rels/presentation.xml.rels',
      data: rels([
        ['rId1', 'slideMaster', 'slideMasters/slideMaster1.xml'],
        ['rId2', 'slide', 'slides/slide1.xml'],
        ['rId3', 'slide', 'slides/slide2.xml'],
      ]),
    },
    { name: 'ppt/presProps.xml', data: `${XML}<p:presentationPr xmlns:p="${NS_P}"><p:showPr loop="1"><p:present/></p:showPr></p:presentationPr>` },
    { name: 'ppt/slideMasters/slideMaster1.xml', data: MASTER },
    {
      name: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      data: rels([
        ['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml'],
        ['rId2', 'theme', '../theme/theme1.xml'],
      ]),
    },
    { name: 'ppt/slideLayouts/slideLayout1.xml', data: LAYOUT },
    { name: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', data: rels([['rId1', 'slideMaster', '../slideMasters/slideMaster1.xml']]) },
    { name: 'ppt/theme/theme1.xml', data: THEME },
    { name: 'ppt/slides/slide1.xml', data: slide1 },
    { name: 'ppt/slides/_rels/slide1.xml.rels', data: rels([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml']]) },
    { name: 'ppt/slides/slide2.xml', data: slide2 },
    { name: 'ppt/slides/_rels/slide2.xml.rels', data: rels([['rId1', 'slideLayout', '../slideLayouts/slideLayout1.xml']]) },
  ]
  return zipArchive(entries)
}

// ---------------------------------------------------------------------------
// ODP
// ---------------------------------------------------------------------------

const ODF_NS =
  'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" ' +
  'xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" ' +
  'xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" ' +
  'xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:smil="urn:oasis:names:tc:opendocument:xmlns:smil-compatible:1.0" ' +
  'xmlns:anim="urn:oasis:names:tc:opendocument:xmlns:animation:1.0" xmlns:xlink="http://www.w3.org/1999/xlink"'

function odp(): Buffer {
  const styles =
    `${XML}<office:document-styles ${ODF_NS} office:version="1.2"><office:styles>` +
    '<style:style style:name="Default-title" style:family="presentation"><style:text-properties fo:font-size="40pt" fo:font-family="Arial"/></style:style>' +
    '<style:style style:name="Default-outline1" style:family="presentation"><style:text-properties fo:font-size="28pt" fo:font-family="Verdana"/></style:style>' +
    '</office:styles><office:automatic-styles>' +
    '<style:page-layout style:name="PM1"><style:page-layout-properties fo:page-width="33.867cm" fo:page-height="19.05cm"/></style:page-layout>' +
    '</office:automatic-styles><office:master-styles><style:master-page style:name="Default" style:page-layout-name="PM1"/></office:master-styles></office:document-styles>'

  const content =
    `${XML}<office:document-content ${ODF_NS} office:version="1.2"><office:automatic-styles>` +
    '<style:style style:name="dp1" style:family="drawing-page"><style:drawing-page-properties draw:fill="solid" draw:fill-color="#ff0000"/></style:style>' +
    '<style:style style:name="dp2" style:family="drawing-page"><style:drawing-page-properties draw:fill="gradient" smil:type="fade"/></style:style>' +
    '<style:style style:name="gr1" style:family="graphic"><style:graphic-properties draw:fill="solid" draw:fill-color="#00b050" draw:opacity="70%"/></style:style>' +
    '<style:style style:name="pr1" style:family="presentation" style:parent-style-name="Default-title"><style:graphic-properties draw:fill="none"/></style:style>' +
    '<style:style style:name="T1" style:family="text"><style:text-properties fo:font-size="44pt"/></style:style>' +
    '</office:automatic-styles><office:body><office:presentation><presentation:settings presentation:endless="true"/>' +
    '<draw:page draw:name="page1" draw:style-name="dp1" draw:master-page-name="Default">' +
    '<draw:frame presentation:style-name="pr1" presentation:class="title" svg:width="20cm" svg:height="3cm"><draw:text-box><text:p><text:span text:style-name="T1">Üdvözlet</text:span></text:p></draw:text-box></draw:frame>' +
    '<draw:custom-shape draw:id="id3" draw:style-name="gr1"><text:p>Zöld doboz</text:p><draw:enhanced-geometry draw:type="rectangle"/></draw:custom-shape>' +
    '<anim:par smil:begin="next"><anim:seq presentation:node-type="main-sequence"><anim:par smil:begin="indefinite"><anim:par smil:begin="0s">' +
    '<anim:par smil:begin="1s" smil:fill="hold" presentation:node-type="on-click" presentation:preset-id="ooo-entrance-fly-in" presentation:preset-class="entrance">' +
    '<anim:set smil:dur="0.001s" smil:targetElement="id3" smil:attributeName="visibility" smil:to="visible"/>' +
    '<anim:animate smil:dur="0.5s" smil:targetElement="id3" smil:attributeName="x"/>' +
    '</anim:par></anim:par></anim:par></anim:seq></anim:par></draw:page>' +
    '<draw:page draw:name="page2" draw:style-name="dp2" draw:master-page-name="Default">' +
    '<draw:frame svg:width="8cm" svg:height="4cm"><draw:image xlink:href="Pictures/logo.png"/><svg:desc>Logo</svg:desc></draw:frame>' +
    '</draw:page></office:presentation></office:body></office:document-content>'

  return zipArchive([
    { name: 'mimetype', data: 'application/vnd.oasis.opendocument.presentation', store: true },
    {
      name: 'META-INF/manifest.xml',
      data:
        `${XML}<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">` +
        '<manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.presentation"/>' +
        '<manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>' +
        '<manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/></manifest:manifest>',
    },
    { name: 'content.xml', data: content },
    { name: 'styles.xml', data: styles },
  ])
}

// ---------------------------------------------------------------------------
// SVG
// ---------------------------------------------------------------------------

const SVG_BODY =
  '<svg xmlns="http://www.w3.org/2000/svg" width="200mm" height="100mm" viewBox="0 0 200 100">' +
  '<rect id="r1" x="10" y="10" width="50" height="30" fill="#ff0000"/>' +
  '<circle id="c1" cx="120" cy="40" r="20" style="fill:#0000ff;opacity:0.5"/>' +
  '<text id="t1" x="10" y="80" fill="#000000">Szia</text>' +
  '<image width="40mm" height="20mm" href="kep.png"><title>Logo</title></image></svg>'

const SVG_DOCTYPE =
  '<?xml version="1.0"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' + SVG_BODY

// ---------------------------------------------------------------------------
// HTML / CSS
// ---------------------------------------------------------------------------

const STYLE =
  '/* alap stilus */\nh1 { color: #ff0000; font-size: 24px; margin: 10px 20px; }\n.kiemelt { color: blue; font-family: "Arial", sans-serif; }\n' +
  '@media (max-width: 600px) { h1 { color: #00ff00; } }\n@font-face { font-family: X; src: url(x.woff); }\n'

const HTML =
  '<!DOCTYPE html>\n<html lang="hu"><head><meta charset="utf-8"><title>PW oldal</title><style>\n' +
  STYLE +
  '</style></head><body><h1>Cím</h1><p class="kiemelt">Első</p><p>Második</p>' +
  '<a href="https://example.com/">Példa</a><img src="a.png" width="200" height="100" alt="x"></body></html>\n'

const HTML_FRAGMENT = '<h1>Töredék</h1><p>Szöveg</p>\n'

// ---------------------------------------------------------------------------
// PNG
// ---------------------------------------------------------------------------

const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})

function crc32(data: Buffer): number {
  let crc = 0xffffffff
  for (const byte of data) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  body.copy(out, 4)
  out.writeUInt32BE(crc32(body), 8 + data.length)
  return out
}

function png(width: number, height: number): Buffer {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bitmelyseg
  header[9] = 2 // RGB
  const physical = Buffer.alloc(9)
  physical.writeUInt32BE(3780, 0) // 96 dpi, keppont / meter
  physical.writeUInt32BE(3780, 4)
  physical[8] = 1
  const rows = Buffer.alloc((width * 3 + 1) * height, 0x80)
  for (let y = 0; y < height; y++) rows[y * (width * 3 + 1)] = 0
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('pHYs', physical),
    chunk('IDAT', deflateSync(rows, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const FILES: [string, Buffer | string][] = [
  ['pw-bemutato.pptx', pptx()],
  ['pw-bemutato.odp', odp()],
  ['pw-rajz.svg', SVG_BODY],
  ['pw-rajz-doctype.svg', SVG_DOCTYPE],
  ['pw-oldal.html', HTML],
  ['pw-torzs.html', HTML_FRAGMENT],
  ['pw-stilus.css', STYLE],
  ['pw-kep-80x40.png', png(80, 40)],
]

mkdirSync(OUT, { recursive: true })
for (const [name, data] of FILES) writeFileSync(join(OUT, name), data)
console.log(`${FILES.length} fixture fajl: ${OUT}`)
