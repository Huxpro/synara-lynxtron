// Row-by-row comparison of a message-formats fixture thread between Electron and
// Lynxtron (Native), on the latest certified `compare:desktop --message-formats`
// run (apps/lynx/docs/message-formats-checklist.md).
//
// It opens the thread in both renderers from the sidebar, walks the transcript in
// scroll steps and, per step, records every transcript row with its text blocks
// (Electron: apps/lynx/scripts/message-formats/measure.js, the same expression
// the browser pair uses; Native: one `DOM.getDocumentWithBoxModel` tree) and the
// labeled controls inside each row (`labeledControls` of the cell matrix, made
// relative to their row). Rows are paired in transcript order; controls by row
// and label through `compareControls`, with the matrix's 2 px tolerance.
//
// usage:
//   node scripts/message-formats-desktop.mjs [--thread main] [--out <dir>] [--shots]
//     [--click-text "Worked for 13s"] [--label main] [--steps 12] [--blocks]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { compareControls, CONTROL_TOLERANCE_PX, labeledControls } from "./comparison-cells.mjs";
import { electronScreenshot, nativeScreenshot } from "./comparison-colours.mjs";
import {
  openElectronDriver,
  openNativeDriver,
  readCertifiedRun,
  waitFor,
} from "./comparison-workflow.mjs";
import { MESSAGE_FORMATS_THREAD_IDS } from "./message-formats-fixture.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MEASURE_EXPRESSION = readFileSync(
  join(repositoryRoot, "apps/lynx/scripts/message-formats/measure.js"),
  "utf8",
);
const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const norm = (text) => String(text).replace(/\s+/g, " ").trim();
const round = (value) => Math.round(value * 10) / 10;

function attributesOf(node) {
  const map = {};
  const attributes = node?.attributes ?? [];
  for (let index = 0; index + 1 < attributes.length; index += 2) {
    map[attributes[index]] = String(attributes[index + 1]);
  }
  return map;
}

function quadBox(model) {
  const quad = model?.border;
  if (!quad) return null;
  const xs = [quad[0], quad[2], quad[4], quad[6]];
  const ys = [quad[1], quad[3], quad[5], quad[7]];
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  };
}

function nativeText(node) {
  const attributes = attributesOf(node);
  if (node.nodeName === "RAW-TEXT") return attributes.text ?? "";
  let text = node.nodeName === "TEXT" && attributes.text !== undefined ? attributes.text : "";
  for (const child of node.children ?? []) text += nativeText(child);
  return text;
}

/**
 * One Native step in window pixels: `{ list, rows: [{ key, x, y, w, h, text, texts }] }`.
 * A row's texts are its outermost `<text>` elements, as measure.js reads them from the
 * Lynx for Web shadow tree.
 */
export function nativeTranscriptStep(root) {
  let list = null;
  const find = (node) => {
    if (list) return;
    if (node.nodeName === "LIST" && /\bTranscriptList\b/.test(attributesOf(node).class ?? "")) {
      list = node;
      return;
    }
    for (const child of node.children ?? []) find(child);
  };
  find(root);
  if (!list) return null;
  const rows = [];
  const collectTexts = (node, texts) => {
    if (node.nodeName === "TEXT") {
      const box = quadBox(node.box_model);
      const text = norm(nativeText(node));
      if (box && text && (box.w > 0 || box.h > 0)) {
        texts.push({ t: text, cls: (attributesOf(node).class ?? "").slice(0, 80), ...box });
      }
      return;
    }
    for (const child of node.children ?? []) collectTexts(child, texts);
  };
  const visit = (node) => {
    if (node.nodeName === "LIST-ITEM") {
      const box = quadBox(node.box_model);
      if (box && box.h > 0) {
        const texts = [];
        collectTexts(node, texts);
        rows.push({
          key: attributesOf(node)["item-key"] ?? "",
          ...box,
          text: norm(nativeText(node)).slice(0, 70),
          texts,
          node,
        });
      }
      return;
    }
    for (const child of node.children ?? []) visit(child);
  };
  visit(list);
  rows.sort((left, right) => left.y - right.y);
  return { list: quadBox(list.box_model), rows };
}

