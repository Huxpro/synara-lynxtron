import type { EditorId } from '@synara/contracts';
import { EDITORS } from '@synara/contracts';

export function firstAvailableEditor(
  availableEditors: readonly EditorId[]
): EditorId | null {
  const available = new Set(availableEditors);
  return EDITORS.find((editor) => available.has(editor.id))?.id ?? null;
}

export function shouldOfferRecoveryTools(input: {
  readonly projectCount: number;
  readonly threadCount: number;
  readonly threadsHydrated: boolean;
  readonly allThreadsMessageless: boolean;
}): boolean {
  if (!input.threadsHydrated || input.projectCount === 0) return false;
  return input.threadCount === 0 || input.allThreadsMessageless;
}

export function advancedAppVersion(): string {
  return process.env.SYNARA_APP_VERSION || '0.0.0';
}
