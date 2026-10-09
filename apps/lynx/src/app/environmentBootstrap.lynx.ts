import type {
  GitHubRepositoryResult,
  GitListBranchesResult,
  GitStatusLocalResult,
  ServerConfig,
  ServerListLocalServersResult,
} from "@synara/contracts";

import {
  gitBranchesQueryOptions,
  gitGithubRepositoryQueryOptions,
} from "@synara-web/lib/gitReactQuery";
import {
  serverConfigQueryOptions,
  serverLocalServersQueryOptions,
} from "@synara-web/lib/serverReactQuery";
import { ensureNativeApi } from "~/nativeApi";

import { sleepOnHost } from "../platform/timer";

export interface EnvironmentBootstrapData {
  readonly branches: GitListBranchesResult | null;
  readonly config: ServerConfig | null;
  readonly gitStatus: GitStatusLocalResult | null;
  readonly gitStatusLoaded: true;
  readonly localServers: ServerListLocalServersResult | null;
  readonly repository: GitHubRepositoryResult | null;
}

const ENVIRONMENT_BOOTSTRAP_TIMEOUT_MS = 3_000;

async function withinBootstrapBudget<T>(request: Promise<T>): Promise<T | null> {
  return Promise.race([
    request.then(
      (value) => value,
      () => null,
    ),
    sleepOnHost(ENVIRONMENT_BOOTSTRAP_TIMEOUT_MS).then(() => null),
  ]);
}

/**
 * First paint data for the environment panel, read through upstream's query
 * options so the panel's own queries start from the same cache entries.
 * `git.statusLocal` has no upstream query (the web panel waits for the full
 * status); it is a plain facade request used only as the placeholder.
 */
export async function fetchEnvironmentBootstrapData(
  workspaceRoot: string,
): Promise<EnvironmentBootstrapData> {
  "background only";
  const { queryClient } = await import(/* webpackMode: "eager" */ "./queries");

  const [gitStatus, branches, localServers] = await Promise.all([
    withinBootstrapBudget(ensureNativeApi().git.statusLocal({ cwd: workspaceRoot })),
    withinBootstrapBudget(queryClient.fetchQuery(gitBranchesQueryOptions(workspaceRoot))),
    withinBootstrapBudget(queryClient.fetchQuery(serverLocalServersQueryOptions())),
  ]);
  const [config, repository] = await Promise.all([
    withinBootstrapBudget(queryClient.fetchQuery(serverConfigQueryOptions())),
    withinBootstrapBudget(queryClient.fetchQuery(gitGithubRepositoryQueryOptions(workspaceRoot))),
  ]);

  return {
    branches,
    config,
    gitStatus,
    gitStatusLoaded: true,
    localServers,
    repository,
  };
}
