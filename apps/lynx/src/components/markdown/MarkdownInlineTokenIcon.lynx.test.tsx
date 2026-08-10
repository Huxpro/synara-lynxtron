import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { MarkdownInlineTokenIcon } from './MarkdownInlineTokenIcon.lynx';

describe('Lynx Markdown inline token icons', () => {
  it('uses file, skill, slash, agent, terminal, and link icon slots', () => {
    process.env.SYNARA_WS_URL = 'ws://127.0.0.1:58090';
    render(
      <>
        <MarkdownInlineTokenIcon
          segment={{ type: 'mention', path: 'src/App.tsx' }}
        />
        <MarkdownInlineTokenIcon
          segment={{ type: 'skill', name: 'polish' }}
        />
        <MarkdownInlineTokenIcon
          segment={{ type: 'slash-command', command: 'plan' }}
        />
        <MarkdownInlineTokenIcon
          segment={{
            type: 'agent-mention',
            alias: 'reviewer',
            color: 'violet',
          }}
        />
        <MarkdownInlineTokenIcon
          segment={{
            type: 'terminal-context',
            context: {
              terminalId: 'terminal-1',
              terminalLabel: 'Terminal',
            },
          }}
        />
        <MarkdownInlineTokenIcon
          segment={{ type: 'link', url: 'https://openai.com' }}
        />
      </>
    );

    expect(
      elementTree.root?.querySelectorAll('.MdInlineTokenIcon')
    ).toHaveLength(5);
    expect(
      elementTree.root?.querySelector('.MdLinkTargetFavicon')
    ).not.toBeNull();
    expect(elementTree.root?.querySelector('.MdInlineTokenGlyph')).toBeNull();
    const markdownSource = readFileSync(
      new URL('./ChatMarkdown.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./markdown.css', import.meta.url),
      'utf8'
    );
    expect(markdownSource).toContain(
      'resolveAgentChipColor(segment.color)'
    );
    expect(markdownSource).toContain('color={agentColor?.text}');
    expect(styles).toMatch(
      /\.MdInlineToken--mention,[^{]*\.MdInlineToken--link\s*\{[^}]*padding:\s*0;[^}]*border-width:\s*0;[^}]*background-color:\s*transparent;/s
    );
    expect(styles).toMatch(
      /\.MdInlineToken--agent-mention\s*\{[^}]*padding:\s*2px 6px;[^}]*border-width:\s*0;[^}]*border-radius:\s*var\(--radius-md\);/s
    );
    expect(styles).toMatch(
      /\.MdInlineToken--terminal-context\s*\{[^}]*padding:\s*2px;[^}]*border:\s*1px solid var\(--color-border-light\);[^}]*border-radius:\s*4px;/s
    );
  });
});
