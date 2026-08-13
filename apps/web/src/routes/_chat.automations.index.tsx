import { type AutomationDefinition } from "@synara/contracts";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  projectAutomationList,
  type AutomationDefinitionRow,
  type AutomationTriageRow,
} from "@synara/shared/automationList";

import { getProviderStartOptions, useAppSettings } from "~/appSettings";
import {
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  CHAT_SURFACE_HEADER_HEIGHT_CLASS,
  CHAT_SURFACE_HEADER_PADDING_X_CLASS,
} from "~/components/chat/chatHeaderControls";
import { CHAT_BACKGROUND_CLASS_NAME } from "~/components/chat/composerPickerStyles";
import { SidebarHeaderNavigationControls } from "~/components/SidebarHeaderNavigationControls";
import { Button } from "~/components/ui/button";
import { RouteInsetSurface } from "~/components/RouteInsetSurface";
import {
  hasBlockingAutomationDraftWarnings,
  updateAutomationDraftWarningAcknowledgement,
  type AutomationDraftWarning,
  type AutomationDraftWarningId,
} from "~/lib/automationDraft";
import {
  useDesktopTopBarTrafficLightGutterClassName,
  useDesktopTopBarWindowControlsGutterClassName,
} from "~/hooks/useDesktopTopBarGutter";
import { CentralIcon } from "~/lib/central-icons";
import { cn } from "~/lib/utils";
import { ensureNativeApi } from "~/nativeApi";
import { useStore } from "~/store";
import { createAllThreadsSelector } from "~/storeSelectors";
import {
  type AutomationFormState,
  AutomationDialog,
  acknowledgedRiskIdsForFormWarnings,
  automationStatusDotClass,
  buildAutomationFormWarnings,
  createInputFromForm,
  formFromDefinition,
  isFormSubmittable,
  isRowInteractiveEventTarget,
  providerOptionsForAutomationEdit,
  projectModelSelection,
  RunStatusIndicator,
  updateInputFromForm,
  useAutomations,
} from "./-automations.shared";
import { resolveThreadPickerTitle } from "./-chatThreadRoute.logic";

export const Route = createFileRoute("/_chat/automations/")({
  component: AutomationsRouteView,
});

const selectAllThreads = createAllThreadsSelector();

/**
 * Minimal list row shared by the automation sections and the triage list: a leading
 * status glyph, a title, a muted detail that fills the row, and optional right-aligned
 * meta plus a trailing affordance.
 */
function AutomationListRow({
  onClick,
  leading,
  title,
  detail,
  meta,
  trailing,
  onDelete,
}: {
  readonly onClick: () => void;
  readonly leading: ReactNode;
  readonly title: string;
  readonly detail: string;
  readonly meta?: ReactNode;
  readonly trailing?: ReactNode;
  readonly onDelete?: () => void;
}) {
  return (
    // A div with role="button" (not a real <button>) so inline controls like the hover delete
    // can be nested buttons; the keydown guard lets those controls handle their own events
    // without also firing the row's navigation.
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (isRowInteractiveEventTarget(event.target, event.currentTarget)) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      className="group flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors hover:bg-[var(--color-background-elevated-secondary)]"
    >
      {leading}
      <span className="min-w-0 max-w-[45%] truncate text-[0.8125rem] text-foreground">{title}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{detail}</span>
      {meta == null ? null : (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{meta}</span>
      )}
      {onDelete ? (
        <button
          type="button"
          aria-label="Delete automation"
          title="Delete"
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
        >
          <CentralIcon name="trash-can-simple" className="size-3.5" />
        </button>
      ) : null}
      {trailing}
    </div>
  );
}

