import { newThreadId } from "@synara-web/lib/utils";

import { dispatchSynaraCommand } from "../data/synaraClient.lynx";
import { queryClient, type ThreadHeaderSummary } from "./queries";
import { buildNativeThreadForkCreateCommand } from "./threadFork.logic";

export async function createNativeThreadFork(input: {
  readonly thread: ThreadHeaderSummary;
  readonly throughMessageId: string;
}): Promise<string> {
  "background only";
  const nextThreadId = newThreadId();
  await dispatchSynaraCommand(
    buildNativeThreadForkCreateCommand({
      createdAt: new Date().toISOString(),
      nextThreadId,
      thread: input.thread,
      throughMessageId: input.throughMessageId,
    }),
  );
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["threads"] }),
    queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
  ]);
  return nextThreadId;
}
