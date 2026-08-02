import {
  getProviderStartOptions,
  resolveAssistantDeliveryMode,
  useAppSettings,
} from "~/appSettings";
import { useProviderStatusesForLocalConfig } from "~/hooks/useProviderStatusesForLocalConfig";
import { useRefreshProviderStatusesNow } from "~/hooks/useProviderStatusRefresh";
import { dispatchKanbanDraftCard } from "~/lib/kanbanDispatch";
import { resolveProviderSendAvailabilityWithRefresh } from "~/lib/providerAvailability";
import { toastManager } from "~/components/ui/toast";

import type { KanbanCard } from "./kanban.logic";
import { KANBAN_MUTATION_COPY } from "./kanbanMutation.logic";

export function useKanbanDraftStart(onOpenCard: (card: KanbanCard) => void) {
  const { settings } = useAppSettings();
  const assistantDeliveryMode = resolveAssistantDeliveryMode(settings);
  const providerOptions = getProviderStartOptions(settings);
  const providerStatuses = useProviderStatusesForLocalConfig();
  const refreshProviderStatuses = useRefreshProviderStatusesNow();

  return async (card: KanbanCard) => {
    const targetProvider = card.provider ?? settings.defaultProvider;
    const sendAvailability = await resolveProviderSendAvailabilityWithRefresh({
      provider: targetProvider,
      statuses: providerStatuses,
      refreshStatuses: () => refreshProviderStatuses({ silent: true }),
    });
    if (!sendAvailability.usable) {
      toastManager.add({ type: "error", title: sendAvailability.unavailableReason });
      return;
    }

    const result = await dispatchKanbanDraftCard({
      card,
      defaultProvider: settings.defaultProvider,
      assistantDeliveryMode,
      providerOptions,
    });
    if (result.kind === "dispatched") {
      toastManager.add({
        type: "success",
        title: KANBAN_MUTATION_COPY.start.success,
        description: card.title,
      });
      return;
    }
    if (result.kind === "open-thread") {
      const description =
        result.reason === "empty"
          ? "Nothing to send yet — write the prompt in the composer."
          : result.reason === "worktree-pending"
            ? "Open the chat to create the worktree with the normal send flow."
            : "Open the chat to continue this task.";
      toastManager.add({
        type: "info",
        title: "Finish this draft in the chat",
        description,
      });
      onOpenCard(card);
      return;
    }
    if (result.kind === "unavailable") {
      toastManager.add({
        type: "error",
        title: "Not connected",
        description: "Reconnect to the server before starting tasks.",
      });
      return;
    }
    toastManager.add({
      type: "error",
      title: KANBAN_MUTATION_COPY.start.error,
      description: result.message,
    });
  };
}
