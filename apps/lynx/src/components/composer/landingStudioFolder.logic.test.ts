import { describe, expect, it } from '@rstest/core';

import { resolveLandingWorkspaceContext } from './landingStudioFolder.logic';

describe('resolveLandingWorkspaceContext', () => {
  it('uses a picked Studio folder without changing the container project', () => {
    expect(
      resolveLandingWorkspaceContext({
        containerKind: 'studio',
        projectWorkspaceRoot: '/Users/tester/Documents/Synara/Studio',
        studioFolderPath: '/Users/tester/Projects/demo',
      })
    ).toEqual({
      workspaceRoot: '/Users/tester/Projects/demo',
      worktreePath: '/Users/tester/Projects/demo',
    });
  });

  it('uses the Studio root when no folder is selected', () => {
    expect(
      resolveLandingWorkspaceContext({
        containerKind: 'studio',
        projectWorkspaceRoot: '/Users/tester/Documents/Synara/Studio',
        studioFolderPath: null,
      })
    ).toEqual({
      workspaceRoot: '/Users/tester/Documents/Synara/Studio',
      worktreePath: null,
    });
  });

  it('ignores Studio folder state for an ordinary chat project', () => {
    expect(
      resolveLandingWorkspaceContext({
        containerKind: 'chat',
        projectWorkspaceRoot: '/Users/tester/Projects/synara',
        studioFolderPath: '/Users/tester/Projects/other',
      })
    ).toEqual({
      workspaceRoot: '/Users/tester/Projects/synara',
      worktreePath: null,
    });
  });
});
