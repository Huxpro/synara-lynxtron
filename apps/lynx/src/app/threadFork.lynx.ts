import { newThreadId } from "@synara-web/lib/utils";

import { ensureNativeApi } from "~/nativeApi";
import type { ThreadHeaderSummary } from "./queries";
import { buildNativeThreadForkCreateCommand } from "./threadFork.logic";

export async function createNativeThreadFork(input: {
  readonly thread: ThreadHeaderSummary;
  readonly throughMessageId: string;
}): Promise<string> {
  "background only";
  const nextThreadId = newThreadId();
  await ensureNativeApi().orchestration.dispatchCommand(
    buildNativeThreadForkCreateCommand({
      createdAt: new Date().toISOString(),
      nextThreadId,
      thread: input.thread,
      throughMessageId: input.throughMessageId,
    }),
  );
  return nextThreadId;
}
