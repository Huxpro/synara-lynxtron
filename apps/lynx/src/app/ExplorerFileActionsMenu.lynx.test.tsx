import { describe, expect, it } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { ExplorerFileActionsMenu } from './ExplorerPreviewHeader.lynx';

describe('Lynx Explorer file actions menu', () => {
  it('opens the shared anchored file menu used by preview and diff headers', async () => {
    render(
      <ExplorerFileActionsMenu
        includeCopyPath
        path="src/example.js"
        threadId="thread-one"
        triggerClassName="TestFileActionsTrigger"
      />
    );

    const trigger = elementTree.root?.querySelector('.TestFileActionsTrigger');
    expect(trigger?.getAttribute('aria-expanded')).toBe('false');
    fireEvent.tap(trigger!);

    await waitFor(() => {
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
      expect(
        elementTree.root?.querySelector('.ExplorerDockPreviewActionsPopup')
      ).not.toBeNull();
    });
    expect(
      [...(elementTree.root?.querySelectorAll('.LxMenuItem') ?? [])].map(
        (item) => item.textContent
      )
    ).toEqual([
      'Reference in chat',
      'Ask why this changed',
      'Copy path',
    ]);
  });

  it('uses the same end/bottom anchor and popup width on every file surface', () => {
    const source = readFileSync(
      new URL('./ExplorerPreviewHeader.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./explorer-dock.css', import.meta.url),
      'utf8'
    );
    const diffSource = readFileSync(
      new URL('./DiffDock.lynx.tsx', import.meta.url),
      'utf8'
    );
    const diffStyles = readFileSync(
      new URL(
        '../adapters/pull-request-code-composition-elements.css',
        import.meta.url
      ),
      'utf8'
    );

    expect(source).toContain('align="end"');
    expect(source).toContain('side="bottom"');
    expect(styles).toMatch(
      /\.ExplorerDockPreviewActionsPopup\s*\{[^}]*width:\s*208px;/s
    );
    expect(diffSource).toContain('<ExplorerFileActionsMenu');
    expect(diffSource).toContain('includeCopyPath');
    expect(diffSource).toContain(
      'popupClassName="DiffDockFileActionsMenu"'
    );
    expect(diffSource).toContain('showActionIcons');
    expect(diffStyles).toMatch(
      /\.DiffDockFileActionsMenu\s*\{[^}]*width:\s*240px;[^}]*min-width:\s*240px;[^}]*padding:\s*4px;/s
    );
    expect(diffStyles).toMatch(
      /\.DiffDockFileActionsMenu \.LxMenuItem\s*\{[^}]*min-height:\s*26px;[^}]*padding:\s*3px 8px;/s
    );
  });

  it('opens restored menus after the async file trigger mounts', async () => {
    render(
      <ExplorerFileActionsMenu
        defaultOpen
        includeCopyPath
        path="src/example.js"
        popupClassName="DiffDockFileActionsMenu"
        showActionIcons
        threadId="thread-one"
        triggerClassName="TestRestoredFileActionsTrigger"
      />
    );

    await waitFor(() => {
      const trigger = elementTree.root?.querySelector(
        '.TestRestoredFileActionsTrigger'
      );
      expect(trigger?.getAttribute('aria-expanded')).toBe('true');
      expect(
        elementTree.root?.querySelector(
          '.ExplorerDockPreviewActionsPopup.DiffDockFileActionsMenu'
        )
      ).not.toBeNull();
    });
  });
});
