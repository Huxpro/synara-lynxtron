import type { OrchestrationCheckpointSummary } from '@synara/contracts';

export type RepoDiffScope =
  | 'branch'
  | 'staged'
  | 'unstaged'
  | 'workingTree';
export type EditorDiffSource =
  | RepoDiffScope
  | 'allTurns'
  | 'lastTurn'
  | `turn:${string}`;

export type EditorDiffRequest =
  | { readonly kind: 'empty' }
  | { readonly kind: 'repo'; readonly scope: RepoDiffScope }
  | {
      readonly kind: 'turn';
      readonly fromTurnCount: number;
      readonly toTurnCount: number;
    }
  | { readonly kind: 'full-thread'; readonly toTurnCount: number };

export function sortEditorDiffCheckpoints(
  checkpoints: readonly OrchestrationCheckpointSummary[]
): OrchestrationCheckpointSummary[] {
  return [...checkpoints].toSorted((left, right) =>
    left.checkpointTurnCount !== right.checkpointTurnCount
      ? right.checkpointTurnCount - left.checkpointTurnCount
      : right.completedAt.localeCompare(left.completedAt)
  );
}

export function resolveEditorDiffRequest(
  source: EditorDiffSource,
  checkpoints: readonly OrchestrationCheckpointSummary[]
): EditorDiffRequest {
  if (
    source === 'workingTree' ||
    source === 'unstaged' ||
    source === 'staged' ||
    source === 'branch'
  ) {
    return { kind: 'repo', scope: source };
  }
  const ordered = sortEditorDiffCheckpoints(checkpoints);
  const latest = ordered[0];
  if (!latest) return { kind: 'empty' };
  if (source === 'allTurns') {
    return { kind: 'full-thread', toTurnCount: latest.checkpointTurnCount };
  }
  const selected =
    source === 'lastTurn'
      ? latest
      : ordered.find(
          (checkpoint) => checkpoint.turnId === source.slice('turn:'.length)
        );
  if (!selected) return { kind: 'empty' };
  return {
    kind: 'turn',
    fromTurnCount: Math.max(0, selected.checkpointTurnCount - 1),
    toTurnCount: selected.checkpointTurnCount,
  };
}
