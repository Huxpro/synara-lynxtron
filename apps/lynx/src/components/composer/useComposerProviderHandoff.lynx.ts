// FILE: components/composer/useComposerProviderHandoff.lynx.ts
// Purpose: The composer's side of upstream's in-thread handoff on send: a model
//   of another provider picked in a started thread hands the thread to that
//   provider in place, right before the message is dispatched.
//   Upstream wires this in `ChatView.tsx` (`canSendWithProviderHandoff`,
//   `prepareProviderHandoffForSend`) and `useChatTurnExecution.ts`; the wiring
//   is mirrored here over the same pieces: the decisions in
//   `app/providerHandoffSend.logic.ts` and upstream's `continueThreadHandoff`.
// Layer: L3 orchestration (Lynx)

import type { ModelSelection, ProviderKind, ThreadId } from "@synara/contracts";
import { useStore } from "@synara-web/store";
import { getThreadFromState } from "@synara-web/threadDerivation";
import type { Thread } from "@synara-web/types";

import {
  isProviderHandoffDisabled,
  needsProviderHandoffForSend,
  resolveProviderHandoffSendRefusal,
  resolveSendCreatedAtAfterProviderHandoff,
  type ProviderHandoffSendRefusal,
} from "../../app/providerHandoffSend.logic";
import { useThreadHandoff } from "../../generated/threadHandoff.generated";

export interface ComposerProviderHandoffSend {
  /** Why this send cannot go out yet, or `null`. Checked before anything is dispatched. */
  readonly refusal: ProviderHandoffSendRefusal | null;
  /**
   * Hands the thread off when the send needs it. Throws upstream's error when
   * the target could not start or is still starting, so the draft stays.
   */
  readonly handOff: () => Promise<void>;
  /** The turn's `createdAt`: after the handoff row when there was one. */
  readonly resolveCreatedAt: () => string;
}

export function useComposerProviderHandoff(input: {
  readonly threadId: string;
  /** Upstream's `boundProvider`; `null` for a thread that has not run yet. */
  readonly boundProvider: ProviderKind | null;
}): (modelSelection: ModelSelection) => ComposerProviderHandoffSend {
  const { continueThreadHandoff } = useThreadHandoff();
  return (modelSelection) => {
    "background only";
    const readThread = (): Thread | undefined =>
      getThreadFromState(useStore.getState(), input.threadId as ThreadId);
    const threadForSend = readThread();
    const selectedProvider = modelSelection.provider;
    const providerHandoffPendingForSend =
      threadForSend !== undefined &&
      input.boundProvider !== null &&
      selectedProvider !== input.boundProvider;
    const needsProviderHandoff =
      threadForSend !== undefined && needsProviderHandoffForSend(threadForSend, modelSelection);
    let handedOff = false;
    return {
      refusal: resolveProviderHandoffSendRefusal({
        providerHandoffPendingForSend,
        handoffDisabled: threadForSend === undefined || isProviderHandoffDisabled(threadForSend),
        selectedProvider,
      }),
      handOff: async () => {
        if (!needsProviderHandoff || !threadForSend) return;
        // A send owns the thread and model captured before attachment/setup waits.
        await continueThreadHandoff(
          threadForSend,
          modelSelection.provider,
          modelSelection.instanceId,
          modelSelection,
        );
        handedOff = true;
      },
      resolveCreatedAt: () => {
        const messageCreatedAt = new Date().toISOString();
        return handedOff
          ? resolveSendCreatedAtAfterProviderHandoff({
              thread: readThread(),
              messageCreatedAt,
              nowMs: Date.now(),
            })
          : messageCreatedAt;
      },
    };
  };
}
