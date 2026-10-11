import { renderedTextIncludes } from "../../../scripts/comparison-workflows.mjs";
import { fileURLToPath } from "node:url";
// One certified pair, sequential card measurements and background-only interactions.
import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import {
  readCertifiedRun,
  openNativeDriver,
  openElectronDriver,
  openBackend,
  waitFor,
} from "../../../scripts/comparison-workflow.mjs";
const run = readCertifiedRun(),
  n = await openNativeDriver(run.native.devtool.port),
  e = await openElectronDriver(run.options.electronCdpPort),
  backend = await openBackend(run);
const args = process.argv.slice(2),
  out = args[args.indexOf("--out") + 1];
let priorProviderSettings = null;
let downloadedPath = null;
let priorDownload = null;
const report = {
  runId: run.runId,
  options: run.options,
  cases: [],
  workflows: [],
  limitations: [
    "OS save-file and confirmation dialogs are covered by Native port unit tests; physical system-dialog interaction is unverified under the no-foreground constraint.",
  ],
};
const attrs = (node) =>
  Object.fromEntries(
    Array.from({ length: (node.attributes ?? []).length / 2 }, (_, i) => [
      node.attributes[i * 2],
      node.attributes[i * 2 + 1],
    ]),
  );
const walk = (node, fn) => {
  if (!node) return;
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
};
const box = (node) => {
  const q = node?.box_model?.border;
  return q ? { x: q[0], y: q[1], width: q[2] - q[0], height: q[5] - q[1] } : null;
};
const relative = (b, p) => ({ ...b, x: b.x - p.x, y: b.y - p.y });
async function measure(kind, nativeClass, labels) {
  const electron = await waitFor(
    () =>
      e.evaluate(`(()=>{
 const labels=${JSON.stringify(labels)},buttons=[...document.querySelectorAll('button')];
 const first=buttons.find(x=>x.getAttribute('aria-label')===labels[0]||x.textContent.trim()===labels[0]);if(!first)return null;
 const card=${kind === "plan" ? "first.parentElement.parentElement.parentElement" : kind === "failure" ? "first.closest('[role=alert]')" : "first.parentElement.parentElement.parentElement"};if(!card)return null;
 const b=card.getBoundingClientRect(), controls={};const relative=x=>{const r=x.getBoundingClientRect();return{x:r.x-b.x,y:r.y-b.y,width:r.width,height:r.height}};
 for(const label of labels){let x=[...card.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')===label||x.textContent.trim()===label);if(!x&&label.startsWith('Open ')&&!label.endsWith(' options'))x=[...card.querySelectorAll('[role=group]')].find(x=>x.getAttribute('aria-label')===label)?.querySelector('button');if(x)controls[label]=relative(x);}
 return {panel:{x:b.x,y:b.y,width:b.width,height:b.height},controls,text:card.textContent};})()`),
    { label: kind + " Electron card" },
  );
  if (!electron) throw new Error(kind + " Electron card missing");
  const doc = await n.send("DOM.getDocumentWithBoxModel", {});
  let card;
  walk(doc.root ?? doc, (node) => {
    if ((attrs(node).class ?? "").split(" ").includes(nativeClass)) card = node;
  });
  const panel = box(card);
  if (!panel) throw new Error(kind + " Native card missing");
  const controls = {};
  walk(card, (node) => {
    const a = attrs(node),
      label = a["accessibility-label"];
    if (labels.includes(label) && box(node)) controls[label] = relative(box(node), panel);
    if (kind === "changes" && label === "Review changes" && box(node))
      controls.Review = relative(box(node), panel);
    if (kind === "changes" && label === "Undo file changes" && box(node))
      controls.Undo = relative(box(node), panel);
  });
  const compared = labels.map((label) => {
    const eb = electron.controls[label],
      nb = controls[label];
    return {
      label,
      electron: eb,
      native: nb,
      delta:
        eb && nb
          ? Object.fromEntries(
              ["x", "y", "width", "height"].map((k) => [
                k,
                Math.round((nb[k] - eb[k]) * 100) / 100,
              ]),
            )
          : null,
    };
  });
  report.cases.push({
    kind,
    electron,
    native: { panel, controls },
    heightDelta: panel.height - electron.panel.height,
    compared,
  });
  console.log(JSON.stringify(report.cases.at(-1)));
}
async function composerText(d) {
  if (d.kind === "electron")
    return d.evaluate(
      `(document.querySelector('[data-testid="composer-editor"]')?.innerText??'').trim()`,
    );
  let value = "";
  walk(await d.documentRoot(), (node) => {
    const a = attrs(node);
    if (node.nodeName === "TEXTAREA" && a["accessibility-label"] === "Message composer")
      value = String(a["default-value"] ?? "").trim();
  });
  return value;
}
async function tapText(d, label) {
  if (d.kind === "native") return d.tap({ label });
  await e.evaluate(
    `(()=>{const x=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()===${JSON.stringify(label)}||x.getAttribute('aria-label')===${JSON.stringify(label)});if(!x)throw new Error('Missing button');x.setAttribute('data-chat83-action',${JSON.stringify(label)});})()`,
  );
  return d.tap({ attribute: ["data-chat83-action", label] });
}
try {
  if (args.includes("--exercise")) {
    priorProviderSettings = await backend.request("server.getSettings", {});
    await backend.request("server.updateSettings", {
      providers: {
        codex: {
          binaryPath: fileURLToPath(new URL("./transcript-card-provider.mjs", import.meta.url)),
        },
      },
    });
  }
  if (!args.includes("--changes-only")) {
    for (const d of [e, n]) await d.tap({ attribute: ["data-thread-id", "chat-83-plan"] });
    await waitFor(() => n.find({ className: "TranscriptPlanCard" }), { label: "Native plan" });
    await measure("plan", "TranscriptPlanCard", [
      "Download to .plan folder",
      "Export markdown file",
      "Copy as markdown",
    ]);
    if (args.includes("--exercise"))
      for (const d of [e, n]) {
        await d.tap({ label: "Copy as markdown" });
        await waitFor(() => d.find({ label: "Copied" }), { label: d.kind + " copied plan" });
        const copied = execFileSync("pbpaste", { encoding: "utf8" });
        if (!copied.startsWith("# Card action audit")) throw new Error("Wrong copied plan");
        const t = await backend.thread("chat-83-plan");
        const root = (await backend.snapshot()).projects.find(
          (x) => x.id === t.projectId,
        ).workspaceRoot;
        if (!downloadedPath) {
          downloadedPath = join(root, ".plan", "card-action-audit.md");
          priorDownload = existsSync(downloadedPath) ? readFileSync(downloadedPath) : null;
        }
        await d.tap({ label: "Download to .plan folder" });
        const contents = await waitFor(
          () => {
            try {
              return readFileSync(join(root, ".plan", "card-action-audit.md"), "utf8");
            } catch {
              return null;
            }
          },
          { label: d.kind + " plan download" },
        );
        if (contents !== copied) throw new Error("Downloaded plan differs from copied markdown");
        unlinkSync(downloadedPath); // The next renderer must perform its own write.
        report.workflows.push({ renderer: d.kind, kind: "plan-copy-download", ok: true });
      }
    for (const d of [e, n])
      await d.tap({ attribute: ["data-thread-id", "chat-83-failure-electron"] });
    await waitFor(() => n.find({ className: "ThreadErrorBanner--inline" }), {
      label: "Native failed card",
    });
    await measure("failure", "ThreadErrorBanner--inline", [
      "Copy error",
      "Continue task",
      "Change model",
    ]);
    if (args.includes("--exercise"))
      for (const d of [e, n]) {
        const id = "chat-83-failure-" + d.kind;
        await d.tap({ attribute: ["data-thread-id", id] });
        await waitFor(
          () =>
            d.find(
              d.kind === "native"
                ? { label: "Continue task" }
                : { selector: "[role=alert] button", text: "Continue task" },
            ),
          { label: d.kind + " recovery" },
        );
        await tapText(d, "Change model");
        await waitFor(
          () =>
            d.find(
              d.kind === "native"
                ? { className: "ComposerModelPickerPopupLynx" }
                : { selector: '[data-slot="menu-popup"]' },
            ),
          { label: d.kind + " model picker" },
        );
        await d.tap({ label: "Change model and reasoning" });
        const draft = "Unsent draft retained for " + d.kind;
        await d.tap(
          d.kind === "native" ? { label: "Message composer" } : { testId: "composer-editor" },
        );
        await d.type(draft);
        await waitFor(async () => (await composerText(d)) === draft, { label: d.kind + " draft" });
        const previous = await backend.thread(id);
        await tapText(d, "Continue task");
        const settled = await waitFor(
          async () => {
            const t = await backend.thread(id);
            return t?.latestTurn?.turnId !== previous.latestTurn.turnId &&
              t?.latestTurn?.state === "completed"
              ? t
              : null;
          },
          { label: d.kind + " continued turn", timeoutMs: 30000 },
        );
        const message = settled.messages.find(
          (x) => x.role === "assistant" && x.text.startsWith("Recovery received:"),
        );
        if (!message?.text.includes("avoid repeating them"))
          throw new Error("Provider did not receive upstream continuation prompt");
        if ((await composerText(d)) !== draft) throw new Error("Recovery consumed ordinary draft");
        report.workflows.push({
          renderer: d.kind,
          kind: "continue-failed-preserves-draft",
          ok: true,
          turnId: settled.latestTurn.turnId,
          providerReceipt: message.text,
        });
      }
  }
  const changesThreadId = args.includes("--changes-thread")
    ? args[args.indexOf("--changes-thread") + 1]
    : "comparison-fixture-transcript-v2";
  for (const d of [e, n]) {
    await d.tap({ attribute: ["data-thread-id", changesThreadId] });
    if (await d.find({ label: "Collapse panel" })) {
      await d.tap({ label: "Collapse panel" });
      await waitFor(async () => !(await d.find({ label: "Collapse panel" })), {
        label: d.kind + " dock closed before geometry",
      });
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    for (let i = 0; i < 35; i++) {
      if (await d.find({ label: "Collapse changed files list" })) break;
      await d.scroll({ x: 530, y: 400 }, -420);
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  await measure("changes", "TranscriptTurnChangesCard", [
    "Undo",
    "Review",
    "Collapse changed files list",
    "Review changes to README.md",
    "Review changes to src/math.ts",
    "Open README.md",
    "Open README.md options",
    "Open src/math.ts",
    "Open src/math.ts options",
  ]);
  if (args.includes("--exercise"))
    for (const d of [e, n]) {
      await d.tap({ label: "Collapse changed files list" });
      await waitFor(() => d.find({ label: "Expand changed files list" }), {
        label: d.kind + " collapsed files",
      });
      await d.tap({ label: "Expand changed files list" });
      const changesThread = await backend.thread(changesThreadId);
      const workspace = (await backend.snapshot()).projects.find(
        (project) => project.id === changesThread.projectId,
      ).workspaceRoot;
      for (const [label, expected] of [
        ["Copy absolute path", join(workspace, "src/math.ts")],
        ["Copy relative path", "src/math.ts"],
      ]) {
        await d.tap({ label: "Open src/math.ts options" });
        await d.tap(
          d.kind === "native"
            ? { text: label, within: ".LxMenuLayer" }
            : { selector: '[role="menuitem"]', text: label },
        );
        await waitFor(() => execFileSync("pbpaste", { encoding: "utf8" }) === expected, {
          label: d.kind + " " + label,
        });
      }
      report.workflows.push({ renderer: d.kind, kind: "file-path-copy-menus", ok: true });
      await d.tap({ label: "Review changes to src/math.ts" });
      await waitFor(
        () =>
          d.find(d.kind === "native" ? { className: "DiffDock" } : { label: "Choose turn diff" }),
        { label: d.kind + " review dock" },
      );
      if (args.includes("--changes-thread"))
        await waitFor(() => renderedTextIncludes(d, "cardAudit"), {
          label: d.kind + " loaded owned checkpoint diff",
        });
      report.workflows.push({
        renderer: d.kind,
        kind: "collapse-expand-file-review",
        ok: true,
        loadedCheckpoint: args.includes("--changes-thread"),
      });
      await d.tap({ label: "Close file view" });
      if (await d.find({ label: "Collapse panel" })) {
        await d.tap({ label: "Collapse panel" });
        await waitFor(async () => !(await d.find({ label: "Collapse panel" })), {
          label: d.kind + " dock cleanup",
        });
      }
    }
} catch (error) {
  report.error = String(error.stack ?? error);
  process.exitCode = 1;
} finally {
  if (priorProviderSettings)
    await backend.request("server.updateSettings", {
      providers: { codex: { binaryPath: priorProviderSettings.providers.codex.binaryPath } },
    });
  if (downloadedPath) {
    if (priorDownload) writeFileSync(downloadedPath, priorDownload);
    else if (existsSync(downloadedPath)) unlinkSync(downloadedPath);
  }
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  }
  n.close();
  e.close();
  backend.close();
}
if (report.error) console.error(report.error);
if (
  args.includes("--assert") &&
  !report.error &&
  report.cases.some((c) =>
    c.compared.some((x) => !x.delta || Object.values(x.delta).some((v) => Math.abs(v) > 2)),
  )
) {
  console.error("Control geometry exceeds 2px");
  process.exitCode = 1;
}
