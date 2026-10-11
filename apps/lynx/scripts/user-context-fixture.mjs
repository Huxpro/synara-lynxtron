import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
// Seed isolated comparison threads through the normal provider pipeline.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readCertifiedRun, openBackend, waitFor } from "../../../scripts/comparison-workflow.mjs";
import {
  comparisonFixtureSetupCommands,
  comparisonFixtureTurnCommand,
} from "../../../scripts/comparison-fixture.mjs";
const run = readCertifiedRun(),
  backend = await openBackend(run);
const statePath = join(
  process.cwd(),
  ".synara-desktop-comparison/runs",
  run.runId + "-chat84-fixtures.json",
);
const cleanup = process.argv.includes("--cleanup");
const tag = randomUUID().slice(0, 8);
const fixtures =
  cleanup && existsSync(statePath)
    ? JSON.parse(readFileSync(statePath, "utf8"))
    : JSON.parse(
        execFileSync(
          "bun",
          [
            "--eval",
            `import {createUserContextFixtures} from "./apps/lynx/scripts/user-context-fixtures.ts";console.log(JSON.stringify(createUserContextFixtures(${JSON.stringify(tag)})))`,
          ],
          { encoding: "utf8" },
        ),
      );

let prior;
try {
  if (process.argv.includes("--cleanup")) {
    const existing = new Set(
      (await backend.snapshot()).threads.filter((t) => !t.deletedAt).map((t) => t.id),
    );
    for (const { threadId } of fixtures) {
      if (!existing.has(threadId)) continue;
      await backend.request("orchestration.dispatchCommand", {
        type: "thread.session.stop",
        commandId: `${threadId}:stop:${Date.now()}`,
        threadId,
        createdAt: new Date().toISOString(),
      });
      await backend.request("orchestration.dispatchCommand", {
        type: "thread.delete",
        commandId: `${threadId}:delete:${Date.now()}`,
        threadId,
      });
    }
    await waitFor(
      async () =>
        !(await backend.snapshot()).threads.some(
          (t) => !t.deletedAt && fixtures.some((f) => f.threadId === t.id),
        ),
      { label: "owned context threads deleted" },
    );
  } else {
    if (existsSync(statePath)) {
      const previous = JSON.parse(readFileSync(statePath, "utf8"));
      const live = (await backend.snapshot()).threads.filter((t) => !t.deletedAt);
      if (previous.some((f) => live.some((t) => t.id === f.threadId)))
        throw Error("Clean up owned context fixtures before reseeding");
    }
    writeFileSync(statePath, JSON.stringify(fixtures, null, 2) + "\n");
    const snapshot = await backend.snapshot(),
      project = snapshot.projects.find((p) => p.id === "comparison-fixture-project-v2");
    if (!project || snapshot.threads.some((t) => fixtures.some((f) => f.threadId === t.id)))
      throw Error("Requires fresh certified fixture project");
    prior = await backend.request("server.getSettings", {});
    await backend.request("server.updateSettings", {
      providers: {
        codex: {
          binaryPath: fileURLToPath(new URL("./transcript-card-provider.mjs", import.meta.url)),
        },
      },
    });
    for (const fixture of fixtures) {
      await backend.request("orchestration.dispatchCommand", {
        ...comparisonFixtureSetupCommands(project.workspaceRoot)[1],
        commandId: fixture.threadId + ":create",
        threadId: fixture.threadId,
        projectId: project.id,
        title: `User context audit · ${fixture.kind}`,
        envMode: "local",
        worktreePath: null,
        branch: null,
      });
      await backend.request("orchestration.dispatchCommand", {
        ...comparisonFixtureTurnCommand(fixture.threadId, 0, fixture.text),
        message: {
          ...comparisonFixtureTurnCommand(fixture.threadId, 0, fixture.text).message,
          messageId: fixture.messageId,
        },
        runtimeMode: "approval-required",
      });
      await waitFor(
        async () => {
          const t = await backend.thread(fixture.threadId);
          return t?.latestTurn?.state === "completed" ? t : null;
        },
        { label: fixture.kind + " user context", timeoutMs: 30000 },
      );
    }
    console.log(JSON.stringify({ runId: run.runId, fixtures }, null, 2));
  }
} finally {
  if (prior)
    await backend.request("server.updateSettings", {
      providers: { codex: { binaryPath: prior.providers.codex.binaryPath } },
    });
  backend.close();
}
