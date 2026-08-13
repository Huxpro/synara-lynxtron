import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Automations route', () => {
  it('uses canonical automation data and host-backed polling', () => {
    const pageSource = readFileSync(
      new URL('./AutomationsPage.lynx.tsx', import.meta.url),
      'utf8'
    );
    const queriesSource = readFileSync(
      new URL('./queries.ts', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain("queryKey: ['automations']");
    expect(pageSource).toContain('projectAutomationList({');
    expect(pageSource).toContain('useHostPolling(automations.refetch, 5_000)');
    expect(pageSource).toContain('void sleepOnHost(delayMs).then(');
    expect(pageSource).toContain('void pollRef.current().finally(schedule)');
    expect(pageSource).not.toContain('refetchInterval: 5_000');
    expect(queriesSource).toContain("'background only'");
    expect(queriesSource).toContain('fetchAutomationList()');
    expect(clientSource).toContain(
      "transportRequest<AutomationListResult>('automation.list', {})"
    );
  });

  it('routes the real page and sidebar entry', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );
    const sidebarSource = readFileSync(
      new URL('../components/sidebar/Sidebar.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(routerSource).toContain("pathname === '/automations'");
    expect(routerSource).toContain('<AutomationsPage');
    expect(sidebarSource).toContain(
      "automationsActive={activePath === '/automations'}"
    );
    expect(sidebarSource).toContain(
      "onOpenAutomations={() => navigate('/automations')}"
    );
  });
});
