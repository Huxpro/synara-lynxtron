import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Sidebar thread metadata icon fidelity', () => {
  it('uses canonical fork, handoff, worktree, and automation assets', () => {
    const source = readFileSync(
      new URL('./Sidebar.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./sidebar.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "import forkSvg from '@synara-central-icons/fork.svg?raw';"
    );
    expect(source).toContain(
      "import worktreeSvg from '@synara-central-icons/arrow-split-right.svg?raw';"
    );
    expect(source).toContain('<GitBranchIcon size={12} />');
    expect(source).toContain('<ClockIcon size={12} />');
    expect(source).not.toMatch(/[⑂⇢◇◷]/);
    expect(styles).toMatch(
      /\.AppSidebarThreadMeta\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;[^}]*display:\s*flex;/s
    );
  });
});
