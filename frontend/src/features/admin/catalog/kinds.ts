import type { ExerciseKind } from '../../../types'

/** A feladat típusai magyarul, a szerkesztőben megjelenő sorrendben. */
export const KIND_OPTIONS: ReadonlyArray<{ value: ExerciseKind; label: string }> = [
  { value: 'code', label: 'Programozás (szerkesztő, tesztesetek)' },
  { value: 'sql', label: 'SQL (szerkesztő, tesztesetek)' },
  { value: 'sheet_upload', label: 'Táblázatkezelés (fájlfeltöltés)' },
  { value: 'doc_upload', label: 'Szövegszerkesztés (fájlfeltöltés)' },
  { value: 'visual_upload', label: 'Bemutató vagy kép (fájlfeltöltés)' },
  { value: 'web', label: 'Weboldal (böngészőben ellenőrzött)' },
  { value: 'sheet_browser', label: 'Táblázat-gyakorló (böngészőben)' },
  { value: 'doc_browser', label: 'Szöveg-gyakorló (böngészőben)' },
]

/** Szerkesztős típus: nyelv, kiinduló kód és tesztesetek tartoznak hozzá. */
export const isEditorKind = (kind: ExerciseKind): boolean => kind === 'code' || kind === 'sql'

export const isUploadExerciseKind = (kind: ExerciseKind): boolean => kind === 'sheet_upload' || kind === 'doc_upload' || kind === 'visual_upload'

/** A feladathoz feltölthető fájlszerepek típusonként (a szerver `ManageAttachment::assertRoleFits` szabályával egyező). */
export function attachmentRolesFor(kind: ExerciseKind): ReadonlyArray<'source' | 'input' | 'sample_image' | 'sample_solution'> {
  if (isEditorKind(kind)) return ['source', 'input']
  if (isUploadExerciseKind(kind)) return ['source', 'sample_image', 'sample_solution']
  return ['source', 'sample_image']
}

/** Ezeknél a `spec` JSON-ként szerkeszthető (mély szerkezet). */
export const isJsonKind = (kind: ExerciseKind): boolean => kind === 'web' || kind === 'sheet_browser' || kind === 'doc_browser' || kind === 'sql'

/** A típushoz választható beadási kiterjesztések (a szerver ugyanezt engedi). */
export const UPLOAD_EXTENSIONS: Readonly<Record<'sheet_upload' | 'doc_upload' | 'visual_upload', readonly string[]>> = {
  sheet_upload: ['.xlsx', '.ods'],
  doc_upload: ['.docx', '.odt'],
  visual_upload: ['.pptx', '.odp', '.svg', '.png'],
}

/** A JSON-szerkesztő kiinduló mintája: a szerver ezt a szerkezetet várja. */
export const SPEC_SAMPLES: Readonly<Partial<Record<ExerciseKind, object>>> = {
  web: {
    files: [{ name: 'index.html', language: 'html', content: '<!doctype html>\n<title>Címlap</title>\n<h1>Üdv!</h1>\n' }],
    checks: [{ label: 'Az oldal címe megfelelő', points: 1, hint: 'A <title> elemben a kért szöveg álljon.', type: 'title', value: 'Címlap' }],
    exam_reference: null,
  },
  sheet_browser: {
    columns: 4,
    rows: 6,
    cells: { A1: 'Név', B1: 'Pont' },
    checks: [{ label: 'A B2 cellában képlet van', type: 'has_formula', cell: 'B2' }],
  },
  doc_browser: {
    paragraphs: ['Első bekezdés.', 'Második bekezdés.'],
    checks: [{ label: 'Az első bekezdés középre igazított', paragraph: 0, type: 'align', value: 'center' }],
  },
  sql: {
    database: 'iskola',
    tables: [{ name: 'tanulo', columns: [{ name: 'id', primary: true }, { name: 'nev' }] }],
    subtasks: [{ label: 'Az összes tanuló', query_name: 'osszes', points: 2 }],
  },
}
