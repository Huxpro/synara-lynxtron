import { describe, expect, it, rs } from '@rstest/core';

import { buildLynxSidebarSearchActions } from './sidebarSearchSpaceActions.logic';

describe('Native sidebar search Space actions', () => {
  it('reuses the Electron desktop shortcut labels', () => {
    const actions = buildLynxSidebarSearchActions(() => undefined);
    expect(
      Object.fromEntries(
        actions.map((action) => [action.id, action.shortcutLabel ?? null])
      )
    ).toMatchObject({
      'new-chat': '⌥⌘N',
      'new-thread': '⌘N',
      'add-project': '⇧⌘O',
      'import-thread': '⌘I',
      feedback: null,
      'usage-settings': '⇧⌘U',
      'new-space': null,
    });
  });

  it('keeps the shared Feedback Synara action available in Native', () => {
    expect(
      buildLynxSidebarSearchActions(() => undefined).find(
        (candidate) => candidate.id === 'feedback'
      )?.label
    ).toBe('Feedback Synara');
  });

  it('keeps New space executable even before the first Space exists', () => {
    const onCreateSpace = rs.fn();
    const action = buildLynxSidebarSearchActions(onCreateSpace).find(
      (candidate) => candidate.id === 'new-space'
    );
    expect(action?.label).toBe('New space');
    action?.run?.();
    expect(onCreateSpace).toHaveBeenCalledTimes(1);
  });
});
