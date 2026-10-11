// P2-V5: unified/remark parses on the background thread; this module only
// turns the serializable mdast subset into Lynx-native view/text elements.

import { useEffect, useRef, useState, type ReactNode } from "@lynx-js/react";
import { getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef, SelectionChangeEvent } from "@lynx-js/types";
import type { ProviderMentionReference } from "@synara/contracts";
import {
  splitPromptIntoDisplaySegments,
  type ComposerPromptSegment,
} from "@synara-web/composer-editor-mentions";

import { useLynxInteractiveState } from "../ui/interactive-state.lynx";
import {
  CheckIcon,
  CircleAlertIcon,
  CopyIcon,
  LightBulbIcon,
  TextWrapIcon,
  TriangleAlertIcon,
} from "../../lib/icons.lynx";
import { clipboard } from "../../platform/clipboard";
import { sleepOnHost } from "../../platform/timer";
import { openExternalBestEffort } from "../../platform/window";
import { parseMarkdown, type MarkdownNode, type MarkdownVariant } from "./markdownAst";
import { resolveAgentChipColor } from "@synara-web/components/composerInlineChip.logic";
import {
  collapseMarkdownSoftBreaks,
  isMarkdownListLoose,
  markdownNodeHasInlineCode,
  markdownNodePlainText,
  markdownSpacingStyle,
  resolveMarkdownChildSpacing,
  resolveMarkdownCodeBlockPresentation,
  resolveMarkdownInlineTokenPresentation,
  resolveMarkdownListMarker,
  resolveMarkdownTableColumnWeights,
  toggleMarkdownCodeWrap,
  type MarkdownChildSpacing,
  type MarkdownInlineTokenSegment,
} from "./markdownPresentation.logic";
import { MarkdownInlineTokenIcon } from "./MarkdownInlineTokenIcon.lynx";
import {
  resolveLynxInlineCodeFileReference,
  resolveLynxMarkdownFileReference,
} from "./markdownFileReferences.logic";
import { FileEntryIcon } from "../FileEntryIcon.lynx";
import { ExternalLinkIcon } from "./ExternalLinkIcon.lynx";
import { MarkdownFileReferenceToken } from "./MarkdownFileReferenceToken.lynx";
import { highlightExplorerCode } from "../../data/hostSyntaxHighlight.lynx";
import type { NativeSyntaxHighlightResult } from "../../main/syntaxHighlightingContract.logic";
import { useTheme } from "../../adapters/useTheme.lynx";
import { TEXT_SELECTION_SCROLL_SCOPE_PROPS } from "./textSelectionScrollScope.logic";

export interface ChatMarkdownProps {
  readonly text: string;
  readonly className?: string;
  readonly cwd?: string | null;
  readonly selectable?: boolean;
  readonly variant?: MarkdownVariant;
  readonly mentionReferences?: ReadonlyArray<ProviderMentionReference>;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly onTextSelection?: (selection: MarkdownTextSelection | null) => void;
  readonly preparsedTree?: MarkdownNode | null;
}

