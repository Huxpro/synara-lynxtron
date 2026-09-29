import type { ContextMenuItem } from "@synara/contracts";

export type FileContextMenuAction = "reference-in-chat" | "ask-why-in-chat" | "copy-path";

export function buildFileContextMenuItems(input: {
  readonly referenceLabel?: string;
  readonly askWhyLabel?: string;
  readonly referenceAvailable: boolean;
  readonly askWhyAvailable: boolean;
}): ContextMenuItem<FileContextMenuAction>[] {
  return [
    ...(input.referenceAvailable
      ? [{ id: "reference-in-chat" as const, label: input.referenceLabel ?? "Reference in chat" }]
      : []),
    ...(input.askWhyAvailable
      ? [{ id: "ask-why-in-chat" as const, label: input.askWhyLabel ?? "Ask why this changed" }]
      : []),
    { id: "copy-path" as const, label: "Copy path" },
  ];
}
