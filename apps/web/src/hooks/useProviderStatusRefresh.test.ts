import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import type { ServerConfig, ServerProviderStatus } from "@synara/contracts";

import { serverQueryKeys } from "../lib/serverReactQuery";
import { writeProviderStatusesToConfigCache } from "./useProviderStatusRefresh";

const providers = [
  {
    provider: "claudeAgent",
    available: true,
    version: "2.1.212",
  },
] as readonly ServerProviderStatus[];

function config(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    homeDir: "/tmp",
    cwd: "/tmp",
    providers: [],
    keybindings: [],
    editors: [],
    ...overrides,
  } as ServerConfig;
}

describe("writeProviderStatusesToConfigCache", () => {
  it("hydrates the complete config before merging an early provider refresh", async () => {
    const queryClient = new QueryClient();
    const loadConfig = vi.fn(async () => config({ homeDir: "/real-home" }));

    await writeProviderStatusesToConfigCache(queryClient, providers, loadConfig);

    expect(loadConfig).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(serverQueryKeys.config())).toEqual(
      config({ homeDir: "/real-home", providers: [...providers] }),
    );
  });

  it("merges into an existing config without refetching it", async () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(serverQueryKeys.config(), config({ cwd: "/workspace" }));
    const loadConfig = vi.fn(async () => config());

    await writeProviderStatusesToConfigCache(queryClient, providers, loadConfig);

    expect(loadConfig).not.toHaveBeenCalled();
    expect(queryClient.getQueryData<ServerConfig>(serverQueryKeys.config())).toMatchObject({
      cwd: "/workspace",
      providers,
    });
  });
});
