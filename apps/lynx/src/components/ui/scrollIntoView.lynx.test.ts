import { beforeEach, describe, expect, it, rs } from '@rstest/core';

import { scrollLynxElementIntoViewById } from './scrollIntoView.lynx';

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

describe('scrollLynxElementIntoViewById', () => {
  it('invokes the native scrollIntoView method with start alignment', () => {
    expect(scrollLynxElementIntoViewById('setting-theme')).toBe(true);
    expect(select).toHaveBeenCalledWith('#setting-theme');
    expect(invoke).toHaveBeenCalledWith({
      method: 'scrollIntoView',
      params: {
        scrollIntoViewOptions: {
          block: 'start',
          inline: 'start',
        },
      },
    });
    expect(exec).toHaveBeenCalledOnce();
  });

  it('fails closed for empty ids or unavailable selector APIs', () => {
    expect(scrollLynxElementIntoViewById('')).toBe(false);
    Object.assign(lynx, {
      createSelectorQuery() {
        throw new Error('selector unavailable');
      },
    });
    expect(scrollLynxElementIntoViewById('setting-theme')).toBe(false);
  });

  it('supports nearest alignment for active picker rows', () => {
    expect(
      scrollLynxElementIntoViewById('composer-command-row-plan', 'nearest')
    ).toBe(true);
    expect(invoke).toHaveBeenLastCalledWith({
      method: 'scrollIntoView',
      params: {
        scrollIntoViewOptions: {
          block: 'nearest',
          inline: 'start',
        },
      },
    });
  });
});