/** Electron step from measure.js, re-based to the same shape (content pixels). */
function electronTranscriptStep(raw) {
  const seen = new Map();
  const rows = raw.rows.map((row) => {
    // Row tops move in the virtualized list, so a row is known by kind and text
    // (numbered when two rows of one step share both).
    const base = `${row.kind}|${row.text}`;
    const nth = (seen.get(base) ?? 0) + 1;
    seen.set(base, nth);
    return {
      id: nth === 1 ? base : `${base}#${nth}`,
      key: `${row.kind}${row.role ? `:${row.role}` : ""}`,
      x: row.x,
      y: row.y,
      w: row.w,
      h: row.h,
      text: row.text,
      texts: [],
    };
  });
  for (const text of raw.texts) {
    const middle = text.y + text.h / 2;
    const row = rows.find(
      (candidate) => middle >= candidate.y && middle < candidate.y + candidate.h,
    );
    if (row) row.texts.push(text);
  }
  return { rows, extras: raw.extras };
}

function eRowsByText(order, rows, text) {
  const wanted = text.replace(/\s+/g, "").slice(0, 24);
  for (const key of order) {
    const row = rows.get(key);
    if (row.text.replace(/\s+/g, "").slice(0, 24) === wanted) return row;
  }
  return null;
}

/** Keeps the tallest sighting of each row (a row entering the viewport may be partial). */
function mergeRow(rows, order, key, row) {
  const previous = rows.get(key);
  if (!previous) order.push(key);
  if (!previous || row.h > previous.h + 0.01) rows.set(key, row);
}

const blockKey = (text) => text.t.replace(/\s+/g, "").slice(0, 60);

/** Text blocks of one paired row, matched by text: offset from the row top and size. */
export function compareRowBlocks(electronRow, nativeRow) {
  const pool = new Map();
  for (const text of nativeRow.texts) {
    const key = blockKey(text);
    if (!pool.has(key)) pool.set(key, []);
    pool.get(key).push(text);
  }
  const lines = [];
  for (const text of electronRow.texts) {
    const match = pool.get(blockKey(text))?.shift();
    if (!match) {
      lines.push({ kind: "electron-only", text: text.t.slice(0, 60), electron: text });
      continue;
    }
    const delta = {
      dy: round(match.y - nativeRow.y - (text.y - electronRow.y)),
      dx: round(match.x - nativeRow.x - (text.x - electronRow.x)),
      w: round(match.w - text.w),
      h: round(match.h - text.h),
    };
    lines.push({ kind: "paired", text: text.t.slice(0, 60), delta, electron: text, native: match });
  }
  for (const rest of pool.values()) {
    for (const text of rest)
      lines.push({ kind: "native-only", text: text.t.slice(0, 60), native: text });
  }
  return lines;
}

/**
 * The labeled controls that belong to transcript rows, relative to the row's top and
 * the transcript's left edge. `owned` lists what each row's own subtree labels
 * (`{ row, label, x, y }` in window pixels); a control of `labeledControls` counts
 * when it sits on one of them, so chrome drawn over the transcript is left out.
 */
function controlsInRows(controls, owned, left) {
  const out = [];
  for (const [label, boxes] of controls) {
    for (const box of boxes) {
      const owner = owned.find(
        (entry) =>
          entry.label === label &&
          Math.abs(entry.x - box.x) < 1.5 &&
          Math.abs(entry.y - box.y) < 1.5,
      );
      if (!owner) continue;
      out.push({
        row: owner.row,
        label,
        box: {
          x: round(box.x - left),
          y: round(box.y - owner.rowTop),
          width: round(box.width),
          height: round(box.height),
          gutter: box.gutter,
        },
      });
    }
  }
  return out;
}

