// FILE: fileReferenceContextMenu.ts
// Purpose: Right-click menu shared by file rows and file previews (editor
//          explorer, changed-file lists, dock file pane).
// Layer: Web UI helpers
// Exports: showFileReferenceContextMenu

import { formatSelectionLabel, type ChatFileReference } from "~/lib/chatReferences";
import { buildFileContextMenuItems } from "@synara/shared/fileContextMenu";
import { readNativeApi } from "~/nativeApi";

import { clipboard } from "~/platform/clipboard";
// Right-click menu shared by explorer rows, changed-file rows, and the file
// preview. Falls back to a DOM menu outside the desktop app.
export async function showFileReferenceContextMenu(input: {
  path: string;
  position: { x: number; y: number };
  /** Line/column range from source views, or a quoted snippet from surfaces
   * without stable source lines (rendered markdown preview). */
  selection?: Omit<ChatFileReference, "path"> | null;
  onReferenceInChat: ((reference: ChatFileReference) => void) | undefined;
  onAskWhyInChat?: ((reference: ChatFileReference) => void) | undefined;
}): Promise<void> {
  const api = readNativeApi();
  if (!api) {
    return;
  }
  const reference: ChatFileReference = {
    path: input.path,
    ...input.selection,
  };
  const rangeLabel = formatSelectionLabel(reference);
  const hasSnippet = typeof reference.snippet === "string" && reference.snippet.trim().length > 0;
  const clicked = await api.contextMenu.show(
    buildFileContextMenuItems({
      referenceAvailable: Boolean(input.onReferenceInChat),
      askWhyAvailable: Boolean(input.onAskWhyInChat),
      referenceLabel: rangeLabel
        ? `Reference ${rangeLabel} in chat`
        : hasSnippet
          ? "Reference selection in chat"
          : "Reference in chat",
      askWhyLabel: rangeLabel ? `Ask why ${rangeLabel} changed` : "Ask why this changed",
    }),
    input.position,
  );
  if (clicked === "reference-in-chat") {
    input.onReferenceInChat?.(reference);
    return;
  }
  if (clicked === "ask-why-in-chat") {
    input.onAskWhyInChat?.(reference);
    return;
  }
  if (clicked === "copy-path") {
    void clipboard.writeText(input.path).catch(() => {});
  }
}
