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
    expect(routerSource).toContain("pathname: '/automations/$automationId'");
    expect(routerSource).toContain('automationId={route.params.automationId}');
    expect(sidebarSource).toContain(
      "automationsActive={activePath.startsWith('/automations')}"
    );
    expect(sidebarSource).toContain(
      "onOpenAutomations={() => navigate('/automations')}"
    );
  });

  it('opens list rows into the read-only detail surface', () => {
    const pageSource = readFileSync(
      new URL('./AutomationsPage.lynx.tsx', import.meta.url),
      'utf8'
    );
    const detailSource = readFileSync(
      new URL('./AutomationDetailPage.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain(
      'navigate(`/automations/${encodeURIComponent(id)}`)'
    );
    expect(pageSource).toContain('<AutomationDetailPage');
    expect(detailSource).toContain('projectAutomationDetail({');
    expect(detailSource).toContain('Automation not found.');
    expect(detailSource).toContain('AutomationDetailNotFoundHeader');
    expect(detailSource).toContain('Back to automations');
    expect(detailSource).toContain('Previous runs');
    expect(detailSource).toContain('No runs yet.');
    expect(detailSource).toContain("'Pause' : 'Resume'");
    expect(pageSource).toContain('mutationFn: updateAutomation');
    expect(pageSource).toContain('mutationFn: deleteAutomation');
    expect(pageSource).toContain(
      "invalidateQueries({ queryKey: ['automations'] })"
    );
    expect(detailSource).toContain("'background only'");
    expect(detailSource).toContain('return dialogs.confirm(');
    expect(detailSource).toContain('confirmAutomationDelete(definition.name)');
    expect(detailSource).toContain('if (confirmed) onDelete(definition)');
    expect(pageSource).toContain("navigate('/automations')");
    expect(detailSource).not.toContain('automation.update');
    expect(detailSource).not.toContain('automation.delete');
    expect(detailSource).not.toContain('automation.runNow');
  });

  it('creates a canonical daily automation from the real dialog', () => {
    const pageSource = readFileSync(
      new URL('./AutomationsPage.lynx.tsx', import.meta.url),
      'utf8'
    );
    const dialogSource = readFileSync(
      new URL('./AutomationCreateDialog.lynx.tsx', import.meta.url),
      'utf8'
    );
    const createLogicSource = readFileSync(
      new URL('./automationCreate.logic.ts', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain('mutationFn: createAutomation');
    expect(pageSource).toContain('<AutomationCreateDialog');
    expect(pageSource).toContain(
      'navigate(`/automations/${encodeURIComponent(definition.id)}`)'
    );
    expect(dialogSource).toContain('buildAutomationCreateInput({');
    expect(createLogicSource).toContain(
      "export type CreateSchedule = 'daily' | 'manual' | 'weekdays'"
    );
    expect(createLogicSource).toContain("input.schedule === 'manual'");
    expect(createLogicSource).toContain(
      "{ type: input.schedule, timeOfDay: '09:00' }"
    );
    expect(createLogicSource).toContain(
      "type CreateWorktreeMode = 'auto' | 'worktree'"
    );
    expect(createLogicSource).toContain('worktreeMode: input.worktreeMode');
    expect(createLogicSource).toContain("runtimeMode: 'approval-required'");
    expect(dialogSource).toContain('project?.defaultModelSelection ?? null');
    expect(dialogSource).toContain('Create automation');
    expect(dialogSource).not.toContain("model: 'gpt-");
  });
});
