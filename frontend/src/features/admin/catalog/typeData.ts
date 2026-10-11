import type { ExerciseKind } from '../../../types'
import type { AdminExercise, Comparison, ExerciseSpecValue } from './api'
import { isJsonKind, isUploadExerciseKind, SPEC_SAMPLES } from './kinds'

/** A „Típus-adatok” fül űrlapállapota: szöveges mezők, hogy a félig kitöltött érték se vesszen el. */
export interface UploadFields {
  steps: string
  deliverable: string
  accepted_extensions: string[]
  software: string
  exam_reference: string
  exam_points: string
  raw_points: string
}

export interface SubtaskRow {
  /** Csak a listaelem azonosítására: a sorszám szerkeszthető, ezért nem lehet kulcs. */
  key: number
  number: string
  label: string
  points: string
}

export interface TypeData {
  upload: UploadFields
  /** A mély szerkezetű típusok (web, böngészős gyakorlók, SQL) JSON-ja szövegként. */
  specText: string
  subtasks: SubtaskRow[]
  comparison: Comparison | null
}

let nextRowKey = 1
export const newRowKey = (): number => nextRowKey++

const text = (value: unknown): string => (typeof value === 'string' ? value : '')
const list = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
const numberText = (value: unknown): string => (typeof value === 'number' ? String(value) : '')

export function emptyUploadFields(): UploadFields {
  return { steps: '', deliverable: '', accepted_extensions: [], software: '', exam_reference: '', exam_points: '', raw_points: '' }
}

/** A mentett feladat `spec` és `comparison` mezőiből a szerkesztő állapota. */
export function initialTypeData(exercise: AdminExercise | null): TypeData {
  const kind = exercise?.kind ?? 'code'
  const spec = exercise?.spec ?? null
  const data: TypeData = { upload: emptyUploadFields(), specText: '', subtasks: [], comparison: exercise?.comparison ?? null }

  if (spec && isUploadExerciseKind(kind)) {
    data.upload = {
      steps: list(spec.steps).join('\n'),
      deliverable: text(spec.deliverable),
      accepted_extensions: list(spec.accepted_extensions),
      software: list(spec.software).join(', '),
      exam_reference: text(spec.exam_reference),
      exam_points: numberText(spec.exam_points),
      raw_points: numberText(spec.raw_points),
    }
  } else if (spec && isJsonKind(kind)) {
    data.specText = JSON.stringify(spec, null, 2)
  } else if (spec && kind === 'code' && Array.isArray(spec.subtasks)) {
    data.subtasks = spec.subtasks.flatMap((row: unknown) => {
      if (typeof row !== 'object' || row === null) return []
      const item = row as Record<string, unknown>
      return [{ key: newRowKey(), number: numberText(item.number), label: text(item.label), points: numberText(item.points) }]
    })
  }

  return data
}

const nullableNumber = (value: string): number | null => (value.trim() === '' ? null : Number(value))
const nullableText = (value: string): string | null => (value.trim() === '' ? null : value.trim())
const lines = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '')

export interface BuiltTypeData {
  spec: ExerciseSpecValue | null
  comparison: Comparison | null
  /** A JSON szövegének hibája; ilyenkor nem mentünk. */
  jsonError: string | null
}

/** A küldendő `spec` és `comparison` a típus szerint; a többi típus adata nem megy el. */
export function buildTypeData(kind: ExerciseKind, data: TypeData): BuiltTypeData {
  if (isUploadExerciseKind(kind)) {
    const { upload } = data
    return {
      spec: {
        steps: lines(upload.steps),
        deliverable: nullableText(upload.deliverable),
        accepted_extensions: upload.accepted_extensions,
        software: upload.software
          .split(/[,\n]/)
          .map((item) => item.trim())
          .filter((item) => item !== ''),
        exam_reference: nullableText(upload.exam_reference),
        exam_points: nullableNumber(upload.exam_points),
        raw_points: nullableNumber(upload.raw_points),
      },
      comparison: null,
      jsonError: null,
    }
  }

  if (isJsonKind(kind)) {
    if (data.specText.trim() === '') return { spec: null, comparison: null, jsonError: null }
    try {
      const parsed: unknown = JSON.parse(data.specText)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return { spec: null, comparison: null, jsonError: 'A JSON legfelső szintje egy objektum legyen, pl. { "files": [...] }.' }
      }
      return { spec: parsed as ExerciseSpecValue, comparison: null, jsonError: null }
    } catch (error) {
      const detail = error instanceof Error ? ` (${error.message})` : ''
      return { spec: null, comparison: null, jsonError: `A JSON nem értelmezhető${detail}. Javítsd a szöveget, utána mentsd újra.` }
    }
  }

  // code: részfeladatok + az összevetés módja
  const subtasks = data.subtasks.map((row) => ({ number: Number(row.number), label: row.label.trim(), points: Number(row.points) }))
  return { spec: subtasks.length > 0 ? { subtasks } : null, comparison: data.comparison, jsonError: null }
}

/** A kiinduló minta a JSON-szerkesztőbe, ha a típushoz van. */
export function sampleText(kind: ExerciseKind): string {
  const sample = SPEC_SAMPLES[kind]
  return sample ? JSON.stringify(sample, null, 2) : ''
}
