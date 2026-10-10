import { useMemo, useState } from "@lynx-js/react";
import type { AutomationDefinitionRow, AutomationTriageRow } from "@synara/shared/automationList";
import { projectAutomationList } from "@synara/shared/automationList";

import { Button } from "../components/ui/button";
import { ClockIcon, RefreshCwIcon } from "../lib/icons";
import { useTheme } from "../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useSidebarSnapshot } from "./sidebarSnapshot.lynx";
import { AutomationDialog } from "./AutomationDialog.lynx";
import { setAutomationCreateOpen, useAutomationCreateOpen } from "./automationCreateIntent.lynx";
import { AutomationDetailPage } from "./AutomationDetailPage.lynx";
import { useLiveAutomations } from "./automationsLive.lynx";
import "./automations-page.css";

export function AutomationStatusDot({
  tone,
}: {
  readonly tone: AutomationDefinitionRow["tone"] | "triage";
}) {
  return (
    <view className={`AutomationsStatusDot AutomationsStatusDot--${tone}`}>
      <view className="AutomationsStatusDotCore" />
    </view>
  );
}

export function AutomationRow({
  row,
  onOpen,
}: {
  readonly row: AutomationDefinitionRow;
  readonly onOpen: (automationId: string) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "AutomationsRow AutomationsRow--interactive",
    accessibleLabel: `${row.definition.name}. ${row.detail}. ${row.meta}`,
    accessibilityElement: true,
    accessibilityTraits: "button",
    onActivate: () => onOpen(row.definition.id),
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <AutomationStatusDot tone={row.tone} />
      <text className="AutomationsRowTitle">{row.definition.name}</text>
      <text className="AutomationsRowDetail">{row.detail}</text>
      <text className="AutomationsRowMeta">{row.meta}</text>
    </view>
  );
}

export function AutomationTriageListRow({
  row,
  onOpen,
}: {
  readonly row: AutomationTriageRow;
  readonly onOpen: (automationId: string) => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "AutomationsRow AutomationsRow--interactive",
    accessibleLabel: `${row.title}. ${row.detail}. ${row.meta}`,
    accessibilityElement: true,
    accessibilityTraits: "button",
    onActivate: row.definition ? () => onOpen(row.definition!.id) : undefined,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <AutomationStatusDot tone="triage" />
      <text className="AutomationsRowTitle">{row.title}</text>
      <text className="AutomationsRowDetail">{row.detail}</text>
      <text className="AutomationsRowMeta">{row.meta}</text>
    </view>
  );
}

