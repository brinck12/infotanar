import { http } from '../../shared/api/client'
import type { RunRequest, RunResponse, SubmissionResponse } from '../../types'

/** "Futtatás": csak a nyilvános teszteseteken fut, nem mentődik. */
export async function runCode(payload: RunRequest): Promise<RunResponse> {
  return (await http.post<RunResponse>('/run', payload)).data
}

/** "Beadás": minden teszteseten fut, és mentődik. */
export async function submitCode(payload: RunRequest): Promise<SubmissionResponse> {
  return (await http.post<SubmissionResponse>('/submissions', payload)).data
}
