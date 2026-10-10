// FILE: app/threadHandoff.lynx.ts
// Purpose: Which providers a thread can be handed to, for the Lynx surfaces
//   that offer Hand off (thread header, sidebar thread menu, composer send).
//   The eligibility and ordering are upstream's (`lib/threadHandoff`); the hand
//   off itself is upstream's `useThreadHandoff`, generated into
//   `generated/threadHandoff.generated.ts`.
// Layer: L3 orchestration (Lynx)

import { PROVIDER_DISPLAY_NAMES } from "@synara/contracts";
import { isProviderKind } from "@synara-web/providerOrdering";
import type { ContextMenuItem, ServerProviderStatus, ServerSettingsView } from "@synara/contracts";
import { contextMenuGroup } from "@synara-web/lib/contextMenuGroup";
import {
  canContinueThreadHandoff,
  canCreateThreadHandoff,
  resolveAvailableHandoffTargets,
  type ThreadHandoffTarget,
} from "@synara-web/lib/threadHandoff";

import type { ThreadHeaderSummary } from "./queries";
import { queryClient } from "./queryClient";
import {
  readServerConfig,
  readServerSettings,
  refreshServerProviderStatuses,
} from "./settingsServerData.lynx";

/** Which providers can receive a handoff: enabled in settings and currently usable. */
export interface NativeThreadHandoffProviderContext {
  readonly providerSettings: ServerSettingsView["providers"] | null | undefined;
  readonly providerStatuses: readonly ServerProviderStatus[];
}

export async function fetchNativeThreadHandoffProviderContext(options?: {
  readonly fresh?: boolean;
}): Promise<NativeThreadHandoffProviderContext> {
  "background only";
  const [config, settings] = await Promise.all([
    options?.fresh ? refreshServerProviderStatuses(queryClient) : readServerConfig(queryClient),
    readServerSettings(queryClient),
  ]);
  return { providerSettings: settings.providers, providerStatuses: config.providers };
}

export function resolveNativeThreadHandoffTargets(
  thread: ThreadHeaderSummary | undefined,
  providers: NativeThreadHandoffProviderContext,
): readonly ThreadHandoffTarget[] {
  if (
    !thread ||
    !canCreateThreadHandoff({
      thread: thread as never,
      isBusy:
        thread.sessionStatus === "starting" ||
        thread.sessionStatus === "running" ||
        thread.latestTurnState === "running",
      hasPendingApprovals: thread.pendingApprovals.length > 0,
      hasPendingUserInput: thread.pendingUserInputs.length > 0,
    })
  )
    return [];
  // Lynx hands off between the built-in providers' default accounts (provider accounts are
  // not ported): one instance per provider kind, enabled as the server settings say.
  const providerInstances = providers.providerStatuses.flatMap((status) => {
    const provider = status.provider;
    if (!isProviderKind(provider) || status.instanceId !== provider) return [];
    return [
      {
        instanceId: status.instanceId,
        provider,
        driver: provider,
        label: PROVIDER_DISPLAY_NAMES[provider],
        enabled: providers.providerSettings?.[provider]?.enabled !== false,
        isDefault: true,
        supported: true as const,
      },
    ];
  });
  return resolveAvailableHandoffTargets({
    sourceProvider: thread.modelSelection.provider,
    providerInstances,
    providerStatuses: providers.providerStatuses,
  });
}

/**
 * The targets that can take over the same thread (upstream's
 * `continueHandoffTargets` in `ChatView.tsx` and `Sidebar.tsx`): every other
 * provider, never another account of the thread's own.
 */
export function resolveNativeContinueHandoffTargets(
  thread: Pick<ThreadHeaderSummary, "modelSelection"> | undefined,
  targets: readonly ThreadHandoffTarget[],
): readonly ThreadHandoffTarget[] {
  if (!thread) return [];
  return targets.filter((target) =>
    canContinueThreadHandoff({
      sourceProvider: thread.modelSelection.provider,
      targetProvider: target.provider,
    }),
  );
}

export interface NativeThreadHandoffMenuAction {
  readonly destination: "this-thread" | "new-thread";
  readonly target: ThreadHandoffTarget;
}

/**
 * The thread menu's Handoff rows, as upstream's `Sidebar.tsx` builds them: one
 * "Handoff" row whose submenu lists "<provider> in this thread" and
 * "<provider> in a new thread", or a single plain row when there is one choice.
 * Upstream's `contextMenuGroup` returns the submenu as `children`; the Lynx
 * host menu reads `submenu`.
 */
export function buildNativeThreadHandoffMenuItems(
  handoffTargets: readonly ThreadHandoffTarget[],
  continueHandoffTargets: readonly ThreadHandoffTarget[],
): ContextMenuItem<string>[] {
  return contextMenuGroup<string>({ id: "handoff", label: "Handoff", separatorBefore: true }, [
    ...continueHandoffTargets.map((target) => ({
      id: `handoff-here:${target.instanceId}`,
      label: `${target.label} in this thread`,
      standaloneLabel: `Handoff to ${target.label} in this thread`,
    })),
    ...handoffTargets.map((target, index) => ({
      id: `handoff:${target.instanceId}`,
      label: continueHandoffTargets.length > 0 ? `${target.label} in a new thread` : target.label,
      standaloneLabel: `Handoff to ${target.label}`,
      ...(index === 0 && continueHandoffTargets.length > 0 ? { separatorBefore: true } : {}),
    })),
  ]).map(({ children, ...item }) => (children ? { ...item, submenu: children } : item));
}

/** The handoff a thread-menu action id names, or `null` for any other action. */
export function resolveNativeThreadHandoffMenuAction(
  action: string,
  handoffTargets: readonly ThreadHandoffTarget[],
  continueHandoffTargets: readonly ThreadHandoffTarget[],
): NativeThreadHandoffMenuAction | null {
  const continueTarget = continueHandoffTargets.find(
    (target) => action === `handoff-here:${target.instanceId}`,
  );
  if (continueTarget) return { destination: "this-thread", target: continueTarget };
  const target = handoffTargets.find((entry) => action === `handoff:${entry.instanceId}`);
  return target ? { destination: "new-thread", target } : null;
}
