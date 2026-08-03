import { describe, expect, it } from '@rstest/core';

import {
  buildNativeSearchImportThreadCreateCommand,
  buildNativeSearchProjectCreateCommand,
} from './sidebarSearchActions.logic';

describe('Native sidebar search actions', () => {
  it('builds a canonical project create command from an absolute path', () => {
    const command = buildNativeSearchProjectCreateCommand({
      workspaceRoot: '/tmp/example-project/',
      createIfMissing: true,
    });

    expect(command).toMatchObject({
      type: 'project.create',
      title: 'example-project',
      workspaceRoot: '/tmp/example-project/',
      createWorkspaceRootIfMissing: true,
      defaultModelSelection: { provider: 'codex' },
      spaceId: null,
    });
  });

  it('builds provider-specific imported thread identity', () => {
    const command = buildNativeSearchImportThreadCreateCommand({
      projectId: 'project-a',
      provider: 'claudeAgent',
      model: 'claude-sonnet',
      externalId: 'session-1234567890',
    });

    expect(command).toMatchObject({
      type: 'thread.create',
      projectId: 'project-a',
      title: 'Imported Claude session 34567890',
      modelSelection: {
        provider: 'claudeAgent',
        model: 'claude-sonnet',
      },
      envMode: 'local',
      interactionMode: 'default',
      runtimeMode: 'full-access',
    });
  });
});
