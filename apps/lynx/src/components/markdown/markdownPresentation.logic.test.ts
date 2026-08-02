import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import {
  resolveMarkdownCodeBlockPresentation,
  resolveMarkdownInlineTokenPresentation,
  toggleMarkdownCodeWrap,
} from './markdownPresentation.logic';

describe('Lynx markdown presentation logic', () => {
  it('dedents fenced code and keeps language outside the body', () => {
    expect(
      resolveMarkdownCodeBlockPresentation({
        code: '    function greet() {\n      return "hello";\n    }',
        language: 'javascript',
      })
    ).toEqual({
      code: 'function greet() {\n  return "hello";\n}\n',
      minimumTextHeightPx: 66,
      metadata: '',
      title: 'javascript',
    });
  });

  it('projects file-reference metadata with the Web code-fence grammar', () => {
    expect(
      resolveMarkdownCodeBlockPresentation({
        code: 'const ready = true;',
        language: '12:18:src/runtime/state.ts',
      })
    ).toEqual({
      code: 'const ready = true;\n',
      minimumTextHeightPx: 33,
      metadata: 'src/runtime · 12-18',
      title: 'state.ts',
    });
  });

  it('uses the same readable labels for skills, mentions, and links', () => {
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: 'skill',
        name: 'check-code',
      })
    ).toEqual({ glyph: '◆', label: 'Check Code', openExternalUrl: null });
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: 'mention',
        path: 'src/components/App.tsx',
      })
    ).toEqual({ glyph: '@', label: 'App.tsx', openExternalUrl: null });
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: 'link',
        url: 'https://example.com',
      })
    ).toEqual({
      glyph: '↗',
      label: 'https://example.com',
      openExternalUrl: 'https://example.com',
    });
  });

  it('keeps soft-wrap state deterministic and wires both accessible actions', () => {
    expect(toggleMarkdownCodeWrap(false)).toBe(true);
    expect(toggleMarkdownCodeWrap(true)).toBe(false);

    const source = readFileSync(
      new URL('./ChatMarkdown.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain("label={wrap ? 'Disable soft wrap' : 'Enable soft wrap'}");
    expect(source).toContain("label={copied ? 'Copied' : 'Copy code'}");
    expect(source).toContain("variant === 'user' ? ' MdRoot--user' : ''");
  });

  it('keeps user dollar tokens out of the assistant math processor', () => {
    const source = readFileSync(
      new URL('./markdownAst.lynx.ts', import.meta.url),
      'utf8'
    );
    expect(source).toContain("variant === 'user' ? userProcessor : assistantProcessor");
    expect(source).toMatch(
      /const userProcessor = unified\(\)\s*\.use\(remarkParse\)\s*\.use\(remarkGfm\);/s
    );
  });
});
