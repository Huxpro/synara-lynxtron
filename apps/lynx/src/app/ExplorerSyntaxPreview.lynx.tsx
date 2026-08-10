import { useState } from '@lynx-js/react';

import { type NativeSyntaxHighlightThemes } from '../main/syntaxHighlightingContract.logic';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { PlusIcon } from '../lib/icons.lynx';
import { ExplorerFileCommentEditor } from './ExplorerFileCommentEditor.lynx';

function tokenStyle(fontStyle: number): Record<string, string | number> {
  return {
    ...(fontStyle & 1 ? { fontStyle: 'italic' } : {}),
    ...(fontStyle & 2 ? { fontWeight: 700 } : {}),
    ...(fontStyle & 4 ? { textDecoration: 'underline' } : {}),
  };
}

export function ExplorerSyntaxPreview(props: {
  readonly contents: string;
  readonly highlighted: NativeSyntaxHighlightThemes | null;
  readonly initialCommentLine: number | null;
  readonly onComment: (input: {
    readonly lineNumber: number;
    readonly text: string;
  }) => void;
  readonly path: string;
  readonly theme: 'dark' | 'light';
  readonly truncated: boolean;
}) {
  const highlighted = props.highlighted?.[props.theme] ?? null;
  const [commentLine, setCommentLine] = useState<number | null>(
    props.initialCommentLine
  );
  return (
    <scroll-view
      className="ExplorerDockPreviewScroll"
      scroll-orientation="vertical"
    >
      {highlighted ? (
        <view
          className="ExplorerDockSyntax"
          data-language={highlighted.language}
          data-syntax-highlighted="true"
        >
          {highlighted.lines.map((line, lineIndex) => {
            const lineNumber = lineIndex + 1;
            return (
              <ExplorerSyntaxLine
                active={commentLine === lineNumber}
                key={`${lineIndex}:${line.map((token) => token.content).join('')}`}
                line={line}
                lineNumber={lineNumber}
                onActivate={() => setCommentLine(lineNumber)}
                onCancel={() => setCommentLine(null)}
                onSubmit={(text) => {
                  props.onComment({ lineNumber, text });
                  setCommentLine(null);
                }}
              />
            );
          })}
        </view>
      ) : (
        <text className="ExplorerDockCode">{props.contents}</text>
      )}
      {props.truncated ? (
        <text className="ExplorerDockTruncated">
          Preview truncated at 1 MB.
        </text>
      ) : null}
    </scroll-view>
  );
}

export function ExplorerSyntaxLine(props: {
  readonly active: boolean;
  readonly line: NativeSyntaxHighlightThemes['light']['lines'][number];
  readonly lineNumber: number;
  readonly onActivate: () => void;
  readonly onCancel: () => void;
  readonly onSubmit: (text: string) => void;
}) {
  const lineNumber = useLynxInteractiveState({
    baseClassName: `ExplorerDockSyntaxLineNumber${
      props.active ? ' ExplorerDockSyntaxLineNumber--active' : ''
    }`,
    accessibleLabel: `Comment on line ${props.lineNumber}`,
    onActivate: props.onActivate,
  });
  return (
    <view className="ExplorerDockSyntaxLineGroup">
      <view
        className={`ExplorerDockSyntaxLine${
          props.active ? ' ExplorerDockSyntaxLine--commenting' : ''
        }`}
      >
        <view className={lineNumber.className} {...lineNumber.eventProps}>
          <text className="ExplorerDockSyntaxLineNumberText">
            {props.lineNumber}
          </text>
          <view className="ExplorerDockSyntaxCommentGlyph">
            <PlusIcon
              className="ExplorerDockSyntaxCommentGlyphIcon"
              size={14}
            />
          </view>
        </view>
        <text className="ExplorerDockSyntaxCode">
          {props.line.length === 0 ? (
            <text> </text>
          ) : (
            props.line.map((token, tokenIndex) => (
              <text
                key={`${tokenIndex}:${token.content}`}
                style={{
                  color: token.color,
                  ...tokenStyle(token.fontStyle),
                }}
              >
                {token.content}
              </text>
            ))
          )}
        </text>
      </view>
      {props.active ? (
        <ExplorerFileCommentEditor
          lineNumber={props.lineNumber}
          onCancel={props.onCancel}
          onSubmit={props.onSubmit}
        />
      ) : null}
    </view>
  );
}
