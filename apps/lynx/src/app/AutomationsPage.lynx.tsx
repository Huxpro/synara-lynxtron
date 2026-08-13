import { useEffect, useMemo, useRef } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type { AutomationDefinitionRow, AutomationTriageRow } from '@synara/shared/automationList';
import { projectAutomationList } from '@synara/shared/automationList';

import { Button } from '../components/ui/button';
import { RefreshCwIcon } from '../lib/icons';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { sleepOnHost } from '../platform/timer';
import { fetchAutomations, fetchSidebarSnapshot } from './queries';
import './automations-page.css';

function useHostPolling(poll: () => Promise<unknown>, delayMs: number): void {
  const pollRef = useRef(poll);
  pollRef.current = poll;
  useEffect(() => {
    'background only';
    let cancelled = false;
    const schedule = () => {
      void sleepOnHost(delayMs).then(() => {
        if (cancelled) return;
        void pollRef.current().finally(schedule);
      });
    };
    schedule();
    return () => {
      cancelled = true;
    };
  }, [delayMs]);
}

function AutomationStatusDot({
  tone,
}: {
  readonly tone: AutomationDefinitionRow['tone'] | 'triage';
}) {
  return (
    <view className={`AutomationsStatusDot AutomationsStatusDot--${tone}`}>
      <view className="AutomationsStatusDotCore" />
    </view>
  );
}

function AutomationRow({
  row,
  onOpenThread,
}: {
  readonly row: AutomationDefinitionRow;
  readonly onOpenThread: (threadId: string) => void;
}) {
  const threadId = row.latestRun?.threadId ?? row.definition.targetThreadId;
  const interactive = threadId !== null;
  const interaction = useLynxInteractiveState({
    baseClassName: `AutomationsRow${
      interactive ? ' AutomationsRow--interactive' : ''
    }`,
    accessibleLabel: `${row.definition.name}. ${row.detail}. ${row.meta}`,
    accessibilityElement: true,
    accessibilityTraits: interactive ? 'button' : 'text',
    onActivate: interactive ? () => onOpenThread(threadId) : undefined,
  });
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
    >
      <AutomationStatusDot tone={row.tone} />
      <text className="AutomationsRowTitle">{row.definition.name}</text>
      <text className="AutomationsRowDetail">{row.detail}</text>
      <text className="AutomationsRowMeta">{row.meta}</text>
    </view>
  );
}

function AutomationTriageListRow({
  row,
  onOpenThread,
}: {
  readonly row: AutomationTriageRow;
  readonly onOpenThread: (threadId: string) => void;
}) {
  const interactive = row.run.threadId !== null;
  const interaction = useLynxInteractiveState({
    baseClassName: `AutomationsRow${
      interactive ? ' AutomationsRow--interactive' : ''
    }`,
    accessibleLabel: `${row.title}. ${row.detail}. ${row.meta}`,
    accessibilityElement: true,
    accessibilityTraits: interactive ? 'button' : 'text',
    onActivate:
      interactive && row.run.threadId
        ? () => onOpenThread(row.run.threadId as string)
        : undefined,
  });
  return (
    <view
      className={interaction.className}
      {...interaction.eventProps}
    >
      <AutomationStatusDot tone="triage" />
      <text className="AutomationsRowTitle">{row.title}</text>
      <text className="AutomationsRowDetail">{row.detail}</text>
      <text className="AutomationsRowMeta">{row.meta}</text>
    </view>
  );
}

function AutomationSection({
  title,
  rows,
  onOpenThread,
}: {
  readonly title: string;
  readonly rows: readonly AutomationDefinitionRow[];
  readonly onOpenThread: (threadId: string) => void;
}) {
  if (rows.length === 0) return null;
  return (
    <view className="AutomationsSection">
      <text className="AutomationsSectionTitle">{title}</text>
      <view className="AutomationsRows">
        {rows.map((row) => (
          <AutomationRow
            key={row.definition.id}
            row={row}
            onOpenThread={onOpenThread}
          />
        ))}
      </view>
    </view>
  );
}

export function AutomationsPage({
  navigate,
}: {
  readonly navigate: (to: string) => void;
}) {
  const automations = useQuery({
    queryKey: ['automations'],
    queryFn: fetchAutomations,
  });
  const sidebar = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: fetchSidebarSnapshot,
  });
  useHostPolling(automations.refetch, 5_000);
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
    [automations.data, sidebar.data]
  );
  const openThread = (threadId: string) => navigate(`/thread/${threadId}`);

  return (
    <view className="AutomationsPage">
      <view className="AutomationsHeader AppWindowDragRegion">
        <view className="AutomationsHeaderSpacer" />
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Refresh"
          onClick={() => void automations.refetch()}
        >
          <RefreshCwIcon size={16} color="var(--foreground)" />
        </Button>
        <Button size="sm" disabled aria-label="New automation">
          New automation
        </Button>
      </view>
      <scroll-view
        className="AutomationsScroller"
        scroll-orientation="vertical"
      >
        <view className="AutomationsContent">
          <text className="AutomationsTitle">Automations</text>
          {automations.isPending ? (
            <view
              className="AutomationsState"
              accessibility-element={true}
              accessibility-label="Loading automations"
              accessibility-traits="updating"
            >
              <text className="AutomationsStateText">
                Loading automations...
              </text>
            </view>
          ) : automations.error ? (
            <view
              className="AutomationsState"
              accessibility-element={true}
              accessibility-label="Automations could not be loaded"
              accessibility-traits="text"
            >
              <text className="AutomationsStateTitle">
                Automations could not be loaded
              </text>
              <text className="AutomationsStateText">
                Check the server connection and try again.
              </text>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void automations.refetch()}
              >
                Try again
              </Button>
            </view>
          ) : projection &&
            projection.current.length === 0 &&
            projection.paused.length === 0 ? (
            <view
              className="AutomationsState"
              accessibility-element={true}
              accessibility-label="No automations yet. Schedule a prompt to run on its own, or wake an existing thread on a loop."
              accessibility-traits="text"
            >
              <text className="AutomationsStateTitle">No automations yet</text>
              <text className="AutomationsStateText">
                Schedule a prompt to run on its own, or wake an existing thread
                on a loop.
              </text>
            </view>
          ) : projection ? (
            <view className="AutomationsSections">
              {projection.triage.length > 0 ? (
                <view className="AutomationsSection">
                  <view className="AutomationsSectionHeader">
                    <text className="AutomationsSectionTitle">
                      Needs review
                    </text>
                    <text className="AutomationsSectionCount">
                      Unread {projection.unreadTriageCount}
                    </text>
                  </view>
                  <view className="AutomationsRows">
                    {projection.triage.map((row) => (
                      <AutomationTriageListRow
                        key={row.run.id}
                        row={row}
                        onOpenThread={openThread}
                      />
                    ))}
                  </view>
                </view>
              ) : null}
              <AutomationSection
                title="Current"
                rows={projection.current}
                onOpenThread={openThread}
              />
              <AutomationSection
                title="Paused"
                rows={projection.paused}
                onOpenThread={openThread}
              />
            </view>
          ) : null}
        </view>
      </scroll-view>
    </view>
  );
}
