import { newCommandId, newThreadId } from "@synara-web/lib/utils";
import type { ChatAssistantSelectionAttachment } from "@synara/contracts";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import { ensureNativeApi } from "~/nativeApi";
import { queryClient, type ThreadHeaderSummary } from "./queries";
import { buildLynxSidechatCreateCommand } from "./sidechatCreate.logic";

/**
 * Creates a Side chat forked from `source` and returns its thread id. A selection seeds the
 * Side composer before the pane mounts, as Electron's addSelectionToSide does.
 */
export async function createNativeSidechat(input: {
  readonly source: ThreadHeaderSummary;
  readonly seedSelection?: ChatAssistantSelectionAttachment;
}): Promise<string> {
  "background only";
  const sidechatThreadId = newThreadId();
  await ensureNativeApi().orchestration.dispatchCommand(
    buildLynxSidechatCreateCommand({
      commandId: newCommandId(),
      createdAt: new Date().toISOString(),
      source: input.source,
      threadId: sidechatThreadId,
    }),
  );
  if (input.seedSelection) {
    useComposerDraftStore.getState().addAssistantSelection(sidechatThreadId, input.seedSelection);
  }
  await queryClient.invalidateQueries({ queryKey: ["thread-detail", sidechatThreadId] });
  return sidechatThreadId;
}
