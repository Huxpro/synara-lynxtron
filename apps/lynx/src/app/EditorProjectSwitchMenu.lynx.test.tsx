import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';
import { useState } from '@lynx-js/react';
import { readFileSync } from 'node:fs';

import { EditorProjectSwitchMenu } from './EditorProjectSwitchMenu.lynx';

function ProjectSwitchHarness(props: { readonly empty?: boolean }) {
  const [open, setOpen] = useState(false);
  const onProjectIdChange = rs.fn();
  return (
    <EditorProjectSwitchMenu
      currentProjectId="project-a"
      groups={
        props.empty
          ? []
          : [
              {
                key: 'space-work',
                label: 'Work · Active',
                icon: 'home',
                items: [
                  {
                    id: 'project-a',
                    selected: true,
                    threadId: 'thread-a',
                    title: 'Editor Parity',
                    spaceId: null,
                  },
                ],
              },
            ]
      }
      open={open}
      query={props.empty ? 'missing' : ''}
      onOpenChange={setOpen}
      onProjectIdChange={onProjectIdChange}
      onQueryChange={() => undefined}
    />
  );
}

async function openMeasuredProjectSwitch() {
  const trigger = elementTree.root?.querySelector(
    '.ThreadEditorProjectSwitchTrigger'
  );
  if (!trigger) throw new Error('expected project switch trigger');
  const layoutEvent = new Event('bindEvent:layoutchange', { bubbles: true });
  Object.assign(layoutEvent, {
    detail: { height: 28, left: 318, top: 9, width: 28 },
  });
  fireEvent(trigger, layoutEvent);
  fireEvent.tap(trigger);
  await waitFor(() => {
    if (!elementTree.root?.querySelector('.LxMenuPopup')) {
      throw new Error('expected controlled project popup');
    }
  });
}

describe('Lynx Editor project switch menu', () => {
  it('renders a controlled open searchable group with a concrete list viewport', () => {
    render(<ProjectSwitchHarness />);
    return openMeasuredProjectSwitch().then(() => {

    expect(elementTree.root?.querySelector('.LxMenuPopup')).not.toBeNull();
    expect(
      elementTree.root
        ?.querySelector('.ThreadEditorProjectSwitchTrigger')
        ?.getAttribute('class')
    ).toContain('ThreadEditorProjectSwitchTrigger--open');
    expect(
      elementTree.root?.querySelector('.ThreadEditorProjectSwitchList')
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelector('.ThreadEditorProjectSwitchPopup')
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelector('.LxMenuItem.ui-focus')
    ).toBeNull();
    expect(
      elementTree.root?.querySelector('.ComposerProjectPickerGroupLabelTextLynx')
        ?.textContent
    ).toBe('Work · Active');
    const item = elementTree.root?.querySelector('.LxMenuItem');
    expect(item?.textContent).toContain('Editor Parity');
    expect(item?.getAttribute('aria-checked')).toBe('true');
    });
  });

  it('gives initial focus to search instead of highlighting the first project', () => {
    const source = readFileSync(
      new URL('./EditorProjectSwitchMenu.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain('autoHighlightFirst={false}');
    expect(source).toContain('.focus()');
    expect(source).toContain(
      '.then(() => input.setSelectionRange(0, props.query.length))'
    );
  });

  it('keeps the empty search result present after opening', () => {
    render(<ProjectSwitchHarness empty />);
    return openMeasuredProjectSwitch().then(() => {

    expect(
      elementTree.root?.querySelector('.ThreadEditorProjectSwitchList')
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelector('.ThreadEditorProjectSwitchEmpty')?.textContent
    ).toBe('No matching projects');
    });
  });
});