/** Labeled descendants of each visible Native row, from the same tree as the rows. */
function nativeOwnedLabels(rows) {
  const owned = [];
  for (const row of rows) {
    const visit = (node) => {
      const attributes = attributesOf(node);
      const label = attributes["accessibility-label"];
      const box = quadBox(node.box_model);
      if (label && box) owned.push({ row, rowTop: row.y, label, x: box.x, y: box.y });
      for (const child of node.children ?? []) visit(child);
    };
    visit(row.node);
  }
  return owned;
}

const ELECTRON_OWNED_LABELS = `(() => {
  const sc = document.querySelector("[data-chat-scroll-container]");
  const norm = (s) => String(s).replace(/\\s+/g, " ").trim();
  return Array.from(sc.querySelectorAll("[data-timeline-row-kind]")).flatMap((row) => {
    const top = row.getBoundingClientRect().top;
    return Array.from(row.querySelectorAll("[aria-label]")).map((node) => {
      const control = node.matches('[data-slot="input"]') && node.parentElement?.matches('[data-slot="input-control"]') ? node.parentElement : node;
      const r = control.getBoundingClientRect();
      return { rowText: norm(row.innerText).slice(0, 70), rowKind: row.getAttribute("data-timeline-row-kind"), rowTop: top, label: node.getAttribute("aria-label"), x: r.x, y: r.y };
    });
  });
})()`;

let sharpModule = null;
async function savePng(png, path, width) {
  sharpModule ??= createRequire(join(repositoryRoot, "apps/lynx/package.json"))("sharp");
  await sharpModule(png).resize({ width }).png().toFile(path);
}

async function retry(action, attempts = 4) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await action();
    } catch (error) {
      if (attempt >= attempts) throw error;
      await sleep(600);
    }
  }
}

async function nativeTree(native) {
  return retry(async () => {
    await native.send("DOM.enable", { useCompression: false });
    const document = await native.send("DOM.getDocumentWithBoxModel", {});
    const step = nativeTranscriptStep(document?.root ?? document);
    if (!step) throw new Error("No TranscriptList in the Native tree.");
    return step;
  });
}

const ELECTRON_SCROLLER = 'document.querySelector("[data-chat-scroll-container]")';

