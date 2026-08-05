import { useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import { SettingsSection } from '@synara-web/components/settings/SettingsSection';
import { formatRelativeTime } from '@synara-web/lib/relativeTime';

import { Button } from '../components/ui/button';
import { ArchiveIcon } from '../lib/icons.lynx';
import { dispatchSynaraCommand } from '../data/synaraClient.lynx';
import { fetchSidebarSnapshot, queryClient } from './queries';
import {
  createUnarchiveCommand,
  groupArchivedThreads,
} from './settingsArchived.logic';

import './settings-archived-panel.css';

function newCommandId(): string {
  return `lynx-archived-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

export function SettingsArchivedPanel() {
  const snapshotQuery = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: fetchSidebarSnapshot,
  });
  const [restoringThreadId, setRestoringThreadId] = useState<string | null>(
    null
  );
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const groups = groupArchivedThreads(
    snapshotQuery.data?.projects ?? [],
    snapshotQuery.data?.archivedThreads ?? []
  );

  async function restoreThread(threadId: string) {
    'background only';
    if (restoringThreadId) return;
    setRestoringThreadId(threadId);
    setRestoreError(null);
    try {
      await dispatchSynaraCommand(
        createUnarchiveCommand({
          threadId,
          commandId: newCommandId(),
        })
      );
      await queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] });
    } catch (error) {
      setRestoreError(
        error instanceof Error ? error.message : 'Unable to restore the thread.'
      );
    } finally {
      setRestoringThreadId(null);
    }
  }

  if (snapshotQuery.isPending) {
    return (
      <view className="SettingsArchivedState">
        <text className="SettingsArchivedStateText">
          Loading archived threads…
        </text>
      </view>
    );
  }

  if (snapshotQuery.isError) {
    const errorMessage =
      snapshotQuery.error instanceof Error
        ? snapshotQuery.error.message
        : 'Archived threads could not be loaded.';
    return (
      <view className="SettingsArchivedState SettingsArchivedState--error">
        <text className="SettingsArchivedStateText">
          {errorMessage}
        </text>
        <Button
          size="xs"
          variant="outline"
          aria-label="Retry loading archived threads"
          onClick={() => void snapshotQuery.refetch()}
        >
          Retry
        </Button>
      </view>
    );
  }

  if (groups.length === 0) {
    return (
      <view className="SettingsArchivedEmpty">
        <view className="SettingsArchivedEmptyIconShell">
          <ArchiveIcon
            className="SettingsArchivedEmptyIcon"
            size={20}
            color="var(--muted-foreground)"
          />
        </view>
        <text className="SettingsArchivedEmptyTitle">No archived threads</text>
        <text className="SettingsArchivedEmptyDescription">
          Archived threads will appear here and can be restored to the sidebar.
        </text>
      </view>
    );
  }

  return (
    <view className="SettingsArchivedPanel">
      {restoreError ? (
        <view className="SettingsArchivedRestoreError">
          <text className="SettingsArchivedRestoreErrorText">
            {restoreError}
          </text>
        </view>
      ) : null}
      {groups.map((group) => (
        <SettingsSection
          key={group.projectId ?? 'unknown-project'}
          title={group.title}
        >
          {group.threads.map((thread, index) => (
            <view
              key={thread.id}
              className={`SettingsArchivedRow${
                index > 0 ? ' SettingsArchivedRow--divided' : ''
              }`}
            >
              <view className="SettingsArchivedRowCopy">
                <text className="SettingsArchivedRowTitle">{thread.title}</text>
                <text className="SettingsArchivedRowDescription">
                  Archived{' '}
                  {formatRelativeTime(
                    thread.archivedAt ??
                      thread.updatedAt ??
                      thread.createdAt ??
                      ''
                  )}
                </text>
              </view>
              <Button
                size="xs"
                variant="outline"
                disabled={restoringThreadId !== null}
                aria-label={`Restore ${thread.title}`}
                onClick={() => void restoreThread(thread.id)}
              >
                {restoringThreadId === thread.id ? 'Restoring…' : 'Restore'}
              </Button>
            </view>
          ))}
        </SettingsSection>
      ))}
    </view>
  );
}
