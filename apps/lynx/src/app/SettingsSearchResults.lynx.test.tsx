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
    expect(styles).toMatch(
      /\.SettingsSearchResults\s*\{[^}]*gap:\s*2px;/s
    );
    expect(styles).toMatch(
      /\.SettingsSearchResults\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;/s
    );
    expect(styles).not.toMatch(
      /\.SettingsSearchResults\s*\{[^}]*max-height:/
    );
    expect(source).toContain('<view className="SettingsSearchResults">');
    expect(source).not.toContain(
      'className="SettingsSearchResults"\n      scroll-orientation'
    );
    expect(styles).not.toMatch(
      /\.SettingsSearchResultSectionIcon\s*\{[^}]*(?:border|border-radius):/s
    );
    expect(styles).toMatch(
      /\.SettingsSearchResultSectionRow\s*\{[^}]*opacity:\s*0\.95;/s
    );
    expect(styles).toMatch(
      /\.SettingsSearchResultTitleRow\s*\{[^}]*opacity:\s*0\.89;/s
    );
    expect(styles).toMatch(
      /\.SettingsSearchResultTitle\s*\{[^}]*font-size:\s*13px;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SettingsSearchEmpty\s*\{[^}]*padding:\s*4px 8px;[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*line-height:\s*18px;[^}]*opacity:\s*0\.58;/s
    );
  });
});
