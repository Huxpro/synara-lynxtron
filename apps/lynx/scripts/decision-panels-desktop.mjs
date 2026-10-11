// Geometry and interaction evidence for #82 on the one certified comparison pair.
import { writeFileSync } from "node:fs";
import {
  readCertifiedRun,
  openNativeDriver,
  openElectronDriver,
  openBackend,
  waitFor,
} from "../../../scripts/comparison-workflow.mjs";
const run = readCertifiedRun(),
  n = await openNativeDriver(run.native.devtool.port),
  e = await openElectronDriver(run.options.electronCdpPort);
const args = process.argv.slice(2),
  out = args.includes("--out") ? args[args.indexOf("--out") + 1] : null;
const attrs = (node) =>
  Object.fromEntries(
    Array.from({ length: (node.attributes ?? []).length / 2 }, (_, i) => [
      node.attributes[i * 2],
      node.attributes[i * 2 + 1],
    ]),
  );
function walk(node, fn) {
  fn(node);
  for (const child of node.children ?? []) walk(child, fn);
}
function text(node) {
  const a = attrs(node);
  return (a.text ?? "") + (node.children ?? []).map(text).join("");
}
function box(node) {
  const q = node?.box_model?.border;
  if (!q) return null;
  return { x: q[0], y: q[1], width: q[2] - q[0], height: q[5] - q[1] };
}
function relative(b, p) {
  return { ...b, x: b.x - p.x, y: b.y - p.y };
}
const cases = [
  {
    kind: "approval",
    title: "Approve this command?",
    labels: ["Approve once", "Always allow this session", "Decline", "Cancel turn"],
  },
  {
    kind: "question",
    title: "Which mode should be used?",
    labels: ["Read only", "Workspace write", "Previous question", "Next question", "Cancel"],
  },
];
const report = { runId: run.runId, options: run.options, cases: [] };
try {
  for (const c of cases) {
    const id = `chat-82-${c.kind}-electron`;
    for (const d of [e, n]) await d.tap({ attribute: ["data-thread-id", id] });
    await waitFor(
      () =>
        n.find({
          className:
            c.kind === "approval" ? "PendingApprovalPanelLynx" : "PendingUserInputPanelLynx",
        }),
      { label: c.kind + " Native panel" },
    );
    const electron = await waitFor(
      async () =>
        e.evaluate(`(()=>{
   const p=[...document.querySelectorAll('p')].find(x=>x.textContent.startsWith(${JSON.stringify(c.title)}));if(!p)return null;
   const card=p.parentElement.parentElement,b=card.getBoundingClientRect();
   const rect=x=>{const r=x.getBoundingClientRect();return {x:r.x-b.x,y:r.y-b.y,width:r.width,height:r.height}};
   const labels=${JSON.stringify(c.labels)},controls={};
   for(const label of labels){const x=[...card.querySelectorAll('button')].find(x=>x.getAttribute('aria-label')===label||x.textContent.includes(label));if(x)controls[label]=rect(x);}
   return {panel:{x:b.x,y:b.y,width:b.width,height:b.height},controls,text:p.textContent,editorDisabled:document.querySelector('[contenteditable]')?.getAttribute('contenteditable')==='false',footer:!!document.querySelector('[data-chat-composer-footer]'),customInput:!!card.querySelector('input,textarea,[contenteditable]'),texts:[...card.querySelectorAll('p,pre,button > div,button > span')].map(x=>({text:x.textContent,...rect(x),fontSize:getComputedStyle(x).fontSize,fontWeight:getComputedStyle(x).fontWeight,lineHeight:getComputedStyle(x).lineHeight}))};
  })()`),
      { label: c.kind + " Electron panel" },
    );
    await n.send("DOM.enable", { useCompression: false });
    const document = await n.send("DOM.getDocumentWithBoxModel", {}),
      root = document.root ?? document;
    let card = null,
      footer = false;
    walk(root, (node) => {
      const a = attrs(node);
      if (
        (a.class ?? "")
          .split(" ")
          .includes(
            c.kind === "approval" ? "PendingApprovalPanelLynx" : "PendingUserInputPanelLynx",
          )
      )
        card = node;
      if ((a.class ?? "").includes("ComposerFooterRowLynx")) footer = true;
    });
    const panel = box(card),
      controls = {},
      texts = [];
    let customInput = false;
    walk(card, (node) => {
      const a = attrs(node),
        b = box(node);
      if (a["accessibility-label"] && c.labels.includes(a["accessibility-label"]) && b)
        controls[a["accessibility-label"]] = relative(b, panel);
      if (node.nodeName === "INPUT" || node.nodeName === "TEXTAREA") customInput = true;
      if (node.nodeName === "TEXT" && b)
        texts.push({ text: text(node), ...relative(b, panel), className: a.class });
    });
    const native = { panel, controls, footer, customInput, texts };
    const compared = c.labels.map((label) => {
      const a = electron.controls[label],
        b = native.controls[label];
      if (!a || !b) return { label, pass: false, missing: a ? "native" : b ? "electron" : "both" };
      const delta = Object.fromEntries(
        ["x", "y", "width", "height"].map((k) => [k, Math.round((b[k] - a[k]) * 100) / 100]),
      );
      return { label, delta, pass: Object.values(delta).every((v) => Math.abs(v) <= 2) };
    });
    const structurePass =
      !native.customInput && !electron.customInput && native.footer === electron.footer;
    report.cases.push({ kind: c.kind, electron, native, compared, structurePass });
    console.log(
      JSON.stringify({
        kind: c.kind,
        panelHeightDelta: panel.height - electron.panel.height,
        compared,
      }),
    );
  }
  if (args.includes("--exercise")) {
    const backend = await openBackend(run);
    report.workflows = [];
    const choose = async (driver, label) => {
      if (driver.kind === "native") return driver.tap({ label });
      await waitFor(
        () =>
          driver.evaluate(
            `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(${JSON.stringify(label)}));if(!b)return false;b.setAttribute('data-chat82-choice',${JSON.stringify(label)});return true})()`,
          ),
        { label: `Electron ${label}` },
      );
      return driver.tap({ attribute: ["data-chat82-choice", label] });
    };
    try {
      for (const driver of [e, n]) {
        for (const kind of ["approval", "question"]) {
          const threadId = `chat-82-${kind}-${driver.kind}`;
          await driver.tap({ attribute: ["data-thread-id", threadId] });
          const before = await backend.thread(threadId);
          if (kind === "approval") {
            await choose(driver, "Approve once");
          } else {
            await choose(driver, "Read only");
            await waitFor(
              async () =>
                driver.kind === "native"
                  ? driver.find({ text: "What should the agent check next?" })
                  : driver.evaluate(
                      `document.body.textContent.includes("What should the agent check next?")`,
                    ),
              { label: `${driver.kind} second question` },
            );
            await driver.tap(
              driver.kind === "native"
                ? { label: "Message composer" }
                : { testId: "composer-editor" },
            );
            await driver.type("Check the tests");
            await waitFor(
              async () =>
                driver.kind === "native"
                  ? driver.find({ label: "Submit answers" })
                  : driver.evaluate(
                      `!![...document.querySelectorAll('button')].find(x=>x.textContent.trim()==="Submit answers"&&!x.disabled)`,
                    ),
              { label: `${driver.kind} submit enabled` },
            );
            if (driver.kind === "native") await driver.tap({ label: "Submit answers" });
            else {
              const target = await driver.evaluate(
                `(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==="Submit answers");b?.setAttribute('data-chat82-submit','');return !!b})()`,
              );
              if (!target) throw new Error("Submit answers missing");
              await driver.tap({ attribute: ["data-chat82-submit", ""] });
            }
          }
          const after = await waitFor(
            async () => {
              const thread = await backend.thread(threadId);
              return thread?.latestTurn?.state === "completed" &&
                thread.pendingInteractions.every((x) => x.status === "resolved")
                ? thread
                : null;
            },
            { label: `${driver.kind} ${kind} canonical settlement`, timeoutMs: 20000 },
          );
          if (after.latestTurn.turnId !== before.latestTurn.turnId)
            throw new Error("Question answer created a new turn");
          const received = after.messages.find(
            (x) => x.role === "assistant" && x.text?.startsWith("Decision received:"),
          )?.text;
          if (!received) throw new Error("Fixture did not acknowledge response payload");
          if (
            kind === "question" &&
            (!received.includes("Read only") || !received.includes("Check the tests"))
          )
            throw new Error("Provider did not receive both answers");
          const result = {
            received,
            actor: driver.kind,
            kind,
            threadId,
            before: before.pendingInteractions,
            after: after.pendingInteractions,
            latestTurn: after.latestTurn,
            messageCountBefore: before.messages.length,
            messageCountAfter: after.messages.length,
          };
          report.workflows.push(result);
          console.log(JSON.stringify({ actor: driver.kind, kind, status: "settled" }));
        }
      }
    } finally {
      backend.close();
    }
  }
  if (out && out !== "--out") writeFileSync(out, JSON.stringify(report, null, 2));
  if (
    args.includes("--assert") &&
    report.cases.some((c) => !c.structurePass || c.compared.some((x) => !x.pass))
  )
    process.exitCode = 1;
} finally {
  e.close();
  n.close();
}
