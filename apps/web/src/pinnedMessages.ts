// FILE: pinnedMessages.ts
// Purpose: Pure transforms + dispatch helpers for per-thread pinned messages and notes.
// Layer: Chat environment panel + message timeline helpers.

import { type MessageId, type PinnedMessage, type ThreadId } from "@synara/contracts";
import {
  addPinnedMessage,
  clampThreadNotes,
  derivePinLabel,
  displayLabelFor,
  isMessagePinned,
  normalizePinLabel,
  removePinnedMessage,
  setPinnedMessageDone,
  setPinnedMessageLabel,
  togglePinnedMessage,
  togglePinnedMessageDone,
} from "@synara/shared/pinnedMessages";

import { newCommandId } from "./lib/utils";
import { readNativeApi } from "./nativeApi";

export { clampThreadNotes, derivePinLabel, displayLabelFor, isMessagePinned, normalizePinLabel };

export function addPin(
  pins: readonly PinnedMessage[] | undefined,
  messageId: MessageId,
  pinnedAt: string,
): PinnedMessage[] {
  return addPinnedMessage(pins, { messageId, label: null, done: false, pinnedAt });
}

export function removePin(
  pins: readonly PinnedMessage[] | undefined,
  messageId: MessageId,
): PinnedMessage[] {
  return removePinnedMessage(pins, messageId);
}

export function restorePinAtIndex(
  pins: readonly PinnedMessage[] | undefined,
  pin: PinnedMessage,
  index: number,
): PinnedMessage[] {
  const existingPins = pins ?? [];
  if (isMessagePinned(existingPins, pin.messageId)) {
    return existingPins as PinnedMessage[];
  }
  const nextPins = [...existingPins];
  nextPins.splice(Math.max(0, Math.min(index, nextPins.length)), 0, pin);
  return nextPins;
}

export function togglePin(
  pins: readonly PinnedMessage[] | undefined,
  messageId: MessageId,
  pinnedAt: string,
): PinnedMessage[] {
  return togglePinnedMessage(pins, { messageId, label: null, done: false, pinnedAt });
}

export function togglePinDone(
  pins: readonly PinnedMessage[] | undefined,
  messageId: MessageId,
): PinnedMessage[] {
  return togglePinnedMessageDone(pins, messageId);
}

export function setPinDone(
  pins: readonly PinnedMessage[] | undefined,
  messageId: MessageId,
  done: boolean,
): PinnedMessage[] {
  return setPinnedMessageDone(pins, messageId, done);
}

/** Set (or clear, with `null`) a pin's user-provided label. Empty input clears it. */
export function setPinLabel(
  pins: readonly PinnedMessage[] | undefined,
  messageId: MessageId,
  label: string | null,
): PinnedMessage[] {
  return setPinnedMessageLabel(pins, messageId, label);
}

async function dispatchSidepanelCommand(
  command:
    | {
        readonly type: "thread.pinned-message.add" | "thread.pinned-message.remove";
        readonly threadId: ThreadId;
        readonly messageId: MessageId;
      }
    | {
        readonly type: "thread.pinned-message.done.set";
        readonly threadId: ThreadId;
        readonly messageId: MessageId;
        readonly done: boolean;
      }
    | {
        readonly type: "thread.pinned-message.label.set";
        readonly threadId: ThreadId;
        readonly messageId: MessageId;
        readonly label: string | null;
      }
    | {
        readonly type: "thread.meta.update";
        readonly threadId: ThreadId;
        readonly notes: string;
      },
): Promise<void> {
  const api = readNativeApi();
  if (!api) {
    return;
  }
  await api.orchestration.dispatchCommand({
    commandId: newCommandId(),
    ...command,
  });
}

export function dispatchPinnedMessageAdd(threadId: ThreadId, messageId: MessageId): Promise<void> {
  return dispatchSidepanelCommand({ type: "thread.pinned-message.add", threadId, messageId });
}

export function dispatchPinnedMessageRemove(
  threadId: ThreadId,
  messageId: MessageId,
): Promise<void> {
  return dispatchSidepanelCommand({ type: "thread.pinned-message.remove", threadId, messageId });
}

export function dispatchPinnedMessageDoneSet(
  threadId: ThreadId,
  messageId: MessageId,
  done: boolean,
): Promise<void> {
  return dispatchSidepanelCommand({
    type: "thread.pinned-message.done.set",
    threadId,
    messageId,
    done,
  });
}

export function dispatchPinnedMessageLabelSet(
  threadId: ThreadId,
  messageId: MessageId,
  label: string | null,
): Promise<void> {
  return dispatchSidepanelCommand({
    type: "thread.pinned-message.label.set",
    threadId,
    messageId,
    label: normalizePinLabel(label),
  });
}

export function dispatchThreadNotes(threadId: ThreadId, notes: string): Promise<void> {
  return dispatchSidepanelCommand({
    type: "thread.meta.update",
    threadId,
    notes: clampThreadNotes(notes),
  });
}
