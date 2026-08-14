// P2-V5: unified/remark parses on the background thread; this module only
// turns the serializable mdast subset into Lynx-native view/text elements.

import { useEffect, useRef, useState } from '@lynx-js/react';
import type { ProviderMentionReference } from '@synara/contracts';
import {
  splitPromptIntoDisplaySegments,
  type ComposerPromptSegment,
} from '@synara-web/composer-editor-mentions';

import { useLynxInteractiveState } from '../ui/interactive-state.lynx';
import { CheckIcon, CopyIcon, TextWrapIcon } from '../../lib/icons.lynx';
import { clipboard } from '../../platform/clipboard';
import { sleepOnHost } from '../../platform/timer';
import { openExternalBestEffort } from '../../platform/window';
import {
  parseMarkdown,
  type MarkdownNode,
  type MarkdownVariant,
} from './markdownAst';
import {
  resolveAgentChipColor,
} from '@synara-web/components/composerInlineChip.logic';
import {
  resolveMarkdownCodeBlockPresentation,
  resolveMarkdownInlineTokenPresentation,
  toggleMarkdownCodeWrap,
  type MarkdownInlineTokenSegment,
} from './markdownPresentation.logic';
import { MarkdownInlineTokenIcon } from './MarkdownInlineTokenIcon.lynx';
import {
  resolveLynxInlineCodeFileReference,
  resolveLynxMarkdownFileReference,
} from './markdownFileReferences.logic';
import { ExternalLinkIcon } from './ExternalLinkIcon.lynx';
import { MarkdownFileReferenceToken } from './MarkdownFileReferenceToken.lynx';

export interface ChatMarkdownProps {
  readonly text: string;
  readonly className?: string;
  readonly cwd?: string | null;
  readonly variant?: MarkdownVariant;
  readonly mentionReferences?: ReadonlyArray<ProviderMentionReference>;
  readonly onOpenFileReference?: (relativePath: string) => void;
}

interface MarkdownRenderContext {
  readonly allowComposerChips: boolean;
  readonly cwd: string | null;
  readonly mentionReferences: ReadonlyArray<ProviderMentionReference>;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly variant: MarkdownVariant;
}

function MarkdownInlineToken({
  context,
  segment,
}: {
  readonly context: MarkdownRenderContext;
  readonly segment: MarkdownInlineTokenSegment;
}) {
  const presentation = resolveMarkdownInlineTokenPresentation(segment);
  const agentColor =
    segment.type === 'agent-mention'
      ? resolveAgentChipColor(segment.color)
      : null;
  const externalTarget = presentation.openExternalUrl;
  const fileReference =
    segment.type === 'mention'
      ? resolveLynxMarkdownFileReference({
          cwd: context.cwd,
          rawPath: segment.path,
        })
      : null;
  const activate = externalTarget
    ? () => {
        'background only';
        openExternalBestEffort(externalTarget);
      }
    : fileReference && context.onOpenFileReference
      ? () => {
          'background only';
          context.onOpenFileReference?.(fileReference);
        }
      : undefined;
  const interaction = useLynxInteractiveState({
    baseClassName: `MdInlineToken MdInlineToken--${segment.type}`,
    focusable: Boolean(activate),
    onActivate: activate,
    accessibilityTraits: activate ? 'link' : 'text',
    accessibleLabel: externalTarget
      ? `Open ${externalTarget}`
      : fileReference
        ? `Open ${fileReference}`
        : presentation.label,
  });
  return (
    <text
      className={interaction.className}
      style={
        agentColor
          ? {
              backgroundColor: agentColor.bg,
              color: agentColor.text,
            }
          : undefined
      }
      {...interaction.eventProps}
    >
      <MarkdownInlineTokenIcon
        segment={segment}
        color={agentColor?.text}
      />
      {presentation.label}
    </text>
  );
}

