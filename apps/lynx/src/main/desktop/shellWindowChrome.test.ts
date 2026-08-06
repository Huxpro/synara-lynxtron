import { describe, expect, it } from '@rstest/core';
import { getMacTrafficLightPosition } from '@synara/shared/desktopChrome';

import { resolveShellWindowChrome } from './shellWindowChrome';

describe('shell window chrome', () => {
  it('embeds the macOS traffic lights in the shared top chrome', () => {
    expect(resolveShellWindowChrome('darwin')).toEqual({
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: getMacTrafficLightPosition(),
    });
  });

  it('uses renderer-owned window chrome on Windows', () => {
    expect(resolveShellWindowChrome('win32')).toEqual({ frame: false });
  });

  it('keeps the native frame on Linux', () => {
    expect(resolveShellWindowChrome('linux')).toEqual({});
  });
});
