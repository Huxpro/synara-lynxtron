import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Settings search result anatomy', () => {
  it('uses the Web two-row section and setting hierarchy', () => {
    const source = readFileSync(
      new URL('./SettingsSearchResults.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');

    expect(source).toContain('SettingsSearchResultSectionRow');
    expect(source).toContain('SettingsSearchResultTitleRow');
    expect(source).toContain('<SettingsIconElement');
    expect(source).toContain('section={props.entry.section}');
    expect(styles).toMatch(
      /\.SettingsSearchResultSectionRow,\s*\.SettingsSearchResultTitleRow\s*\{[^}]*min-height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SettingsSearchResultTitleRow\s*\{[^}]*padding-left:\s*32px;/s
    );
    expect(styles).not.toMatch(
      /\.SettingsSearchResultSectionIcon\s*\{[^}]*(?:border|border-radius):/s
    );
  });
});
