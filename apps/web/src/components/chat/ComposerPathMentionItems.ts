// FILE: ComposerPathMentionItems.ts
// Purpose: Map workspace search entries to "@" path mention menu items (shared by
// the web composer and the Lynx composer).

import type { ProjectEntry } from "@synara/contracts";

import { basenameOfPath } from "../../file-icons";
import type { ComposerCommandItem } from "./ComposerCommandMenuComposition";

export function buildWorkspacePathComposerItems(
  entries: readonly ProjectEntry[],
): Extract<ComposerCommandItem, { type: "path" }>[] {
  return entries.map((entry) => ({
    id: `path:${entry.kind}:${entry.path}`,
    type: "path" as const,
    path: entry.path,
    pathKind: entry.kind,
    label: basenameOfPath(entry.path),
    description: entry.parentPath ?? "",
  }));
}