function renderUserText(
  value: string,
  key: string,
  context: MarkdownRenderContext
): React.ReactNode {
  const occurrences = new Map<string, number>();
  return splitPromptIntoDisplaySegments(value, context.mentionReferences).map(
    (segment) => {
      const identity = JSON.stringify(segment);
      const occurrence = occurrences.get(identity) ?? 0;
      occurrences.set(identity, occurrence + 1);
      const segmentKey = `${key}.${segment.type}.${identity}.${occurrence}`;
      return segment.type === 'text' ? (
        <text key={segmentKey}>{segment.text}</text>
      ) : (
        <MarkdownInlineToken
          context={context}
          key={segmentKey}
          segment={segment}
        />
      );
    }
  );
}

function renderInlineChildren(
  node: MarkdownNode,
  key: string,
  context: MarkdownRenderContext
): React.ReactNode {
  return (node.children ?? []).map((child, index) =>
    renderNode(child, `${key}.${index}`, context)
  );
}

function renderTable(
  node: MarkdownNode,
  key: string,
  context: MarkdownRenderContext
) {
  return (
    <scroll-view className="MdTableScroller" scroll-x key={key}>
      <view className="MdTable">
        {(node.children ?? []).map((row, rowIndex) => (
          <view className="MdTableRow" key={`${key}.row.${rowIndex}`}>
            {(row.children ?? []).map((cell, cellIndex) => (
              <view
                className={rowIndex === 0 ? 'MdTableCell MdTableHeaderCell' : 'MdTableCell'}
                key={`${key}.cell.${rowIndex}.${cellIndex}`}
              >
                <text className={rowIndex === 0 ? 'MdTableHeaderText' : 'MdTableCellText'}>
                  {renderInlineChildren(
                    cell,
                    `${key}.inline.${rowIndex}.${cellIndex}`,
                    context
                  )}
                </text>
              </view>
            ))}
          </view>
        ))}
      </view>
    </scroll-view>
  );
}

function MarkdownLink({
  node,
  nodeKey,
  context,
}: {
  readonly node: MarkdownNode;
  readonly nodeKey: string;
  readonly context: MarkdownRenderContext;
}) {
  const url = node.url ?? '';
  const external = /^https?:\/\//i.test(url);
  const fileReference = external
    ? null
    : resolveLynxMarkdownFileReference({
        cwd: context.cwd,
        rawPath: url,
      });
  const activate = external
    ? () => {
        'background only';
        openExternalBestEffort(url);
      }
    : undefined;
  const interaction = useLynxInteractiveState({
    baseClassName: 'MdLink',
    disabled: !activate,
    focusable: Boolean(activate),
    onActivate: activate,
    accessibilityTraits: activate ? 'link' : 'text',
    accessibleLabel: external ? `Open ${url}` : undefined,
  });
  if (fileReference) {
    return (
      <MarkdownFileReferenceToken
        className="MdInlineToken MdInlineToken--file"
        key={nodeKey}
        onOpenFileReference={context.onOpenFileReference}
        relativePath={fileReference}
        showGlyph
      >
        {renderInlineChildren(node, nodeKey, {
          ...context,
          allowComposerChips: false,
        })}
      </MarkdownFileReferenceToken>
    );
  }
  return (
    <text className={interaction.className} key={nodeKey} {...interaction.eventProps}>
      {external ? <ExternalLinkIcon url={url} /> : null}
      {renderInlineChildren(node, nodeKey, {
        ...context,
        allowComposerChips: false,
      })}
    </text>
  );
}

function MarkdownCodeAction({
  active = false,
  label,
  onActivate,
  children,
}: {
  readonly active?: boolean;
  readonly label: string;
  readonly onActivate: () => void;
  readonly children: React.ReactNode;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `MdCodeAction${active ? ' MdCodeAction--active' : ''}`,
    onActivate,
    accessibleLabel: label,
    accessibilityValue: active ? 'on' : 'off',
  });
  return (
    <view className={interaction.className} aria-label={label} {...interaction.eventProps}>
      {children}
    </view>
  );
}

