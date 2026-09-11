import { describe, expect, it } from 'vitest';

import {
  defaultFilePreviewMode,
  isMarkdownPreviewablePath,
  resolveFilePreviewMode,
} from './filePreviewMode';

describe('file preview mode', () => {
  it('recognizes markdown extensions case-insensitively', () => {
    expect(isMarkdownPreviewablePath('docs/README.MD')).toBe(true);
    expect(isMarkdownPreviewablePath('notes.mdx')).toBe(true);
    expect(isMarkdownPreviewablePath('src/index.ts')).toBe(false);
  });

  it('keeps Editor source-first and dock previews rendered-first', () => {
    expect(defaultFilePreviewMode({ filePath: 'README.md', presentation: 'editor' })).toBe('source');
    expect(defaultFilePreviewMode({ filePath: 'README.md', presentation: 'dock' })).toBe('preview');
    expect(defaultFilePreviewMode({ filePath: 'index.ts', presentation: 'dock' })).toBe('source');
  });

  it('applies an override only to the file that owns it', () => {
    const override = { filePath: 'README.md', mode: 'preview' as const };
    expect(resolveFilePreviewMode({ defaultMode: 'source', filePath: 'README.md', override })).toBe('preview');
    expect(resolveFilePreviewMode({ defaultMode: 'source', filePath: 'other.md', override })).toBe('source');
  });
});
