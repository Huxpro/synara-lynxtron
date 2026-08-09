import { describe, expect, it } from '@rstest/core';

import {
  resolveLynxInlineCodeFileReference,
  resolveLynxMarkdownFileReference,
} from './markdownFileReferences.logic';

describe('Lynx markdown file references', () => {
  it('normalizes workspace links to safe relative paths', () => {
    expect(
      resolveLynxMarkdownFileReference({
        cwd: '/Users/dev/project',
        rawPath: 'src/app/router.tsx:42:7',
      })
    ).toBe('src/app/router.tsx');
    expect(
      resolveLynxMarkdownFileReference({
        cwd: '/Users/dev/project',
        rawPath: '/Users/dev/project/README.md#L3',
      })
    ).toBe('README.md');
  });

  it('rejects external, out-of-workspace, and traversal targets', () => {
    expect(
      resolveLynxMarkdownFileReference({
        cwd: '/Users/dev/project',
        rawPath: 'https://example.com/docs',
      })
    ).toBeNull();
    expect(
      resolveLynxMarkdownFileReference({
        cwd: '/Users/dev/project',
        rawPath: '/tmp/secret.txt',
      })
    ).toBeNull();
    expect(
      resolveLynxMarkdownFileReference({
        cwd: '/Users/dev/project',
        rawPath: '../secret.txt',
      })
    ).toBeNull();
  });

  it('uses the shared inline-code candidate grammar', () => {
    expect(
      resolveLynxInlineCodeFileReference({
        cwd: '/Users/dev/project',
        value: '`src/app/router.tsx`',
      })
    ).toBe('src/app/router.tsx');
    expect(
      resolveLynxInlineCodeFileReference({
        cwd: '/Users/dev/project',
        value: 'not a file',
      })
    ).toBeNull();
  });
});
