export type SidebarThreadMetaKind = "automation" | "handoff" | "fork" | "worktree";

export interface SidebarThreadMetaDescriptor {
  readonly id: SidebarThreadMetaKind;
  readonly tooltip: string;
  readonly active?: boolean;
}

export interface SidebarThreadAutomationMetaInput {
  readonly name: string;
  readonly enabled: boolean;
  readonly cadenceLabel: string;
}

export interface SidebarThreadMetaModelInput {
  readonly forkSourceThreadId?: string | null;
  readonly sidechatSourceThreadId?: string | null;
  readonly handoffBadgeLabel?: string | null;
  readonly includeHandoffBadge?: boolean;
  readonly handoffShownInAvatar?: boolean;
  readonly worktreeBadgeLabel?: string | null;
  readonly automations?: readonly SidebarThreadAutomationMetaInput[];
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
