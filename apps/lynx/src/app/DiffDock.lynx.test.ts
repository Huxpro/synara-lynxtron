import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Diff Dock chrome fidelity', () => {
  it('uses Web neutral hover material for close and retry controls', () => {
    const styles = readFileSync(
      new URL('./diff-dock.css', import.meta.url),
      'utf8'
    );

    for (const className of ['DiffDockClose', 'DiffDockRetry']) {
      expect(styles).toMatch(
        new RegExp(
          `\\.${className}\\.ui-hover,[^}]*\\{[^}]*background-color:\\s*var\\(--color-background-elevated-secondary\\);`,
          's'
        )
      );
    }
    expect(styles).not.toContain('background-color: var(--accent)');
  });

  it('fits standalone state feedback inside a short thread dock', () => {
    const styles = readFileSync(
      new URL('./diff-dock.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ThreadPage[\s\S]*?> \.DiffDock[\s\S]*?\.DiffDockState\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*100%;/s
    );
  });

  it('provides a stable searchable file jump overlay for multi-file diffs', () => {
    const source = readFileSync(
      new URL('./DiffDock.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./diff-dock.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain("props.presentation === 'dock'");
    expect(source).toContain('view.files.length > 1');
    expect(source).toContain('aria-label="Jump to file"');
    expect(source).toContain('className="DiffDockFileJumpViewport"');
    expect(source).toContain('accessibility-label="Search changed files"');
    expect(source).toContain('file.path.toLowerCase().includes(');
    expect(source).toContain("const closeFileJump = () => {");
    expect(source).toContain("setFileJumpQuery('')");
    expect(source).toContain('bindtap={closeFileJump}');
    expect(source).toContain('onClick={closeFileJump}');
    expect(source).toContain('setExpandedFileKeys([file.key])');
    expect(source).toContain('scrollLynxElementIntoViewById(fileElementId(file.key))');
    expect(source).toContain('const jumpToFile = (file: PullRequestDiffFileView) => {');
    expect(source).toContain('onClick={() => jumpToFile(file)}');
    expect(source).toContain('onConfirm={() => {');
    expect(source).toContain('if (fileJumpFiles.length === 1)');
    expect(source).toContain('jumpToFile(fileJumpFiles[0]!)');
    expect(source).not.toContain('<Menu');
    expect(styles).toMatch(
      /\.DiffDockFileJumpViewport\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*120;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.DiffDockFileJumpDialog\s*\{[^}]*width:\s*calc\(100vw - 16px\);[^}]*height:\s*calc\(100vh - 16px\);/s
    );
  });
});
