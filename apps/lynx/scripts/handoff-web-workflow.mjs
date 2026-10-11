// Run the unchanged upstream J7 against a certified, isolated browser pair.
// Both browsers remain headless. A Web pass never substitutes for a Native pass.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { openSynaraRpcSession } from "../../../scripts/comparison-fixture.mjs";
import { registerHooks } from "node:module";
const webUrl = new URL("../../../scripts/comparison-web.mjs", import.meta.url).href;
// The shared launcher predates Web's /$threadId route. Adapt only its browser
// route; Native still receives /thread/:id. Fail closed if either seam moves.
registerHooks({
  load(url, context, nextLoad) {
    const loaded = nextLoad(url, context);
    if (url !== webUrl) return loaded;
    let source = String(loaded.source);
    for (const [before, after] of [
      [
        "const route = comparisonRoute(threadId);",
        'const route = "/" + encodeURIComponent(threadId);',
      ],
      ["encodeURIComponent(route)", "encodeURIComponent(comparisonRoute(threadId))"],
    ]) {
      if (source.split(before).length !== 2) throw Error("Browser route seam changed: " + before);
      source = source.replace(before, after);
    }
    return { ...loaded, source };
  },
});
const { parseWebComparisonArgs, startWebComparison } = await import(webUrl);
const { workflowJ7, activeThreadId, renderedMessageIds } =
  await import("../../../scripts/comparison-workflows.mjs");
import { waitFor } from "../../../scripts/comparison-workflow.mjs";
import { showAppSidebar } from "../../../scripts/comparison-navigation.mjs";
import { takeLynxWebPageErrors } from "../../../scripts/comparison-web-connector.mjs";

const options = parseWebComparisonArgs(process.argv.slice(2));
const pair = await startWebComparison(options, {
  theme: options.theme,
  width: options.width,
  height: options.height,
});
// Web hover-revealed controls need a painted hover state before pressing.
// Keep real pointer input and resolve the target again after layout settles.
for (const [driver, page] of [
  [pair.electron, pair.sessions.web],
  [pair.native, pair.sessions.lynx],
]) {
  const tap = driver.tap.bind(driver);
  driver.tap = async (target) => {
    const box = await waitFor(() => driver.find(target), {
      label: `Web pointer target ${JSON.stringify(target)}`,
    });
    await page.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
    await page.evaluate(
      "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
    );
    return tap(target);
  };
}
// Select the real sidebar row on both clients, then certify the actual last
// message. The legacy launcher's sidebar-membership check is insufficient.
const anchors = {};
try {
  const lastMessageId = pair.manifest.threads.find(
    (t) => t.threadId === pair.manifest.transcriptThreadId,
  ).lastMessageId;
  for (const driver of [pair.electron, pair.native]) {
    await driver.tap({ attribute: ["data-thread-id", pair.manifest.transcriptThreadId] });
    await waitFor(
      async () => {
        const active = await activeThreadId(driver);
        const messages = await renderedMessageIds(driver);
        anchors[driver.kind] = { active, messages };
        return active === pair.manifest.transcriptThreadId && messages.includes(lastMessageId);
      },
      { label: `${driver.kind} active fixture transcript and last message`, timeoutMs: 60_000 },
    );
  }
  console.log("[J7:web] active conversation anchors certified");
} catch (error) {
  if (options.out) {
    mkdirSync(dirname(options.out), { recursive: true });
    writeFileSync(
      options.out,
      JSON.stringify(
        {
          runId: pair.runId,
          status: "preflight failed",
          anchors,
          error: String(error.message ?? error),
          nativeTree: await pair.native.documentRoot().catch(() => null),
        },
        null,
        2,
      ) + "\n",
    );
  }
  await pair.stop();
  throw error;
}
const session = await openSynaraRpcSession(
  `ws://127.0.0.1:${pair.ports.serverPort}/`,
  "handoff-web",
);
const backend = {
  ...session,
  snapshot: () => session.request("orchestration.getSnapshot", {}),
  thread: async (id) =>
    (await session.request("orchestration.getSnapshot", {})).threads.find((t) => t.id === id) ??
    null,
};
const report = {
  runId: pair.runId,
  anchors,
  pair: "web-original ↔ lynx-for-web",
  configuration: options,
  renderers: {},
};
let failed = false;
try {
  takeLynxWebPageErrors(pair.ports.cdp.lynx);
  for (const driver of [pair.electron, pair.native]) {
    const steps = [];
    const step = async (name, action) => {
      const start = Date.now();
      try {
        const detail = await action();
        steps.push({ name, ok: true, ms: Date.now() - start, detail });
        console.log(`[J7:web-${driver.kind}] ✓ ${name}`);
        return detail;
      } catch (error) {
        console.log(`[J7:web-${driver.kind}] ✗ ${name}: ${error.message ?? error}`);
        const diagnostic =
          driver.kind === "electron"
            ? await driver
                .evaluate(
                  `({url: location.href, composers: [...document.querySelectorAll('[data-testid="composer-editor"]')].map(n=>({text:n.innerText,rect:n.getBoundingClientRect().toJSON()})), rows:[...document.querySelectorAll('[data-message-id]')].map(n=>({id:n.getAttribute('data-message-id'),rect:n.getBoundingClientRect().toJSON()})), model:document.querySelector('[aria-label="Change model and reasoning"]')?.innerText})`,
                )
                .catch(() => null)
            : await driver.documentRoot().catch(() => null);
        steps.push({
          name,
          diagnostic,
          ok: false,
          ms: Date.now() - start,
          error: String(error.message ?? error),
        });
        throw error;
      }
    };
    try {
      await showAppSidebar(driver);
      const result = await workflowJ7({ driver, backend, step });
      report.renderers[driver.kind] = { ok: true, steps, result };
    } catch (error) {
      failed = true;
      report.renderers[driver.kind] = { ok: false, steps, error: String(error.message ?? error) };
    }
  }
  report.lynxWebErrors = takeLynxWebPageErrors(pair.ports.cdp.lynx);
  if (report.lynxWebErrors.length > 0) failed = true;
} finally {
  backend.close();
  await pair.stop();
  report.endedAt = new Date().toISOString();
  if (options.out) {
    mkdirSync(dirname(options.out), { recursive: true });
    writeFileSync(options.out, JSON.stringify(report, null, 2) + "\n");
  }
}
process.exitCode = failed ? 1 : 0;
