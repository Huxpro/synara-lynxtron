import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Transcript status icon fidelity', () => {
  it('uses Webs Alert, Bot, Check, and Zap identities for work tones', () => {
    const source = readFileSync(
      new URL('./Transcript.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./App.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "import botSvg from '@synara-central-icons/robot.svg?raw';"
    );
    expect(source).toContain(
      "import toolSvg from '@synara-central-icons/zap.svg?raw';"
    );
    expect(source).toContain('<CircleAlertIcon');
    expect(source).toContain('<CheckIcon');
    expect(source).not.toContain("if (tone === 'tool') return '›'");
    expect(source).not.toContain("return '✓'");
    expect(styles).toMatch(
      /\.TranscriptStatusIcon\s*\{[^}]*width:\s*13px;[^}]*height:\s*13px;[^}]*flex-shrink:\s*0;/
    );
  });
});
