// One certified pair. Exact message identity avoids virtualized row text pairing.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { execFileSync } from "node:child_process";
import {
  readCertifiedRun,
  openElectronDriver,
  openNativeDriver,
  waitFor,
} from "../../../scripts/comparison-workflow.mjs";
import { showAppSidebar } from "../../../scripts/comparison-navigation.mjs";
import { nativeTranscriptStep } from "../../../scripts/message-formats-desktop.mjs";
import { compareControls } from "../../../scripts/comparison-cells.mjs";
const run = readCertifiedRun(),
  e = await openElectronDriver(run.options.electronCdpPort),
  n = await openNativeDriver(run.native.devtool.port),
  args = process.argv.slice(2),
  out = args[args.indexOf("--out") + 1];
const fixtures = JSON.parse(
  readFileSync(`.synara-desktop-comparison/runs/${run.runId}-chat84-fixtures.json`, "utf8"),
);
const report = { runId: run.runId, options: run.options, cases: [], workflows: [] };
const norm = (s) => String(s).replace(/\s+/g, " ").trim();
const attrs = (node) =>
  Object.fromEntries(
    Array.from({ length: (node.attributes ?? []).length / 2 }, (_, i) => [
      node.attributes[i * 2],
      node.attributes[i * 2 + 1],
    ]),
  );
const box = (node) => {
  const q = node.box_model?.border;
  return q ? { x: q[0], y: q[1], width: q[2] - q[0], height: q[5] - q[1] } : null;
};
const walk = (node, fn) => {
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function measure(fixture, label = "default") {
  const electron = await waitFor(
    () =>
      e.evaluate(
        `(()=>{const row=document.querySelector('[data-message-role="user"]');if(!row||!row.innerText.includes(${JSON.stringify(fixture.prompt)}))return null;const b=row.getBoundingClientRect();const controls=[];for(const node of row.querySelectorAll('button,[aria-label]')){const r=node.getBoundingClientRect();if(r.width<=0||r.height<=0)continue;const label=node.getAttribute('aria-label')||node.getAttribute('title')||node.innerText?.replace(/\\s+/g,' ').trim();if(label)controls.push([label,{x:r.x,y:r.y,width:r.width,height:r.height}]);}return {height:b.height,width:b.width,text:row.innerText,controls};})()`,
      ),
    { label: "Electron user row" },
  );
  const doc = await n.send("DOM.getDocumentWithBoxModel", {}),
    step = nativeTranscriptStep(doc.root ?? doc),
    row = step?.rows.find((r) => r.key === fixture.messageId);
  if (!row) throw Error("Native user row missing: " + fixture.messageId);
  const controls = [];
  walk(row.node, (node) => {
    const a = attrs(node),
      b = box(node);
    if (a["accessibility-label"] && b && b.width > 0 && b.height > 0)
      controls.push([a["accessibility-label"], { ...b }]);
  });
  const group = (entries) => {
    const result = new Map();
    for (const [label, b] of entries) {
      const key = norm(label);
      result.set(key, [...(result.get(key) ?? []), b]);
    }
    return result;
  };
  const comparison = compareControls(group(electron.controls), group(controls)),
    heightDelta = Math.round((row.h - electron.height) * 100) / 100;
  const entry = {
    kind: fixture.kind,
    label,
    electron,
    native: { height: row.h, width: row.w, text: row.text, controls },
    heightDelta,
    comparison,
    pass:
      Math.abs(heightDelta) <= 2 &&
      comparison.outside.length === 0 &&
      comparison.missing.length === 0,
  };
  report.cases.push(entry);
  console.log(
    fixture.kind,
    label,
    entry.pass ? "PASS" : "DIFF",
    heightDelta,
    comparison.matched + "/" + comparison.compared,
  );
  return entry;
}
try {
  for (const fixture of fixtures) {
    for (const d of [e, n]) {
      await showAppSidebar(d);
      await d.tap({ attribute: ["data-thread-id", fixture.threadId] });
      await sleep(500);
      if (await d.find({ label: "Collapse panel" })) await d.tap({ label: "Collapse panel" });
    }
    await sleep(800);
    await measure(fixture);
    if (args.includes("--exercise")) {
      for (const d of [e, n]) {
        await d.tap(
          d.kind === "electron"
            ? { selector: '[data-message-role="user"] button[aria-label="Copy message"]' }
            : { within: ".TranscriptMessageRowUser", label: "Copy message" },
        );
        await sleep(100);
        const copied = execFileSync("pbpaste", [], { encoding: "utf8" });
        if (copied !== fixture.prompt)
          throw Error(d.kind + " copied hidden transport: " + JSON.stringify(copied));
        report.workflows.push({
          renderer: d.kind,
          kind: fixture.kind,
          action: "copy-visible-prompt",
          ok: true,
        });
        await d.tap({ label: "Edit message" });
        await sleep(250);
        let draft;
        if (d.kind === "electron")
          draft = await d.evaluate(
            `document.querySelector('textarea[aria-label="Edit message"]')?.value ?? document.querySelector('textarea')?.value`,
          );
        else {
          walk(await d.documentRoot(), (node) => {
            const a = attrs(node);
            if (node.nodeName === "TEXTAREA" && a["accessibility-label"] === "Edit message")
              draft = a["default-value"];
          });
        }
        if (draft !== fixture.prompt)
          throw Error(d.kind + " edit exposes hidden transport: " + JSON.stringify(draft));
        await d.tap(
          d.kind === "electron" ? { selector: "button", text: "Cancel" } : { text: "Cancel" },
        );
        await sleep(200);
        report.workflows.push({
          renderer: d.kind,
          kind: fixture.kind,
          action: "edit-visible-prompt-cancel",
          ok: true,
        });
      }
      if (["paste", "pull-request"].includes(fixture.kind)) {
        for (const d of [e, n]) {
          const target =
            fixture.kind === "paste"
              ? d.kind === "electron"
                ? { selector: "button", text: "Show text" }
                : {
                    label: report.cases
                      .at(-1)
                      .native.controls.find(([label]) => label.startsWith("Show text"))[0],
                  }
              : d.kind === "electron"
                ? { selector: 'button[title="Show the prompt this card sent"]' }
                : { label: "Show the prompt this card sent" };
          await d.tap(target);
        }
        await sleep(800);
        await measure(fixture, "expanded");
      }
    }
  }
} catch (error) {
  report.error = String(error.stack ?? error);
  console.error(report.error);
} finally {
  e.close();
  n.close();
  if (out) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
  }
}
if (report.error || (args.includes("--assert") && report.cases.some((c) => !c.pass)))
  process.exitCode = 1;
