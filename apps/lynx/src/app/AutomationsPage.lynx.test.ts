import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx Automations route", () => {
  it("uses canonical automation data and host-backed polling", () => {
    const pageSource = readFileSync(new URL("./AutomationsPage.lynx.tsx", import.meta.url), "utf8");

    expect(pageSource).toContain('queryKey: ["automations"]');
    expect(pageSource).toContain("projectAutomationList({");
    expect(pageSource).toContain("useHostPolling(automations.refetch, 5_000)");
    expect(pageSource).toContain("void sleepOnHost(delayMs)\n        .then(");
    expect(pageSource).toContain("await pollRef.current().catch(() => undefined)");
    expect(pageSource).not.toContain("pollRef.current().finally(schedule)");
    expect(pageSource).not.toContain("refetchInterval: 5_000");
    // The shared facade carries the request; the wire payload stays `{}`.
    expect(pageSource).toContain("queryFn: () => ensureNativeApi().automation.list({})");
    expect(pageSource).not.toContain("synaraClient");
  });

  it("routes the real page and sidebar entry", () => {
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const railSource = readFileSync(
      new URL("../components/sidebar/AppRail.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(routerSource).toContain('pathname === "/automations"');
    expect(routerSource).toContain("<AutomationsPage");
    expect(routerSource).toContain('pathname: "/automations/$automationId"');
    expect(routerSource).toContain("automationId={route.params.automationId}");
    // Upstream's rail owns the route destinations; its panel on these routes is the list.
    expect(railSource).toContain('automations: "/automations",');
    expect(railSource).toContain("railItemForPathname(upstreamPathname)");
    expect(routerSource).toContain(
      'route.pathname.startsWith("/automations") ? (\n          <AutomationsRailPanel />',
    );
  });

  it("opens list rows into the actionable detail surface", () => {
    const pageSource = readFileSync(new URL("./AutomationsPage.lynx.tsx", import.meta.url), "utf8");
    const detailSource = readFileSync(
      new URL("./AutomationDetailPage.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(pageSource).toContain("navigate(`/automations/${encodeURIComponent(id)}`)");
    expect(pageSource).toContain("<AutomationDetailPage");
    expect(detailSource).toContain("projectAutomationDetail({");
    expect(detailSource).toContain("Automation not found.");
    expect(detailSource).toContain("AutomationDetailNotFoundHeader");
    expect(detailSource).toContain("Back to automations");
    expect(detailSource).toContain("Previous runs");
    expect(detailSource).toContain("No runs yet.");
    expect(detailSource).toContain('"Pause" : "Resume"');
    expect(pageSource).toContain("ensureNativeApi().automation.update(input)");
    expect(pageSource).toContain("ensureNativeApi().automation.delete(input)");
    expect(pageSource).toContain("ensureNativeApi().automation.runNow(input)");
    // Like the web list, Create closes the dialog and stays on the list.
    const createMutation = pageSource.slice(
      pageSource.indexOf("ensureNativeApi().automation.create(input)"),
      pageSource.indexOf("const runNowMutation"),
    );
    expect(createMutation).toContain("setCreateOpen(false)");
    expect(createMutation).not.toContain("navigate(");
    expect(pageSource).toContain('invalidateQueries({ queryKey: ["automations"] })');
    expect(detailSource).toContain('"background only"');
    expect(detailSource).toContain("return dialogs.confirm(");
    expect(detailSource).toContain("confirmAutomationDelete(definition.name)");
    expect(detailSource).toContain("if (confirmed) onDelete(definition)");
    expect(pageSource).toContain('navigate("/automations")');
    expect(detailSource).not.toContain("automation.update");
    expect(detailSource).not.toContain("automation.delete");
    expect(detailSource).toContain('runNowPending ? "Running..." : "Run now"');
    expect(detailSource).toContain("<InlineDetailSelect");
    expect(detailSource).toContain('label="Repeats"');
    expect(detailSource).toContain('schedule.type === "interval"');
    expect(detailSource).toContain('schedule.type === "once"');
    expect(detailSource).toContain('schedule.type === "cron"');
    expect(detailSource).toContain('schedule.type === "weekly"');
    expect(detailSource).not.toContain('aria-label="Edit"');
  });

  it("stacks automation detail panes at compact widths", () => {
    const detailStyles = readFileSync(new URL("./automations-page.css", import.meta.url), "utf8");

    expect(detailStyles).toContain(".SliceRoot--viewport-compact .AutomationDetailPage");
    expect(detailStyles).toContain("flex-direction: column;");
    expect(detailStyles).toContain(".SliceRoot--viewport-compact .AutomationDetailMain");
    expect(detailStyles).toContain("flex: 0 0 246px;");
    expect(detailStyles).toContain(".SliceRoot--viewport-compact .AutomationDetailAside");
    expect(detailStyles).toContain("min-width: 0;");
  });

  it("keeps the compact detail breadcrumb below desktop titlebar controls", () => {
    const detailStyles = readFileSync(new URL("./automations-page.css", import.meta.url), "utf8");

    expect(detailStyles).toMatch(
      /\.SliceRoot--viewport-compact \.AutomationDetailHeader\s*\{[^}]*height:\s*92px;[^}]*min-height:\s*92px;[^}]*padding:\s*46px 20px 0;/s,
    );
  });

  it("keeps the compact not-found title below desktop titlebar controls", () => {
    const detailStyles = readFileSync(new URL("./automations-page.css", import.meta.url), "utf8");

    expect(detailStyles).toMatch(
      /\.SliceRoot--viewport-compact \.AutomationDetailNotFoundHeader\s*\{[^}]*height:\s*92px;[^}]*min-height:\s*92px;[^}]*padding:\s*46px 20px 0;/s,
    );
  });

  it("keeps medium detail headers outside closed desktop titlebar controls", () => {
    const detailStyles = readFileSync(new URL("./automations-page.css", import.meta.url), "utf8");

    expect(detailStyles).toMatch(
      /\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.AutomationDetailHeader,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.AutomationDetailNotFoundHeader\s*\{[^}]*padding-left:\s*180px;/s,
    );
  });

  it("keeps compact detail actions reachable at short heights", () => {
    const detailStyles = readFileSync(new URL("./automations-page.css", import.meta.url), "utf8");

    expect(detailStyles).toMatch(
      /\.SliceRoot--viewport-short-height\.SliceRoot--viewport-compact\s+\.AutomationDetailMain\s*\{[^}]*flex:\s*0 0 120px;[^}]*height:\s*120px;/s,
    );
  });

  it("keeps compact list actions outside desktop titlebar controls", () => {
    const pageSource = readFileSync(new URL("./AutomationsPage.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./automations-page.css", import.meta.url), "utf8");

    // Upstream's header holds Refresh only; "New automation" lives in the rail panel and
    // in the index prompt, both opening the one create dialog.
    const panelSource = readFileSync(
      new URL("./AutomationsRailPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(pageSource).not.toContain('className="AutomationsNewAction"');
    expect(pageSource).toContain('className="AutomationsIndexPromptAction"');
    expect(pageSource).toContain('aria-label="New automation"');
    expect(panelSource).toContain('label: "New automation"');
    expect(panelSource).toContain("onActivate: () => setAutomationCreateOpen(true)");
    expect(pageSource).toContain("const createOpen = useAutomationCreateOpen();");
    expect(styles).toMatch(/\.AutomationsHeader\s*\{[^}]*height:\s*44px;[^}]*min-height:\s*44px;/s);
  });

  it("creates a canonical daily automation from the real dialog", () => {
    const pageSource = readFileSync(new URL("./AutomationsPage.lynx.tsx", import.meta.url), "utf8");
    const dialogSource = readFileSync(
      new URL("./AutomationCreateDialog.lynx.tsx", import.meta.url),
      "utf8",
    );
    const composerPrimitivesSource = readFileSync(
      new URL("./AutomationComposerPrimitives.lynx.tsx", import.meta.url),
      "utf8",
    );
    const createLogicSource = readFileSync(
      new URL("./automationCreate.logic.ts", import.meta.url),
      "utf8",
    );
    const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./automations-page.css", import.meta.url), "utf8");

    expect(pageSource).toContain("ensureNativeApi().automation.create(input)");
    expect(pageSource).toContain("<AutomationDialog");
    expect(pageSource).toContain("threads={sidebar.data?.threads ?? []}");
    expect(pageSource).not.toContain(
      "navigate(`/automations/${encodeURIComponent(definition.id)}`)",
    );
    expect(dialogSource).toContain("buildAutomationCreateInput({");
    expect(createLogicSource).toContain("readonly schedule: AutomationSchedule");
    expect(createLogicSource).toContain("schedule: input.schedule");
    expect(dialogSource).toContain("SCHEDULE_KIND_OPTIONS.map");
    expect(dialogSource).toContain(
      '<MenuPopup align="start" side="top" className="AutomationCreateScheduleMenu">',
    );
    expect(dialogSource).toContain("scheduleFromForm(formForValidation)");
    expect(dialogSource).toContain("isFormSubmittable(formForValidation)");
    expect(dialogSource).toContain('scheduleForm.scheduleKind === "once"');
    expect(dialogSource).toContain('scheduleForm.scheduleKind === "custom"');
    expect(dialogSource).toContain('scheduleForm.scheduleKind === "weekly"');
    expect(dialogSource).toContain('scheduleForm.scheduleKind === "cron"');
    expect(dialogSource).toContain('import { Input } from "../components/ui/input.lynx"');
    expect(dialogSource).toContain("<AutomationTimeInput");
    expect(dialogSource).toContain("defaultValue={scheduleForm.timeOfDay}");
    expect(createLogicSource).toContain("export type CreateWorktreeMode = AutomationWorktreeMode");
    expect(dialogSource).toContain('<MenuRadioItem value="local">Local</MenuRadioItem>');
    expect(dialogSource).toContain("setWorktreeMode(value as CreateWorktreeMode)");
    expect(dialogSource).toContain("buildAutomationDraftWarnings({");
    expect(dialogSource).toContain('acknowledgedWarningIds.has("local-checkout")');
    expect(createLogicSource).toContain("worktreeMode: input.worktreeMode");
    expect(createLogicSource).toContain("maxIterations: input.maxIterations");
    expect(createLogicSource).toContain("interactionMode: input.interactionMode");
    expect(dialogSource).toContain("Max iterations");
    expect(dialogSource).toContain("Permissions");
    expect(dialogSource).toContain('<MenuRadioItem value="standalone">Standalone</MenuRadioItem>');
    expect(dialogSource).toContain('<MenuRadioItem value="heartbeat">Heartbeat</MenuRadioItem>');
    expect(dialogSource).toContain("Target thread");
    expect(dialogSource).toContain("Stop when");
    expect(dialogSource).toContain('<DialogPanel className="AutomationCreatePanel">');
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog\s*\{[^}]*width:\s*768px;[^}]*max-width:\s*calc\(100vw - 32px\);[^}]*height:\s*498\.5px;[^}]*max-height:\s*calc\(100vh - 32px\);/s,
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog--expanded\s*\{[^}]*height:\s*540px;/s,
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog--expanded-more\s*\{[^}]*height:\s*582px;/s,
    );
    expect(dialogSource).toContain('? " AutomationCreateDialog--expanded-more"');
    expect(dialogSource).toContain('? " AutomationCreateDialog--expanded"');
    expect(styles).toMatch(/\.AutomationCreatePanel\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;/s);
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationCreateDialog\s*>\s*\.AutomationCreatePanel\s*\{[^}]*max-height:\s*none;/s,
    );
    expect(dialogSource).toContain('<view className="AutomationCreateToolbar">');
    expect(styles).toMatch(
      /\.AutomationCreateToolbar\s*\{[^}]*display:\s*flex;[^}]*flex:\s*1;[^}]*flex-direction:\s*row;/s,
    );
    expect(styles).toMatch(
      /\.AutomationCreatePrompt\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*240px;[^}]*border-width:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.AutomationCreateName\s*\{[^}]*flex:\s*1;[^}]*border-width:\s*0;[^}]*font-size:\s*18px;[^}]*line-height:\s*28px;/s,
    );
    expect(styles).toMatch(
      /\.AutomationCreateFooter\s*\{[^}]*flex-shrink:\s*0;[^}]*height:\s*auto;[^}]*margin-top:\s*0;[^}]*padding:\s*4px 16px 16px;/s,
    );
    // Upstream's chip row wraps beside the block reason and the buttons.
    expect(styles).toMatch(/\.AutomationCreateToolbar\s*\{[^}]*flex-wrap:\s*wrap;/s);
    expect(dialogSource).toContain("automationFormSubmitBlockReason(");
    expect(dialogSource).toContain('className="AutomationCreateBlockReason"');
    expect(styles).toMatch(
      /\.AutomationCreateBlockReason\s*\{[^}]*font-size:\s*var\(--app-font-size-ui, 13px\);/s,
    );
    expect(dialogSource).toContain("AutomationCreateWarnings");
    expect(dialogSource).toContain("acknowledgedWarningIds");
    expect(dialogSource).toContain("buildAutomationDraftWarnings({");
    expect(dialogSource).toContain("AUTOMATION_TEMPLATES.map");
    expect(dialogSource).toContain("<AutomationComposerStopWhenInput");
    expect(composerPrimitivesSource).toContain('aria-label="Heartbeat stop condition"');
    expect(dialogSource).toContain("completionPolicyFromStopWhen(stopWhen)");
    expect(dialogSource).toContain("No threads in this project");
    expect(dialogSource).toContain("isFormSubmittable(formForValidation)");
    expect(dialogSource).toContain(
      "thread.id === targetThreadId && thread.projectId === projectId",
    );
    expect(dialogSource).toContain(
      '<MenuRadioItem value="approval-required">Approval required</MenuRadioItem>',
    );
    expect(dialogSource).toContain(
      '<MenuRadioItem value="full-access">Full access</MenuRadioItem>',
    );
    expect(dialogSource).toContain("hasUnacknowledgedWarning");
    expect(dialogSource).toContain("warning.requiresAcknowledgement");
    expect(composerPrimitivesSource).toContain("function InteractiveAutomationComposerWarningRow");
    expect(composerPrimitivesSource).toContain('accessibility-trait="text"');
    expect(composerPrimitivesSource).toContain(
      '"AutomationCreateWarning AutomationCreateWarning--interactive"',
    );
    expect(createLogicSource).toContain("runtimeMode: input.runtimeMode");
    expect(createLogicSource).toContain('input.mode === "heartbeat" ? input.targetThreadId : null');
    expect(createLogicSource).toContain('input.mode === "heartbeat"');
    expect(createLogicSource).toContain("input.completionPolicy");
    expect(createLogicSource).toContain(
      'input.runtimeMode === "full-access" ? ["full-access" as const] : []',
    );
    expect(dialogSource).toContain("resolveAutomationModelSelection({");
    expect(dialogSource).toContain(
      "initialProjectModelSelection ?? AUTOMATION_DEFAULT_MODEL_SELECTION",
    );
    expect(dialogSource).toContain("resolveAutomationModelSelectionForProjectChange({");
    expect(dialogSource).toContain("defaultProvider: generalSettings.defaultProvider");
    expect(dialogSource).toContain("<ComposerModelControl");
    expect(dialogSource).toContain("hideStatusLabel");
    expect(dialogSource).toContain("...serverConfigQueryOptions(), enabled: open");
    expect(dialogSource).toContain("ensureNativeApi().provider.listModels({");
    // The server schema takes a missing `cwd`, never a null one.
    expect(dialogSource).toContain("...(cwd ? { cwd } : {}),");
    expect(queriesSource).not.toContain("fetchAutomationCreateServerConfig");
    expect(queriesSource).not.toContain("fetchAutomationCreateModels");
    expect(dialogSource).toContain("enabled: open");
    expect(dialogSource).toContain("runtimeModels={modelCatalog.data?.models ?? []}");
    expect(dialogSource.indexOf("const generalSettings")).toBeGreaterThan(
      dialogSource.indexOf("export function AutomationCreateDialog"),
    );
    expect(dialogSource).toContain("Boolean(project)");
    expect(dialogSource).toContain('pending ? "Creating..." : "Create"');
    expect(dialogSource).not.toContain("model: 'gpt-");
  });

  it("edits automations through the canonical composer form contract", () => {
    const pageSource = readFileSync(new URL("./AutomationsPage.lynx.tsx", import.meta.url), "utf8");
    const detailSource = readFileSync(
      new URL("./AutomationDetailPage.lynx.tsx", import.meta.url),
      "utf8",
    );
    const editSource = readFileSync(
      new URL("./AutomationEditDialog.lynx.tsx", import.meta.url),
      "utf8",
    );
    const timeInputSource = readFileSync(
      new URL("./AutomationTimeInput.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./automations-page.css", import.meta.url), "utf8");

    expect(pageSource).toContain("onEdit={(input) =>");
    expect(pageSource).toContain("updateMutation.mutate(input, {");
    expect(pageSource).toContain("projects={sidebar.data?.projects ?? []}");
    expect(pageSource).toContain("threads={sidebar.data?.threads ?? []}");
    expect(detailSource).toContain("<AutomationDialog");
    expect(detailSource).toContain("projects={projects}");
    expect(detailSource).toContain("threads={threads}");
    expect(detailSource).toContain("onEditOpenChange(true)");
    expect(editSource).toContain("Edit automation");
    expect(editSource).toContain("formFromDefinition(definition");
    expect(editSource).toContain("updateInputFromForm(");
    expect(editSource).toContain("providerOptionsForAutomationEdit(");
    expect(editSource).toContain("<AutomationComposerNameInput");
    expect(editSource).toContain("<AutomationComposerStopWhenInput");
    expect(editSource).toContain("<AutomationComposerWarningRow");
    expect(editSource).toContain("<ComposerModelControl");
    expect(editSource).toContain("modelSelection={form.modelSelection}");
    expect(editSource).toContain("SCHEDULE_KIND_OPTIONS.map");
    expect(editSource).toContain(
      '<MenuPopup align="start" side="top" className="AutomationCreateScheduleMenu">',
    );
    expect(editSource).toContain('form.scheduleKind === "once"');
    expect(editSource).toContain('form.scheduleKind === "custom"');
    expect(editSource).toContain('form.scheduleKind === "cron"');
    expect(editSource).toContain('form.scheduleKind === "weekly"');
    expect(editSource).toContain("<AutomationTimeInput");
    expect(editSource).toContain("defaultValue={form.timeOfDay}");
    expect(editSource).toContain('aria-label="Automation timezone"');
    expect(editSource).toContain("MAX_ITERATION_OPTIONS");
    expect(editSource).toContain("buildAutomationFormWarnings(form)");
    expect(editSource).toContain("hasBlockingAutomationDraftWarnings(");
    expect(editSource).toContain("acknowledgedRiskIdsForFormWarnings(");
    expect(editSource).toContain('pending ? "Saving..." : "Save"');
    expect(timeInputSource).toContain(
      'import { TimePicker } from "../components/ui/time-picker.lynx";',
    );
    expect(timeInputSource).toContain('<MenuTrigger ariaLabel="Automation time"');
    expect(timeInputSource).toContain("<TimePicker");
    expect(timeInputSource).toContain("value={defaultValue}");
    expect(styles).toMatch(
      /\.LxDialogPopup\.AutomationEditDialog\s*\{[^}]*width:\s*768px;[^}]*max-width:\s*calc\(100vw - 32px\);[^}]*height:\s*465px;[^}]*max-height:\s*calc\(100vh - 32px\);/s,
    );
  });
});
