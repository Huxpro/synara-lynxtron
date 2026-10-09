// FILE: GitCore.statusLocal.test.ts
// Purpose: `statusDetails(cwd, { refreshRemote: false })` (the fork's `git.statusLocal`
//   path) must not schedule the background upstream fetch that the default call does.
import path from "node:path";

import * as NodeServices from "@effect/platform-node/NodeServices";
import { it } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { describe, expect, vi } from "vitest";

import { ServerConfig } from "../../config.ts";
import { GitCore, type GitCoreShape } from "../Services/GitCore.ts";
import { GitCoreLive, makeGitCore } from "./GitCore.ts";

const ServerConfigLayer = ServerConfig.layerTest(process.cwd(), {
  prefix: "synara-git-core-status-local-test-",
});
const TestLayer = Layer.mergeAll(
  NodeServices.layer,
  GitCoreLive.pipe(Layer.provide(ServerConfigLayer), Layer.provide(NodeServices.layer)),
);

const makeCountingGitCore = (onFetch: () => void) =>
  Effect.gen(function* () {
    const real = yield* GitCore;
    const execute: GitCoreShape["execute"] = (input) => {
      if (input.args[0] === "fetch") onFetch();
      return real.execute(input);
    };
    return yield* makeGitCore({ executeOverride: execute }).pipe(
      Effect.provide(Layer.provideMerge(ServerConfigLayer, NodeServices.layer)),
    );
  });

/** A clone tracking `origin/<branch>`: the state in which a status read may fetch. */
const makeTrackedRepository = Effect.gen(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const core = yield* GitCore;
  const git = (cwd: string, args: ReadonlyArray<string>) =>
    core.execute({ operation: "GitCore.statusLocal.test", cwd, args, timeoutMs: 10_000 });
  const remote = yield* fileSystem.makeTempDirectoryScoped({ prefix: "git-status-local-remote-" });
  const source = yield* fileSystem.makeTempDirectoryScoped({ prefix: "git-status-local-" });
  yield* git(remote, ["init", "--bare"]);
  yield* core.initRepo({ cwd: source });
  yield* git(source, ["config", "user.email", "test@test.com"]);
  yield* git(source, ["config", "user.name", "Test"]);
  yield* fileSystem.writeFileString(path.join(source, "README.md"), "# test\n");
  yield* git(source, ["add", "."]);
  yield* git(source, ["commit", "-m", "initial"]);
  const branch = (yield* git(source, ["branch", "--show-current"])).stdout.trim();
  yield* git(source, ["remote", "add", "origin", remote]);
  yield* git(source, ["push", "-u", "origin", branch]);
  return source;
});

describe("GitCore.statusDetails remote refresh", () => {
  it.layer(TestLayer)((it) => {
    it.effect("schedules no fetch for a local-only read, and one for the default read", () =>
      Effect.gen(function* () {
        const source = yield* makeTrackedRepository;
        let fetches = 0;
        const core = yield* makeCountingGitCore(() => {
          fetches += 1;
        });

        const local = yield* core.statusDetails(source, { refreshRemote: false });
        expect(local.hasUpstream).toBe(true);
        // The refresh is forked; give a wrongly scheduled one time to reach git.
        yield* Effect.promise(() => new Promise((resolve) => setTimeout(resolve, 300)));
        expect(fetches).toBe(0);

        yield* core.statusDetails(source);
        yield* Effect.promise(() => vi.waitFor(() => expect(fetches).toBe(1)));
      }),
    );
  });
});
