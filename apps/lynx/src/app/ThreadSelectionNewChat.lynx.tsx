import type { ThreadEnvironmentMode } from "@synara/contracts";
import type { TranscriptAssistantSelection } from "@synara-web/components/chat/chatSelectionActions";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import type { ThreadHeaderSummary } from "./queries";
import { startNativeSelectionChat } from "./selectionChat.lynx";
import { SelectionNewChatComposer } from "./SelectionNewChatComposer.lynx";
import type { TranscriptSelectionAnchor } from "./Transcript";

/**
 * The thread page's "Add to new Chat" composer: starts the new chat in the thread's project
 * with the thread's model and runtime mode, and navigates to it.
 */
export function ThreadSelectionNewChat(props: {
  readonly thread: ThreadHeaderSummary & { readonly workspaceRoot: string };
  readonly selectionChat: {
    readonly selection: TranscriptAssistantSelection;
    readonly anchor: TranscriptSelectionAnchor;
  };
  readonly defaultEnvMode: ThreadEnvironmentMode;
  readonly canUseWorktree: boolean;
  readonly onClose: () => void;
  readonly onNavigateToThread: (threadId: string) => void;
}) {
  const { thread, selectionChat } = props;
  return (
    <SelectionNewChatComposer
      selection={selectionChat.selection}
      anchor={selectionChat.anchor}
      defaultEnvMode={props.defaultEnvMode}
      canUseWorktree={props.canUseWorktree}
      onClose={props.onClose}
      onSubmit={async (prompt, envMode, intent) => {
        "background only";
        // The composer's current pick (draft) wins over the thread's persisted one.
        const draft = useComposerDraftStore.getState().draftsByThreadId[thread.id];
        const nextThreadId = await startNativeSelectionChat({
          selection: selectionChat.selection,
          prompt,
          envMode,
          intent,
          projectId: thread.projectId,
          projectCwd: thread.workspaceRoot,
          modelSelection: draft?.modelSelection ?? thread.modelSelection,
          runtimeMode: draft?.runtimeMode ?? thread.runtimeMode,
        });
        props.onNavigateToThread(nextThreadId);
      }}
    />
  );
}
