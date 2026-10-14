/** Egy gyakorlo vizsga a frontend `ExamDetail` alakjaban (egyetlen resszel). */
export function buildExamDetail(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const part = {
    id: 11,
    order: 1,
    key: 'spreadsheet',
    name: 'Táblázatkezelés',
    points: 15,
    minutes: 45,
    description: 'Készítsd el a táblázatot.',
    steps: [],
    sources: [],
    deliverable: 'hyrox',
    accepted_extensions: ['xlsx'],
    software: 'Excel / Calc',
    exercise_id: null,
  }
  return {
    id: 5,
    session: '2026-05',
    title: 'Gyakorló feladatsor',
    level: 'emelt',
    minutes: 240,
    points: 100,
    parts: [part],
    attempt: null,
    source_zip: null,
    ...overrides,
  }
}

/** Egy futo probalkozas; a `server_time` es a `deadline` ISO idopont. */
export function buildExamAttempt(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 9,
    exam_id: 5,
    mode: 'exam',
    state: 'in_progress',
    started_at: new Date().toISOString(),
    deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    server_time: new Date().toISOString(),
    submissions: [],
    ...overrides,
  }
}

/** A vizsga eredmenyoldala (reszek nelkul). */
export function buildExamResult(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    attempt_id: 9,
    exam: buildExamDetail(),
    score: 40,
    max_score: 100,
    pending_manual_points: 0,
    parts: [],
    review: [],
    ...overrides,
  }
}
