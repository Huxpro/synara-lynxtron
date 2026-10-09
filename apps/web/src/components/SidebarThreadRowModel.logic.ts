export interface SidebarThreadRowModelInput {
  readonly threadId: string;
  readonly parentThreadId?: string | null | undefined;
  readonly sidechatSourceThreadId?: string | null | undefined;
  readonly activeThreadId?: string | null | undefined;
  readonly selected?: boolean | undefined;
  readonly temporary?: boolean | undefined;
  readonly depth?: number | undefined;
  readonly topLevel?: boolean | undefined;
}

export interface SidebarThreadRowModel {
  readonly isActive: boolean;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly isSubagentThread: boolean;
  readonly subagentIndentPx: number;
  readonly showCompactMeta: boolean;
  readonly showTemporaryThreadIcon: boolean;
  readonly hoverScope: "chat" | "project";
}

/**
 * Host-neutral row state shared by the Web and Lynx sidebar renderers.
 *
 * Event wiring and host anatomy stay platform-owned, while all state that
 * controls row identity/layout is derived once from serializable inputs.
 */
export function resolveSidebarThreadRowModel(
  input: SidebarThreadRowModelInput,
): SidebarThreadRowModel {
  const isActive = input.activeThreadId === input.threadId;
  const isSelected = input.selected === true;
  const isSubagentThread = Boolean(input.parentThreadId);
  const depth = input.depth ?? 0;

  return {
    isActive,
    isSelected,
    isHighlighted: isActive || isSelected,
    isSubagentThread,
    subagentIndentPx: Math.max(0, Math.min(depth - 1, 3) * 10),
    showCompactMeta: !isSubagentThread,
    showTemporaryThreadIcon:
      !isSubagentThread && input.temporary === true && !input.sidechatSourceThreadId,
    hoverScope: input.topLevel === true ? "chat" : "project",
  };
}
