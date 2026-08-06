import { fireEvent, render } from '@lynx-js/react/testing-library';
import { describe, expect, it, rs } from '@rstest/core';
import { readFileSync } from 'node:fs';

import {
  SidebarListSectionHeaderAddProjectElement,
  SidebarListSectionHeaderContainerElement,
  SidebarListSectionHeaderSortElement,
  SidebarListSectionHeaderToolbarElement,
} from './SidebarListSectionHeaderElements.lynx';

describe('sidebar list section header actions', () => {
  it('publishes a real accessible Add project action', () => {
    const onActivate = rs.fn();
    render(
      <SidebarListSectionHeaderContainerElement>
        <SidebarListSectionHeaderToolbarElement>
          <SidebarListSectionHeaderAddProjectElement
            onActivate={onActivate}
          />
        </SidebarListSectionHeaderToolbarElement>
      </SidebarListSectionHeaderContainerElement>
    );

    const header = elementTree.root?.querySelector(
      '.SharedSidebarListSectionHeader'
    );
    const action = elementTree.root?.querySelector(
      '.SharedSidebarListSectionHeaderAction'
    );
    if (!header || !action) throw new Error('expected header Add project action');

    expect(action.getAttribute('accessibility-label')).toBe('Add project');
    fireEvent(header, new Event('bindEvent:mouseenter', { bubbles: true }));
    expect(header.getAttribute('class')).toContain('ui-hover');
    fireEvent.focus(action);
    expect(action.getAttribute('class')).toContain('ui-focus');
    fireEvent.tap(action);
    expect(onActivate).toHaveBeenCalledTimes(1);
  });

  it('matches the Web icon action and reveal anatomy', () => {
    const styles = readFileSync(
      new URL('./sidebar-list-section-header-elements.css', import.meta.url),
      'utf8'
    );
    const sidebarSource = readFileSync(
      new URL('../components/sidebar/Sidebar.lynx.tsx', import.meta.url),
      'utf8'
    );
    const paletteSource = readFileSync(
      new URL(
        '../components/sidebar/SidebarSearchPalette.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedSidebarListSectionHeaderAction\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*6px;[^}]*opacity:\s*0;[^}]*pointer-events:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SharedSidebarListSectionHeader\.ui-hover\s*\.SharedSidebarListSectionHeaderAction,\s*\.SharedSidebarListSectionHeaderAction\.ui-focus\s*\{[^}]*opacity:\s*1;[^}]*pointer-events:\s*auto;/s
    );
    expect(styles).toMatch(
      /\.SharedSidebarListSectionHeaderActionIcon\s*\{[^}]*position:\s*absolute;[^}]*top:\s*3px;[^}]*left:\s*3px;[^}]*width:\s*14px;[^}]*height:\s*14px;/s
    );
    expect(styles).toMatch(
      /\.SharedSidebarListSectionHeaderActionIcon--foreground\s*\{[^}]*opacity:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SharedSidebarListSectionHeaderAction\.ui-hover\s*\.SharedSidebarListSectionHeaderActionIcon--foreground,\s*\.SharedSidebarListSectionHeaderAction\.ui-focus\s*\.SharedSidebarListSectionHeaderActionIcon--foreground,\s*\.SharedSidebarListSectionHeaderAction\.ui-pressed\s*\.SharedSidebarListSectionHeaderActionIcon--foreground\s*\{[^}]*opacity:\s*1;/s
    );
    expect(sidebarSource).toContain(
      'elementId={ADD_PROJECT_TRIGGER_ELEMENT_ID}'
    );
    expect(
      readFileSync(
        new URL('./SidebarListSectionHeaderElements.lynx.tsx', import.meta.url),
        'utf8'
      )
    ).toContain('SharedSidebarListSectionHeader LynxWebHoverOwner');
    expect(sidebarSource).toContain(
      "openSearchPalette('~/', ADD_PROJECT_TRIGGER_ELEMENT_ID)"
    );
    expect(sidebarSource).toContain(
      'const [searchInitialQuery, setSearchInitialQuery] = useState(\'\')'
    );
    expect(sidebarSource).toContain('key={searchPaletteKey}');
    expect(sidebarSource).toContain('initialQuery={searchInitialQuery}');
    expect(sidebarSource).toContain(
      'focusLynxElementById(searchReturnFocusElementId)'
    );
    expect(paletteSource).toContain('initialQuery={props.initialQuery}');
  });

  it('publishes project and thread sort radio groups', () => {
    const onProjectSortOrderChange = rs.fn();
    const onThreadSortOrderChange = rs.fn();
    render(
      <SidebarListSectionHeaderSortElement
        projectSortOrder="manual"
        threadSortOrder="updated_at"
        onProjectSortOrderChange={onProjectSortOrderChange}
        onThreadSortOrderChange={onThreadSortOrderChange}
      />
    );

    const trigger = elementTree.root?.querySelector('.LxMenuTrigger');
    if (!trigger) throw new Error('expected project sort trigger');
    expect(trigger.getAttribute('aria-label')).toBe('Sort projects');
    fireEvent.tap(trigger);

    const items = elementTree.root?.querySelectorAll('.LxMenuItem') ?? [];
    expect(items).toHaveLength(5);
    expect(elementTree.root?.textContent).toContain('Sort projects');
    expect(elementTree.root?.textContent).toContain('Sort threads');
    expect(elementTree.root?.textContent).toContain('Date added');
    expect(elementTree.root?.textContent).toContain('Date created');
  });

  it('persists sort choices through the canonical app-settings projection', () => {
    const sidebarSource = readFileSync(
      new URL('../components/sidebar/Sidebar.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(sidebarSource).toContain('readSettingsGeneralProjection(');
    expect(sidebarSource).toContain('writeSidebarSortProjection(');
    expect(sidebarSource).toContain(
      'setPersistedStorageItem(\n            APP_SETTINGS_STORAGE_KEY'
    );
    expect(sidebarSource).toContain('projectSortOrder,');
    expect(sidebarSource).toContain('threadSortOrder,');
  });
});
