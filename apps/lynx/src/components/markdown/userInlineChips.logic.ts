import type { ProviderMentionReference } from "@synara/contracts";
import type { ComposerPromptSegment } from "@synara-web/composer-editor-mentions";
import type { ParsedTerminalContextEntry } from "@synara-web/lib/terminalContext";
import { formatInlineTerminalContextLabel } from "@synara-web/components/chat/userMessageTerminalContexts";
import {
  createComposerChipsRemarkPlugin,
  parseComposerChipSegment,
} from "@synara-web/lib/remarkComposerChips";

type ChipNode = {
  type: string;
  value?: string;
  data?: { hProperties?: Record<string, unknown> };
  children?: ChipNode[];
};
export type UserInlineChipSegment =
  | ComposerPromptSegment
  | { type: "transcript-terminal"; context: ParsedTerminalContextEntry };
/** Run upstream's exact display-token transform, then port only its host nodes. */
export function userInlineChipSegments(
  text: string,
  mentions: ReadonlyArray<ProviderMentionReference>,
  contexts: ReadonlyArray<ParsedTerminalContextEntry>,
): UserInlineChipSegment[] {
  const tree: ChipNode = { type: "root", children: [{ type: "text", value: text }] };
  createComposerChipsRemarkPlugin(
    mentions,
    contexts.map((context, index) => ({
      label: formatInlineTerminalContextLabel(context.header),
      index,
    })),
  )()(tree);
  return (tree.children ?? []).map((node): UserInlineChipSegment => {
    if (node.type === "text") return { type: "text", text: node.value ?? "" };
    if (node.type === "composerChip") {
      const parsed = parseComposerChipSegment(node.data?.hProperties?.dataSegment);
      if (parsed) return parsed;
    }
    if (node.type === "terminalContextChip") {
      const context = contexts[Number(node.data?.hProperties?.dataContextIndex)];
      if (context) return { type: "transcript-terminal", context };
    }
    throw new Error(`Unsupported upstream user chip node: ${node.type}`);
  });
}
