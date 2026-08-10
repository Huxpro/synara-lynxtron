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
      directory: null,
      filePath: null,
      isFileReference: false,
      lineRange: null,
      minimumTextHeightPx: 66,
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
      directory: 'src/runtime',
      filePath: 'src/runtime/state.ts',
      isFileReference: true,
      lineRange: '12-18',
      minimumTextHeightPx: 33,
      title: 'state.ts',
    });
    const source = readFileSync(
      new URL('./ChatMarkdown.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./markdown.css', import.meta.url),
      'utf8'
    );
    expect(source).toContain('className="MdCodeFileIcon"');
    expect(source).toContain(
      '<text className="MdCodeDirectory">{presentation.directory}</text>'
    );
    expect(source).toContain(
      '<text className="MdCodeLineRange">{presentation.lineRange}</text>'
    );
    expect(styles).toMatch(
      /\.MdCodeFileIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s
    );
    expect(styles).toMatch(
      /\.MdCodeDirectory\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s
    );
  });

  it('uses the same readable labels for skills, mentions, and links', () => {
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: 'skill',
        name: 'check-code',
      })
    ).toEqual({ label: 'Check Code', openExternalUrl: null });
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: 'mention',
        path: 'src/components/App.tsx',
      })
    ).toEqual({ label: 'App.tsx', openExternalUrl: null });
    expect(
      resolveMarkdownInlineTokenPresentation({
        type: 'link',
        url: 'https://example.com',
      })
    ).toEqual({
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
    expect(source).toContain('resolveLynxMarkdownFileReference({');
    expect(source).toContain('resolveLynxInlineCodeFileReference({');
    expect(source).toContain('<MarkdownFileReferenceToken');
    expect(source).toContain('onOpenFileReference={context.onOpenFileReference}');
    expect(source).toContain("renderUserText(text, 'fallback', context)");
    expect(source).toContain('accessibility-role="checkbox"');
    expect(source).toContain(
      'accessibility-state={{ checked: props.checked, disabled: true }}'
    );
    expect(source).toContain(
      '<CheckIcon className="MdTaskCheckboxIcon" size={10} />'
    );
    expect(source).not.toContain("'☑'");
    expect(source).not.toContain("'☐'");
    const styles = readFileSync(
      new URL('./markdown.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.MdTaskCheckbox\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*border:\s*1px solid var\(--color-border\);[^}]*border-radius:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.MdTaskCheckbox--checked\s*\{[^}]*border-color:\s*var\(--primary\);[^}]*background-color:\s*var\(--primary\);/s
    );
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
