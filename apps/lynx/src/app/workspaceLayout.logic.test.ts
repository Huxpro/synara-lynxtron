import { describe, expect, it } from '@rstest/core';

import { workspaceTerminalIdsForPreset } from './workspaceLayout.logic';

describe('workspaceTerminalIdsForPreset', () => {
  it.each([
    ['single', ['default']],
    ['two-columns', ['default', 'workspace-2']],
    ['two-rows', ['default', 'workspace-2']],
    ['top-main', ['default', 'workspace-2', 'workspace-3']],
    ['left-main', ['default', 'workspace-2', 'workspace-3']],
    ['quad', ['default', 'workspace-2', 'workspace-3', 'workspace-4']],
  ] as const)('maps %s to stable terminal identities', (presetId, expected) => {
    expect(workspaceTerminalIdsForPreset(presetId)).toEqual(expected);
  });
});
