import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Native file preview header', () => {
  it('keeps the deep breadcrumb and controlled Markdown view actions', () => {
    const source = readFileSync(
      new URL('./ExplorerPreviewHeader.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./explorer-dock.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain('deriveFilePreviewBreadcrumb({');
    expect(source).toContain('prefixSegments.map((segment) => (');
    expect(source).toContain('accessibility-label="Markdown view"');
    expect(source).toContain('aria-label="Source view"');
    expect(source).toContain('aria-label="Preview markdown"');
    expect(source).toContain('props.onMarkdownPreviewChange(false)');
    expect(source).toContain('props.onMarkdownPreviewChange(true)');
    expect(source).toContain('ExplorerDockMarkdownMode--active');
    expect(styles).toMatch(
      /\.ExplorerDockMarkdownModes\s*\{[^}]*height:\s*28px;[^}]*flex-shrink:\s*0;[^}]*border-radius:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.LxButton\.ExplorerDockMarkdownMode\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;/s
    );
  });
});