function MarkdownInlineCode({
  context,
  node,
  nodeKey,
}: {
  readonly context: MarkdownRenderContext;
  readonly node: MarkdownNode;
  readonly nodeKey: string;
}) {
  const fileReference = resolveLynxInlineCodeFileReference({
    cwd: context.cwd,
    value: node.value ?? '',
  });
  if (fileReference) {
    return (
      <MarkdownFileReferenceToken
        className="MdInlineToken MdInlineToken--file"
        key={nodeKey}
        onOpenFileReference={context.onOpenFileReference}
        relativePath={fileReference}
        showGlyph
      >
        {node.value ?? ''}
      </MarkdownFileReferenceToken>
    );
  }
  return (
    <text className="MdCode MdInlineCode" key={nodeKey}>
      {node.value ?? ''}
    </text>
  );
}

function MarkdownTaskCheckbox(props: { readonly checked: boolean }) {
  return (
    <view
      className={`MdTaskCheckbox${
        props.checked ? ' MdTaskCheckbox--checked' : ''
      }`}
      accessibility-element={true}
      accessibility-role="checkbox"
      accessibility-state={{ checked: props.checked, disabled: true }}
      accessibility-value={props.checked ? 'Checked' : 'Not checked'}
    >
      {props.checked ? (
        <CheckIcon className="MdTaskCheckboxIcon" size={10} />
      ) : null}
    </view>
  );
}

function MarkdownCodeBlock({ node, nodeKey }: { readonly node: MarkdownNode; readonly nodeKey: string }) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const copyGenerationRef = useRef(0);
  const presentation = resolveMarkdownCodeBlockPresentation({
    code: node.value ?? '',
    language: node.lang,
  });

  async function copyCode() {
    'background only';
    const generation = copyGenerationRef.current + 1;
    copyGenerationRef.current = generation;
    try {
      await clipboard.writeText(presentation.code);
      setCopied(true);
      await sleepOnHost(1200);
      if (copyGenerationRef.current === generation) setCopied(false);
    } catch {
      if (copyGenerationRef.current === generation) setCopied(false);
    }
  }

  function toggleWrap() {
    'background only';
    setWrap(toggleMarkdownCodeWrap);
  }

  return (
    <view
      className={`MdCodeBlockShell${wrap ? ' MdCodeBlockShell--wrap' : ''}`}
      key={nodeKey}
    >
      <view className="MdCodeHeader">
        <view className="MdCodeTitle">
          {presentation.isFileReference && presentation.filePath ? (
            <FileEntryIcon
              className="MdCodeFileIcon"
              pathValue={presentation.filePath}
            />
          ) : null}
          <text className="MdCodeLanguage">{presentation.title}</text>
          {presentation.directory ? (
            <text className="MdCodeDirectory">{presentation.directory}</text>
          ) : null}
          {presentation.lineRange ? (
            <text className="MdCodeLineRange">{presentation.lineRange}</text>
          ) : null}
        </view>
        <view className="MdCodeActions">
          <MarkdownCodeAction
            active={wrap}
            label={wrap ? 'Disable soft wrap' : 'Enable soft wrap'}
            onActivate={toggleWrap}
          >
            <TextWrapIcon size={12} />
          </MarkdownCodeAction>
          <MarkdownCodeAction
            active={copied}
            label={copied ? 'Copied' : 'Copy code'}
            onActivate={() => {
              'background only';
              void copyCode();
            }}
          >
            {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
          </MarkdownCodeAction>
        </view>
      </view>
      <scroll-view className="MdCodeScroller" scroll-x={!wrap}>
        <view className="MdCodeBlock">
          <text
            className="MdCode MdCodeBlockText"
            style={{ minHeight: `${presentation.minimumTextHeightPx}px` }}
          >
            {presentation.code}
          </text>
        </view>
      </scroll-view>
    </view>
  );
}

