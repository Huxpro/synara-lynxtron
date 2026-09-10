import { beforeEach, describe, expect, it } from '@rstest/core';
import { render, waitFor } from '@lynx-js/react/testing-library';

import {
  normalizeProjectLocalNameInput,
  ProjectRenameDialogLynx,
} from './ProjectRenameDialog.lynx';

const project = {
  id: 'project-a',
  kind: 'project' as const,
  title: 'Local alias',
  remoteName: 'Remote title',
  folderName: 'repo-folder',
  localName: 'Local alias',
  workspaceRoot: '/work/repo-folder',
  defaultModelSelection: null,
  scripts: [],
  spaceId: null,
};

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

describe('Native project rename dialog', () => {
  it('matches Electron copy and seeds the local alias', async () => {
    render(
      <ProjectRenameDialogLynx
        open
        project={project}
        onOpenChange={() => undefined}
        onSave={() => undefined}
      />
    );
    await waitFor(() =>
      expect(elementTree.root?.querySelector('.LxDialogTitle')?.textContent).toBe('Rename project')
    );
    expect(elementTree.root?.querySelector('.LxDialogDescription')?.textContent).toBe(
      'Keep it short and recognizable.'
    );
    expect(elementTree.root?.querySelector('.LxInput')?.getAttribute('value')).toBe('Local alias');
    expect(elementTree.root?.querySelector('.LxInput')?.getAttribute('placeholder')).toBe(
      'repo-folder'
    );
  });

  it('trims a saved alias and preserves empty as the clear-alias signal', () => {
    expect(normalizeProjectLocalNameInput('  New alias  ')).toBe('New alias');
    expect(normalizeProjectLocalNameInput('   ')).toBe('');
  });
});
