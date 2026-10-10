import "background-only";

import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { remarkGithubAlerts, type GithubAlertKind } from "@synara-web/lib/remarkGithubAlerts";
import { remarkHtmlBreaks } from "@synara-web/lib/remarkHtmlBreaks";

export interface MarkdownNode {
  readonly type: string;
  readonly value?: string;
  readonly depth?: number;
  readonly ordered?: boolean;
  /** Ordered lists: the first item's number. */
  readonly start?: number | null;
  /** Lists and items: loose (paragraphs keep their margins) rather than tight. */
  readonly spread?: boolean;
  readonly checked?: boolean | null;
  readonly url?: string;
  readonly alt?: string;
  readonly lang?: string | null;
  /** Tables: one alignment per column (`null` is the default, start-aligned). */
  readonly align?: ReadonlyArray<"left" | "right" | "center" | null>;
  /** Blockquotes: the GitHub alert kind upstream's `remarkGithubAlerts` tagged. */
  readonly alert?: GithubAlertKind;
  readonly children?: readonly MarkdownNode[];
}

export type MarkdownVariant = "assistant" | "user";

// The plugin list of upstream's `MARKDOWN_REMARK_PLUGINS` (`ChatMarkdown.tsx`).
const assistantProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath, { singleDollarTextMath: true })
  .use(remarkGithubAlerts)
  .use(remarkHtmlBreaks);

// Sent prompts use GFM but intentionally skip math, matching Web: literal
// `$50` and `$skill` tokens must survive for user-message chip rendering.
const userProcessor = unified().use(remarkParse).use(remarkGfm);

function toSerializableNode(node: Record<string, unknown>): MarkdownNode {
  const children = Array.isArray(node.children)
    ? node.children.map((child) => toSerializableNode(child as Record<string, unknown>))
    : undefined;
  const alert = (node.data as { hProperties?: Record<string, unknown> } | undefined)?.hProperties?.[
    "data-github-alert"
  ];
  return {
    type: String(node.type),
    ...(typeof node.value === "string" ? { value: node.value } : {}),
    ...(typeof node.depth === "number" ? { depth: node.depth } : {}),
    ...(typeof node.ordered === "boolean" ? { ordered: node.ordered } : {}),
    ...(typeof node.start === "number" ? { start: node.start } : {}),
    ...(typeof node.spread === "boolean" ? { spread: node.spread } : {}),
    ...(typeof node.checked === "boolean" || node.checked === null
      ? { checked: node.checked as boolean | null }
      : {}),
    ...(typeof node.url === "string" ? { url: node.url } : {}),
    ...(typeof node.alt === "string" ? { alt: node.alt } : {}),
    ...(typeof node.lang === "string" || node.lang === null
      ? { lang: node.lang as string | null }
      : {}),
    ...(Array.isArray(node.align)
      ? { align: node.align as NonNullable<MarkdownNode["align"]> }
      : {}),
    ...(typeof alert === "string" ? { alert: alert as GithubAlertKind } : {}),
    ...(children ? { children } : {}),
  };
}

export function parseMarkdown(text: string, variant: MarkdownVariant = "assistant"): MarkdownNode {
  const processor = variant === "user" ? userProcessor : assistantProcessor;
  // The source goes along as the file: `remarkGithubAlerts` reads it.
  return toSerializableNode(
    processor.runSync(processor.parse(text), text) as unknown as Record<string, unknown>,
  );
}
