import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx sidebar hover parity', () => {
  it('reveals real project and thread actions without activating the row', () => {
    const source = readFileSync(
      new URL('./Sidebar.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./sidebar.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain('lynxNestedInteractiveEventProps');
    expect(source).toContain("void performThreadAction(thread, '', 'toggle-pin')");
    expect(source).toContain("void performThreadAction(thread, '', 'archive')");
    expect(source).toContain("type: 'project.meta.update'");
    expect(source).toContain("navigate('/pull-requests')");
    expect(source).toContain('`/new-thread/${encodeURIComponent(group.id)}`');
    expect(styles).toMatch(
      /\.AppSidebarProjectHeader\.ui-hover \.AppSidebarRowHoverActions,[\s\S]*?opacity:\s*1;[\s\S]*?pointer-events:\s*auto;/s
    );
    expect(styles).toMatch(
      /\.AppSidebarProjectHeader\.ui-hover \.SharedSidebarProjectSummaryCopy,[\s\S]*?padding-right:\s*76px;/s
    );
  });

  it('renders the thread preview as a fixed overlay outside sidebar clipping', () => {
    const source = readFileSync(
      new URL('./Sidebar.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./sidebar.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain('getRectByRef(rowRef, true)');
    expect(source).toContain('className="AppSidebarRowHoverCard"');
    expect(styles).toMatch(
      /\.AppSidebarRowHoverCard\s*\{[^}]*position:\s*fixed;[^}]*width:\s*256px;/s
    );
  });
});
