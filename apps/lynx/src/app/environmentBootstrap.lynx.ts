import type {
  GitHubRepositoryResult,
  GitListBranchesResult,
  GitStatusLocalResult,
  ServerConfig,
  ServerListLocalServersResult,
} from '@synara/contracts';

import { sleepOnHost } from '../platform/timer';

export interface EnvironmentBootstrapData {
  readonly branches: GitListBranchesResult | null;
  readonly config: ServerConfig | null;
  readonly gitStatus: GitStatusLocalResult | null;
  readonly gitStatusLoaded: true;
  readonly localServers: ServerListLocalServersResult | null;
  readonly repository: GitHubRepositoryResult | null;
}

const ENVIRONMENT_BOOTSTRAP_TIMEOUT_MS = 3_000;

async function withinBootstrapBudget<T>(
  request: Promise<T>
): Promise<T | null> {
  return Promise.race([
    request.then(
      (value) => value,
      () => null
    ),
    sleepOnHost(ENVIRONMENT_BOOTSTRAP_TIMEOUT_MS).then(() => null),
  ]);
}

export async function fetchEnvironmentBootstrapData(
  workspaceRoot: string
): Promise<EnvironmentBootstrapData> {
  const {
    fetchGitBranches,
    fetchGitHubRepository,
    fetchGitStatusLocal,
    fetchLocalServers,
    fetchServerConfig,
  } = await import(/* webpackMode: "eager" */ '../data/synaraClient.lynx');

  const [gitStatus, branches, localServers] = await Promise.all([
    withinBootstrapBudget(fetchGitStatusLocal(workspaceRoot)),
    withinBootstrapBudget(fetchGitBranches(workspaceRoot)),
    withinBootstrapBudget(fetchLocalServers()),
  ]);
  const [config, repository] = await Promise.all([
    withinBootstrapBudget(fetchServerConfig()),
    withinBootstrapBudget(fetchGitHubRepository(workspaceRoot)),
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
