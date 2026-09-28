import type { RunResponse, RunStatus, SubmissionResponse, TestResult } from '../../api/types'

/**
 * Fluent builder egy teszteset eredmenyere. Alapertelmezesben egy
 * sikeres, nem rejtett eredmenyt ad a mintafeladat elso tesztesetere.
 */
export class TestResultBuilder {
  private result: TestResult = {
    test_case_id: 1,
    hidden: false,
    passed: true,
    time: 0.02,
    exit_code: 0,
    judge_status: 'Accepted',
    stdin: '3\n5\n10\n15\n',
    stdout: '30\n',
    expected: '30\n',
    stderr: '',
    compile_output: '',
  }

  withId(id: number): this {
    this.result.test_case_id = id
    return this
  }

  /** Hibas kimenet: a program lefutott, de mast irt ki, mint az elvart. */
  failing(actualStdout = '0\n'): this {
    this.result.passed = false
    this.result.stdout = actualStdout
    return this
  }

  /** Rejtett teszteset: a backend a kimeneti mezoket nem kuldi vissza. */
  hidden(): this {
    const { test_case_id, passed, time, exit_code, judge_status } = this.result
    this.result = { test_case_id, hidden: true, passed, time, exit_code, judge_status }
    return this
  }

  with(overrides: Partial<TestResult>): this {
    this.result = { ...this.result, ...overrides }
    return this
  }

  build(): TestResult {
    return { ...this.result }
  }
}

/**
 * Fluent builder egy futtatas/beadas valaszra. Ha nincs explicit statusz,
 * az eredmenyekbol szarmaztatja (mind sikeres -> passed, kulonben failed).
 */
export class RunResponseBuilder {
  private results: TestResult[] = []
  private status: RunStatus | undefined
  private message: string | undefined

  withResults(...results: (TestResult | TestResultBuilder)[]): this {
    this.results.push(...results.map((r) => (r instanceof TestResultBuilder ? r.build() : r)))
    return this
  }

  withStatus(status: RunStatus): this {
    this.status = status
    return this
  }

  /** Futtatasi hiba (pl. elerhetetlen kodfuttato) felhasznaloi uzenettel. */
  errored(message: string): this {
    this.status = 'error'
    this.message = message
    this.results = []
    return this
  }

  build(): RunResponse {
    const status = this.status ?? (this.results.every((r) => r.passed) ? 'passed' : 'failed')
    return {
      status,
      results: [...this.results],
      ...(this.message === undefined ? {} : { message: this.message }),
    }
  }

  buildSubmission(submissionId = 1): SubmissionResponse {
    return { submission_id: submissionId, ...this.build() }
  }
}

export const aTestResult = (): TestResultBuilder => new TestResultBuilder()
export const aRunResponse = (): RunResponseBuilder => new RunResponseBuilder()
