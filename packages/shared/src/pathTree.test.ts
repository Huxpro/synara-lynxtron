import { describe, expect, it } from 'vitest';

import { buildPathTree, filterPathsForSearch } from './pathTree';

describe('path tree', () => {
  it('sorts directories before files and compresses single-child chains', () => {
    expect(buildPathTree(['z.ts', 'src/app/b.ts', 'src/app/a.ts'])).toEqual([
      {
        kind: 'directory',
        name: 'src/app',
        path: 'src/app',
        children: [
          { kind: 'file', name: 'a.ts', path: 'src/app/a.ts' },
          { kind: 'file', name: 'b.ts', path: 'src/app/b.ts' },
        ],
      },
      { kind: 'file', name: 'z.ts', path: 'z.ts' },
    ]);
  });

  it('filters paths case-insensitively without changing the empty query order', () => {
    expect(filterPathsForSearch(['src/App.ts', 'README.md'], 'app')).toEqual(['src/App.ts']);
    expect(filterPathsForSearch(['b', 'a'], ' ')).toEqual(['b', 'a']);
  });
});
