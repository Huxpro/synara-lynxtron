import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Composer token icon fidelity', () => {
  it('uses semantic icons for rich composer tokens and preserves the slash glyph', () => {
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
      '<text className="ComposerChipGlyph">/</text>'
    );
    expect(source).not.toContain('function segmentGlyph');
    expect(source).not.toContain("return '◆'");
    expect(source).not.toContain("return '›'");
    expect(source).not.toContain("return '↗'");
    expect(styles).toMatch(
      /\.ComposerChipIcon\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;[^}]*margin-right:\s*4px;[^}]*flex-shrink:\s*0;/s
    );
  });
});
