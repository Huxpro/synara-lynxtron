import 'background-only';

import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

export interface MarkdownNode {
  readonly type: string;
  readonly value?: string;
  readonly depth?: number;
  readonly ordered?: boolean;
  readonly checked?: boolean | null;
  readonly url?: string;
  readonly alt?: string;
  readonly lang?: string | null;
  readonly children?: readonly MarkdownNode[];
}

export type MarkdownVariant = 'assistant' | 'user';

const assistantProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath, { singleDollarTextMath: true });

// Sent prompts use GFM but intentionally skip math, matching Web: literal
// `$50` and `$skill` tokens must survive for user-message chip rendering.
const userProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm);

function toSerializableNode(node: Record<string, unknown>): MarkdownNode {
  const children = Array.isArray(node.children)
    ? node.children.map((child) => toSerializableNode(child as Record<string, unknown>))
    : undefined;
  return {
    type: String(node.type),
    ...(typeof node.value === 'string' ? { value: node.value } : {}),
    ...(typeof node.depth === 'number' ? { depth: node.depth } : {}),
    ...(typeof node.ordered === 'boolean' ? { ordered: node.ordered } : {}),
    ...(typeof node.checked === 'boolean' || node.checked === null
      ? { checked: node.checked as boolean | null }
      : {}),
    ...(typeof node.url === 'string' ? { url: node.url } : {}),
    ...(typeof node.alt === 'string' ? { alt: node.alt } : {}),
    ...(typeof node.lang === 'string' || node.lang === null
      ? { lang: node.lang as string | null }
      : {}),
    ...(children ? { children } : {}),
  };
}

export function parseMarkdown(
  text: string,
  variant: MarkdownVariant = 'assistant'
): MarkdownNode {
  const processor = variant === 'user' ? userProcessor : assistantProcessor;
  return toSerializableNode(processor.runSync(processor.parse(text)) as unknown as Record<string, unknown>);
}
