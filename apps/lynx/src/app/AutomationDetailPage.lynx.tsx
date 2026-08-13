import type {
  AutomationDefinition,
  AutomationRun,
} from '@synara/contracts';
import {
  formatAutomationRunTimestamp,
  projectAutomationDetail,
  type AutomationListProject,
  type AutomationListThread,
} from '@synara/shared/automationList';

import { Button } from '../components/ui/button';
import { ChevronRightIcon } from '../lib/icons';

function DetailGroup({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <view className="AutomationDetailGroup">
      <text className="AutomationDetailGroupTitle">{title}</text>
      <view className="AutomationDetailGroupRows">{children}</view>
    </view>
  );
}

function DetailRow({
  label,
  value,
  compact = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly compact?: boolean;
}) {
  return (
    <view
      className={`AutomationDetailRow AutomationDetailRow--${
        compact || label === 'Mode'
          ? 'compact'
          : label === 'Time'
            ? 'time'
            : 'control'
      }`}
    >
      <text className="AutomationDetailRowLabel">{label}</text>
      <text className="AutomationDetailRowValue">{value}</text>
    </view>
  );
}

export function AutomationDetailPage({
  automationId,
  definitions,
  runs,
  projects,
  threads,
  navigate,
}: {
  readonly automationId: string;
  readonly definitions: readonly AutomationDefinition[];
  readonly runs: readonly AutomationRun[];
  readonly projects: readonly AutomationListProject[];
  readonly threads: readonly AutomationListThread[];
  readonly navigate: (to: string) => void;
}) {
  const definition =
    definitions.find((candidate) => candidate.id === automationId) ?? null;
  if (!definition) {
    return (
      <view className="AutomationDetailNotFound">
        <text className="AutomationDetailNotFoundText">
          Automation not found.
        </text>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/automations')}
        >
          Back to automations
        </Button>
      </view>
    );
  }
  const projectName =
    projects.find((project) => project.id === definition.projectId)?.name ??
    'Unknown project';
  const targetThreadTitle = definition.targetThreadId
    ? threads.find((thread) => thread.id === definition.targetThreadId)?.title
    : null;
  const detail = projectAutomationDetail({
    definition,
    projectName,
    runs: runs.filter((run) => run.automationId === definition.id),
    targetThreadTitle,
  });

  return (
    <view className="AutomationDetailPage">
      <view className="AutomationDetailMain">
        <view className="AutomationDetailHeader AppWindowDragRegion">
          <view
            className="AutomationDetailBreadcrumb"
            accessibility-element={true}
            accessibility-label="Back to automations"
            accessibility-traits="button"
            focusable={true}
            bindtap={() => navigate('/automations')}
          >
            <text className="AutomationDetailBreadcrumbParent">
              Automations
            </text>
            <ChevronRightIcon size={14} color="var(--muted-foreground)" />
            <text className="AutomationDetailBreadcrumbCurrent">
              {definition.name}
            </text>
          </view>
        </view>
        <scroll-view
          className="AutomationDetailPromptScroller"
          scroll-orientation="vertical"
        >
          <view className="AutomationDetailPrompt">
            <text className="AutomationDetailTitle">{definition.name}</text>
            <text className="AutomationDetailPromptText">
              {definition.prompt}
            </text>
          </view>
        </scroll-view>
      </view>
      <view className="AutomationDetailAside">
        <view className="AutomationDetailActionsHeader AppWindowDragRegion" />
        <scroll-view
          className="AutomationDetailAsideScroller"
          scroll-orientation="vertical"
        >
          <view className="AutomationDetailAsideContent">
            <DetailGroup title="Status">
              <DetailRow compact label="Status" value={detail.status} />
              <DetailRow
                compact
                label="Next run"
                value={formatAutomationRunTimestamp(detail.nextRunAt)}
              />
              <DetailRow
                compact
                label="Last ran"
                value={formatAutomationRunTimestamp(detail.lastRunAt)}
              />
            </DetailGroup>
            <DetailGroup title="Details">
              {detail.detailRows.map((row) => (
                <DetailRow key={row.label} label={row.label} value={row.value} />
              ))}
            </DetailGroup>
            <DetailGroup title="Previous runs">
              {detail.runs.length === 0 ? (
                <text className="AutomationDetailNoRuns">No runs yet.</text>
              ) : (
                detail.runs.map((row) => (
                  <view
                    key={row.run.id}
                    className={`AutomationDetailRun${
                      row.run.threadId ? ' AutomationDetailRun--interactive' : ''
                    }`}
                    accessibility-element={true}
                    accessibility-label={`${row.title}. ${row.detail}. ${row.meta}`}
                    accessibility-traits={
                      row.run.threadId ? 'button' : 'text'
                    }
                    focusable={row.run.threadId !== null}
                    bindtap={
                      row.run.threadId
                        ? () => navigate(`/thread/${row.run.threadId}`)
                        : undefined
                    }
                  >
                    <view className="AutomationDetailRunDot" />
                    <text className="AutomationDetailRunText">
                      {row.title} · {row.detail}
                    </text>
                    <text className="AutomationDetailRunMeta">{row.meta}</text>
                  </view>
                ))
              )}
            </DetailGroup>
          </view>
        </scroll-view>
      </view>
    </view>
  );
}
