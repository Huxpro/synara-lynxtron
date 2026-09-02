import { describe, expect, it } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { MarkdownFileReferenceToken } from './MarkdownFileReferenceToken.lynx';

describe('Lynx markdown file reference token', () => {
  it('publishes an accessible file-open action', () => {
    const openedPaths: string[] = [];
    const onOpenFileReference = (relativePath: string) => {
      openedPaths.push(relativePath);
    };
    render(
      <MarkdownFileReferenceToken
        className="MdInlineToken MdInlineToken--file"
        onOpenFileReference={onOpenFileReference}
        relativePath="src/app/router.tsx"
        showGlyph
      >
        the router
      </MarkdownFileReferenceToken>
    );

    const reference = elementTree.root?.querySelector('.MdInlineToken--file');
    expect(reference?.getAttribute('accessibility-label')).toBe(
      'Open src/app/router.tsx'
    );
    expect(reference?.querySelector('.MdInlineTokenFileIcon')).not.toBeNull();
    expect(reference?.querySelector('.MdInlineTokenGlyph')).toBeNull();
    fireEvent.tap(reference!);
    expect(openedPaths).toEqual(['src/app/router.tsx']);
  });

  it('stays non-interactive without an owning opener', () => {
    render(
      <MarkdownFileReferenceToken
        className="MdInlineToken MdInlineToken--file"
        relativePath="README.md"
      >
        README.md
      </MarkdownFileReferenceToken>
    );

    const reference = elementTree.root?.querySelector('.MdInlineToken--file');
    expect(reference?.getAttribute('accessibility-traits')).toBe('text');
    expect(reference?.getAttribute('focusable')).not.toBe('true');
  });

  it('wires external links to the shared favicon slot instead of a text arrow', () => {
    const source = readFileSync(
      new URL('./ChatMarkdown.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain(
      "{external ? <ExternalLinkIcon url={url} /> : null}"
    );
    expect(source).not.toContain(
      '{external ? <text className="MdLinkTarget"> ↗</text> : null}'
    );
  });

  it('reuses the native host syntax-highlighting contract for fenced code', () => {
    const source = readFileSync(
      new URL('./ChatMarkdown.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "import { highlightExplorerCode } from '../../data/synaraClient.lynx'"
    );
    expect(source).toContain(
      'useState<NativeSyntaxHighlightResult | null>(null)'
    );
    expect(source).toContain('highlightExplorerCode({');
    expect(source).toContain('color: token.color');
  });
});
