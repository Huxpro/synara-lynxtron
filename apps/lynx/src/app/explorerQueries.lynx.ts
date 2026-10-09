// FILE: app/explorerQueries.lynx.ts
// Purpose: The Explorer's visible reads as observers of upstream's project
//   queries (upstream keys), so session sync's project invalidations refresh
//   what is on screen and there is one cache. Selection changes and unmounts
//   cancel through the observers. Syntax highlighting is derived from the file
//   contents by a separate, Lynx-only host query.
// Layer: L3 orchestration (Lynx).

import { useEffect, useRef } from "@lynx-js/react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectEntry, ProjectReadFileResult } from "@synara/contracts";
import { isLocalAbsolutePath } from "@synara/shared/path";
import {
  isLocalPreviewGrantUsable,
  projectListDirectoriesQueryOptions,
  projectLocalPreviewGrantQueryOptions,
  projectQueryKeys,
  projectReadFileQueryOptions,
  projectSearchEntriesQueryOptions,
} from "@synara-web/lib/projectReactQuery";

import type { NativeSyntaxHighlightThemes } from "../main/syntaxHighlightingContract.logic";

const EXPLORER_SEARCH_LIMIT = 80;

/** Root listing, or the file search when a query is typed. */
export function useExplorerEntries(input: {
  readonly workspaceRoot: string | null;
  readonly query: string;
}) {
  const searching = input.query.length > 0;
  const listing = useQuery(
    projectListDirectoriesQueryOptions({
      cwd: input.workspaceRoot,
      includeFiles: true,
      enabled: !searching,
    }),
  );
  const search = useQuery(
    projectSearchEntriesQueryOptions({
      cwd: input.workspaceRoot,
      query: input.query,
      kind: "file",
      limit: EXPLORER_SEARCH_LIMIT,
    }),
  );
  const active = searching ? search : listing;
  // Upstream keeps the previous result as a placeholder while a new key loads;
  // the Explorer shows its loading state for that window, as it always did.
  const loading = active.isPending || (active.isPlaceholderData && active.isFetching);
  return {
    entries: loading ? [] : (active.data?.entries ?? []),
    truncated: searching && !loading ? (search.data?.truncated ?? false) : false,
    isError: active.isError,
    isPending: input.workspaceRoot !== null && loading,
  };
}

/** One listing per expanded directory; a failed directory is reported, not fatal. */
export function useExplorerDirectories(input: {
  readonly workspaceRoot: string | null;
  readonly expandedPaths: readonly string[];
  readonly enabled: boolean;
}) {
  const results = useQueries({
    queries: input.expandedPaths.map((relativePath) =>
      projectListDirectoriesQueryOptions({
        cwd: input.workspaceRoot,
        relativePath,
        includeFiles: true,
        enabled: input.enabled,
      }),
    ),
  });
  const listed: (readonly [string, readonly ProjectEntry[], boolean])[] = [];
  input.expandedPaths.forEach((path, index) => {
    const result = results[index];
    if (!result) return;
    if (result.isError) listed.push([path, [], true]);
    else if (!result.isPending && !result.isPlaceholderData) {
      listed.push([path, result.data?.entries ?? [], false]);
    }
  });
  return {
    results: listed,
    isFetching: results.some((result) => result.isFetching),
  };
}

/**
 * The selected file. A path outside the workspace is read with a short-lived
 * preview grant; when a read made with a grant is rejected (the server
 * restarted and forgot its tokens), that grant is evicted and the read is
 * retried once with a fresh one. A second rejection is shown, not retried.
 */
