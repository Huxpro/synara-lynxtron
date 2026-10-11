import {
  hasActiveComposerSend,
  subscribeComposerSends,
} from "@synara-web/lib/composerSendOwnership";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "@lynx-js/react";
import { useStore } from "@synara-web/store";
import { createThreadSelector } from "@synara-web/storeSelectors";
import { getThreadFromState } from "@synara-web/threadDerivation";
import { hasFileUndoSettled, type PendingFileUndo } from "@synara-web/components/ChatView.logic";
import type { TurnId } from "@synara/contracts";
import {
  canContinueFailedTurn,
  createUndoTurnFiles,
} from "../generated/transcriptCardActions.generated";
export interface ComposerRecoveryActions {
  readonly continueFailedTurn: (turnId: TurnId) => Promise<void>;
  readonly openModelPicker: () => void;
}
interface CardActions {
  readonly onUndoTurnFiles?: (counts: readonly number[]) => void;
  readonly isUndoing: boolean;
  readonly recoverableTurnId: TurnId | null;
  readonly recoveryDisabled: boolean;
  readonly composer: ComposerRecoveryActions | null;
}
const Context = createContext<CardActions>({
  isUndoing: false,
  recoverableTurnId: null,
  recoveryDisabled: true,
  composer: null,
});
export const useTranscriptCardActions = () => useContext(Context);
export function TranscriptCardActionsProvider(props: {
  readonly children?: ReactNode;
  readonly threadId: string;
  readonly composer: ComposerRecoveryActions | null;
  readonly onThreadError?: (error: string | null) => void;
}) {
  const thread = useStore(
    useMemo(() => createThreadSelector(props.threadId as never), [props.threadId]),
  );
  const sendBusy = useSyncExternalStore(
    subscribeComposerSends,
    () => hasActiveComposerSend(props.threadId as never),
    () => false,
  );
  const [pending, setPending] = useState<PendingFileUndo | null>(null);
  const [isUndoing, setIsUndoing] = useState(false);
  const undoClaim = useRef(false);
  useEffect(() => {
    "background only";
    if (pending && hasFileUndoSettled({ pending, thread: thread ?? null })) {
      setPending(null);
      setIsUndoing(false);
    }
  }, [pending, thread]);
  const latest = thread?.latestTurn;
  const recoverableTurnId = latest?.state === "error" ? latest.turnId : null;
  const recoveryDisabled =
    sendBusy ||
    !recoverableTurnId ||
    !canContinueFailedTurn(thread, recoverableTurnId, props.composer, true);
  const undo = async (counts: readonly number[]) => {
    "background only";
    if (undoClaim.current) return;
    undoClaim.current = true;
    try {
      const current = getThreadFromState(useStore.getState(), props.threadId as never);
      await createUndoTurnFiles({
        activeThread: current,
        isRevertingCheckpoint: isUndoing,
        hasLiveTurn: current?.session?.status === "running",
        isSendBusy: hasActiveComposerSend(props.threadId as never),
        isConnecting: current?.session?.status === "connecting",
        setThreadError: (_id, error) => props.onThreadError?.(error),
        setIsRevertingCheckpoint: setIsUndoing,
        setPendingFileUndo: setPending,
      })(counts);
    } finally {
      undoClaim.current = false;
    }
  };
  return (
    <Context.Provider
      value={{
        onUndoTurnFiles: undo,
        isUndoing,
        recoverableTurnId,
        recoveryDisabled,
        composer: props.composer,
      }}
    >
      {props.children}
    </Context.Provider>
  );
}