export interface MarkdownTextSelection {
  readonly text: string;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface MarkdownRenderContext {
  readonly allowComposerChips: boolean;
  readonly cwd: string | null;
  readonly mentionReferences: ReadonlyArray<ProviderMentionReference>;
  readonly onOpenFileReference?: (relativePath: string) => void;
  readonly onTextSelection?: (selection: MarkdownTextSelection | null) => void;
  readonly selectable: boolean;
  readonly variant: MarkdownVariant;
  /** Enclosing lists by kind, for nested marker styles. */
  readonly listDepth?: { readonly ordered: number; readonly unordered: number };
  /** Inside a tight list item, whose paragraphs render without block margins. */
  readonly tightListItem?: boolean;
}

type BlockSpacingStyle = ReturnType<typeof markdownSpacingStyle>;

interface MarkdownListContext {
  readonly ordered: boolean;
  readonly index: number;
  readonly start: number | null;
  readonly loose: boolean;
}

function SelectableMarkdownText(props: {
  readonly children?: ReactNode;
  readonly className: string;
  readonly context: MarkdownRenderContext;
  readonly style?: BlockSpacingStyle;
}) {
  const textRef = useRef<NodesRef>(null);
  const selectionEnabled = props.context.selectable && props.context.onTextSelection !== undefined;

  function handleSelectionChange(event: SelectionChangeEvent) {
    "background only";
    const start = event.detail.start;
    const end = event.detail.end;
    if (!selectionEnabled || start < 0 || end <= start || !textRef.current) {
      props.context.onTextSelection?.(null);
      return;
    }
    const selectedText = new Promise<string>((resolve) => {
      textRef.current
        ?.invoke({
          method: "getSelectedText",
          success: (result) => resolve(result.selectedText),
          fail: () => resolve(""),
        })
        .exec();
    });
    const selectionRect = new Promise<{
      readonly left: number;
      readonly top: number;
      readonly width: number;
      readonly height: number;
    } | null>((resolve) => {
      textRef.current
        ?.invoke({
          method: "getTextBoundingRect",
          params: { start, end },
          success: (result) =>
            resolve({
              left: result.boundingRect.left,
              top: result.boundingRect.top,
              width: result.boundingRect.width,
              height: result.boundingRect.height,
            }),
          fail: () => resolve(null),
        })
        .exec();
    });
    void Promise.all([selectedText, selectionRect, getRectByRef(textRef, true)])
      .then(([text, localRect, elementRect]) => {
        if (!text.trim() || !localRect) {
          props.context.onTextSelection?.(null);
          return;
        }
        props.context.onTextSelection?.({
          text,
          left: elementRect.left + localRect.left,
          top: elementRect.top + localRect.top,
          width: localRect.width,
          height: localRect.height,
        });
      })
      .catch(() => props.context.onTextSelection?.(null));
  }

  return (
    <text
      ref={textRef}
      className={props.className}
      style={props.style}
      text-selection={props.context.selectable}
      custom-context-menu={selectionEnabled}
      flatten={false}
      bindselectionchange={selectionEnabled ? handleSelectionChange : undefined}
    >
      {props.children}
    </text>
  );
}

function MarkdownInlineToken({
  context,
  segment,
}: {
  readonly context: MarkdownRenderContext;
  readonly segment: MarkdownInlineTokenSegment;
}) {
  const presentation = resolveMarkdownInlineTokenPresentation(segment);
  const agentColor = segment.type === "agent-mention" ? resolveAgentChipColor(segment.color) : null;
  const externalTarget = presentation.openExternalUrl;
  const fileReference =
    segment.type === "mention"
      ? resolveLynxMarkdownFileReference({
          cwd: context.cwd,
          rawPath: segment.path,
        })
      : null;
  const activate = externalTarget
    ? () => {
        "background only";
        openExternalBestEffort(externalTarget);
      }
    : fileReference && context.onOpenFileReference
      ? () => {
          "background only";
          context.onOpenFileReference?.(fileReference);
        }
      : undefined;
  const interaction = useLynxInteractiveState({
    baseClassName: `MdInlineToken MdInlineToken--${segment.type}`,
    focusable: Boolean(activate),
    onActivate: activate,
    accessibilityTraits: activate ? "link" : "text",
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
      <MarkdownInlineTokenIcon segment={segment} color={agentColor?.text} />
      {presentation.label}
    </text>
  );
}

function renderUserText(
  value: string,
  key: string,
  context: MarkdownRenderContext,
): React.ReactNode {
  if (!/[@$/]|https?:\/\//i.test(value)) {
    return <text key={key}>{value}</text>;
  }
  const occurrences = new Map<string, number>();
  return splitPromptIntoDisplaySegments(value, context.mentionReferences).map((segment) => {
    const identity = JSON.stringify(segment);
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    const segmentKey = `${key}.${segment.type}.${identity}.${occurrence}`;
    return segment.type === "text" ? (
      <text key={segmentKey}>{segment.text}</text>
    ) : (
      <MarkdownInlineToken context={context} key={segmentKey} segment={segment} />
    );
  });
}

function renderInlineChildren(
  node: MarkdownNode,
  key: string,
  context: MarkdownRenderContext,
): React.ReactNode {
  return (node.children ?? []).map((child, index) => renderNode(child, `${key}.${index}`, context));
}

function MarkdownTable(props: {
  readonly node: MarkdownNode;
  readonly nodeKey: string;
  readonly context: MarkdownRenderContext;
  readonly style: BlockSpacingStyle;
}) {
  const rows = props.node.children ?? [];
  const weights = resolveMarkdownTableColumnWeights(
    rows.map((row) => (row.children ?? []).map((cell) => markdownNodePlainText(cell))),
  );
  return (
    <view className="MdTableScroller" style={props.style}>
      <view className="MdTable">
        {rows.map((row, rowIndex) => (
          <view
            className={rowIndex === rows.length - 1 ? "MdTableRow MdTableRow--last" : "MdTableRow"}
            key={`${props.nodeKey}.row.${rowIndex}`}
          >
            {(row.children ?? []).map((cell, cellIndex) => {
              const align = props.node.align?.[cellIndex] ?? "left";
              return (
                <view
                  className={`${rowIndex === 0 ? "MdTableCell MdTableHeaderCell" : "MdTableCell"}${
                    cellIndex === (row.children ?? []).length - 1 ? " MdTableCell--last" : ""
                  }`}
                  key={`${props.nodeKey}.cell.${rowIndex}.${cellIndex}`}
                  style={{ flexGrow: weights[cellIndex] ?? 1 }}
                >
                  <text
                    className={`${rowIndex === 0 ? "MdTableHeaderText" : "MdTableCellText"} MdTableText--${align}${
                      markdownNodeHasInlineCode(cell) ? " MdText--inline-code" : ""
                    }`}
                  >
                    {renderInlineChildren(
                      cell,
                      `${props.nodeKey}.inline.${rowIndex}.${cellIndex}`,
                      props.context,
                    )}
                  </text>
                </view>
              );
            })}
          </view>
        ))}
      </view>
    </view>
  );
}

// Upstream's `GITHUB_ALERTS` (`ChatMarkdown.tsx`): title and glyph per kind.
const GITHUB_ALERTS = {
  note: { title: "Note", Icon: CircleAlertIcon },
  tip: { title: "Tip", Icon: LightBulbIcon },
  important: { title: "Important", Icon: CircleAlertIcon },
  warning: { title: "Warning", Icon: TriangleAlertIcon },
  caution: { title: "Caution", Icon: CircleAlertIcon },
} as const;

function MarkdownAlertTitle(props: { readonly kind: keyof typeof GITHUB_ALERTS }) {
  const { activeTheme, svgColors } = useTheme();
  const alert = GITHUB_ALERTS[props.kind];
  // An SVG takes a resolved colour, not a CSS variable: the theme's values
  // behind `--info`, `--success`, `--warning` and `--destructive`. `important`
  // (`--status-merged`) has no theme value in script and uses the accent.
  const color =
    props.kind === "tip"
      ? activeTheme.theme.semanticColors.diffAdded
      : props.kind === "warning"
        ? svgColors.warning
        : props.kind === "caution"
          ? activeTheme.theme.semanticColors.diffRemoved
          : activeTheme.theme.accent;
  return (
    <view className="MdAlertTitle">
      <alert.Icon className="MdAlertIcon" color={color} size={14} />
      <text className="MdAlertTitleText">{alert.title}</text>
    </view>
  );
}

/** Block children of a container, each with the margin that separates it from the previous one. */
function renderBlockChildren(
  node: MarkdownNode,
  key: string,
  context: MarkdownRenderContext,
  listContext?: (index: number) => MarkdownListContext,
): React.ReactNode {
  const spacing = resolveMarkdownChildSpacing({
    parent: node,
    variant: context.variant,
    tight: context.tightListItem === true,
  });
  return (node.children ?? []).map((child, index) =>
    renderNode(child, `${key}.${index}`, context, listContext?.(index), spacing[index]),
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
  const url = node.url ?? "";
  const external = /^https?:\/\//i.test(url);
  const fileReference = external
    ? null
    : resolveLynxMarkdownFileReference({
        cwd: context.cwd,
        rawPath: url,
      });
  const activate = external
    ? () => {
        "background only";
        openExternalBestEffort(url);
      }
    : undefined;
  const interaction = useLynxInteractiveState({
    baseClassName: "MdLink",
    disabled: !activate,
    focusable: Boolean(activate),
    onActivate: activate,
    accessibilityTraits: activate ? "link" : "text",
    accessibleLabel: external ? `Open ${url}` : undefined,
  });
  if (fileReference) {
    return (
      <MarkdownFileReferenceToken
        className="MdInlineToken MdInlineToken--mention"
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
    baseClassName: `MdCodeAction${active ? " MdCodeAction--active" : ""}`,
    onActivate,
    accessibleLabel: label,
    accessibilityValue: active ? "on" : "off",
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
    value: node.value ?? "",
  });
  if (fileReference) {
    return (
      <MarkdownFileReferenceToken
        className="MdInlineToken MdInlineToken--mention"
        key={nodeKey}
        onOpenFileReference={context.onOpenFileReference}
        relativePath={fileReference}
        showGlyph
      >
        {node.value ?? ""}
      </MarkdownFileReferenceToken>
    );
  }
  return (
    <text className="MdCode MdInlineCode" key={nodeKey}>
      {node.value ?? ""}
    </text>
  );
}

function MarkdownTaskCheckbox(props: { readonly checked: boolean }) {
  return (
    <view
      className={`MdTaskCheckbox${props.checked ? " MdTaskCheckbox--checked" : ""}`}
      accessibility-element={true}
      accessibility-role="checkbox"
      accessibility-state={{ checked: props.checked, disabled: true }}
      accessibility-value={props.checked ? "Checked" : "Not checked"}
    >
      {props.checked ? (
        <CheckIcon
          className="MdTaskCheckboxIcon"
          color="var(--color-text-button-primary)"
          size={10}
          strokeWidth={3}
        />
      ) : null}
    </view>
  );
}

function MarkdownCodeBlock({
  node,
  nodeKey,
  style,
}: {
  readonly node: MarkdownNode;
  readonly nodeKey: string;
  readonly style: BlockSpacingStyle;
}) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [highlighted, setHighlighted] = useState<NativeSyntaxHighlightResult | null>(null);
  const copyGenerationRef = useRef(0);
  const { codeFontFamily, resolvedTheme } = useTheme();
  const presentation = resolveMarkdownCodeBlockPresentation({
    code: node.value ?? "",
    language: node.lang,
  });

  useEffect(() => {
    "background only";
    let active = true;
    setHighlighted(null);
    const path = presentation.highlightPath;
    if (!presentation.displayCode || !path)
      return () => {
        active = false;
      };
    void highlightExplorerCode({ code: presentation.displayCode, path })
      .then((themes) => {
        if (active) setHighlighted(themes?.[resolvedTheme] ?? null);
      })
      .catch(() => {
        if (active) setHighlighted(null);
      });
    return () => {
      active = false;
    };
  }, [presentation.highlightPath, presentation.displayCode, resolvedTheme]);

  async function copyCode() {
    "background only";
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
    "background only";
    setWrap(toggleMarkdownCodeWrap);
  }

  return (
    <view
      className={`MdCodeBlockShell${wrap ? " MdCodeBlockShell--wrap" : ""}`}
      key={nodeKey}
      style={style}
    >
      <view className="MdCodeHeader">
        <view className="MdCodeTitle">
          {presentation.isFileReference && presentation.filePath ? (
            <FileEntryIcon className="MdCodeFileIcon" pathValue={presentation.filePath} />
          ) : null}
          <text
            className={
              presentation.isFileReference ? "MdCodeLanguage MdCodeFileName" : "MdCodeLanguage"
            }
          >
            {presentation.title}
          </text>
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
            label={wrap ? "Disable soft wrap" : "Enable soft wrap"}
            onActivate={toggleWrap}
          >
            <TextWrapIcon color="var(--muted-foreground)" size={12} />
          </MarkdownCodeAction>
          <MarkdownCodeAction
            active={copied}
            label={copied ? "Copied" : "Copy code"}
            onActivate={() => {
              "background only";
              void copyCode();
            }}
          >
            {copied ? (
              <CheckIcon color="var(--muted-foreground)" size={12} />
            ) : (
              <CopyIcon color="var(--muted-foreground)" size={12} />
            )}
          </MarkdownCodeAction>
        </view>
      </view>
      <scroll-view className="MdCodeScroller" scroll-x={!wrap}>
        <view className="MdCodeBlock">
          <text
            className="MdCode MdCodeBlockText"
            style={{
              fontFamily: codeFontFamily,
              // One line is `leading-relaxed` of the chat font, as in `.chat-markdown pre`.
              minHeight: `calc(var(--app-font-size-chat, 13px) * ${1.625 * presentation.lineCount})`,
            }}
          >
            {highlighted
              ? highlighted.lines.map((line, lineIndex) => (
                  <text key={`${lineIndex}:${line.map((token) => token.content).join("")}`}>
                    {line.map((token, tokenIndex) => (
                      <text
                        key={`${tokenIndex}:${token.content}`}
                        style={{
                          color: token.color,
                          ...(token.fontStyle & 1 ? { fontStyle: "italic" } : {}),
                          ...(token.fontStyle & 2 ? { fontWeight: "700" } : {}),
                          ...(token.fontStyle & 4 ? { textDecoration: "underline" } : {}),
                        }}
                      >
                        {token.content}
                      </text>
                    ))}
                    {lineIndex < highlighted.lines.length - 1 ? "\n" : ""}
                  </text>
                ))
              : presentation.displayCode}
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
  listContext?: MarkdownListContext,
  spacing?: MarkdownChildSpacing,
): React.ReactNode {
  const children = () => renderInlineChildren(node, key, context);
  const style = markdownSpacingStyle(spacing);
  switch (node.type) {
    case "root":
      return <view key={key}>{renderBlockChildren(node, key, context)}</view>;
    case "text":
      return context.variant === "user" && context.allowComposerChips ? (
        renderUserText(node.value ?? "", key, context)
      ) : (
        <text key={key}>
          {context.variant === "user"
            ? (node.value ?? "")
            : collapseMarkdownSoftBreaks(node.value ?? "")}
        </text>
      );
    case "paragraph":
      return (
        <SelectableMarkdownText
          className={
            markdownNodeHasInlineCode(node) ? "MdParagraph MdText--inline-code" : "MdParagraph"
          }
          context={context}
          key={key}
          style={style}
        >
          {children()}
        </SelectableMarkdownText>
      );
    case "heading":
      return (
        <SelectableMarkdownText
          className={`MdHeading MdH${node.depth ?? 3}`}
          context={context}
          key={key}
          style={style}
        >
          {children()}
        </SelectableMarkdownText>
      );
    case "strong":
      return (
        <text className="MdStrong" key={key}>
          {children()}
        </text>
      );
    case "emphasis":
      return (
        <text className="MdEmphasis" key={key}>
          {children()}
        </text>
      );
    case "delete":
      return (
        <text className="MdDeleted" key={key}>
          {children()}
        </text>
      );
    case "link":
      return <MarkdownLink node={node} nodeKey={key} context={context} />;
    case "image":
      return (
        <text className="MdImageFallback" key={key}>
          [image: {node.alt ?? "preview"}]
        </text>
      );
    case "blockquote": {
      if (!node.alert) {
        return (
          <view className="MdBlockquote" key={key} style={style}>
            {renderBlockChildren(node, key, context)}
          </view>
        );
      }
      return (
        <view className={`MdBlockquote MdAlert MdAlert--${node.alert}`} key={key} style={style}>
          <MarkdownAlertTitle kind={node.alert} />
          {/* The title is a paragraph of its own in the Web blockquote: its
              margin and the first child's collapse to one block margin. */}
          <view className="MdAlertBody">{renderBlockChildren(node, key, context)}</view>
        </view>
      );
    }
    case "list": {
      const loose = isMarkdownListLoose(node);
      return (
        <view className="MdList" key={key} style={style}>
          {renderBlockChildren(node, key, context, (index) => ({
            ordered: node.ordered === true,
            index,
            start: node.start ?? null,
            loose,
          }))}
        </view>
      );
    }
    case "listItem": {
      const task = node.checked !== undefined && node.checked !== null;
      const ordered = listContext?.ordered === true;
      const depth = context.listDepth ?? { ordered: 0, unordered: 0 };
      const marker = resolveMarkdownListMarker({
        ordered,
        index: listContext?.index ?? 0,
        start: listContext?.start,
        depth: ordered ? depth.ordered : depth.unordered,
      });
      const itemContext: MarkdownRenderContext = {
        ...context,
        tightListItem: listContext?.loose !== true,
        listDepth: ordered
          ? { ...depth, ordered: depth.ordered + 1 }
          : { ...depth, unordered: depth.unordered + 1 },
      };
      return (
        <view className="MdListItem" key={key} style={style}>
          {task ? (
            <view className="MdListMarker MdTaskCheckboxSlot">
              <MarkdownTaskCheckbox checked={node.checked === true} />
            </view>
          ) : (
            <view className="MdListMarker">
              {marker === "◦" || marker === "▪" ? (
                // The browser draws these markers as shapes. Native's text engine renders the
                // glyphs as a small dot and a faint box, so they are drawn here; the invisible
                // bullet gives the box the first line's height for the shape to centre on.
                <view className="MdListMarkerShape">
                  <text className="MdListMarkerStrut">•</text>
                  <view
                    className={`MdListBullet MdListBullet--${marker === "◦" ? "circle" : "square"}`}
                  />
                </view>
              ) : (
                <text className="MdListMarkerText">{marker}</text>
              )}
            </view>
          )}
          <view className="MdListBody">{renderBlockChildren(node, key, itemContext)}</view>
        </view>
      );
    }
    case "code":
      return <MarkdownCodeBlock node={node} nodeKey={key} style={style} />;
    case "inlineCode":
      return <MarkdownInlineCode context={context} node={node} nodeKey={key} />;
    case "math":
      return (
        <view className="MdMathBlockShell" key={key} style={style}>
          <text className="MdCode MdMath MdMathBlock">
            ƒ {"  "}
            {node.value ?? ""}
          </text>
        </view>
      );
    case "inlineMath":
      return (
        <text className="MdCode MdMath" key={key}>
          ƒ {node.value ?? ""}
        </text>
      );
    case "table":
      return <MarkdownTable context={context} key={key} node={node} nodeKey={key} style={style} />;
    case "thematicBreak":
      return <view className="MdRule" key={key} style={style} />;
    case "break":
      return (
        <text className="MdBreak" key={key}>
          {"\n"}
        </text>
      );
    case "html":
      return (
        <text className="MdHtmlFallback" key={key} style={spacing ? style : undefined}>
          {node.value ?? ""}
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
  selectable = false,
  variant = "assistant",
  mentionReferences = [],
  onOpenFileReference,
  onTextSelection,
  preparsedTree,
}: ChatMarkdownProps) {
  const [parsedTree, setParsedTree] = useState<MarkdownNode | null>(null);
  const hasPreparsedTree = preparsedTree !== undefined;
  const tree = hasPreparsedTree ? preparsedTree : parsedTree;

  useEffect(() => {
    "background only";
    if (hasPreparsedTree) return;
    try {
      setParsedTree(parseMarkdown(text, variant));
    } catch (error) {
      console.error("[markdown] parse failed", String(error), error);
    }
  }, [hasPreparsedTree, text, variant]);

  const context: MarkdownRenderContext = {
    allowComposerChips: variant === "user",
    cwd,
    mentionReferences,
    onOpenFileReference,
    onTextSelection,
    selectable,
    variant,
  };

  const root = (
    <view
      className={`${className ? `MdRoot ${className}` : "MdRoot"}${
        variant === "user" ? " MdRoot--user" : ""
      }`}
    >
      {tree ? (
        renderNode(tree, "root", context)
      ) : (
        <SelectableMarkdownText className="MdParagraph" context={context}>
          {variant === "user" ? renderUserText(text, "fallback", context) : text}
        </SelectableMarkdownText>
      )}
    </view>
  );
  if (!selectable) return root;
  // See textSelectionScrollScope.logic.ts: without this scope, selecting text by dragging
  // sends the scroller that holds the markdown (the transcript list) to its top.
  return (
    <scroll-view
      className={
        variant === "user"
          ? "MdSelectionScrollScope"
          : "MdSelectionScrollScope MdSelectionScrollScope--bleed"
      }
      {...TEXT_SELECTION_SCROLL_SCOPE_PROPS}
    >
      {root}
    </scroll-view>
  );
}
