import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Native Git right-dock pane', () => {
  it('uses canonical staged and unstaged RPCs plus the portable diff renderer', () => {
    const source = readFileSync(new URL('./GitDockPane.lynx.tsx', import.meta.url), 'utf8');
    const client = readFileSync(new URL('../data/synaraClient.lynx.ts', import.meta.url), 'utf8');
    expect(source).toContain("fetchWorkingTreeDiff(props.workspaceRoot, 'staged')");
    expect(source).toContain("fetchWorkingTreeDiff(props.workspaceRoot, 'unstaged')");
    expect(source).toContain('buildPullRequestCodeView');
    expect(source).toContain('<PullRequestCodeComposition');
    expect(source).toContain('stageGitFiles(props.workspaceRoot, input.paths)');
    expect(source).toContain('unstageGitFiles(props.workspaceRoot, input.paths)');
    expect(source).toContain('fallbackSection');
    expect(source).toContain("selectedResolved?.section === 'staged'");
    expect(source).toContain("selectedResolved?.section === 'unstaged'");
    expect(client).toContain("transportRequest('git.stageFiles'");
    expect(client).toContain("transportRequest('git.unstageFiles'");
  });

  it('is wired as a singleton shared right-dock pane', () => {
    const router = readFileSync(new URL('./router.tsx', import.meta.url), 'utf8');
    expect(router).toContain("activePane?.kind === 'git'");
    expect(router).toContain("'diff', 'explorer', 'terminal', 'sidechat', 'git'");
    expect(router).toContain('<GitDockPane');
  });
});
