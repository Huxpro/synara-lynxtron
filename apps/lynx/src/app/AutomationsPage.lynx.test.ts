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
    expect(pageSource).toContain('void sleepOnHost(delayMs)\n        .then(');
    expect(pageSource).toContain(
      'await pollRef.current().catch(() => undefined)'
    );
    expect(pageSource).not.toContain('pollRef.current().finally(schedule)');
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

  it('stacks automation detail panes at compact widths', () => {
    const detailStyles = readFileSync(
      new URL('./automations-page.css', import.meta.url),
      'utf8'
    );

    expect(detailStyles).toContain(
      '.SliceRoot--viewport-compact .AutomationDetailPage'
    );
    expect(detailStyles).toContain('flex-direction: column;');
    expect(detailStyles).toContain(
      '.SliceRoot--viewport-compact .AutomationDetailMain'
    );
    expect(detailStyles).toContain('flex: 0 0 200px;');
    expect(detailStyles).toContain(
      '.SliceRoot--viewport-compact .AutomationDetailAside'
    );
    expect(detailStyles).toContain('min-width: 0;');
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
    const queriesSource = readFileSync(
      new URL('./queries.ts', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./automations-page.css', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain('mutationFn: createAutomation');
    expect(pageSource).toContain('<AutomationCreateDialog');
    expect(pageSource).toContain('threads={sidebar.data?.threads ?? []}');
    expect(pageSource).toContain(
      'navigate(`/automations/${encodeURIComponent(definition.id)}`)'
    );
    expect(dialogSource).toContain('buildAutomationCreateInput({');
    expect(createLogicSource).toContain(
      "export type CreateSchedule = 'daily' | 'manual' | 'weekdays'"
    );
    expect(createLogicSource).toContain("input.schedule === 'manual'");
    expect(createLogicSource).toContain(
      '{ type: input.schedule, timeOfDay: input.timeOfDay }'
    );
    expect(dialogSource).toContain('<NativeTimeInput');
    expect(dialogSource).toContain("'default-value': '09:00'");
    expect(dialogSource).not.toContain("defaultValue: '09:00'");
    expect(dialogSource).toContain(
      "/^(?:[01]\\d|2[0-3]):[0-5]\\d$/u.test(timeOfDay)"
    );
    expect(createLogicSource).toContain(
      'export type CreateWorktreeMode = AutomationWorktreeMode'
    );
    expect(dialogSource).toContain('label="Local"');
    expect(dialogSource).toContain("setWorktreeMode('local')");
    expect(dialogSource).toContain("'Local checkout'");
    expect(createLogicSource).toContain('worktreeMode: input.worktreeMode');
    expect(createLogicSource).toContain('maxIterations: input.maxIterations');
    expect(createLogicSource).toContain('stopOnError: input.stopOnError');
    expect(createLogicSource).toContain(
      'interactionMode: input.interactionMode'
    );
    expect(dialogSource).toContain('Max iterations');
    expect(dialogSource).toContain('Stop on error');
    expect(dialogSource).toContain('Interaction mode');
    expect(dialogSource).toContain('Permissions');
    expect(dialogSource).toContain('label="Standalone"');
    expect(dialogSource).toContain('label="Heartbeat"');
    expect(dialogSource).toContain('Target thread');
    expect(dialogSource).toContain('Stop when');
    expect(dialogSource).toContain(
      '<DialogPanel className="AutomationCreatePanel">'
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog\s*\{[^}]*height:\s*calc\(100vh - 32px\);[^}]*max-height:\s*680px;/s
    );
    expect(styles).toMatch(
      /\.AutomationCreatePanel\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-medium \.AutomationCreatePanel,[^{]*\{[^}]*gap:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-medium \.AutomationCreatePrompt,[^{]*\{[^}]*height:\s*56px;[^}]*min-height:\s*56px;/s
    );
    expect(dialogSource).toContain('Heartbeat stop condition');
    expect(dialogSource).toContain('completionPolicyFromStopWhen(stopWhen)');
    expect(dialogSource).toContain('No threads in this project');
    expect(dialogSource).toContain(
      "mode === 'standalone' || targetThreadId.length > 0"
    );
    expect(dialogSource).toContain(
      'thread.id === targetThreadId && thread.projectId === projectId'
    );
    expect(dialogSource).toContain('label="Approval required"');
    expect(dialogSource).toContain('label="Full access"');
    expect(dialogSource).toContain('await dialogs.confirm(');
    expect(dialogSource).toContain(
      'Scheduled full-access runs can make changes without per-step approval.'
    );
    expect(createLogicSource).toContain('runtimeMode: input.runtimeMode');
    expect(createLogicSource).toContain(
      "input.mode === 'heartbeat' ? input.targetThreadId : null"
    );
    expect(createLogicSource).toContain(
      "input.mode === 'heartbeat'"
    );
    expect(createLogicSource).toContain('input.completionPolicy');
    expect(createLogicSource).toContain(
      "input.runtimeMode === 'full-access' ? ['full-access' as const] : []"
    );
    expect(dialogSource).toContain('resolveAutomationModelSelection({');
    expect(dialogSource).toContain(
      'resolveAutomationModelSelectionForProjectChange({'
    );
    expect(dialogSource).toContain(
      'defaultProvider: generalSettings.defaultProvider'
    );
    expect(dialogSource).toContain('<ComposerModelControl');
    expect(dialogSource).toContain('fetchAutomationCreateServerConfig');
    expect(dialogSource).toContain('fetchAutomationCreateModels');
    expect(queriesSource).toContain(
      'export async function fetchAutomationCreateServerConfig()'
    );
    expect(queriesSource).toContain(
      'export async function fetchAutomationCreateModels('
    );
    expect(dialogSource).toContain('enabled: open');
    expect(dialogSource).toContain('runtimeModels={modelCatalog.data?.models ?? []}');
    expect(dialogSource.indexOf('const generalSettings')).toBeGreaterThan(
      dialogSource.indexOf('export function AutomationCreateDialog')
    );
    expect(dialogSource).toContain('Boolean(project)');
    expect(dialogSource).toContain('Create automation');
    expect(dialogSource).not.toContain("model: 'gpt-");
  });

  it('edits automation name and prompt through the canonical update mutation', () => {
    const pageSource = readFileSync(
      new URL('./AutomationsPage.lynx.tsx', import.meta.url),
      'utf8'
    );
    const detailSource = readFileSync(
      new URL('./AutomationDetailPage.lynx.tsx', import.meta.url),
      'utf8'
    );
    const editSource = readFileSync(
      new URL('./AutomationEditDialog.lynx.tsx', import.meta.url),
      'utf8'
    );
    const editLogicSource = readFileSync(
      new URL('./automationEdit.logic.ts', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain('onEdit={(input) =>');
    expect(pageSource).toContain('updateMutation.mutate(input, {');
    expect(detailSource).toContain('<AutomationEditDialog');
    expect(detailSource).toContain('onEditOpenChange(true)');
    expect(editSource).toContain('<DialogTitle>Edit automation</DialogTitle>');
    expect(editSource).toContain('buildAutomationEditInput({');
    expect(editSource).toContain('default-value={definition.prompt}');
    expect(editSource).toContain('automationEditStopWhen(definition)');
    expect(editSource).toContain("definition.mode === 'heartbeat'");
    expect(editSource).toContain('accessibleLabel="Heartbeat stop condition"');
    expect(editSource).toContain('<AutomationChoiceOption');
    expect(editSource).toContain("[10, '10 runs']");
    expect(editLogicSource).toContain(
      'completionPolicyFromStopWhen(stopWhen)'
    );
    expect(editSource).not.toContain('sleepOnHost(0)');
  });
});
