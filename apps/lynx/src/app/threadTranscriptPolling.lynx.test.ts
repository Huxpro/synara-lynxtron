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
    expect(routerOwnerSource).toContain("'thread-detail'");
    expect(routerOwnerSource).toContain('explorerTrimmedQuery');
    expect(routerOwnerSource).toContain('explorerSelectedPath');
    expect(routerOwnerSource).toContain(
      'parseRoute(initialRoute).params.threadId ?? null'
    );
    expect(routerOwnerSource).toContain("'background only'");
    expect(routerOwnerSource).toContain('fetchThreadTranscriptRows(threadId)');
    expect(routerOwnerSource).toContain('fetchThreadHeaderSummary(threadId)');
    expect(routerOwnerSource).toContain('refetchInterval: 500');
    expect(routerOwnerSource).toContain('retry: false');
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
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(routerSource).toContain(
      "bridgeCall<{ readonly route?: unknown }>('shellRendererReady')"
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
    expect(appSource).toContain('initialThreadBootstrap={initialThreadBootstrap}');
    expect(appSource).toContain('initialExplorerPath={initialExplorerPath}');
    expect(appSource).toContain('initialExplorerQuery={initialExplorerQuery}');
    expect(appSource).toContain('fetchThreadTranscriptRows(threadMatch[1])');
    expect(appSource).toContain('fetchThreadHeaderSummary(threadMatch[1])');
    expect(appSource).toContain('fetchExplorerEntries({');
    expect(appSource).toContain('fetchExplorerFile({');
    expect(routerSource).toContain('readonly initialRoute: string | null');
    expect(routerSource).toContain('useRoute(initialRoute)');
    expect(routerSource).toContain('resolvedActiveThreadData');
  });
});
