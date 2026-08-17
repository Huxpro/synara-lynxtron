export interface LocalServerStopFeedback {
  readonly pid: number;
  readonly message: string;
}

export function retainLocalServerStopFeedback(
  feedback: LocalServerStopFeedback | null,
  serverPids: readonly number[]
): LocalServerStopFeedback | null {
  if (!feedback) return null;
  return serverPids.includes(feedback.pid) ? feedback : null;
}