function AutomationsRouteView() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const desktopTopBarTrafficLightGutterClassName = useDesktopTopBarTrafficLightGutterClassName();
  const desktopTopBarWindowControlsGutterClassName =
    useDesktopTopBarWindowControlsGutterClassName();
  const projects = useStore((state) => state.projects);
  const threads = useStore(selectAllThreads);
  const [editingDefinition, setEditingDefinition] = useState<AutomationDefinition | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogWarnings, setDialogWarnings] = useState<readonly AutomationDraftWarning[]>([]);
  const [acknowledgedWarningIds, setAcknowledgedWarningIds] = useState<
    ReadonlySet<AutomationDraftWarningId>
  >(() => new Set());
  const [triageFilter, setTriageFilter] = useState<"unread" | "all">("unread");
  const fallbackProjectId = projects[0]?.id ?? "";
  const [form, setForm] = useState<AutomationFormState>(() =>
    formFromDefinition(null, fallbackProjectId, projectModelSelection(projects, fallbackProjectId)),
  );

  const {
    data,
    isLoading,
    refetch,
    createMutation,
    updateMutation,
    deleteMutation,
  } = useAutomations((threadId) => void navigate({ to: "/$threadId", params: { threadId } }));
  const providerOptionsForDispatch = getProviderStartOptions(settings);

  const updateDialogForm = (nextForm: AutomationFormState) => {
    setForm(nextForm);
    setDialogWarnings(buildAutomationFormWarnings(nextForm));
  };

  const toggleWarning = (id: AutomationDraftWarningId, checked: boolean) => {
    setAcknowledgedWarningIds((current) =>
      updateAutomationDraftWarningAcknowledgement(current, id, checked),
    );
  };

  const openCreateDialog = () => {
    setEditingDefinition(null);
    const nextForm = formFromDefinition(
      null,
      fallbackProjectId,
      projectModelSelection(projects, fallbackProjectId),
    );
    setForm(nextForm);
    setDialogWarnings(buildAutomationFormWarnings(nextForm));
    setAcknowledgedWarningIds(new Set());
    setDialogOpen(true);
  };

  const submitForm = () => {
    if (!isFormSubmittable(form)) return;
    if (hasBlockingAutomationDraftWarnings(dialogWarnings, acknowledgedWarningIds)) return;
    const acknowledgedRisks = acknowledgedRiskIdsForFormWarnings(
      dialogWarnings,
      acknowledgedWarningIds,
    );
    const closeOnSuccess = { onSuccess: () => setDialogOpen(false) };
    if (editingDefinition) {
      updateMutation.mutate(
        updateInputFromForm(
          editingDefinition,
          form,
          providerOptionsForAutomationEdit(editingDefinition, form, providerOptionsForDispatch),
          acknowledgedRisks,
        ),
        closeOnSuccess,
      );
      return;
    }
    createMutation.mutate(
      createInputFromForm(form, providerOptionsForDispatch, acknowledgedRisks),
      closeOnSuccess,
    );
  };

  const deleteDefinition = async (definition: AutomationDefinition) => {
    const confirmed = await ensureNativeApi().dialogs.confirm(`Delete "${definition.name}"?`);
    if (!confirmed) return;
    deleteMutation.mutate(definition);
  };

  const projection = useMemo(
    () =>
      projectAutomationList({
        data,
        projects: projects.map((project) => ({ id: project.id, name: project.name })),
        threads: threads.map((thread) => ({
          id: thread.id,
          title: resolveThreadPickerTitle(thread.title),
        })),
      }),
    [data, projects, threads],
  );
  const triageRows = triageFilter === "unread" ? projection.triage : projection.allTriage;

  const renderRow = (row: AutomationDefinitionRow) => {
    const { definition, latestRun } = row;
    return (
      <AutomationListRow
        key={definition.id}
        onClick={() =>
          void navigate({
            to: "/automations/$automationId",
            params: { automationId: definition.id },
          })
        }
        leading={
          <span
            className={cn(
              "flex size-3.5 shrink-0 items-center justify-center",
              automationStatusDotClass(definition, latestRun),
            )}
          >
            <span className="block size-1.5 rounded-full bg-current" />
          </span>
        }
        title={definition.name}
        detail={row.detail}
        meta={row.meta}
        onDelete={() => void deleteDefinition(definition)}
      />
    );
  };

  const renderSection = (title: string, rows: readonly AutomationDefinitionRow[]) =>
    rows.length > 0 ? (
      <section className="flex flex-col gap-0.5">
        <h2 className="px-2 pb-1 text-sm font-medium text-foreground">{title}</h2>
        <div className="flex flex-col">{rows.map(renderRow)}</div>
      </section>
    ) : null;

  const renderTriageRow = (row: AutomationTriageRow) => {
    const { definition, run } = row;
    return (
      <AutomationListRow
        key={run.id}
        // A run row opens its automation; the run's thread is opened from inside the
        // automation detail's "Previous runs" sidebar (orphan runs fall back to the thread).
        onClick={() =>
          definition
            ? void navigate({
                to: "/automations/$automationId",
                params: { automationId: definition.id },
              })
            : run.threadId
              ? void navigate({ to: "/$threadId", params: { threadId: run.threadId } })
              : undefined
        }
        leading={<RunStatusIndicator status={run.status} />}
        title={row.title}
        detail={row.detail}
        meta={row.meta}
        trailing={
          <CentralIcon
            name="chevron-right-small"
            className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          />
        }
      />
    );
  };

  const renderTriage = () =>
    projection.allTriage.length > 0 ? (
      <section className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-3 px-2 pb-1">
          <h2 className="text-sm font-medium text-foreground">Needs review</h2>
          <div className="flex items-center gap-0.5 rounded-md bg-[var(--color-background-elevated-secondary)] p-0.5 text-xs">
            {(["unread", "all"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTriageFilter(value)}
                className={cn(
                  "rounded px-2 py-0.5 transition-colors",
                  triageFilter === value
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {value === "unread"
                  ? `Unread ${projection.unreadTriageCount}`
                  : `All ${projection.allTriage.length}`}
              </button>
            ))}
          </div>
        </div>
        {triageRuns.length === 0 ? (
          <div className="px-2 py-4 text-xs text-muted-foreground">No unread runs.</div>
        ) : (
          <div className="flex flex-col">{triageRows.map(renderTriageRow)}</div>
        )}
      </section>
    ) : null;

  return (
    <RouteInsetSurface>
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          CHAT_BACKGROUND_CLASS_NAME,
        )}
      >
        <header
          className={cn(
            CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
            CHAT_SURFACE_HEADER_PADDING_X_CLASS,
            "drag-region",
            desktopTopBarTrafficLightGutterClassName,
            desktopTopBarWindowControlsGutterClassName,
          )}
        >
          <div className={cn("flex items-center gap-2 sm:gap-3", CHAT_SURFACE_HEADER_HEIGHT_CLASS)}>
            <SidebarHeaderNavigationControls />
            <div className="min-w-0 flex-1" />
            <div className="flex shrink-0 items-center gap-1 [-webkit-app-region:no-drag]">
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Refresh"
                title="Refresh"
                onClick={() => void refetch()}
              >
                <CentralIcon name="arrow-rotate-clockwise" className="size-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={openCreateDialog}
                disabled={projects.length === 0}
              >
                <CentralIcon name="plus-small" className="size-4" />
                New automation
              </Button>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-12 pt-8">
            <h1 className="px-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
              Automations
            </h1>
            {isLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Loading automations...
              </div>
            ) : data.definitions.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-16 text-center">
                <p className="text-sm font-medium text-foreground">No automations yet</p>
                <p className="max-w-xs text-xs text-muted-foreground">
                  Schedule a prompt to run on its own, or wake an existing thread on a loop.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {renderTriage()}
                {renderSection("Current", projection.current)}
                {renderSection("Paused", projection.paused)}
              </div>
            )}
          </div>
        </main>
      </div>

      <AutomationDialog
        open={dialogOpen}
        editing={editingDefinition !== null}
        form={form}
        projects={projects}
        threads={threads}
        warnings={dialogWarnings}
        acknowledgedWarningIds={acknowledgedWarningIds}
        onToggleWarning={toggleWarning}
        onOpenChange={setDialogOpen}
        onFormChange={updateDialogForm}
        onSubmit={submitForm}
        busy={createMutation.isPending || updateMutation.isPending}
      />
    </RouteInsetSurface>
  );
}
