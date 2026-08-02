// P2-V5: unified/remark parses on the background thread; this module only
// turns the serializable mdast subset into Lynx-native view/text elements.

import { useEffect, useState } from '@lynx-js/react';

import { parseMarkdown, type MarkdownNode } from './markdownAst';

export interface ChatMarkdownProps {
  readonly text: string;
  readonly className?: string;
}

function renderInlineChildren(node: MarkdownNode, key: string): React.ReactNode {
  return (node.children ?? []).map((child, index) => renderNode(child, `${key}.${index}`));
}

function renderTable(node: MarkdownNode, key: string) {
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
                  {renderInlineChildren(cell, `${key}.inline.${rowIndex}.${cellIndex}`)}
                </text>
              </view>
            ))}
          </view>
        ))}
      </view>
    </scroll-view>
  );
}

function renderNode(
  node: MarkdownNode,
  key: string,
  listContext?: { ordered: boolean; index: number }
): React.ReactNode {
  const children = () => renderInlineChildren(node, key);
  switch (node.type) {
    case 'root':
      return <view key={key}>{children()}</view>;
    case 'text':
      return <text key={key}>{node.value ?? ''}</text>;
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
      return (
        <text className="MdLink" key={key}>
          {children()}
          {node.url ? <text className="MdLinkTarget"> ↗</text> : null}
        </text>
      );
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
            renderNode(child, `${key}.${index}`, { ordered: node.ordered === true, index })
          )}
        </view>
      );
    case 'listItem': {
      const task = node.checked !== undefined && node.checked !== null;
      const marker = task
        ? node.checked
          ? '☑'
          : '☐'
        : listContext?.ordered
          ? `${listContext.index + 1}.`
          : '•';
      return (
        <view className="MdListItem" key={key}>
          <text className={node.checked ? 'MdListMarker MdCheckboxChecked' : 'MdListMarker'}>
            {marker}
          </text>
          <view className="MdListBody">{children()}</view>
        </view>
      );
    }
    case 'code':
      return (
        <scroll-view className="MdCodeScroller" scroll-x key={key}>
          <view className="MdCodeBlock">
            <text className="MdCode MdCodeBlockText">
              {node.lang ? `${node.lang}\n` : ''}
              {node.value ?? ''}
            </text>
          </view>
        </scroll-view>
      );
    case 'inlineCode':
      return (
        <text className="MdCode MdInlineCode" key={key}>
          {node.value ?? ''}
        </text>
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
      return renderTable(node, key);
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

export function ChatMarkdown({ text, className }: ChatMarkdownProps) {
  const [tree, setTree] = useState<MarkdownNode | null>(null);

  useEffect(() => {
    'background only';
    try {
      const parsed = parseMarkdown(text);
      setTree(parsed);
    } catch (error) {
      console.error('[markdown] parse failed', String(error), error);
    }
  }, [text]);

  return (
    <view className={className ? `MdRoot ${className}` : 'MdRoot'}>
      {tree ? renderNode(tree, 'root') : <text className="MdParagraph">{text}</text>}
    </view>
  );
}