function renderNode(
  node: MarkdownNode,
  key: string,
  context: MarkdownRenderContext,
  listContext?: { ordered: boolean; index: number }
): React.ReactNode {
  const children = () => renderInlineChildren(node, key, context);
  switch (node.type) {
    case 'root':
      return <view key={key}>{children()}</view>;
    case 'text':
      return context.variant === 'user' && context.allowComposerChips
        ? renderUserText(node.value ?? '', key, context)
        : <text key={key}>{node.value ?? ''}</text>;
    case 'paragraph':
      return (
        <text className="MdParagraph" key={key}>
          {children()}
        </text>
      );
    case 'heading':
      return (
        <text className={`MdHeading MdH${node.depth ?? 3}`} key={key}>
          {children()}
        </text>
      );
    case 'strong':
      return (
        <text className="MdStrong" key={key}>
          {children()}
        </text>
      );
    case 'emphasis':
      return (
        <text className="MdEmphasis" key={key}>
          {children()}
        </text>
      );
    case 'delete':
      return (
        <text className="MdDeleted" key={key}>
          {children()}
        </text>
      );
    case 'link':
      return <MarkdownLink node={node} nodeKey={key} context={context} />;
    case 'image':
      return (
        <text className="MdImageFallback" key={key}>
          [image: {node.alt ?? 'preview'}]
        </text>
      );
    case 'blockquote':
      return (
        <view className="MdBlockquote" key={key}>
          {children()}
        </view>
      );
    case 'list':
      return (
        <view className="MdList" key={key}>
          {(node.children ?? []).map((child, index) =>
            renderNode(
              child,
              `${key}.${index}`,
              context,
              { ordered: node.ordered === true, index }
            )
          )}
        </view>
      );
    case 'listItem': {
      const task = node.checked !== undefined && node.checked !== null;
      const marker = listContext?.ordered
          ? `${listContext.index + 1}.`
          : '•';
      return (
        <view className="MdListItem" key={key}>
          {task ? (
            <view className="MdListMarker MdTaskCheckboxSlot">
              <MarkdownTaskCheckbox checked={node.checked === true} />
            </view>
          ) : (
            <text className="MdListMarker">{marker}</text>
          )}
          <view className="MdListBody">{children()}</view>
        </view>
      );
    }
    case 'code':
      return <MarkdownCodeBlock node={node} nodeKey={key} />;
    case 'inlineCode':
      return (
        <MarkdownInlineCode
          context={context}
          node={node}
          nodeKey={key}
        />
      );
    case 'math':
      return (
        <view className="MdMathBlockShell" key={key}>
          <text className="MdCode MdMath MdMathBlock">ƒ {'  '}{node.value ?? ''}</text>
        </view>
      );
    case 'inlineMath':
      return (
        <text className="MdCode MdMath" key={key}>
          ƒ {node.value ?? ''}
        </text>
      );
    case 'table':
      return renderTable(node, key, context);
    case 'thematicBreak':
      return <view className="MdRule" key={key} />;
    case 'break':
      return <text key={key}>{'\n'}</text>;
    case 'html':
      return (
        <text className="MdHtmlFallback" key={key}>
          {node.value ?? ''}
        </text>
      );
    default:
      return <view key={key}>{children()}</view>;
  }
}

export function ChatMarkdown({
  text,
  className,
  cwd = null,
  variant = 'assistant',
  mentionReferences = [],
  onOpenFileReference,
}: ChatMarkdownProps) {
  const [tree, setTree] = useState<MarkdownNode | null>(null);

  useEffect(() => {
    'background only';
    try {
      const parsed = parseMarkdown(text, variant);
      setTree(parsed);
    } catch (error) {
      console.error('[markdown] parse failed', String(error), error);
    }
  }, [text, variant]);

  const context: MarkdownRenderContext = {
    allowComposerChips: variant === 'user',
    cwd,
    mentionReferences,
    onOpenFileReference,
    variant,
  };

  return (
    <view
      className={`${className ? `MdRoot ${className}` : 'MdRoot'}${
        variant === 'user' ? ' MdRoot--user' : ''
      }`}
    >
      {tree ? (
        renderNode(tree, 'root', context)
      ) : (
        <text className="MdParagraph">
          {variant === 'user'
            ? renderUserText(text, 'fallback', context)
            : text}
        </text>
      )}
    </view>
  );
}
