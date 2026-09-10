export function buildThreadRelaunchUrl(input: {
  readonly editorCenterMode: 'diff' | 'file';
  readonly editorChatOpen: boolean;
  readonly editorMode: boolean;
  readonly editorSearchActive: boolean;
  readonly environmentOpen: boolean;
  readonly diffFileTreeOpen: boolean;
  readonly explorerExpandedDirectories: readonly string[];
  readonly explorerOpen: boolean;
  readonly explorerPath: string | null;
  readonly explorerPresentationMode: 'dock' | 'single-file';
  readonly explorerQuery: string;
  readonly terminalOpen: boolean;
  readonly threadId: string;
}): string {
  const url = new URL(`synara://thread/${encodeURIComponent(input.threadId)}`);
  if (input.environmentOpen) url.searchParams.set('environment', 'open');
  if (input.diffFileTreeOpen) url.searchParams.set('diffFileTree', 'open');
  if (input.editorMode) {
    url.searchParams.set('editor', 'open');
    url.searchParams.set('editorMode', input.editorCenterMode);
    url.searchParams.set('editorChat', input.editorChatOpen ? 'open' : 'hidden');
    if (input.editorSearchActive) url.searchParams.set('editorSearch', 'open');
  }
  if (input.terminalOpen) url.searchParams.set('terminal', 'open');
  if (input.explorerOpen) {
    url.searchParams.set('explorer', 'open');
    url.searchParams.set('explorerMode', input.explorerPresentationMode);
    if (input.explorerPath) url.searchParams.set('explorerPath', input.explorerPath);
    if (input.explorerQuery) url.searchParams.set('explorerQuery', input.explorerQuery);
    for (const path of input.explorerExpandedDirectories) {
      url.searchParams.append('explorerExpanded', path);
    }
  }
  return url.toString();
}
