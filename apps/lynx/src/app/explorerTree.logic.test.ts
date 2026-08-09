import { describe, expect, it } from '@rstest/core';

import { toggleExpandedDirectory } from './explorerTree.logic';

describe('Explorer tree state', () => {
  it('adds and removes one directory without mutating the current set', () => {
    const current = new Set(['src']);
    const opened = toggleExpandedDirectory(current, 'docs');
    const closed = toggleExpandedDirectory(opened, 'src');

    expect([...current]).toEqual(['src']);
    expect([...opened]).toEqual(['src', 'docs']);
    expect([...closed]).toEqual(['docs']);
  });
});
