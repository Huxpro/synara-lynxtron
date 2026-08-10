import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Composer token icon fidelity', () => {
  it('uses semantic icons for every rich composer token', () => {
    const source = readFileSync(
      new URL('./Composer.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "import agentMentionSvg from '@synara-central-icons/robot.svg?raw';"
    );
    expect(source).toContain(
      "import skillSvg from '@synara-central-icons/building-blocks.svg?raw';"
    );
    expect(source).toContain(
      "import terminalSvg from '@synara-central-icons/console.svg?raw';"
    );
    expect(source).toContain('<FileEntryIcon');
    expect(source).toContain('<ExternalLinkIcon');
    expect(source).toContain(
      'token.key.slice(\'mention:\'.length)'
    );
    expect(source).toContain(
      '<ClockIcon'
    );
    expect(source).not.toContain('function segmentGlyph');
    expect(source).not.toContain("return '◆'");
    expect(source).not.toContain("return '›'");
    expect(source).not.toContain("return '↗'");
    expect(source).not.toContain('className="ComposerChipGlyph"');
    expect(styles).toMatch(
      /\.ComposerChipIcon\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;[^}]*margin-right:\s*4px;[^}]*flex-shrink:\s*0;/s
    );
  });

  it('matches the Web token anatomy instead of filling every token with accent', () => {
    const source = readFileSync(
      new URL('./Composer.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./composer.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "resolveAgentChipColor(segment.color)"
    );
    expect(source).toContain("color=\"var(--info-foreground)\"");
    expect(styles).toMatch(
      /\.ComposerChip--mention,\s*\.ComposerChip--skill,\s*\.ComposerChip--slash-command,\s*\.ComposerChip--link\s*\{[^}]*background-color:\s*transparent;/s
    );
    expect(styles).toMatch(
      /\.ComposerChipLabel\s*\{[^}]*color:\s*var\(--info-foreground\);[^}]*font-size:\s*var\(--type-composer-editor-size\);[^}]*font-weight:\s*500;/s
    );
    expect(styles).toMatch(
      /\.ComposerChip--agent-mention\s*\{[^}]*padding:\s*2px 6px;[^}]*border-radius:\s*var\(--radius-md\);/s
    );
    expect(styles).toMatch(
      /\.ComposerChip--terminal-context\s*\{[^}]*padding:\s*2px;[^}]*border:\s*1px solid var\(--color-border-light\);[^}]*background-color:\s*var\(--sidebar-accent-active\);/s
    );
    expect(styles).not.toMatch(
      /\.ComposerChip\s*\{[^}]*background-color:\s*var\(--accent\);/s
    );
  });
});