export function AutomationSection({
  title,
  rows,
  onOpen,
}: {
  readonly title: string;
  readonly rows: readonly AutomationDefinitionRow[];
  readonly onOpen: (automationId: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <view className="AutomationsSection">
      <text className="AutomationsSectionTitle">{title}</text>
      <view className="AutomationsRows">
        {rows.map((row) => (
          <AutomationRow key={row.definition.id} row={row} onOpen={onOpen} />
        ))}
      </view>
    </view>
  );
}

export function AutomationsListContent({
  definitionsCount,
  error,
  isLoading,
  onOpen,
  onRetry,
  projection,
}: {
  readonly definitionsCount: number;
  readonly error: boolean;
  readonly isLoading: boolean;
  readonly onOpen: (automationId: string) => void;
  readonly onRetry: () => void;
  readonly projection: ReturnType<typeof projectAutomationList> | null;
}) {
  return (
    <scroll-view className="AutomationsScroller" scroll-orientation="vertical">
      <view className="AutomationsContent">
        <text className="AutomationsTitle">Automations</text>
        {isLoading ? (
          <view
            className="AutomationsState"
            accessibility-element
            accessibility-label="Loading automations"
            accessibility-trait="updating"
          >
            <text className="AutomationsStateText">Loading automations...</text>
          </view>
        ) : error ? (
          <view
            className="AutomationsState"
            accessibility-element
            accessibility-label="Automations could not be loaded"
            accessibility-trait="text"
          >
            <text className="AutomationsStateTitle">Automations could not be loaded</text>
            <text className="AutomationsStateText">Check the server connection and try again.</text>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </view>
        ) : definitionsCount === 0 ? (
          <view
            className="AutomationsState"
            accessibility-element
            accessibility-label="No automations yet. Schedule a prompt to run on its own, or wake an existing thread on a loop."
            accessibility-trait="text"
          >
            <text className="AutomationsStateTitle">No automations yet</text>
            <text className="AutomationsStateText">
              Schedule a prompt to run on its own, or wake an existing thread on a loop.
            </text>
          </view>
        ) : projection ? (
          <view className="AutomationsSections">
            {projection.triage.length > 0 ? (
              <view className="AutomationsSection">
                <view className="AutomationsSectionHeader">
                  <text className="AutomationsSectionTitle">Needs review</text>
                  <text className="AutomationsSectionCount">
                    Unread {projection.unreadTriageCount}
                  </text>
                </view>
                <view className="AutomationsRows">
                  {projection.triage.map((row) => (
                    <AutomationTriageListRow key={row.run.id} row={row} onOpen={onOpen} />
                  ))}
                </view>
              </view>
            ) : null}
            <AutomationSection title="Current" rows={projection.current} onOpen={onOpen} />
            <AutomationSection title="Paused" rows={projection.paused} onOpen={onOpen} />
          </view>
        ) : null}
      </view>
    </scroll-view>
  );
}

/** Upstream `_chat.automations.index`: the list lives in the rail panel; the route prompts. */
function AutomationsIndexPrompt(props: {
  readonly disabled: boolean;
  readonly onCreate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <view className="AutomationsIndexPrompt">
      <ClockIcon color={semanticIconColor("secondary")} size={32} />
      <text className="AutomationsIndexPromptTitle">Automations</text>
      <text className="AutomationsIndexPromptText">
        Pick an automation in the panel to see its runs, or schedule a new one.
      </text>
      <Button
        className="AutomationsIndexPromptAction"
        size="sm"
        disabled={props.disabled}
        aria-label="New automation"
        onClick={props.onCreate}
      >
        New automation
      </Button>
    </view>
  );
}

export function AutomationsPage({
  automationId = null,
  navigate,
}: {
  readonly automationId?: string | null;
  readonly navigate: (to: string) => void;
}) {
  const { semanticIconColor } = useTheme();
  const createOpen = useAutomationCreateOpen();
  const setCreateOpen = setAutomationCreateOpen;
  const [editOpen, setEditOpen] = useState(false);
  // Upstream's list query and mutations (optimistic definition patch included),
  // kept current by the server's automation stream instead of a poll.
  const automations = useLiveAutomations();
  const { updateMutation, deleteMutation, createMutation, runNowMutation } = automations;
  const sidebar = useSidebarSnapshot();
  const projection = useMemo(
    () =>
      automations.data
        ? projectAutomationList({
            data: automations.data,
            projects:
              sidebar.data?.projects.map((project) => ({
                id: project.id,
                name: project.title,
              })) ?? [],
            threads:
              sidebar.data?.threads.map((thread) => ({
                id: thread.id,
                title: thread.title,
              })) ?? [],
          })
        : null,
    [automations.data, sidebar.data],
  );
  const openAutomation = (id: string) => navigate(`/automations/${encodeURIComponent(id)}`);

  if (automationId) {
    if (automations.isLoading || sidebar.isPending) {
      return (
        <view
          className="AutomationDetailNotFound"
          accessibility-element={true}
          accessibility-label="Loading automation"
          accessibility-trait="updating"
        >
          <text className="AutomationDetailNotFoundText">Loading automation...</text>
        </view>
      );
    }
    return (
      <AutomationDetailPage
        automationId={automationId}
        definitions={automations.data?.definitions ?? []}
        runs={automations.data?.runs ?? []}
        projects={sidebar.data?.projects ?? []}
        threads={sidebar.data?.threads ?? []}
        updateError={
          updateMutation.error instanceof Error
            ? updateMutation.error.message
            : updateMutation.error
              ? String(updateMutation.error)
              : null
        }
        updatePending={updateMutation.isPending}
        editOpen={editOpen}
        onEditOpenChange={setEditOpen}
        onEdit={(input) =>
          updateMutation.mutate(input, {
            onSuccess: () => setEditOpen(false),
          })
        }
        onPatch={(input) => updateMutation.mutate(input)}
        deleteError={
          deleteMutation.error instanceof Error
            ? deleteMutation.error.message
            : deleteMutation.error
              ? String(deleteMutation.error)
              : null
        }
        deletePending={deleteMutation.isPending}
        onDelete={(definition) =>
          deleteMutation.mutate(definition, { onSuccess: () => navigate("/automations") })
        }
        onToggleEnabled={(definition) =>
          updateMutation.mutate({
            id: definition.id,
            enabled: !definition.enabled,
          })
        }
        runNowError={
          runNowMutation.error instanceof Error
            ? runNowMutation.error.message
            : runNowMutation.error
              ? String(runNowMutation.error)
              : null
        }
        runNowPending={runNowMutation.isPending}
        onRunNow={(definition) => runNowMutation.mutate(definition)}
        onApproveRisks={async (definition, acknowledgedRisks, maxIterations, runAfter) => {
          try {
            await updateMutation.mutateAsync({
              id: definition.id,
              acknowledgedRisks,
              ...(maxIterations !== undefined ? { maxIterations } : {}),
            });
            if (runAfter) {
              await runNowMutation.mutateAsync(definition);
            }
          } catch {
            // Both mutations surface their errors through the detail action banner.
          }
        }}
        navigate={navigate}
      />
    );
  }

  return (
    <view className="AutomationsPage">
      <view className="AutomationsHeader AppWindowDragRegion chat-surface-divider">
        <view className="AutomationsHeaderSpacer" />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh"
          onClick={() => void automations.refetch()}
        >
          <RefreshCwIcon size={16} color={semanticIconColor("secondary")} />
        </Button>
      </view>
      <AutomationsIndexPrompt
        disabled={(sidebar.data?.projects.length ?? 0) === 0}
        onCreate={() => setCreateOpen(true)}
      />
      <AutomationDialog
        variant="create"
        open={createOpen}
        projects={sidebar.data?.projects ?? []}
        threads={sidebar.data?.threads ?? []}
        pending={createMutation.isPending}
        error={
          createMutation.error instanceof Error
            ? createMutation.error.message
            : createMutation.error
              ? String(createMutation.error)
              : null
        }
        // Like the web list, creating closes the dialog and keeps the list, where
        // the new automation appears; it does not open the detail.
        onCreate={(input) =>
          createMutation.mutate(input, { onSuccess: () => setCreateOpen(false) })
        }
        onOpenChange={setCreateOpen}
      />
    </view>
  );
}
