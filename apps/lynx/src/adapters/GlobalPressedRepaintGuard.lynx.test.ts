import { describe, expect, it } from '@rstest/core';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function cssFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? cssFiles(path)
      : path.endsWith('.css')
        ? [path]
        : [];
  });
}

describe('global pressed repaint guard', () => {
  it('forbids whole-control pressed opacity and transforms', () => {
    const violations = cssFiles(sourceRoot).flatMap((path) => {
      const styles = readFileSync(path, 'utf8');
      return Array.from(
        styles.matchAll(
          /([^{}]*\.ui-(?:pressed|active)[^{}]*)\{([^{}]*)\}/g
        )
      )
        .filter((match) => {
          const selector = match[1] ?? '';
          const body = match[2] ?? '';
          const stateOwnerHasDescendant =
            /\.ui-(?:pressed|active)\s+/.test(selector);
          const declarations = body
            .split(';')
            .map((declaration) => declaration.trim())
            .filter(Boolean)
            .map((declaration) => {
              const separator = declaration.indexOf(':');
              return separator < 0
                ? { property: declaration, value: '' }
                : {
                    property: declaration.slice(0, separator).trim(),
                    value: declaration.slice(separator + 1).trim(),
                  };
            });
          const dimsOwner = declarations.some(
            ({ property, value }) =>
              property === 'opacity' && /^0\./.test(value)
          );
          const transformsOwner = declarations.some(
            ({ property, value }) =>
              property === 'transform' && value !== 'none'
          );
          return (
            !stateOwnerHasDescendant && (dimsOwner || transformsOwner)
          );
        })
        .map((match) => `${path}: ${match[1]?.trim()}`);
    });

    expect(violations).toEqual([]);
  });
});
