import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from '@rstest/core';

function productionSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return productionSourceFiles(absolute);
    if (!entry.isFile() || !/\.(?:ts|tsx)$/.test(entry.name)) return [];
    if (/\.(?:test|spec)\.(?:ts|tsx)$/.test(entry.name)) return [];
    return [absolute];
  });
}

describe('Lynx accessibility attribute audit', () => {
  it('uses the official singular accessibility-trait attribute everywhere', () => {
    const sourceRoot = path.resolve(__dirname, '..');
    const offenders = productionSourceFiles(sourceRoot).filter((file) =>
      readFileSync(file, 'utf8').includes('accessibility-traits')
    );
    expect(offenders).toEqual([]);
  });

  it('keeps generated icons decorative unless they have their own label', () => {
    const generator = readFileSync(
      path.resolve(__dirname, '../../scripts/generate-lynx-icons.mjs'),
      'utf8'
    );
    expect(generator).toContain(
      'accessibility-element={accessibilityLabel ? true : false}'
    );
    expect(generator).toContain(
      "accessibility-trait={accessibilityLabel ? 'image' : undefined}"
    );
  });
});
