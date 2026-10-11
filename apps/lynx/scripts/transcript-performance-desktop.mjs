// One already-certified background desktop pair; deterministic provider protocol.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  readCertifiedRun,
  openBackend,
  openNativeDriver,
  waitFor,
} from "../../../scripts/comparison-workflow.mjs";
import {
  comparisonFixtureSetupCommands,
  comparisonFixtureTurnCommand,
} from "../../../scripts/comparison-fixture.mjs";
import { showAppSidebar } from "../../../scripts/comparison-navigation.mjs";

const outIndex = process.argv.indexOf("--out");
if (outIndex < 0 || !process.argv[outIndex + 1]) throw Error("--out report.json is required");
const out = process.argv[outIndex + 1];
const run = readCertifiedRun();
const backend = await openBackend(run);
const native = await openNativeDriver(run.native.devtool.port);
const threadId = "chat88-history-" + Date.now();
const report = {
  runId: run.runId,
  threadId,
  source: "deterministic provider protocol, not a live model",
  startedAt: new Date().toISOString(),
};
let prior;
let created = false;
const evaluate = async (expression) => {
  const result = await native.evaluate(expression);
  const value = result?.value ?? result?.result?.value;
  return typeof value === "string" ? JSON.parse(value) : value;
};
try {
  const available = await evaluate(
    "JSON.stringify({available: typeof globalThis.__synaraTranscriptProfile === 'object'})",
  );
  if (!available?.available) throw Error("Requires an explicit SYNARA_TRANSCRIPT_PROFILE=1 build");
  const snapshot = await backend.snapshot();
  const project = snapshot.projects.find((p) => p.id === "comparison-fixture-project-v2");
  if (!project || snapshot.threads.some((t) => t.id === threadId && !t.deletedAt))
    throw Error("Owned fixture preflight failed");
  prior = await backend.request("server.getSettings", {});
  await backend.request("server.updateSettings", {
    providers: {
      codex: {
        binaryPath: fileURLToPath(new URL("./transcript-card-provider.mjs", import.meta.url)),
      },
    },
  });
  await backend.request("orchestration.dispatchCommand", {
    ...comparisonFixtureSetupCommands(project.workspaceRoot)[1],
    commandId: threadId + ":create",
    threadId,
    title: "Chat88 streaming profile",
    branch: null,
    worktreePath: null,
  });
  created = true;
  let seed;
  for (let index = 0; index < 100; index += 1) {
    await backend.request(
      "orchestration.dispatchCommand",
      comparisonFixtureTurnCommand(threadId, index, "CHAT-88 SEED " + index),
    );
    seed = await waitFor(
      async () => {
        const thread = await backend.thread(threadId);
        return thread?.latestTurn?.state === "completed" &&
          thread.messages.length === 2 * (index + 1)
          ? thread
          : null;
      },
      { label: `seed turn ${index}`, timeoutMs: 15_000, intervalMs: 30 },
    );
    if ((index + 1) % 20 === 0)
      console.log(`[profile] seeded ${index + 1} turns / ${seed.messages.length} messages`);
  }
  const historicalIds = seed.messages.map((m) => m.id);
  await showAppSidebar(native);
  await evaluate(
    `JSON.stringify(globalThis.__synaraTranscriptProfile.reset(${JSON.stringify(threadId)}) ?? null)`,
  );
  await native.tap({ attribute: ["data-thread-id", threadId] });
  await waitFor(
    async () => {
      const state = await evaluate(
        "JSON.stringify(globalThis.__synaraTranscriptProfile.snapshot())",
      );
      return state.rowCount >= 200 ? state : null;
    },
    { label: "actual Native transcript has at least 200 rows", timeoutMs: 30_000 },
  );
  report.initial = await evaluate(
    "JSON.stringify(globalThis.__synaraTranscriptProfile.snapshot())",
  );
  await evaluate(
    `JSON.stringify(globalThis.__synaraTranscriptProfile.reset(${JSON.stringify(threadId)}) ?? null)`,
  );
  const previousTurnId = seed.latestTurn.turnId;
  await backend.request(
    "orchestration.dispatchCommand",
    comparisonFixtureTurnCommand(threadId, 100, "CHAT-88 STREAM"),
  );
  const settled = await waitFor(
    async () => {
      const thread = await backend.thread(threadId);
      return thread?.latestTurn?.turnId !== previousTurnId &&
        thread?.latestTurn?.state === "completed"
        ? thread
        : null;
    },
    { label: "200-chunk streaming fixture completed", timeoutMs: 60_000, intervalMs: 100 },
  );
  await waitFor(
    async () => {
      const state = await evaluate(
        "JSON.stringify(globalThis.__synaraTranscriptProfile.snapshot())",
      );
      return state.rowCount === 202 ? state : null;
    },
    { label: "settled Native rows projected", timeoutMs: 15_000 },
  );
  const observed = await evaluate(
    "JSON.stringify(globalThis.__synaraTranscriptProfile.snapshot())",
  );
  if (observed.pipelines.length === 0)
    report.pipelineError = "No actual Native pipeline samples during streaming";
  await evaluate("JSON.stringify(globalThis.__synaraTranscriptProfile.stop() ?? null)");
  await waitFor(
    async () => {
      const state = await evaluate(
        "JSON.stringify(globalThis.__synaraTranscriptProfile.snapshot())",
      );
      return (
        state.frameCapability.includes("stopped") || state.frameCapability.includes("unavailable")
      );
    },
    { label: "main-thread frame samples returned", timeoutMs: 5000 },
  ).catch((error) => {
    report.frameError = error.message;
  });
  report.streaming = await evaluate(
    "JSON.stringify(globalThis.__synaraTranscriptProfile.snapshot())",
  );
  report.messageCount = settled.messages.length;
  report.unchangedHistoryRenders = historicalIds.reduce(
    (sum, id) => sum + (report.streaming.rowRenders[id] ?? 0),
    0,
  );
  report.totalRowRenders = Object.values(report.streaming.rowRenders).reduce(
    (sum, count) => sum + count,
    0,
  );
  report.measured =
    report.streaming.rowCount >= 202 &&
    (report.streaming.pipelines.length > 0 ||
      report.streaming.frameIntervals?.filter((value) => value > 0).length >= 10);
  console.log(
    JSON.stringify({
      measured: report.measured,
      fontSize: report.streaming.chatFontSizePx,
      rows: report.streaming.rowCount,
      parentRenders: report.streaming.parentRenders,
      totalRowRenders: report.totalRowRenders,
      unchangedHistoryRenders: report.unchangedHistoryRenders,
      pipelines: report.streaming.pipelines.length,
      capability: report.streaming.capability,
      frames: report.streaming.frameIntervals?.length,
      frameCapability: report.streaming.frameCapability,
    }),
  );
} catch (error) {
  report.error = String(error.message ?? error);
  console.error(report.error);
} finally {
  await evaluate("JSON.stringify(globalThis.__synaraTranscriptProfile?.stop() ?? null)").catch(
    () => undefined,
  );
  const cleanup = async (label, action) => {
    try {
      await action();
    } catch (error) {
      (report.cleanupErrors ??= []).push({ label, error: String(error.message ?? error) });
    }
  };
  if (created) {
    await cleanup("stop own running session", async () => {
      const thread = await backend.thread(threadId);
      if (thread?.latestTurn?.state === "running")
        await backend.request("orchestration.dispatchCommand", {
          type: "thread.session.stop",
          commandId: threadId + ":stop",
          threadId,
          createdAt: new Date().toISOString(),
        });
    });
    await cleanup("restore canonical route", async () => {
      await showAppSidebar(native);
      await native.tap({ attribute: ["data-thread-id", "comparison-fixture-transcript-v2"] });
    });
    await cleanup("delete owned fixture", async () => {
      await backend.request("orchestration.dispatchCommand", {
        type: "thread.delete",
        commandId: threadId + ":delete",
        threadId,
      });
      report.deleted = !!(await backend.thread(threadId))?.deletedAt;
    });
  }
  if (prior)
    await cleanup("restore provider binary setting", () =>
      backend.request("server.updateSettings", {
        providers: { codex: { binaryPath: prior.providers.codex.binaryPath } },
      }),
    );
  native.close();
  backend.close();
  report.endedAt = new Date().toISOString();
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
}
process.exitCode =
  report.measured && !report.error && !report.cleanupErrors?.length && report.deleted ? 0 : 1;
