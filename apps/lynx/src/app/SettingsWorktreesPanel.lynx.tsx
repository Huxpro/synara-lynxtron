import { useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import { SettingsSection } from '@synara-web/components/settings/SettingsSection';
import { formatWorktreePathForDisplay } from '@synara-web/worktreeCleanup';

import { Button } from '../components/ui/button';
import {
  dispatchSynaraCommand,
  fetchManagedWorktrees,
  removeManagedWorktree,
} from '../data/synaraClient.lynx';
import { dialogs } from '../platform/dialogs';
import { fetchSidebarSnapshot, queryClient } from './queries';
import {
  createDeleteThreadCommand,
  groupManagedWorktrees,
  linkedWorktreeCounts,
} from './settingsWorktrees.logic';

import './settings-worktrees-panel.css';

function newCommandId(): string {
  return `lynx-worktree-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function deleteConfirmation(input: {
  readonly displayName: string;
  readonly activeCount: number;
  readonly archivedCount: number;
}): string {
  const total = input.activeCount + input.archivedCount;
  if (total === 0) {
    return [
      `Delete worktree "${input.displayName}"?`,
      'This removes the Git worktree from disk.',
    ].join('\n');
  }
  const conversationLabel = total === 1 ? 'conversation is' : 'conversations are';
  return [
    `Delete worktree "${input.displayName}"?`,
    '',
    `${input.activeCount} active and ${input.archivedCount} archived ${conversationLabel} linked to this worktree.`,
    input.archivedCount > 0
      ? 'Archived conversations will be deleted first.'
      : 'Deleting it can break reopening those chats in the same workspace.',
    '',
    'Delete the worktree anyway?',
  ].join('\n');
}

export function SettingsWorktreesPanel() {
  const worktreesQuery = useQuery({
    queryKey: ['managed-worktrees'],
    queryFn: () => {
      'background only';
      return fetchManagedWorktrees();
    },
  });
  const snapshotQuery = useQuery({
    queryKey: ['sidebar-snapshot'],
    queryFn: () => {
      'background only';
      return fetchSidebarSnapshot();
    },
  });
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const groups = groupManagedWorktrees(
    worktreesQuery.data?.worktrees ?? [],
    snapshotQuery.data?.workspaceThreads ?? []
  );

  async function deleteWorktree(input: {
    readonly workspaceRoot: string;
    readonly path: string;
    readonly linkedThreads: ReturnType<
      typeof groupManagedWorktrees
    >[number]['worktrees'][number]['linkedThreads'];
  }) {
    'background only';
    if (deletingPath) return;
    const counts = linkedWorktreeCounts(input.linkedThreads);
    const confirmed = await dialogs.confirm(
      deleteConfirmation({
        displayName: formatWorktreePathForDisplay(input.path),
        activeCount: counts.active,
        archivedCount: counts.archived,
      })
    );
    if (!confirmed) return;

    setDeletingPath(input.path);
    setDeleteError(null);
    try {
      for (const thread of input.linkedThreads) {
        if (thread.archivedAt == null) continue;
        await dispatchSynaraCommand(
          createDeleteThreadCommand({
            threadId: thread.id,
            commandId: newCommandId(),
          })
        );
      }
      await removeManagedWorktree({
        cwd: input.workspaceRoot,
        path: input.path,
        force: true,
      });
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'Unable to delete the worktree.'
      );
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['managed-worktrees'] }),
        queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] }),
      ]);
      setDeletingPath(null);
    }
  }

  if (worktreesQuery.isPending || snapshotQuery.isPending) {
    return (
      <view className="SettingsWorktreesState">
        <text className="SettingsWorktreesStateText">
          Loading managed worktrees…
        </text>
      </view>
    );
  }

  if (worktreesQuery.isError || snapshotQuery.isError) {
    const error = worktreesQuery.error ?? snapshotQuery.error;
    return (
      <view className="SettingsWorktreesState SettingsWorktreesState--error">
        <text className="SettingsWorktreesStateText">
          {error instanceof Error ? error.message : 'Unable to load worktrees.'}
        </text>
        <Button
          size="xs"
          variant="outline"
          aria-label="Retry loading managed worktrees"
          onClick={() => {
            void worktreesQuery.refetch();
            void snapshotQuery.refetch();
          }}
        >
          Retry
        </Button>
      </view>
    );
  }

  if (groups.length === 0) {
    return (
      <view className="SettingsWorktreesState">
        <text className="SettingsWorktreesStateText">
          No app-managed worktrees found yet.
        </text>
      </view>
    );
  }

  return (
    <view className="SettingsWorktreesPanel">
      {deleteError ? (
        <view className="SettingsWorktreesDeleteError">
          <text className="SettingsWorktreesDeleteErrorText">
            {deleteError}
          </text>
        </view>
      ) : null}
      {groups.map((group) => (
        <SettingsSection key={group.workspaceRoot} title={group.workspaceRoot}>
          {group.worktrees.map((worktree, index) => (
            <view
              key={worktree.path}
              className={`SettingsWorktreesRow${
                index > 0 ? ' SettingsWorktreesRow--divided' : ''
              }`}
            >
              <view className="SettingsWorktreesRowCopy">
                <text className="SettingsWorktreesRowTitle">Worktree</text>
                <text className="SettingsWorktreesPath">{worktree.path}</text>
                <text className="SettingsWorktreesConversationLabel">
                  Conversations
                </text>
                {worktree.linkedThreads.length > 0 ? (
                  <view className="SettingsWorktreesConversationList">
                    {worktree.linkedThreads.map((thread) => (
                      <text
                        key={thread.id}
                        className="SettingsWorktreesConversation"
                      >
                        {thread.title}
                      </text>
                    ))}
                  </view>
                ) : (
                  <text className="SettingsWorktreesRowDescription">
                    No conversations linked to this worktree.
                  </text>
                )}
              </view>
              <view className="SettingsWorktreesActions">
                <Button
                  size="xs"
                  variant="destructive"
                  disabled={deletingPath !== null}
                  aria-label={`Delete ${formatWorktreePathForDisplay(
                    worktree.path
                  )} worktree`}
                  onClick={() =>
                    void deleteWorktree({
                      workspaceRoot: group.workspaceRoot,
                      path: worktree.path,
                      linkedThreads: worktree.linkedThreads,
                    })
                  }
                >
                  {deletingPath === worktree.path ? 'Deleting…' : 'Delete'}
                </Button>
                {worktree.linkedThreads.length > 0 ? (
                  <text className="SettingsWorktreesActionHint">
                    Linked conversations exist. Deleting will ask for
                    confirmation.
                  </text>
                ) : null}
              </view>
            </view>
          ))}
        </SettingsSection>
      ))}
    </view>
  );
}
