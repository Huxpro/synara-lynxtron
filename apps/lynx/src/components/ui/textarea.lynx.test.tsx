import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { Textarea } from './textarea.lynx';

describe('Textarea', () => {
  it('reuses the Native Input bridge with multiline defaults', () => {
    const source = readFileSync(new URL('./textarea.lynx.tsx', import.meta.url), 'utf8');
    expect(source).toContain("import { Input, type InputProps } from './input.lynx'");
    expect(source).toContain('maxLines = 5');
    expect(source).toContain('<Input {...props} multiline maxLines={maxLines} />');
  });
});
