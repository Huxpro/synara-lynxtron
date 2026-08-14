import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx window external navigation', () => {
  it('contains fire-and-forget host rejection', () => {
    const source = readFileSync(new URL('./window.ts', import.meta.url), 'utf8');
    expect(source).toContain(
      'void platformWindow.openExternal(url).catch(() => undefined);'
    );
    expect(source).toContain('openWindow: (url) => {\n    openExternalBestEffort(url);');
  });
});
