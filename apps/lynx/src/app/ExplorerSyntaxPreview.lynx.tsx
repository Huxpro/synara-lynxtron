import { type NativeSyntaxHighlightThemes } from '../main/syntaxHighlightingContract.logic';

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
  readonly path: string;
  readonly theme: 'dark' | 'light';
  readonly truncated: boolean;
}) {
  const highlighted = props.highlighted?.[props.theme] ?? null;
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
          {highlighted.lines.map((line, lineIndex) => (
            <view
              className="ExplorerDockSyntaxLine"
              key={`${lineIndex}:${line.map((token) => token.content).join('')}`}
            >
              <text className="ExplorerDockSyntaxLineNumber">
                {lineIndex + 1}
              </text>
              <text className="ExplorerDockSyntaxCode">
                {line.length === 0 ? (
                  <text> </text>
                ) : (
                  line.map((token, tokenIndex) => (
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
          ))}
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
