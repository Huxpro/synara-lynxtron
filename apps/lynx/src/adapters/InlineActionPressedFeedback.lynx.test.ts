import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('inline action pressed feedback', () => {
  it('keeps PR close and Markdown code actions stable', () => {
    const prStyles = readFileSync(
      new URL('./pull-request-detail-close-composition-elements.css', import.meta.url),
      'utf8'
    );
    const markdownStyles = readFileSync(
      new URL('../components/markdown/markdown.css', import.meta.url),
      'utf8'
    );

    expect(prStyles).toMatch(
      /\.SharedPrDetailCloseButton\.ui-pressed\s*\{[^}]*background-color:\s*var\(--color-background-elevated-secondary\);/s
    );
    expect(prStyles).not.toMatch(
      /\.SharedPrDetailCloseButton\.ui-pressed\s*\{[^}]*opacity:/s
    );
    expect(markdownStyles).toMatch(
      /\.MdCodeAction\.ui-pressed\s*\{[^}]*color:\s*var\(--foreground\);[^}]*background-color:\s*var\(--color-background-button-secondary\);/s
    );
    expect(markdownStyles).not.toMatch(
      /\.MdCodeAction\.ui-pressed\s*\{[^}]*(?:opacity|transform):/s
    );
  });
});
