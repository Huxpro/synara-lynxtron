import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';

import { SpaceProjectPickerDialogLynx } from './SpaceProjectPickerDialog.lynx';

const targetSpace = {
  id: 'space-target' as never,
  name: 'Focus',
  icon: 'target' as const,
};
const spaces = [
  targetSpace,
  { id: 'space-other' as never, name: 'Work', icon: 'bag' as const },
];
const projects = [
  {
    id: 'project-a',
    kind: 'project' as const,
    title: 'Alpha',
    workspaceRoot: '/work/alpha',
    defaultModelSelection: null,
    scripts: [],
    spaceId: null,
  },
  {
    id: 'project-b',
    kind: 'project' as const,
    title: 'Beta',
    workspaceRoot: '/work/beta',
    defaultModelSelection: null,
    scripts: [],
    spaceId: 'space-other' as never,
  },
  {
    id: 'project-target',
    kind: 'project' as const,
    title: 'Already there',
    workspaceRoot: '/work/there',
    defaultModelSelection: null,
    scripts: [],
    spaceId: 'space-target' as never,
  },
  {
    id: 'chat-container',
    kind: 'chat' as const,
    title: 'Chats',
    workspaceRoot: '/work/chats',
    defaultModelSelection: null,
    scripts: [],
    spaceId: null,
  },
];

beforeEach(() => {
  Object.assign(lynx, {
    requestAnimationFrame(callback: () => void) {
      callback();
      return 0;
    },
    createSelectorQuery() {
      return {
        select() { return this; },
        invoke() { return this; },
        exec() {},
      };
    },
  });
});

describe('Native Space project picker', () => {
  it('shows grouped movable ordinary projects and submits selected IDs', async () => {
    const onSubmit = rs.fn().mockResolvedValue([]);
    const onOpenChange = rs.fn();
    render(
      <SpaceProjectPickerDialogLynx
        activeSpaceId={null}
        open
        projects={projects}
        spaces={spaces}
        targetSpace={targetSpace}
        onOpenChange={onOpenChange}
        onSubmit={onSubmit}
      />
    );
    await waitFor(() =>
      expect(elementTree.root?.querySelectorAll('.AppSidebarSpaceProjectRow')).toHaveLength(2)
    );
    expect(elementTree.root?.querySelector('.AppSidebarSpaceProjectPickerDialog')).toBeTruthy();
    expect(
      [...(elementTree.root?.querySelectorAll('.AppSidebarSpaceProjectGroupLabelText') ?? [])].map(
        (element) => element.textContent
      )
    ).toEqual(['Void · Active', 'Work']);

    const rows = [...(elementTree.root?.querySelectorAll('.AppSidebarSpaceProjectRow') ?? [])];
    fireEvent.tap(rows[0]!);
    fireEvent.tap(rows[1]!);
    const buttons = [...(elementTree.root?.querySelectorAll('.LxButton') ?? [])];
    const submit = buttons[buttons.length - 1];
    expect(submit?.textContent).toBe('Move 2 projects');
    fireEvent.tap(submit!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(['project-a', 'project-b']));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps only failed projects selected for retry', async () => {
    const onSubmit = rs.fn().mockResolvedValue(['project-b']);
    render(
      <SpaceProjectPickerDialogLynx
        activeSpaceId={null}
        open
        projects={projects}
        spaces={spaces}
        targetSpace={targetSpace}
        onOpenChange={() => undefined}
        onSubmit={onSubmit}
      />
    );
    await waitFor(() =>
      expect(elementTree.root?.querySelectorAll('.AppSidebarSpaceProjectRow')).toHaveLength(2)
    );
    const rows = [...(elementTree.root?.querySelectorAll('.AppSidebarSpaceProjectRow') ?? [])];
    rows.forEach((row) => fireEvent.tap(row));
    const buttons = [...(elementTree.root?.querySelectorAll('.LxButton') ?? [])];
    fireEvent.tap(buttons[buttons.length - 1]!);
    await waitFor(() =>
      expect(elementTree.root?.querySelector('.AppSidebarSpaceProjectError')?.textContent).toContain(
        '1 could not be moved'
      )
    );
    expect(elementTree.root?.querySelectorAll('.AppSidebarSpaceProjectRow--selected')).toHaveLength(1);
  });
});
