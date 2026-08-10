import type { ComposerPromptSegment } from '@synara-web/composer-editor-mentions';
import {
  formatComposerSkillChipLabel,
} from '@synara-web/components/composerInlineChip.logic';
import {
  dedentCode,
  parseCodeFenceDisplayInfo,
} from '@synara-web/lib/codeFenceCore';

const MARKDOWN_CODE_LINE_HEIGHT_PX = 16.5;

export type MarkdownInlineTokenSegment = Exclude<
  ComposerPromptSegment,
  { readonly type: 'text' }
>;

export function resolveMarkdownInlineTokenPresentation(
  segment: MarkdownInlineTokenSegment
): {
  readonly label: string;
  readonly openExternalUrl: string | null;
} {
  let label: string;
  if (segment.type === 'mention') {
    label = segment.path.split(/[\\/]/).pop() || segment.path;
  } else if (segment.type === 'skill') {
    label = formatComposerSkillChipLabel(segment.name);
  } else if (segment.type === 'slash-command') {
    label = `/${segment.command}`;
  } else if (segment.type === 'agent-mention') {
    label = `@${segment.alias}`;
  } else if (segment.type === 'terminal-context') {
    label = segment.context?.terminalLabel ?? 'Terminal context';
  } else {
    label = segment.url;
  }
  return {
    label,
    openExternalUrl: segment.type === 'link' ? segment.url : null,
  };
}

export function resolveMarkdownCodeBlockPresentation(input: {
  readonly code: string;
  readonly language: string | null | undefined;
}) {
  const fence = parseCodeFenceDisplayInfo(input.language ?? 'text');
  const dedentedCode = dedentCode(input.code);
  const code = dedentedCode.endsWith('\n') ? dedentedCode : `${dedentedCode}\n`;
  return {
    // react-markdown gives Web fenced blocks a trailing newline, while the
    // mdast value used by Lynx omits it. Normalize here so line geometry and
    // copied text follow the same contract on both targets.
    code,
    minimumTextHeightPx: code.split('\n').length * MARKDOWN_CODE_LINE_HEIGHT_PX,
    directory: fence.directory,
    filePath: fence.filePath,
    isFileReference: fence.isFileReference,
    lineRange: fence.lineRange,
    title:
      fence.isFileReference && fence.fileName
        ? fence.fileName
        : fence.language,
  };
}

export function toggleMarkdownCodeWrap(current: boolean): boolean {
  return !current;
}
