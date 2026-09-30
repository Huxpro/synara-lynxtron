import type { ModelSelection, RuntimeMode, ThreadEnvironmentMode } from "@synara/contracts";
import type { TranscriptAssistantSelection } from "@synara-web/components/chat/chatSelectionActions";
import { newCommandId, newMessageId, newThreadId } from "@synara-web/lib/utils";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import { buildComposerTurnStartCommand } from "../components/composer/composerDispatch.logic";
import { dispatchSynaraCommand, fetchGitStatus } from "../data/synaraClient.lynx";
import {
  queryClient,
  resolveNativeAssistantDeliveryMode,
  type ThreadHeaderSummary,
} from "./queries";
import { buildSelectionChatCreateCommand, requireSelectionAttachment } from "./selectionChat.logic";
import { createNativeSidechat } from "./sidechatCreate.lynx";
import { canCreateLynxSidechat } from "./sidechatCreate.logic";

/** Electron's addSelectionToSide: a new Side chat whose composer already quotes the text. */
export async function addSelectionToNativeSide(input: {
  readonly source: ThreadHeaderSummary;
  readonly selection: TranscriptAssistantSelection;
}): Promise<string> {
  "background only";
  const attachment = requireSelectionAttachment(input.selection);
  if (!canCreateLynxSidechat(input.source)) {
    throw new Error("Open a main chat before starting Side.");
  }
  return createNativeSidechat({ source: input.source, seedSelection: attachment });
}

/**
 * Electron's startSelectionChat: opens a new chat in the project that either sends the
 * prompt with the quote ("send") or leaves both in its composer ("compose"). Returns the
 * new thread id for navigation.
 */
export async function startNativeSelectionChat(input: {
  readonly selection: TranscriptAssistantSelection;
  readonly prompt: string;
  readonly envMode: ThreadEnvironmentMode;
  readonly intent: "send" | "compose";
  readonly projectId: string;
  readonly projectCwd: string;
  readonly modelSelection: ModelSelection;
  readonly runtimeMode: RuntimeMode;
}): Promise<string> {
  "background only";
  const attachment = requireSelectionAttachment(input.selection);
  const prompt = input.prompt.trim();
  if (!prompt && input.intent !== "compose") throw new Error("Write a message for the new chat.");

  let branch: string | null = null;
  if (input.envMode === "worktree") {
    branch = (await fetchGitStatus(input.projectCwd)).branch ?? null;
    if (!branch) throw new Error("Check out a branch before starting a new worktree.");
  }
  const threadId = newThreadId();
  await dispatchSynaraCommand(
    buildSelectionChatCreateCommand({
      commandId: newCommandId(),
      createdAt: new Date().toISOString(),
      threadId,
      projectId: input.projectId,
      modelSelection: input.modelSelection,
      runtimeMode: input.runtimeMode,
      envMode: input.envMode,
      branch,
    }),
  );

  if (input.intent === "compose") {
    const drafts = useComposerDraftStore.getState();
    drafts.setPrompt(threadId, input.prompt);
    drafts.addAssistantSelection(threadId, attachment);
  } else {
    await dispatchSynaraCommand(
      buildComposerTurnStartCommand({
        assistantDeliveryMode: await resolveNativeAssistantDeliveryMode(),
        attachments: [attachment],
        commandId: newCommandId(),
        createdAt: new Date().toISOString(),
        interactionMode: "default",
        messageId: newMessageId(),
        modelSelection: input.modelSelection,
        runtimeMode: input.runtimeMode,
        text: prompt,
        threadId,
      }),
    );
  }
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["threads"] }),
    queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
  ]);
  return threadId;
}
