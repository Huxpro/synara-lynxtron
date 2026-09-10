import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Native sidebar snapshot ownership', () => {
  it('uses a dedicated query observer instead of colliding with route consumers', () => {
    const source = readFileSync(new URL('./Sidebar.lynx.tsx', import.meta.url), 'utf8');
    const router = readFileSync(new URL('../../app/router.tsx', import.meta.url), 'utf8');

    expect(source).toContain("queryKey: ['sidebar-snapshot', 'navigation']");
    expect(router).toContain("queryKey: ['sidebar-snapshot']");
    expect(source).toContain('queryFn: fetchSidebarSnapshot');
  });
});
