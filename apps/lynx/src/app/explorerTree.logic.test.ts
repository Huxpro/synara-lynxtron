import { describe, expect, it } from '@rstest/core';

import {
  projectExplorerDirectories,
  toggleExpandedDirectory,
  visibleExplorerEntries,
} from './explorerTree.logic';

describe('Explorer tree state', () => {
  it('adds and removes one directory without mutating the current set', () => {
    const current = new Set(['src']);
    const opened = toggleExpandedDirectory(current, 'docs');
    const closed = toggleExpandedDirectory(opened, 'src');

    expect([...current]).toEqual(['src']);
    expect([...opened]).toEqual(['src', 'docs']);
    expect([...closed]).toEqual(['docs']);
  });

  it('projects successful directory entries and errors in one pass', () => {
    const result = projectExplorerDirectories([
      ['src', [{ path: 'src/tree.ts' }], false],
      ['docs', [], true],
    ]);

    expect(result.entriesByPath).toEqual({
      src: [{ path: 'src/tree.ts' }],
    });
    expect([...result.errorPaths]).toEqual(['docs']);
  });

  it('uses the shared directory visibility policy', () => {
    const visible = visibleExplorerEntries([
      { kind: 'directory', name: '.synara-loss', path: '.synara-loss' },
      { kind: 'directory', name: 'node_modules', path: 'node_modules' },
      { kind: 'directory', name: 'apps', path: 'apps' },
      { kind: 'file', name: 'dist', path: 'dist' },
    ]);

    expect(visible).toEqual([
      { kind: 'directory', name: 'apps', path: 'apps' },
      { kind: 'file', name: 'dist', path: 'dist' },
    ]);
  });
});
