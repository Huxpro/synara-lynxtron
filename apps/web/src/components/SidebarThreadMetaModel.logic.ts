export type SidebarThreadMetaKind = "automation" | "handoff" | "fork" | "worktree";

export interface SidebarThreadMetaDescriptor {
  readonly id: SidebarThreadMetaKind;
  readonly tooltip: string;
  readonly active?: boolean | undefined;
}

export interface SidebarThreadAutomationMetaInput {
  readonly name: string;
  readonly enabled: boolean;
  readonly cadenceLabel: string;
}

export interface SidebarThreadMetaModelInput {
  readonly forkSourceThreadId?: string | null | undefined;
  readonly sidechatSourceThreadId?: string | null | undefined;
  readonly handoffBadgeLabel?: string | null | undefined;
  readonly includeHandoffBadge?: boolean | undefined;
  readonly handoffShownInAvatar?: boolean | undefined;
  readonly worktreeBadgeLabel?: string | null | undefined;
  readonly automations?: readonly SidebarThreadAutomationMetaInput[] | undefined;
}

/**
 * Host-neutral ordering and visibility model for the trailing thread-row badges.
 *
 * Providers, environment helpers, and icon renderers stay outside this module;
 * both products consume the same serializable result.
 */
export function resolveSidebarThreadMetaDescriptors(
  input: SidebarThreadMetaModelInput,
): SidebarThreadMetaDescriptor[] {
  const descriptors: SidebarThreadMetaDescriptor[] = [];
  const automations = input.automations ?? [];

  if (automations.length > 0) {
    const firstAutomation = automations[0]!;
    descriptors.push({
      id: "automation",
      tooltip:
        automations.length === 1
          ? `${firstAutomation.name} · ${
              firstAutomation.enabled ? firstAutomation.cadenceLabel : "Paused"
            }`
          : `${automations.length} automations`,
      active: automations.some((automation) => automation.enabled),
    });
  }

  if (
    input.includeHandoffBadge !== false &&
    input.handoffShownInAvatar !== true &&
    input.handoffBadgeLabel
  ) {
    descriptors.push({
      id: "handoff",
      tooltip: input.handoffBadgeLabel,
    });
  }

  if (input.forkSourceThreadId && !input.sidechatSourceThreadId) {
    descriptors.push({
      id: "fork",
      tooltip: "Forked thread",
    });
  }

  if (input.worktreeBadgeLabel) {
    descriptors.push({
      id: "worktree",
      tooltip: input.worktreeBadgeLabel,
    });
  }

  return descriptors;
}
