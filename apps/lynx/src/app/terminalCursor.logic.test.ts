import { describe, expect, it } from '@rstest/core';

import { resolveLynxTerminalCursorGeometry } from './terminalCursor.logic';

describe('resolveLynxTerminalCursorGeometry', () => {
  it('uses the configured inactive bar over a TUI cursor override', () => {
    expect(
      resolveLynxTerminalCursorGeometry({
        active: false,
        cursor: {
          blink: false,
          cellWidth: 1,
          column: 3,
          row: 2,
          style: 'block',
          text: 'X',
          visible: true,
        },
        fontSizePx: 12,
      })
    ).toEqual({
      blink: false,
      renderText: false,
      cursorStyle: {
        height: '18px',
        left: '21.6px',
        top: '36px',
        width: '1px',
      },
      inputProxyStyle: {
        height: '18px',
        left: '21.6px',
        top: '36px',
        width: '7.2px',
      },
      screenMinHeight: '54px',
    });
  });

  it('uses the active underline style after appearance normalization', () => {
    expect(
      resolveLynxTerminalCursorGeometry({
        active: true,
        cursor: {
          blink: true,
          cellWidth: 1,
          column: 1,
          row: 1,
          style: 'underline',
          text: ' ',
          visible: true,
        },
        fontSizePx: 99,
      })
    ).toEqual({
      blink: true,
      renderText: false,
      cursorStyle: {
        height: '1px',
        left: '13.2px',
        top: '65px',
        width: '13.2px',
      },
      inputProxyStyle: {
        height: '33px',
        left: '13.2px',
        top: '33px',
        width: '13.2px',
      },
      screenMinHeight: '66px',
    });
  });

  it('uses the active block style and full cell width', () => {
    expect(
      resolveLynxTerminalCursorGeometry({
        active: true,
        cursor: {
          blink: false,
          cellWidth: 2,
          column: 2,
          row: 0,
          style: 'block',
          text: '你',
          visible: true,
        },
        fontSizePx: 12,
      })
    ).toEqual({
      blink: false,
      renderText: true,
      cursorStyle: {
        height: '18px',
        left: '14.4px',
        top: '0px',
        width: '14.4px',
      },
      inputProxyStyle: {
        height: '18px',
        left: '14.4px',
        top: '0px',
        width: '14.4px',
      },
      screenMinHeight: '18px',
    });
  });
});
