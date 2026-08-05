import { describe, expect, it } from '@rstest/core';

import { ArchiveIcon, PaletteIcon } from '../lib/icons.lynx';
import {
  settingsIconForName,
  settingsIconForSection,
} from './SettingsIcon.lynx';

describe('Lynx Settings icon identity', () => {
  it('resolves navigation names and search sections through one registry', () => {
    expect(settingsIconForName('archive')).toBe(ArchiveIcon);
    expect(settingsIconForSection('archived')).toBe(ArchiveIcon);
    expect(settingsIconForName('color-palette')).toBe(PaletteIcon);
    expect(settingsIconForSection('appearance')).toBe(PaletteIcon);
  });

  it('fails closed for an unknown navigation icon', () => {
    expect(settingsIconForName('missing')).toBeUndefined();
  });
});
