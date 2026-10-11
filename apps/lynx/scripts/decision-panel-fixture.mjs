// Seed only the certified launcher's isolated backend through normal product RPC.
import { fileURLToPath } from "node:url";
import { readCertifiedRun, openBackend, waitFor } from "../../../scripts/comparison-workflow.mjs";
import {
  comparisonFixtureSetupCommands,
  comparisonFixtureTurnCommand,
} from "../../../scripts/comparison-fixture.mjs";
const run = readCertifiedRun(),
  backend = await openBackend(run),
  ids = [
    "chat-82-approval-electron",
    "chat-82-question-electron",
    "chat-82-approval-native",
    "chat-82-question-native",
  ];
let prior;
try {
  if (process.argv.includes("--cleanup")) {
    for (const threadId of ids) {
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
    }
  } else {
    prior = await backend.request("server.getSettings", {});
    const snapshot = await backend.snapshot(),
      project = snapshot.projects.find((x) => x.id === "comparison-fixture-project-v2");
    if (!project || snapshot.threads.some((t) => ids.includes(t.id)))
      throw new Error("Requires fresh canonical fixture project");
    await backend.request("server.updateSettings", {
      providers: {
        codex: {
          binaryPath: fileURLToPath(new URL("./decision-panel-provider.mjs", import.meta.url)),
        },
      },
    });
    for (const [index, threadId] of ids.entries()) {
      await backend.request("orchestration.dispatchCommand", {
        ...comparisonFixtureSetupCommands(project.workspaceRoot)[1],
        commandId: threadId + ":create",
        threadId,
        projectId: project.id,
        title:
          (index % 2 === 0 ? "Approval audit" : "Question audit") +
          " · " +
          (index < 2 ? "electron" : "native"),
        envMode: "local",
        worktreePath: null,
        branch: null,
      });
      await backend.request("orchestration.dispatchCommand", {
        ...comparisonFixtureTurnCommand(
          threadId,
          0,
          index % 2 === 0 ? "CHAT-82 APPROVAL" : "CHAT-82 QUESTION",
        ),
        runtimeMode: "approval-required",
      });
      await waitFor(
        async () => {
          const t = await backend.thread(threadId);
          return t?.pendingInteractions?.some((x) => x.status === "pending") ? t : null;
        },
        { timeoutMs: 30000, label: threadId + " pending interaction" },
      );
    }
    console.log(
      JSON.stringify({
        runId: run.runId,
        threadIds: ids,
        source: "deterministic protocol fixture, not live model",
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
