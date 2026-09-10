import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx thread transcript polling', () => {
  it('polls from the proven SliceRouter query owner', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );
    const routerOwnerSource = routerSource.slice(
      routerSource.indexOf('export function SliceRouter'),
      routerSource.indexOf('const [persistedLastRoute')
    );

    expect(routerSource).not.toContain('function useThreadTranscriptPolling');
    expect(routerOwnerSource).toContain(
      "queryKey: ['thread-detail', activeThreadId]"
    );
    expect(routerOwnerSource).not.toContain(
      "'thread-detail',\n      activeThreadId,\n      explorerTrimmedQuery"
    );
    expect(routerOwnerSource).toContain(
      'parseRoute(initialRoute).params.threadId ?? null'
    );
    expect(routerOwnerSource).toContain("'background only'");
    expect(routerOwnerSource).toContain('fetchThreadTranscriptRows(threadId)');
    expect(routerOwnerSource).toContain('fetchThreadHeaderSummary(threadId)');
    expect(routerOwnerSource).toContain('refetchInterval: 500');
    expect(routerOwnerSource).toContain('retry: false');
    expect(routerOwnerSource).toContain(
      'subscribeOrchestrationShellEvents((item) => {'
    );
    expect(routerOwnerSource).toContain(
      "void queryClient.invalidateQueries({ queryKey: ['threads'] });"
    );
    expect(routerOwnerSource).toContain('className={`AppNotificationStack${');
    expect(routerOwnerSource).toContain("route.pathname === '/components-lab'");
    expect(routerOwnerSource).toContain(
      "queryKey: ['thread-detail', activeThreadId]"
    );
    expect(routerOwnerSource).toContain("item.kind !== 'thread-upserted'");
    expect(routerOwnerSource).toContain('item.thread.id !== activeThreadId');
  });

  it('passes the query state into the thread surface', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );
    expect(routerSource).toContain(
      'currentThread={resolvedActiveThreadData?.summary}'
    );
    expect(routerSource).toContain('data={resolvedActiveThreadData?.data}');
    expect(routerSource).toContain('error={activeThreadError}');
    expect(routerSource).toContain('isPending={resolvedActiveThreadPending}');
  });

  it('delivers the startup route back to the background router', () => {
    const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(routerSource).toContain(
      "bridgeCall<{ readonly route?: unknown }>('shellRendererReady')"
    );
    expect(appSource).toContain(
      "bridgeCall('shellUiReady', { route: initialRoute ?? '/' })"
    );
    expect(routerSource).toContain(
      'Memory-history navigation remains available without shell events.'
    );
    expect(routerSource).toContain('setRoute(parseRoute(reply.route))');
    expect(routerSource).toContain('history.replace(reply.route)');
  });

  it('hydrates the initial route through shared Lynx init data', () => {
    const appSource = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(appSource).toContain('const initData = useInitData()');
    expect(appSource).toContain('initialRoute={initialRoute}');
    expect(appSource).not.toContain('initialThreadBootstrap=');
    expect(appSource).toContain('initialExplorerPath={initialExplorerPath}');
    expect(appSource).toContain('initialExplorerQuery={initialExplorerQuery}');
    expect(appSource).not.toContain('fetchThreadTranscriptRows(');
    expect(appSource).not.toContain('fetchThreadHeaderSummary(');
    expect(appSource).not.toContain('fetchExplorerEntries(');
    expect(appSource).not.toContain('fetchExplorerFile(');
    expect(appSource).not.toContain('queryClient.fetchQuery(');
    expect(appSource).toContain(
      'readPersistedAppearanceFallback(readPersistedAppearance).then('
    );
    expect(appSource).not.toContain(
      'Promise.all([\n      readPersistedAppearanceFallback(readPersistedAppearance)'
    );
    expect(appSource).not.toContain('Preparing Synara…');
    expect(appSource).toContain(
      '<SynaraLogo className="AppHydrationLogo" aria-label="Synara" />'
    );
    expect(routerSource).toContain('readonly initialRoute: string | null');
    expect(routerSource).toContain('useRoute(initialRoute)');
    expect(routerSource).toContain('resolvedActiveThreadData');
    expect(routerSource).not.toContain('matchingInitialThreadBootstrap');
  });
});
