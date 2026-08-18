export function normalizeLynxRpcPayload(
  tag: string,
  payload: unknown
): unknown {
  if (
    tag !== 'orchestration.dispatchCommand' ||
    !payload ||
    typeof payload !== 'object' ||
    !('type' in payload) ||
    payload.type !== 'thread.create'
  ) {
    return payload;
  }
  return {
    ...payload,
    branch: 'branch' in payload ? payload.branch : null,
    worktreePath: 'worktreePath' in payload ? payload.worktreePath : null,
  };
}
