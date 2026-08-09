import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { ExplorerSyntaxLine } from './ExplorerSyntaxPreview.lynx';

describe('Explorer syntax preview', () => {
  it('uses a Host-owned token stream with a plain-text fallback', () => {
    const source = readFileSync(
      new URL('./ExplorerSyntaxPreview.lynx.tsx', import.meta.url),
      'utf8'
    );
    const desktopSource = readFileSync(
      new URL('../main/desktop/main.ts', import.meta.url),
      'utf8'
    );
    const webSource = readFileSync(
      new URL('../main/web/web-host.ts', import.meta.url),
      'utf8'
    );
    const hostSource = readFileSync(
      new URL('../main/syntaxHighlightingHost.ts', import.meta.url),
      'utf8'
    );
    const queriesSource = readFileSync(
      new URL('./queries.ts', import.meta.url),
      'utf8'
    );
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      'readonly highlighted: NativeSyntaxHighlightThemes | null'
    );
    expect(source).toContain('data-syntax-highlighted="true"');
    expect(source).toContain('baseClassName: `ExplorerDockSyntaxLineNumber');
    expect(source).toContain('accessibleLabel: `Comment on line');
    expect(source).toContain('<ExplorerFileCommentEditor');
    expect(source).toContain('color: token.color');
    expect(source).toContain('className="ExplorerDockCode"');
    expect(source).toContain('Preview truncated at 1 MB.');
    expect(desktopSource).toContain(
      'data.tag === NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG'
    );
    expect(webSource).toContain(
      'params.tag === NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG'
    );
    expect(hostSource).toContain("from 'shiki/core'");
    expect(hostSource).not.toContain('@pierre/diffs');
    expect(hostSource).not.toContain("from 'shiki'");
    expect(queriesSource).toContain('readProjectFileWithSyntax');
    expect(source).toContain('props.highlighted?.[props.theme]');
    expect(queriesSource).toContain(
      '/* webpackMode: "eager" */ \'../data/synaraClient\''
    );
  });

  it('keeps Shiki out of the Lynx UI bundle graph', () => {
    const source = readFileSync(
      new URL('./ExplorerSyntaxPreview.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).not.toContain('@pierre/diffs');
    expect(source).not.toContain('shiki');
    expect(source).not.toContain('../platform/bridge');
    expect(source).not.toContain('dangerouslySetInnerHTML');
  });

  it('opens and cancels a line comment from the rendered line-number control', async () => {
    const onComment = rs.fn();
    const { rerender } = render(
      <ExplorerSyntaxLine
        active={false}
        line={[
          { color: '#D73A49', content: 'export', fontStyle: 0 },
          {
            color: '#24292E',
            content: ' const ready = true;',
            fontStyle: 0,
          },
        ]}
        lineNumber={1}
        onActivate={() => {
          rerender(
            <ExplorerSyntaxLine
              active
              line={[
                { color: '#D73A49', content: 'export', fontStyle: 0 },
              ]}
              lineNumber={1}
              onActivate={() => undefined}
              onCancel={() => {
                rerender(
                  <ExplorerSyntaxLine
                    active={false}
                    line={[
                      { color: '#D73A49', content: 'export', fontStyle: 0 },
                    ]}
                    lineNumber={1}
                    onActivate={() => undefined}
                    onCancel={() => undefined}
                    onSubmit={onComment}
                  />
                );
              }}
              onSubmit={onComment}
            />
          );
        }}
        onCancel={() => undefined}
        onSubmit={onComment}
      />
    );

    const lineNumber = elementTree.root?.querySelector(
      '.ExplorerDockSyntaxLineNumber'
    );
    expect(lineNumber?.getAttribute('accessibility-label')).toBe(
      'Comment on line 1'
    );
    fireEvent.tap(lineNumber!);
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector('.ExplorerDockCommentEditor')
      ).not.toBeNull()
    );

    fireEvent.tap(
      (elementTree.root?.querySelectorAll(
        '.ExplorerDockCommentEditor .LxButton'
      ) ?? [])[0]!
    );
    await waitFor(() =>
      expect(
        elementTree.root?.querySelector('.ExplorerDockCommentEditor')
      ).toBeNull()
    );
    expect(onComment).not.toHaveBeenCalled();
  });
});
