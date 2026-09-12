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
    expect(detailStyles).toContain('flex: 0 0 246px;');
    expect(detailStyles).toContain(
      '.SliceRoot--viewport-compact .AutomationDetailAside'
    );
    expect(detailStyles).toContain('min-width: 0;');
  });

  it('keeps the compact detail breadcrumb below desktop titlebar controls', () => {
    const detailStyles = readFileSync(
      new URL('./automations-page.css', import.meta.url),
      'utf8'
    );

    expect(detailStyles).toMatch(
      /\.SliceRoot--viewport-compact \.AutomationDetailHeader\s*\{[^}]*height:\s*92px;[^}]*min-height:\s*92px;[^}]*padding:\s*46px 20px 0;/s
    );
  });

  it('keeps the compact not-found title below desktop titlebar controls', () => {
    const detailStyles = readFileSync(
      new URL('./automations-page.css', import.meta.url),
      'utf8'
    );

    expect(detailStyles).toMatch(
      /\.SliceRoot--viewport-compact \.AutomationDetailNotFoundHeader\s*\{[^}]*height:\s*92px;[^}]*min-height:\s*92px;[^}]*padding:\s*46px 20px 0;/s
    );
  });

  it('keeps medium detail headers outside closed desktop titlebar controls', () => {
    const detailStyles = readFileSync(
      new URL('./automations-page.css', import.meta.url),
      'utf8'
    );

    expect(detailStyles).toMatch(
      /\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.AutomationDetailHeader,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.AutomationDetailNotFoundHeader\s*\{[^}]*padding-left:\s*180px;/s
    );
  });

  it('keeps compact detail actions reachable at short heights', () => {
    const detailStyles = readFileSync(
      new URL('./automations-page.css', import.meta.url),
      'utf8'
    );

    expect(detailStyles).toMatch(
      /\.SliceRoot--viewport-short-height\.SliceRoot--viewport-compact\s+\.AutomationDetailMain\s*\{[^}]*flex:\s*0 0 120px;[^}]*height:\s*120px;/s
    );
  });

  it('keeps compact list actions outside desktop titlebar controls', () => {
    const pageSource = readFileSync(
      new URL('./AutomationsPage.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./automations-page.css', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain('className="AutomationsNewAction"');
    expect(pageSource).toContain('aria-label="New automation"');
    expect(pageSource).toContain('className="AutomationsNewActionIcon"');
    expect(pageSource).toContain("color={semanticIconColor('inverse')}");
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.AutomationsNewAction\s*\{[^}]*width:\s*32px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.AutomationsNewActionText\s*\{[^}]*display:\s*none;/s
    );
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
    const timeLogicSource = readFileSync(
      new URL('./automationTime.logic.ts', import.meta.url),
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
    expect(dialogSource).toContain('<AutomationTimeInput');
    expect(dialogSource).toContain('defaultValue={timeOfDay}');
    expect(dialogSource).not.toContain("defaultValue: '09:00'");
    expect(dialogSource).toContain(
      'isAutomationTimeOfDay(timeOfDay)'
    );
    expect(timeLogicSource).toContain(
      '/^(?:[01]\\d|2[0-3]):[0-5]\\d$/u.test(value)'
    );
    expect(createLogicSource).toContain(
      'export type CreateWorktreeMode = AutomationWorktreeMode'
    );
    expect(dialogSource).toContain('<MenuRadioItem value="local">Local</MenuRadioItem>');
    expect(dialogSource).toContain('setWorktreeMode(value as CreateWorktreeMode)');
    expect(dialogSource).toContain('buildAutomationDraftWarnings({');
    expect(dialogSource).toContain(
      "acknowledgedWarningIds.has('local-checkout')"
    );
    expect(createLogicSource).toContain('worktreeMode: input.worktreeMode');
    expect(createLogicSource).toContain('maxIterations: input.maxIterations');
    expect(createLogicSource).toContain('stopOnError: input.stopOnError');
    expect(createLogicSource).toContain(
      'interactionMode: input.interactionMode'
    );
    expect(dialogSource).toContain('Max iterations');
    expect(dialogSource).toContain('Stop on error');
    expect(dialogSource).toContain('Permissions');
    expect(dialogSource).toContain('<MenuRadioItem value="standalone">Standalone</MenuRadioItem>');
    expect(dialogSource).toContain('<MenuRadioItem value="heartbeat">Heartbeat</MenuRadioItem>');
    expect(dialogSource).toContain('Target thread');
    expect(dialogSource).toContain('Stop when');
    expect(dialogSource).toContain(
      '<DialogPanel className="AutomationCreatePanel">'
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog\s*\{[^}]*width:\s*768px;[^}]*max-width:\s*calc\(100vw - 32px\);[^}]*height:\s*465px;[^}]*max-height:\s*calc\(100vh - 32px\);/s
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog--expanded\s*\{[^}]*height:\s*503px;/s
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog--expanded-more\s*\{[^}]*height:\s*541px;/s
    );
    expect(dialogSource).toContain(
      "? ' AutomationCreateDialog--expanded-more'"
    );
    expect(dialogSource).toContain(
      "? ' AutomationCreateDialog--expanded'"
    );
    expect(styles).toMatch(
      /\.AutomationCreatePanel\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;/s
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog\s*>\s*\.AutomationCreatePanel\s*\{[^}]*max-height:\s*none;/s
    );
    expect(dialogSource).toContain(
      '<view className="AutomationCreateToolbar">'
    );
    expect(styles).toMatch(
      /\.AutomationCreateToolbar\s*\{[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*flex-direction:\s*row;/s
    );
    expect(styles).toMatch(
      /\.AutomationCreatePrompt\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*240px;[^}]*border-width:\s*0;/s
    );
    expect(styles).toMatch(
      /\.AutomationCreateName\s*\{[^}]*flex:\s*1;[^}]*border-width:\s*0;[^}]*font-size:\s*18px;[^}]*line-height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.AutomationCreateFooter\s*\{[^}]*flex-shrink:\s*0;[^}]*height:\s*52px;[^}]*margin-top:\s*0;[^}]*padding:\s*4px 16px 16px;/s
    );
    expect(dialogSource).toContain('AutomationCreateWarnings');
    expect(dialogSource).toContain('acknowledgedWarningIds');
    expect(dialogSource).toContain('buildAutomationDraftWarnings({');
    expect(dialogSource).toContain('AUTOMATION_TEMPLATES.map');
    expect(dialogSource).toContain('Heartbeat stop condition');
    expect(dialogSource).toContain('completionPolicyFromStopWhen(stopWhen)');
    expect(dialogSource).toContain('No threads in this project');
    expect(dialogSource).toContain(
      "mode === 'standalone' || targetThreadId.length > 0"
    );
    expect(dialogSource).toContain(
      'thread.id === targetThreadId && thread.projectId === projectId'
    );
    expect(dialogSource).toContain(
      '<MenuRadioItem value="approval-required">Approval required</MenuRadioItem>'
    );
    expect(dialogSource).toContain(
      '<MenuRadioItem value="full-access">Full access</MenuRadioItem>'
    );
    expect(dialogSource).toContain('hasUnacknowledgedWarning');
    expect(dialogSource).toContain('warning.requiresAcknowledgement');
    expect(dialogSource).toContain('function InteractiveAutomationWarningRow');
    expect(dialogSource).toContain('accessibility-trait="text"');
    expect(dialogSource).toContain(
      "'AutomationCreateWarning AutomationCreateWarning--interactive'"
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
      'initialProjectModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION'
    );
    expect(dialogSource).toContain(
      'resolveAutomationModelSelectionForProjectChange({'
    );
    expect(dialogSource).toContain(
      'defaultProvider: generalSettings.defaultProvider'
    );
    expect(dialogSource).toContain('<ComposerModelControl');
    expect(dialogSource).toContain('hideStatusLabel');
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
    expect(dialogSource).toContain("pending ? 'Creating...' : 'Create'");
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
    const timeInputSource = readFileSync(
      new URL('./AutomationTimeInput.lynx.tsx', import.meta.url),
      'utf8'
    );
    const timezoneLogicSource = readFileSync(
      new URL('./automationTimezone.logic.ts', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./automations-page.css', import.meta.url),
      'utf8'
    );

    expect(pageSource).toContain('onEdit={(input) =>');
    expect(pageSource).toContain('updateMutation.mutate(input, {');
    expect(detailSource).toContain('<AutomationEditDialog');
    expect(detailSource).toContain('onEditOpenChange(true)');
    expect(editSource).toContain('<DialogTitle>Edit automation</DialogTitle>');
    expect(editSource).toContain('buildAutomationEditInput({');
    expect(editSource).toContain('<ComposerModelControl');
    expect(editSource).toContain(
      'modelSelection={modelSelection}'
    );
    expect(editSource).toContain(
      "queryKey: ['automation-edit', 'server-config']"
    );
    expect(editSource).toContain(
      "queryKey: ['automation-edit', 'models', modelCatalogProvider]"
    );
    expect(editLogicSource).toContain(
      '? { modelSelection: input.modelSelection }'
    );
    expect(editSource).toContain('default-value={definition.prompt}');
    expect(editSource).toContain('automationEditStopWhen(definition)');
    expect(editSource).toContain("definition.mode === 'heartbeat'");
    expect(editSource).toContain('accessibleLabel="Heartbeat stop condition"');
    expect(editSource).toContain('<AutomationChoiceOption');
    expect(editSource).toContain(
      'automationEditScheduleForKind('
    );
    expect(editSource).toContain("['manual', 'Manual']");
    expect(editSource).toContain("['daily', 'Daily']");
    expect(editSource).toContain("['weekdays', 'Weekdays']");
    expect(editSource).toContain('<AutomationTimeInput');
    expect(editSource).toContain('defaultValue={timedSchedule.timeOfDay}');
    expect(editSource).toContain(
      'setSchedule({ ...timedSchedule, timeOfDay })'
    );
    expect(editSource).toContain(
      'isAutomationTimeOfDay(timedSchedule.timeOfDay)'
    );
    expect(timeInputSource).toContain("import { TimePicker } from '../components/ui/time-picker.lynx';");
    expect(timeInputSource).toContain('<MenuTrigger ariaLabel="Automation time"');
    expect(timeInputSource).toContain('<TimePicker');
    expect(timeInputSource).toContain('value={defaultValue}');
    expect(editSource).toContain('timedSchedule?.timezone === undefined');
    expect(editSource).toContain('accessibleLabel="Automation timezone"');
    expect(editSource).toContain('defaultValue={timedSchedule.timezone}');
    expect(editSource).toContain('timezone: event.target.value');
    expect(editSource).toContain(
      'isAutomationTimezone(timedSchedule.timezone)'
    );
    expect(timezoneLogicSource).toContain('trimmed.length <= 128');
    expect(editSource).toContain("[10, '10 runs']");
    expect(editLogicSource).toContain(
      'completionPolicyFromStopWhen(stopWhen)'
    );
    expect(editSource).not.toContain('sleepOnHost(0)');
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.LxDialogPopup\.AutomationEditDialog\s*\{[^}]*height:\s*calc\(100vh - 32px\);[^}]*max-height:\s*calc\(100vh - 32px\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.AutomationEditDialog\s+>\s+\.LxDialogTitle\s*\{[^}]*flex-shrink:\s*0;[^}]*min-height:\s*21px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.AutomationEditDialog\s+>\s+\.LxDialogDescription\s*\{[^}]*display:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.AutomationEditPanel\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*padding-top:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.AutomationEditDialog\s+>\s+\.AutomationCreateFooter\s*\{[^}]*flex-shrink:\s*0;[^}]*height:\s*40px;[^}]*margin-top:\s*0;/s
    );
  });
});