async function main() {
  const argv = process.argv.slice(2);
  const option = (name, fallback = null) => {
    const index = argv.indexOf(name);
    return index >= 0 ? argv[index + 1] : fallback;
  };
  const threadName = option("--thread", "main");
  const threadId = MESSAGE_FORMATS_THREAD_IDS[threadName] ?? threadName;
  const label = option("--label", threadName);
  const outDir = option("--out");
  const shots = argv.includes("--shots");
  const clickText = option("--click-text");
  const maxSteps = Number(option("--steps", "14"));
  const stepPx = Number(option("--step-px", "520"));
  const run = readCertifiedRun();
  const theme = run.options.theme;
  const electron = await openElectronDriver(run.options.electronCdpPort);
  const native = await openNativeDriver(run.native.devtool.port);
  if (outDir) mkdirSync(join(outDir, "shots"), { recursive: true });
  try {
    const threadRow = { attribute: ["data-thread-id", threadId] };
    for (const driver of [electron, native]) await driver.tap(threadRow);
    await waitFor(
      async () =>
        (await electron.evaluate(
          `location.href.includes(${JSON.stringify(encodeURIComponent(threadId))}) && Boolean(${ELECTRON_SCROLLER}?.querySelector("[data-timeline-row-kind]"))`,
        )) === true,
      { label: `Electron to show ${threadId}` },
    );
    await sleep(2500);

    // Sightings per renderer, merged over the scroll steps.
    const electronRows = new Map();
    const electronOrder = [];
    const electronControls = new Map();
    const nativeRows = new Map();
    const nativeOrder = [];
    const nativeControls = new Map();

    const electronClick = async () => {
      if (!clickText) return;
      const box = await electron.evaluate(
        `(() => { const sc = ${ELECTRON_SCROLLER}; const w = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeValue.trim() === ${JSON.stringify(clickText)}) { n.parentElement.scrollIntoView({ block: "center" }); const r = n.parentElement.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } } return null; })()`,
      );
      if (!box) throw new Error(`Electron has no text "${clickText}" mounted.`);
      await sleep(300);
      const settled = await electron.evaluate(
        `(() => { const sc = ${ELECTRON_SCROLLER}; const w = document.createTreeWalker(sc, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) { if (n.nodeValue.trim() === ${JSON.stringify(clickText)}) { const r = n.parentElement.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; } } return null; })()`,
      );
      for (const type of ["mousePressed", "mouseReleased"]) {
        await electron.send("Input.dispatchMouseEvent", {
          type,
          x: settled.x,
          y: settled.y,
          button: "left",
          clickCount: 1,
        });
      }
      await sleep(1200);
    };

    const electronStep = async (index) => {
      const raw = JSON.parse(await electron.evaluate(MEASURE_EXPRESSION));
      if (raw.error) throw new Error(`Electron: ${raw.error}`);
      const step = electronTranscriptStep(raw);
      const geometry = await electron.evaluate(
        `(() => { const sc = ${ELECTRON_SCROLLER}; const r = sc.getBoundingClientRect(); return { x: r.left, y: r.top - sc.scrollTop, top: r.top, bottom: r.bottom, scrollTop: sc.scrollTop, max: sc.scrollHeight - sc.clientHeight }; })()`,
      );
      for (const row of step.rows) {
        mergeRow(electronRows, electronOrder, row.id, row);
      }
      const owned = (await electron.evaluate(ELECTRON_OWNED_LABELS)).flatMap((entry) => {
        const row = step.rows.find(
          (candidate) => candidate.id === `${entry.rowKind}|${entry.rowText}`,
        );
        return row ? [{ ...entry, row }] : [];
      });
      for (const entry of controlsInRows(await labeledControls(electron), owned, geometry.x)) {
        electronControls.set(`${entry.row.id}|${entry.label}|${entry.box.x}|${entry.box.y}`, entry);
      }
      return geometry;
    };

    // Both walks go from the end of the transcript to its start: a downward finger
    // drag of more than ~200px sends the Native list back to its top under the DevTool's
    // touch emulation, upward ones are exact.
    const electronBottom = `(() => { const sc = ${ELECTRON_SCROLLER}; sc.scrollTop = sc.scrollHeight; return sc.scrollTop; })()`;
    if (clickText) {
      await electron.evaluate(electronBottom);
      await sleep(500);
      for (let index = 0; index < maxSteps * 2; index += 1) {
        const found = await electron.evaluate(
          `(${ELECTRON_SCROLLER}.innerText ?? "").includes(${JSON.stringify(clickText)})`,
        );
        if (found) break;
        await electron.evaluate(`${ELECTRON_SCROLLER}.scrollTop -= ${stepPx / 2}`);
        await sleep(400);
      }
      await electronClick();
    }
    let electronTop = await electron.evaluate(electronBottom);
    await sleep(700);
    electronTop = await electron.evaluate(electronBottom);
    await sleep(400);
    for (let index = 0; index < maxSteps; index += 1) {
      const geometry = await electronStep(index);
      if (geometry.scrollTop <= 0) break;
      electronTop = Math.max(0, geometry.scrollTop - stepPx);
      await electron.evaluate(`${ELECTRON_SCROLLER}.scrollTop = ${electronTop}`);
      await sleep(600);
    }

    // Native: one stop per user message, reached through the message trail (the app's own
    // "scroll to message"). Finger drags are not used to travel: on this thread a drag that
    // brings an unmeasured tall row into range sends the list to its top (DevTool touch
    // emulation; see the checklist). Short downward drags inside a mounted row only add
    // the views of rows taller than the viewport.
    let step = await nativeTree(native);
    const centre = () => ({ x: step.list.x + step.list.w / 2, y: step.list.y + step.list.h / 2 });
    const visible = () => step.rows.filter((row) => row.x >= step.list.x - 1 && row.w > 0);
    const nativeContentY = new Map();
    let nativeSeen = 0;
    const record = async (shotName) => {
      step = await nativeTree(native);
      const rows = visible().filter((row) => row.key !== "transcript-bottom-inset");
      for (const row of rows) {
        if (!nativeContentY.has(row.key)) nativeContentY.set(row.key, (nativeSeen += 1));
        mergeRow(nativeRows, nativeOrder, row.key, row);
      }
      const controls = controlsInRows(
        await retry(() => labeledControls(native)),
        nativeOwnedLabels(rows),
        step.list.x,
      );
      for (const entry of controls) {
        nativeControls.set(`${entry.row.key}|${entry.label}|${entry.box.x}|${entry.box.y}`, entry);
      }
      if (shots && outDir) {
        await savePng(
          await nativeScreenshot(run.native.devtool.port),
          join(outDir, "shots", `${label}-native-${theme}-${shotName}.png`),
          run.options.width,
        );
      }
      return rows;
    };
    const clickNative = async () => {
      const target = await native.find({ text: clickText });
      if (!target) return false;
      if (target.y < step.list.y + 20 || target.y > step.list.y + step.list.h - 90) return false;
      await native.tap({ text: clickText });
      await sleep(1500);
      return true;
    };
    const trail = [...(await retry(() => labeledControls(native))).keys()]
      .filter((name) => /^Message \d+: /.test(name))
      .toSorted((left, right) => Number(left.match(/\d+/)[0]) - Number(right.match(/\d+/)[0]));
    // Stops: [{ anchorText, extras }] so Electron can take the same views.
    const stops = [];
    let clicked = !clickText;
    if (trail.length === 0) {
      const rows = await record("0");
      if (!clicked) clicked = await clickNative();
      if (clickText && clicked) await record("0");
      stops.push({ anchorText: rows[0]?.text ?? "", extras: 0, offset: null });
    }
    for (const [index, name] of trail.entries()) {
      await native.tap({ label: name });
      await sleep(1400);
      if (!clicked && (await clickNative())) {
        clicked = true;
        await native.tap({ label: name });
        await sleep(1200);
      }
      let rows = await record(`${index}`);
      const anchor = rows.toSorted((left, right) => left.y - right.y)[0];
      const stop = {
        anchorText: anchor?.text ?? "",
        offset: anchor ? anchor.y - step.list.y : 0,
        extras: 0,
      };
      stops.push(stop);
      // Views further down a row taller than the viewport, 400px at a time.
      for (let extra = 1; extra <= 4; extra += 1) {
        const last = rows.toSorted((left, right) => right.y + right.h - (left.y + left.h))[0];
        const nextStop = trail[index + 1] !== undefined;
        if (!last || last.y + last.h <= step.list.y + step.list.h - (nextStop ? 80 : 0)) break;
        const before = anchor ? (visible().find((row) => row.key === anchor.key)?.y ?? null) : null;
        for (let part = 0; part < 4; part += 1) {
          await native.scroll(centre(), 100);
          await sleep(250);
        }
        await sleep(400);
        step = await nativeTree(native);
        const tracked = visible().find((row) => row.key === last.key);
        const moved = tracked ? last.y - tracked.y : null;
        if (moved === null || Math.abs(moved - 400) > 40) {
          console.log(
            `   note: Native drag after stop ${index} moved ${moved ?? "off"}px (anchor before ${before}); extra views skipped`,
          );
          break;
        }
        stop.extras = extra;
        rows = await record(`${index}-${extra}`);
        if (!clicked && (await clickNative())) clicked = true;
      }
    }
    if (clickText && !clicked) console.log(`   note: Native never showed "${clickText}"`);

    // Electron views at the same stops.
    if (shots && outDir) {
      const anchorTop = (text) =>
        electron.evaluate(
          `(() => { const sc = ${ELECTRON_SCROLLER}; const norm = (s) => String(s).replace(/\\s+/g, "").slice(0, 24); const row = Array.from(sc.querySelectorAll("[data-timeline-row-kind]")).find((node) => norm(node.innerText) === ${JSON.stringify(text.replace(/\s+/g, "").slice(0, 24))}); if (!row) return null; return row.getBoundingClientRect().top - sc.getBoundingClientRect().top; })()`,
        );
      for (const [index, stop] of stops.entries()) {
        const known = eRowsByText(electronOrder, electronRows, stop.anchorText);
        if (known) {
          await electron.evaluate(`${ELECTRON_SCROLLER}.scrollTop = ${Math.max(0, known.y - 40)}`);
          await sleep(500);
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const top = await anchorTop(stop.anchorText);
            if (top === null || Math.abs(top - (stop.offset ?? 0)) < 1) break;
            await electron.evaluate(
              `${ELECTRON_SCROLLER}.scrollTop += ${top - (stop.offset ?? 0)}`,
            );
            await sleep(400);
          }
        }
        for (let extra = 0; extra <= stop.extras; extra += 1) {
          if (extra > 0) {
            await electron.evaluate(`${ELECTRON_SCROLLER}.scrollTop += 400`);
            await sleep(500);
          }
          await savePng(
            await electronScreenshot(electron),
            join(
              outDir,
              "shots",
              `${label}-electron-${theme}-${index}${extra ? `-${extra}` : ""}.png`,
            ),
            run.options.width,
          );
        }
      }
    }

    // Pair rows in transcript order. Native's bottom inset is not a transcript row.
    const eRows = electronOrder
      .map((key) => ({ ...electronRows.get(key), id: key }))
      .toSorted((left, right) => left.y - right.y);
    const nRows = nativeOrder
      .filter((key) => key !== "transcript-bottom-inset")
      .map((key) => ({ id: key, ...nativeRows.get(key) }))
      .toSorted((left, right) => nativeContentY.get(left.id) - nativeContentY.get(right.id));
    const count = Math.max(eRows.length, nRows.length);
    const table = [];
    console.log(`\n== ROWS ${threadId} (${theme}, ${run.options.width}x${run.options.height})`);
    console.log("  # Electron   Native    Δ  result  kind / text");
    for (let index = 0; index < count; index += 1) {
      const e = eRows[index];
      const n = nRows[index];
      const delta = e && n ? round(n.h - e.h) : null;
      const ok = delta !== null && Math.abs(delta) <= CONTROL_TOLERANCE_PX;
      table.push({
        index,
        electron: e ? { key: e.key, h: e.h, text: e.text } : null,
        native: n ? { key: n.key, h: n.h, text: n.text } : null,
        delta,
        match: ok,
      });
      console.log(
        `${String(index).padStart(3)} ${String(e ? round(e.h) : "-").padStart(8)} ${String(n ? round(n.h) : "-").padStart(8)} ${String(delta ?? "-").padStart(5)}  ${ok ? "ok    " : "DIFF  "}  ${(e?.key ?? "-").padEnd(18)} ${(e?.text ?? n?.text ?? "").slice(0, 48)}${e && n && norm(e.text).slice(0, 12) !== norm(n.text).slice(0, 12) ? `  ⟂ native: ${n.text.slice(0, 30)}` : ""}`,
      );
    }
    const blocks = [];
    if (argv.includes("--blocks")) {
      console.log("\n== TEXT BLOCKS per row (offset from row top; only > 1px or unpaired)");
      for (let index = 0; index < Math.min(eRows.length, nRows.length); index += 1) {
        const lines = compareRowBlocks(eRows[index], nRows[index]);
        blocks.push({ index, lines });
        const shown = lines.filter(
          (line) =>
            line.kind !== "paired" ||
            Math.abs(line.delta.dy) > 1 ||
            Math.abs(line.delta.h) > 1 ||
            Math.abs(line.delta.dx) > 1.5 ||
            Math.abs(line.delta.w) > 3,
        );
        if (shown.length === 0) continue;
        console.log(`-- row ${index} ${eRows[index].key} "${eRows[index].text.slice(0, 40)}"`);
        for (const line of shown) {
          if (line.kind === "paired") {
            console.log(
              `   Δy ${String(line.delta.dy).padStart(6)} Δx ${String(line.delta.dx).padStart(6)} Δw ${String(line.delta.w).padStart(6)} Δh ${String(line.delta.h).padStart(5)}  (E ${line.electron.w}x${line.electron.h} N ${round(line.native.w)}x${round(line.native.h)})  ${line.text}`,
            );
          } else {
            const item = line.electron ?? line.native;
            console.log(
              `   ${line.kind.padEnd(13)} ${round(item.w)}x${round(item.h)}  ${line.text}`,
            );
          }
        }
      }
    }

    // Controls: same row index and label, relative to the row's origin.
    const indexOfElectronRow = new Map(eRows.map((row, index) => [row.id, index]));
    const indexOfNativeRow = new Map(nRows.map((row, index) => [row.id, index]));
    const group = (entries, indexOf, keyOf) => {
      const perRow = new Map();
      for (const entry of entries.values()) {
        const index = indexOf.get(keyOf(entry.row));
        if (index === undefined) continue;
        const key = `row ${index}: ${entry.label}`;
        if (!perRow.has(key)) perRow.set(key, []);
        perRow.get(key).push(entry.box);
      }
      // A label repeated inside one row (one per code block) is numbered top to bottom.
      const byLabel = new Map();
      for (const [key, boxes] of perRow) {
        if (boxes.length === 1) byLabel.set(key, boxes);
        else {
          boxes
            .toSorted((left, right) => left.y - right.y || left.x - right.x)
            .forEach((box, ordinal) => byLabel.set(`${key} #${ordinal + 1}`, [box]));
        }
      }
      return byLabel;
    };
    const controls = compareControls(
      group(electronControls, indexOfElectronRow, (row) => row.id),
      group(nativeControls, indexOfNativeRow, (row) => row.key),
    );
    console.log(
      `\n== CONTROLS in rows: compared ${controls.compared}, within ${CONTROL_TOLERANCE_PX}px ${controls.matched}, outside ${controls.outside.length}, repeated ${controls.repeated}`,
    );
    for (const entry of controls.outside) {
      console.log(`   DIFF ${entry.label}  Δ ${JSON.stringify(entry.delta)}`);
    }
    for (const label of controls.electronOnly) console.log(`   electron-only ${label}`);
    for (const label of controls.nativeOnly) console.log(`   native-only   ${label}`);
    // Whole-window controls (composer, pending approval / question panel), as a cell does.
    let windowControls = null;
    if (argv.includes("--window")) {
      windowControls = compareControls(
        await labeledControls(electron),
        await retry(() => labeledControls(native)),
      );
      console.log(
        `\n== WINDOW CONTROLS: compared ${windowControls.compared}, within ${CONTROL_TOLERANCE_PX}px ${windowControls.matched}, exempt ${windowControls.exempt.length}, outside ${windowControls.outside.length}`,
      );
      for (const entry of windowControls.outside) {
        console.log(`   DIFF ${entry.label}  Δ ${JSON.stringify(entry.delta)}`);
      }
      for (const name of windowControls.missing) console.log(`   electron-only ${name}`);
      for (const name of windowControls.nativeOnly) console.log(`   native-only   ${name}`);
    }
    if (outDir) {
      writeFileSync(
        join(outDir, `${label}-${theme}.json`),
        `${JSON.stringify({ runId: run.runId, threadId, theme, viewport: { width: run.options.width, height: run.options.height }, rows: table, blocks, controls, windowControls }, null, 1)}\n`,
      );
    }
  } finally {
    electron.close();
    native.close();
  }
}

const isEntrypoint =
  process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  main().then(
    () => process.exit(0),
    (error) => {
      console.error(error instanceof Error ? (error.stack ?? error.message) : error);
      process.exit(1);
    },
  );
}
