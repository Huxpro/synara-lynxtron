import { useEffect, useRef, useState } from "@lynx-js/react";

import { dispatchSynaraCommand } from "../data/synaraClient.lynx";
import { queryClient } from "./queries";

function temporaryCommandId(): string {
  "background only";
  return `lynx-temporary-thread-delete-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function toggleTemporaryThreadId(
  currentThreadId: string | null,
  activeThreadId: string,
): string | null {
  return currentThreadId === activeThreadId ? null : activeThreadId;
}

export function shouldDeleteDepartingTemporaryThread(
  temporaryThreadId: string | null,
  departingThreadId: string,
): boolean {
  return temporaryThreadId === departingThreadId;
}

export async function deleteTemporaryThreadBestEffort(input: {
  readonly dispatchDelete: () => Promise<unknown>;
  readonly invalidate: () => Promise<unknown>;
}): Promise<void> {
  await input.dispatchDelete().catch(() => undefined);
  await input.invalidate().catch(() => undefined);
}

export function useTemporaryThreadLifecycle(
  threadId: string,
  initialTemporary = false,
): {
  readonly temporary: boolean;
  readonly toggleTemporary: () => void;
} {
  const [temporaryThreadId, setTemporaryThreadId] = useState<string | null>(
    initialTemporary ? threadId : null,
  );
  const temporaryThreadIdRef = useRef<string | null>(null);
  temporaryThreadIdRef.current = temporaryThreadId;

  useEffect(() => {
    return () => {
      if (!shouldDeleteDepartingTemporaryThread(temporaryThreadIdRef.current, threadId)) {
        return;
      }
      void deleteTemporaryThreadBestEffort({
        dispatchDelete: () =>
          dispatchSynaraCommand({
            type: "thread.delete",
            commandId: temporaryCommandId() as never,
            threadId: threadId as never,
          }),
        invalidate: () =>
          Promise.all([
            queryClient.invalidateQueries({ queryKey: ["threads"] }),
            queryClient.invalidateQueries({
              queryKey: ["sidebar-snapshot"],
            }),
          ]),
      });
    };
  }, [threadId]);

  return {
    temporary: temporaryThreadId === threadId,
    toggleTemporary: () =>
      setTemporaryThreadId((current) => toggleTemporaryThreadId(current, threadId)),
  };
}
