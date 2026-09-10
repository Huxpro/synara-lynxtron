import { describe, expect, it } from '@rstest/core';

import {
  resolveLynxTerminalCellMetrics,
  resolveLynxTerminalGridSize,
} from './terminalGridSize.logic';

describe('resolveLynxTerminalGridSize', () => {
  it('maps the measured output viewport to the Native monospace grid', () => {
    expect(
      resolveLynxTerminalGridSize({ fontSizePx: 12, width: 764, height: 386 })
    ).toEqual({ cols: 100, rows: 20 });
  });

  it('clamps tiny and extreme layouts to the shared PTY contract', () => {
    expect(
      resolveLynxTerminalGridSize({ fontSizePx: 12, width: 60, height: 40 })
    ).toEqual({ cols: 20, rows: 5 });
    expect(
      resolveLynxTerminalGridSize({ fontSizePx: 1, width: 100_000, height: 100_000 })
    ).toEqual({ cols: 2000, rows: 1000 });
  });

  it('rejects unmeasured or invalid layouts', () => {
    expect(
      resolveLynxTerminalGridSize({ fontSizePx: 12, width: 0, height: 100 })
    ).toBeNull();
    expect(
      resolveLynxTerminalGridSize({ fontSizePx: Number.NaN, width: 748, height: 380 })
    ).toEqual({ cols: 117, rows: 23 });
  });

  it('uses the same normalized font size as the rendered terminal text', () => {
    expect(
      resolveLynxTerminalGridSize({ fontSizePx: 99, width: 748, height: 380 })
    ).toEqual({ cols: 53, rows: 10 });
    expect(resolveLynxTerminalCellMetrics(99)).toEqual({
      cellWidth: 13.2,
      lineHeight: 33,
    });
  });
});
