// Run the existing J1 harness, excluding only the upstream Stop operation (#35).
// The existing send-again and reload checks still execute. No product source is changed.
// Usage: node apps/lynx/scripts/chat-workflow-without-stop.mjs J1 --renderer both --out report.json
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

const workflowUrl = new URL("../../../scripts/comparison-workflows.mjs", import.meta.url).href;
const start = '    await step("stop a streaming turn, then resend", async () => {';
const end =
  '    await step("reload the renderer, reopen the thread, and continue it", async () => {';

export function excludeStop(source) {
  if (source.split(start).length !== 2 || source.split(end).length !== 2) {
    throw new Error(
      "J1 changed: inspect the upstream Stop/resend boundaries before updating this harness.",
    );
  }
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from >= to) throw new Error("J1 Stop/resend boundaries are out of order.");
  return (
    source.slice(0, from) +
    `    await step("send again without Stop (#35 excluded)", async () => {
      const resendToken = \`\${token}-resend\`;
      const settled = await sendAndComplete(driver, backend,
        \`Reply with exactly one line: \${resendToken} ok\`, resendToken, thread.threadId);
      thread.turnId = settled.latestTurn.turnId;
      return { excluded: "Stop (#35)", resentTurnId: thread.turnId };
    });

` +
    source.slice(to)
  );
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  if (process.argv[2] !== "J1")
    throw new Error("This harness only adapts J1; use the original runner for other workflows.");
  registerHooks({
    load(url, context, nextLoad) {
      const loaded = nextLoad(url, context);
      return url === workflowUrl
        ? { ...loaded, source: excludeStop(String(loaded.source)) }
        : loaded;
    },
  });
  await import("../../../scripts/comparison-workflow-run.mjs");
}
