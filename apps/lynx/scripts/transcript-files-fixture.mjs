// A fresh owned git workspace provides valid checkpoint objects; never repairs the canonical seed.
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readCertifiedRun, openBackend, waitFor } from "../../../scripts/comparison-workflow.mjs";
import {
  comparisonFixtureSetupCommands,
  comparisonFixtureTurnCommand,
} from "../../../scripts/comparison-fixture.mjs";
const run = readCertifiedRun(),
  backend = await openBackend(run),
  root = join(process.cwd(), ".synara-desktop-comparison", "runs", run.runId + "-chat83-workspace"),
  projectId = "chat-83-files-project",
  threadId = "chat-83-files";
let prior;
try {
  if (process.argv.includes("--cleanup")) {
    await backend.request("orchestration.dispatchCommand", {
      type: "thread.session.stop",
      commandId: threadId + ":stop:" + Date.now(),
      threadId,
      createdAt: new Date().toISOString(),
    });
    await backend.request("orchestration.dispatchCommand", {
      type: "thread.delete",
      commandId: threadId + ":delete:" + Date.now(),
      threadId,
    });
    await backend.request("orchestration.dispatchCommand", {
      type: "project.delete",
      commandId: projectId + ":delete:" + Date.now(),
      projectId,
    });
    if (
      existsSync(join(root, ".chat83-owned")) &&
      readFileSync(join(root, ".chat83-owned"), "utf8") === run.runId
    )
      rmSync(root, { recursive: true });
  } else {
    const retry = process.argv.includes("--retry");
    if (
      retry &&
      (!existsSync(join(root, ".chat83-owned")) ||
        readFileSync(join(root, ".chat83-owned"), "utf8") !== run.runId ||
        (await backend.thread(threadId))?.checkpoints?.some((x) => x.files.length))
    )
      throw new Error("Retry only supports an unmodified owned fixture");
    if (!retry) {
      if (existsSync(root) || (await backend.thread(threadId)))
        throw new Error("Requires fresh owned files fixture");
      mkdirSync(join(root, "src"), { recursive: true });
      writeFileSync(join(root, ".chat83-owned"), run.runId);
      writeFileSync(join(root, "README.md"), "# Card fixture\n");
      writeFileSync(join(root, "src/math.ts"), "export const baseline = true;\n");
      execFileSync("git", ["init", "-b", "main", root], { stdio: "pipe" });
      execFileSync("git", ["-C", root, "add", "."], { stdio: "pipe" });
      execFileSync(
        "git",
        [
          "-C",
          root,
          "-c",
          "user.name=Comparison fixture",
          "-c",
          "user.email=fixture@invalid",
          "commit",
          "-m",
          "Owned card fixture",
        ],
        { stdio: "pipe" },
      );
      const setup = comparisonFixtureSetupCommands(root);
      await backend.request("orchestration.dispatchCommand", {
        ...setup[0],
        commandId: projectId + ":create",
        projectId,
        title: "Card file audit",
      });
      await backend.request("orchestration.dispatchCommand", {
        ...setup[1],
        commandId: threadId + ":create",
        threadId,
        projectId,
        title: "File action audit",
      });
    }
    prior = await backend.request("server.getSettings", {});
    await backend.request("server.updateSettings", {
      providers: {
        codex: {
          binaryPath: fileURLToPath(new URL("./transcript-card-provider.mjs", import.meta.url)),
        },
      },
    });
    await backend.request("orchestration.dispatchCommand", {
      ...comparisonFixtureTurnCommand(threadId, retry ? 1 : 0, "CHAT-83 FILES"),
      runtimeMode: "full-access",
    });
    const thread = await waitFor(
      async () => {
        const t = await backend.thread(threadId);
        return t?.latestTurn?.state === "completed" &&
          t?.checkpoints?.some((x) => x.files.length === 2)
          ? t
          : null;
      },
      { label: "fresh file checkpoints", timeoutMs: 30000 },
    );
    console.log(
      JSON.stringify({
        runId: run.runId,
        root,
        projectId,
        threadId,
        summaries: thread.checkpoints,
      }),
    );
  }
} finally {
  if (prior)
    await backend.request("server.updateSettings", {
      providers: { codex: { binaryPath: prior.providers.codex.binaryPath } },
    });
  backend.close();
}
