import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import type { NodesRef } from '@lynx-js/types';

import {
  focusLynxElementById,
  consumeProgrammaticLynxFocus,
  focusLynxElementBySelector,
  focusLynxNode,
} from './focus.lynx';

const select = rs.fn();
const invoke = rs.fn();
const exec = rs.fn();

beforeEach(() => {
  Object.assign(lynx, {
    createSelectorQuery() {
      return {
        select(selector: string) {
          select(selector);
          return this;
        },
        invoke(payload: unknown) {
          invoke(payload);
          return this;
        },
        exec() {
          exec();
        },
      };
    },
  });

  select.mockClear();
  invoke.mockClear();
  exec.mockClear();
});

describe('Lynx focus helpers', () => {
  it('marks id-based focus restoration as programmatic exactly once', () => {
    expect(focusLynxElementById('settings-search')).toBe(true);
    expect(consumeProgrammaticLynxFocus('settings-search')).toBe(true);
    expect(consumeProgrammaticLynxFocus('settings-search')).toBe(false);
  });

  it('focuses an existing node through the native setFocus command', () => {
    const nodeInvoke = rs.fn();
    const nodeExec = rs.fn();
    const node = {
      invoke(payload: unknown) {
        nodeInvoke(payload);
        return {
          exec() {
            nodeExec();
          },
        };
      },
    } as unknown as NodesRef;

    expect(focusLynxNode({ current: node })).toBe(true);
    expect(nodeInvoke).toHaveBeenCalledWith({
      method: 'setFocus',
      params: { focus: true },
    });
    expect(nodeExec).toHaveBeenCalledTimes(1);
  });

  it('returns false for a missing node or a failed native command', () => {
    expect(focusLynxNode({ current: null })).toBe(false);
    expect(
      focusLynxNode({
        current: {
          invoke() {
            throw new Error('setFocus unavailable');
          },
        } as unknown as NodesRef,
      })
    ).toBe(false);
  });

  it('focuses exact selectors and derives id selectors', () => {
    expect(focusLynxElementBySelector('.ComposerInput')).toBe(true);
    expect(select).toHaveBeenLastCalledWith('.ComposerInput');
    expect(invoke).toHaveBeenLastCalledWith({
      method: 'setFocus',
      params: { focus: true },
    });
    expect(exec).toHaveBeenCalledTimes(1);

    expect(focusLynxElementById('settings-search')).toBe(true);
    expect(select).toHaveBeenLastCalledWith('#settings-search');
    expect(exec).toHaveBeenCalledTimes(2);
  });

  it('rejects blank selectors without issuing a query', () => {
    expect(focusLynxElementBySelector('   ')).toBe(false);
    expect(focusLynxElementById('')).toBe(false);
    expect(select).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
    expect(exec).not.toHaveBeenCalled();
  });
});
