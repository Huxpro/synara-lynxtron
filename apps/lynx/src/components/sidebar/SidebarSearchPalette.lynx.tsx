import { useMemo, useState } from '@lynx-js/react';

import {
  SidebarSearchPalette,
  type SidebarSearchPaletteMode,
} from '@synara-web/components/SidebarSearchPalette';
import { buildSidebarSearchActions } from '@synara-web/components/SidebarSearchActions.logic';
import type { SidebarSnapshot } from '../../app/queries';

const LYNX_SEARCH_ACTIONS = buildSidebarSearchActions({
  newChatShortcutLabel: '⌘N',
  includeNewThread: false,
  includeAddProject: false,
  includeImportThread: false,
  includeFeedback: false,
  includeUsageSettings: false,
  includeSpaces: false,
  includeNewSpace: false,
});

export function SidebarSearchPaletteLynx(props: {
  readonly open: boolean;
  readonly snapshot: SidebarSnapshot | undefined;
  readonly searchStatus: 'ready' | 'loading' | 'error';
  readonly searchErrorMessage?: string | null;
  readonly onRetrySearch: () => void;
  readonly onOpenChange: (open: boolean) => void;
  readonly onOpenProject: (projectId: string) => void;
  readonly onOpenThread: (threadId: string) => void;
  readonly onCreateThread: () => void;
  readonly onOpenSettings: () => void;
}) {
  const [mode, setMode] = useState<SidebarSearchPaletteMode>('search');
  const projects = useMemo(
    () =>
      (props.snapshot?.searchProjects ?? []).filter((project) =>
        (props.snapshot?.projects ?? []).some(
          (source) => source.id === project.id && source.kind === 'project'
        )
      ),
    [props.snapshot]
  );
  const threads = props.snapshot?.searchThreads ?? [];

  return (
    <SidebarSearchPalette
      open={props.open}
      mode={mode}
      onModeChange={setMode}
      onOpenChange={props.onOpenChange}
      actions={LYNX_SEARCH_ACTIONS}
      projects={projects}
      threads={threads}
      searchStatus={props.searchStatus}
      searchErrorMessage={props.searchErrorMessage}
      onRetrySearch={props.onRetrySearch}
      onCreateChat={props.onCreateThread}
      onCreateThread={props.onCreateThread}
      onAddProjectPath={() => Promise.resolve()}
      homeDir={null}
      onOpenSettings={props.onOpenSettings}
      onOpenFeedback={() => {}}
      onOpenUsageSettings={props.onOpenSettings}
      onOpenProject={props.onOpenProject}
      onOpenThread={props.onOpenThread}
      importProviders={[]}
      onImportThread={() => Promise.resolve()}
      filesystemBrowseEnabled={false}
      appearanceEnabled={false}
    />
  );
}
