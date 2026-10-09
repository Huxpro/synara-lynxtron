import { useRef, useState, type ReactNode } from "@lynx-js/react";
import { getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef } from "@lynx-js/types";
import { buildArchivedThreadContextMenuItems } from "@synara/shared/contextMenu";
import { SettingsSection } from "@synara-web/components/settings/SettingsSection";
import { formatRelativeTime } from "@synara-web/lib/relativeTime";

import { Button } from "../components/ui/button";
import { ArchiveIcon } from "../lib/icons.lynx";
import { dispatchSynaraCommand } from "../data/synaraClient.lynx";
import { dialogs } from "../platform/dialogs";
import { showContextMenu } from "../platform/contextMenu";
import {
  resolveLongPressOffset,
  resolveSecondaryPointerOffset,
} from "../components/sidebar/threadContextActions.logic";
import { focusLynxNode } from "../components/ui/focus.lynx";
import { useSidebarSnapshot } from "./sidebarSnapshot.lynx";
import {
  createDeleteArchivedThreadCommand,
  createUnarchiveCommand,
  groupArchivedThreads,
} from "./settingsArchived.logic";

import "./settings-archived-panel.css";

function newCommandId(): string {
  return `lynx-archived-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function ArchivedThreadRow(props: {
  readonly children: ReactNode;
  readonly className: string;
  readonly onContextMenu: (
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) => void;
}) {
  const rowRef = useRef<NodesRef>(null);
  const openAtOffset = (offset: { readonly x: number; readonly y: number }) => {
    "background only";
    void getRectByRef(rowRef, true)
      .then((rect) =>
        props.onContextMenu({ x: rect.left + offset.x, y: rect.top + offset.y }, () =>
          focusLynxNode(rowRef),
        ),
      )
      .catch(() => {
        // A menu at invented coordinates is worse than no menu.
      });
  };
  return (
    <view
      ref={rowRef}
      className={props.className}
      bindmousedown={(event: {
        readonly button?: number;
        readonly buttons?: number;
        readonly x?: number;
        readonly y?: number;
      }) => {
        const offset = resolveSecondaryPointerOffset(event);
        if (offset) openAtOffset(offset);
      }}
      bindlongpress={(event) => openAtOffset(resolveLongPressOffset(event) ?? { x: 12, y: 12 })}
    >
      {props.children}
    </view>
  );
}

export function SettingsArchivedPanel() {
  const snapshotQuery = useSidebarSnapshot();
  const [pendingAction, setPendingAction] = useState<{
    readonly threadId: string;
    readonly type: "restore" | "delete";
  } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const groups = groupArchivedThreads(
    snapshotQuery.data?.projects ?? [],
    snapshotQuery.data?.archivedThreads ?? [],
  );

  async function restoreThread(threadId: string) {
    "background only";
    if (pendingAction) return;
    setPendingAction({ threadId, type: "restore" });
    setActionError(null);
    try {
      await dispatchSynaraCommand(
        createUnarchiveCommand({
          threadId,
          commandId: newCommandId(),
        }),
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to restore the thread.");
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteThread(threadId: string, threadTitle: string) {
    "background only";
    if (pendingAction) return;
    const confirmed = await dialogs.confirm(
      `Permanently delete "${threadTitle}"?\n\nThis will remove the thread and its conversation history forever.`,
    );
    if (!confirmed) return;

    setPendingAction({ threadId, type: "delete" });
    setActionError(null);
    try {
      await dispatchSynaraCommand(
        createDeleteArchivedThreadCommand({
          threadId,
          commandId: newCommandId(),
        }),
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete the thread.");
    } finally {
      setPendingAction(null);
    }
  }

  async function openArchivedThreadContextMenu(
    threadId: string,
    threadTitle: string,
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) {
    "background only";
    if (pendingAction) return;
    const action = await showContextMenu(buildArchivedThreadContextMenuItems(), position, {
      restoreFocus,
    });
    if (action === "restore") await restoreThread(threadId);
    if (action === "delete") await deleteThread(threadId, threadTitle);
  }

  if (snapshotQuery.isPending) {
    return (
      <view className="SettingsArchivedState">
        <text className="SettingsArchivedStateText">Loading archived threads…</text>
      </view>
    );
  }

  if (snapshotQuery.isError) {
    const errorMessage =
      snapshotQuery.error instanceof Error
        ? snapshotQuery.error.message
        : "Archived threads could not be loaded.";
    return (
      <view className="SettingsArchivedState SettingsArchivedState--error">
        <text
          className="SettingsArchivedStateText"
          accessibility-element
          accessibility-role="alert"
        >
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
      <view
        className="SettingsArchivedEmpty"
        accessibility-element
        accessibility-label="No archived threads. Archived threads will appear here and can be restored to the sidebar."
        accessibility-trait="text"
      >
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
      {actionError ? (
        <view
          className="SettingsArchivedRestoreError"
          accessibility-element
          accessibility-role="alert"
        >
          <text className="SettingsArchivedRestoreErrorText">{actionError}</text>
        </view>
      ) : null}
      {groups.map((group) => (
        <SettingsSection key={group.projectId ?? "unknown-project"} title={group.title}>
          {group.threads.map((thread, index) => (
            <ArchivedThreadRow
              key={thread.id}
              className={`SettingsArchivedRow${index > 0 ? " SettingsArchivedRow--divided" : ""}`}
              onContextMenu={(position, restoreFocus) =>
                void openArchivedThreadContextMenu(thread.id, thread.title, position, restoreFocus)
              }
            >
              <view className="SettingsArchivedRowCopy">
                <text className="SettingsArchivedRowTitle">{thread.title}</text>
                <text className="SettingsArchivedRowDescription">
                  Archived{" "}
                  {formatRelativeTime(
                    thread.archivedAt ?? thread.updatedAt ?? thread.createdAt ?? "",
                  )}
                </text>
              </view>
              <view className="SettingsArchivedRowActions">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={pendingAction !== null}
                  aria-label={`Restore ${thread.title}`}
                  onClick={() => void restoreThread(thread.id)}
                >
                  {pendingAction?.threadId === thread.id && pendingAction.type === "restore"
                    ? "Restoring…"
                    : "Restore"}
                </Button>
                <Button
                  size="xs"
                  variant="destructive"
                  disabled={pendingAction !== null}
                  aria-label={`Delete ${thread.title}`}
                  onClick={() => void deleteThread(thread.id, thread.title)}
                >
                  {pendingAction?.threadId === thread.id && pendingAction.type === "delete"
                    ? "Deleting…"
                    : "Delete"}
                </Button>
              </view>
            </ArchivedThreadRow>
          ))}
        </SettingsSection>
      ))}
    </view>
  );
}
