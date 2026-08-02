import type { ClientOrchestrationCommand } from '@synara/contracts';

import type { ThreadContextMenuActionId } from '@synara-web/components/ThreadContextMenuItems.logic';

export function resolveSecondaryPointerOffset(event: {
  readonly button?: number;
  readonly x?: number;
  readonly y?: number;
}): { readonly x: number; readonly y: number } | null {
  if (event.button !== 2) return null;
  if (!Number.isFinite(event.x) || !Number.isFinite(event.y)) return null;
  return { x: event.x!, y: event.y! };
}

export function buildNativeThreadContextCommand(input: {
  readonly action: ThreadContextMenuActionId;
  readonly commandId: string;
  readonly isPinned: boolean;
  readonly threadId: string;
}): ClientOrchestrationCommand | null {
  if (input.action === 'toggle-pin') {
    return {
      type: 'thread.meta.update',
      commandId: input.commandId as never,
      threadId: input.threadId as never,
      isPinned: !input.isPinned,
    };
  }
  if (input.action === 'archive') {
    return {
      type: 'thread.archive',
      commandId: input.commandId as never,
      threadId: input.threadId as never,
    };
  }
  if (input.action === 'delete') {
    return {
      type: 'thread.delete',
      commandId: input.commandId as never,
      threadId: input.threadId as never,
    };
  }
  return null;
}

export function nativeThreadContextConfirmation(
  action: ThreadContextMenuActionId,
  title: string
): string | null {
  if (action === 'archive') {
    return [
      `Archive thread "${title}"?`,
      'Archived threads are hidden from the sidebar but can be restored later.',
    ].join('\n');
  }
  if (action === 'delete') {
    return [
      `Delete thread "${title}"?`,
      'This permanently clears conversation history for this thread.',
    ].join('\n');
  }
  return null;
}