export function useExplorerFile(input: {
  readonly workspaceRoot: string | null;
  readonly relativePath: string | null;
  readonly enabled: boolean;
}) {
  const queryClient = useQueryClient();
  const path = input.relativePath;
  const needsGrant = path !== null && isLocalAbsolutePath(path);
  const active = input.enabled && input.workspaceRoot !== null && path !== null;
  const grantQuery = useQuery(
    projectLocalPreviewGrantQueryOptions({ path, enabled: active && needsGrant }),
  );
  const previewGrant =
    needsGrant && isLocalPreviewGrantUsable(grantQuery.data)
      ? (grantQuery.data?.grant ?? null)
      : null;
  const fileQuery = useQuery(
    projectReadFileQueryOptions({
      cwd: input.workspaceRoot,
      relativePath: path,
      previewGrant,
      enabled: active && (!needsGrant || previewGrant !== null),
    }),
  );

  // Per selected path: the grant a read was rejected with, and whether the one
  // automatic retry has been spent.
  const recoveryRef = useRef<{
    path: string | null;
    rejectedGrant: string | null;
    retried: boolean;
  }>({ path: null, rejectedGrant: null, retried: false });
  if (recoveryRef.current.path !== path) {
    recoveryRef.current = { path, rejectedGrant: null, retried: false };
  }
  const { errorUpdatedAt, isError, isFetching, isSuccess, refetch } = fileQuery;
  useEffect(() => {
    "background only";
    const recovery = recoveryRef.current;
    if (isSuccess) {
      recovery.rejectedGrant = null;
      recovery.retried = false;
      return;
    }
    if (!needsGrant || path === null || !isError || isFetching || previewGrant === null) return;
    if (recovery.rejectedGrant === null) {
      if (recovery.retried) return;
      // Evict the rejected grant; its observer mints a new one.
      recovery.rejectedGrant = previewGrant;
      void queryClient.resetQueries({
        queryKey: projectQueryKeys.localPreviewGrant(path),
        exact: true,
      });
      return;
    }
    if (recovery.rejectedGrant !== previewGrant && !recovery.retried) {
      // This render's options carry the fresh grant: read once more.
      // (Joining, not restarting, the read the re-enabled observer may have begun.)
      recovery.retried = true;
      recovery.rejectedGrant = null;
      void refetch({ cancelRefetch: false });
    }
  }, [
    errorUpdatedAt,
    isError,
    isFetching,
    isSuccess,
    needsGrant,
    path,
    previewGrant,
    queryClient,
    refetch,
  ]);

  const retry = () => {
    "background only";
    if (needsGrant && path !== null && previewGrant !== null) {
      // An explicit Retry of a grant-authorized read starts from a fresh
      // grant: the effect above reads once when it arrives.
      recoveryRef.current = { path, rejectedGrant: previewGrant, retried: false };
      void queryClient.resetQueries({
        queryKey: projectQueryKeys.localPreviewGrant(path),
        exact: true,
      });
      return;
    }
    recoveryRef.current = { path, rejectedGrant: null, retried: false };
    void refetch();
  };

  return {
    file: (fileQuery.data ?? null) as ProjectReadFileResult | null,
    isError: fileQuery.isError || (needsGrant && grantQuery.isError),
    isPending: active && (fileQuery.isPending || (needsGrant && grantQuery.isPending)),
    isRetrying: fileQuery.isError && fileQuery.isFetching,
    retry,
  };
}

/** Host-side highlighting of the file on screen (Lynx-only; see hostSyntaxHighlight.lynx.ts). */
export function useExplorerSyntaxHighlight(
  file: ProjectReadFileResult | null,
): NativeSyntaxHighlightThemes | null {
  const query = useQuery({
    queryKey: ["explorer-syntax-highlight", file?.relativePath ?? null, file?.contents ?? null],
    queryFn: async (): Promise<NativeSyntaxHighlightThemes | null> => {
      "background only";
      if (!file) return null;
      const { highlightExplorerCode } = await import(
        /* webpackMode: "eager" */ "../data/hostSyntaxHighlight.lynx"
      );
      return highlightExplorerCode({ code: file.contents, path: file.relativePath }).catch(
        () => null,
      );
    },
    enabled: file !== null,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
  return query.data ?? null;
}
