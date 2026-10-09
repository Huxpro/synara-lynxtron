import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  EVENT_ROUTER_GLOBAL_PORTS,
  EVENT_ROUTER_OUTPUT,
  EVENT_ROUTER_SOURCE,
  EventRouterGenerationError,
  extractEventRouter,
  generateEventRouter,
  runEventRouterGenerator,
} from "./generate-event-router.mjs";
import {
  applyEventRouterPatches,
  EventRouterPatchError,
  QUEUED_EVENT_PATCH,
} from "./event-router-patches.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const upstreamSource = fs.readFileSync(path.join(repoRoot, EVENT_ROUTER_SOURCE), "utf8");

const FIXTURE = `
import { ThreadId, type OrchestrationEvent, type Unused } from "@synara/contracts";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import DefaultThing, * as everything from "../lib/everything";
import { readNativeApi } from "../nativeApi";
import { helper } from "./-rootHelper";
import { getDesktopBridge } from "~/platform/desktopBridge";

const LIMIT = 4;
const UNRELATED = 9;
type Pending = { readonly events: OrchestrationEvent[] };

export const Route = { component: RootRouteView };

function RootRouteView() {
  const [value] = useState(UNRELATED);
  return <div>{value}<Outlet /></div>;
}

// Bounded append.
function appendBounded(items: number[], item: number): void {
  if (items.length >= LIMIT) items.shift();
  items.push(item);
}

function EventRouter() {
  const navigate = useNavigate();
  useEffect(() => {
    const api = readNativeApi();
    const pending: Pending = { events: [] };
    const items: number[] = [];
    appendBounded(items, pending.events.length);
    const timer = setTimeout(() => undefined, LIMIT);
    void navigate({ to: "/$threadId", params: { threadId: ThreadId.makeUnsafe("a") } });
    return () => {
      clearTimeout(timer);
      helper(api, everything.all, DefaultThing, selectLate);
    };
  }, [navigate]);
  return null;
}
const selectLate = getDesktopBridge;
`;

test("extracts EventRouter with exactly the declarations and imports it closes over", () => {
  const result = extractEventRouter({ sourceText: FIXTURE });

  assert.deepEqual(
    result.declarations.map((declaration) => declaration.names),
    [["LIMIT"], ["Pending"], ["appendBounded"], ["EventRouter"], ["selectLate"]],
  );
  assert.deepEqual(result.imports, [
    'import { ThreadId, type OrchestrationEvent } from "@synara/contracts";',
    'import { useNavigate } from "@tanstack/react-router";',
    'import { useEffect } from "react";',
    'import DefaultThing, * as everything from "~/lib/everything";',
    'import { readNativeApi } from "~/nativeApi";',
    'import { helper } from "~/routes/-rootHelper";',
    'import { getDesktopBridge } from "~/platform/desktopBridge";',
  ]);
  // The route shell and what only it uses stay behind.
  assert.doesNotMatch(result.text, /RootRouteView|UNRELATED|Outlet|useState|Unused|Route\b/);
  // Declarations are verbatim, leading comment included, and the root is exported.
  assert.match(result.text, /\/\/ Bounded append\.\nfunction appendBounded\(items: number\[\]/);
  assert.match(result.text, /\nexport \{ EventRouter \};\n$/);
});

test("extraction of the upstream file is deterministic and matches the committed artifact", () => {
  const first = generateEventRouter({ sourceText: upstreamSource });
  const second = generateEventRouter({ sourceText: upstreamSource });
  assert.equal(first.text, second.text);
  assert.ok(first.declarations.some((declaration) => declaration.names.includes("EventRouter")));
  for (const line of first.imports) {
    assert.doesNotMatch(line, /from "\.{1,2}\//, "no relative import survives the rewrite");
  }
  // Upstream's engine uses `window` timers; they are the only global it needs ported.
  assert.deepEqual(first.globalPorts, [
    'import { lynxWindowTimers as window } from "../platform/windowTimers";',
  ]);

  const messages = [];
  const code = runEventRouterGenerator({
    check: true,
    log: (line) => messages.push(line),
    logError: (line) => messages.push(line),
  });
  assert.equal(code, 0, messages.join("\n"));
  assert.ok(fs.existsSync(path.join(repoRoot, EVENT_ROUTER_OUTPUT)));
});

test("--check fails when the source or the generated file drifts", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "event-router-generator-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const sourceFile = path.join(directory, "__root.tsx");
  const outputFile = path.join(directory, "eventRouter.generated.tsx");
  const errors = [];
  const run = (check) =>
    runEventRouterGenerator({
      check,
      sourceFile,
      outputFile,
      applyPatches: null,
      log: () => undefined,
      logError: (line) => errors.push(line),
    });

  fs.writeFileSync(sourceFile, FIXTURE);
  assert.equal(run(true), 1, "a missing artifact is stale");
  assert.equal(run(false), 0);
  assert.equal(run(true), 0);

  // Upstream changes a closed-over declaration.
  fs.writeFileSync(sourceFile, FIXTURE.replace("const LIMIT = 4;", "const LIMIT = 8;"));
  assert.equal(run(true), 1);
  assert.match(errors.at(-1), /is stale/);
  assert.equal(run(false), 0);
  assert.equal(run(true), 0);

  // Upstream changes something outside the closure: no drift.
  fs.writeFileSync(
    sourceFile,
    FIXTURE.replace("const LIMIT = 4;", "const LIMIT = 8;").replace(
      "UNRELATED = 9",
      "UNRELATED = 1",
    ),
  );
  assert.equal(run(true), 0);

  // The artifact is edited by hand.
  fs.appendFileSync(outputFile, "\n// hand edit\n");
  assert.equal(run(true), 1);
});

test("fails loudly on a closed-over identifier it cannot resolve", () => {
  const source = FIXTURE.replace(
    "appendBounded(items, pending.events.length);",
    "vanished(items);",
  );
  assert.throws(
    () => extractEventRouter({ sourceText: source }),
    (error) =>
      error instanceof EventRouterGenerationError &&
      /resolve to nothing: vanished \(apps\/web\/src\/routes\/__root\.tsx:\d+\)/.test(
        error.message,
      ),
  );

  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "event-router-generator-"));
  try {
    const sourceFile = path.join(directory, "__root.tsx");
    const outputFile = path.join(directory, "eventRouter.generated.tsx");
    fs.writeFileSync(sourceFile, source);
    const errors = [];
    const code = runEventRouterGenerator({
      sourceFile,
      outputFile,
      applyPatches: null,
      log: () => undefined,
      logError: (line) => errors.push(line),
    });
    assert.equal(code, 1);
    assert.match(errors[0], /vanished/);
    assert.equal(fs.existsSync(outputFile), false, "nothing is written on failure");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("fails loudly when upstream's shape is not the one it understands", () => {
  assert.throws(
    () =>
      extractEventRouter({
        sourceText: FIXTURE.replace("function EventRouter", "function Renamed"),
      }),
    /function EventRouter was not found/,
  );
  assert.throws(
    () =>
      extractEventRouter({
        sourceText: FIXTURE.replace("function EventRouter", "const EventRouter = function"),
      }),
    /function EventRouter was not found/,
  );
  assert.throws(
    () =>
      extractEventRouter({
        sourceText: FIXTURE.replace('"../nativeApi"', '"../../../server/src/nativeApi"'),
      }),
    /leaves apps\/web\/src and cannot be rewritten/,
  );
});

test("carries upstream exports over without exporting a root twice", () => {
  const result = extractEventRouter({
    sourceText: FIXTURE.replace("function appendBounded", "export function appendBounded").replace(
      "function EventRouter",
      "export function EventRouter",
    ),
  });
  assert.match(result.text, /\nexport function appendBounded\(/);
  assert.match(result.text, /\nexport function EventRouter\(/);
  assert.doesNotMatch(result.text, /export \{ EventRouter \}/);
});

test("fails loudly instead of dropping module initialization", () => {
  // A bare side-effect import, unless it is listed as ignorable.
  const withSideEffect = FIXTURE.replace(
    'import { helper } from "./-rootHelper";',
    'import { helper } from "./-rootHelper";\nimport "../lib/new-initialization";',
  );
  assert.throws(
    () => extractEventRouter({ sourceText: withSideEffect }),
    /side-effect import "\.\.\/lib\/new-initialization" at .*:\d+ would be dropped/,
  );
  assert.equal(
    extractEventRouter({
      sourceText: withSideEffect,
      allowedSideEffectImports: ["../lib/new-initialization"],
    }).text,
    extractEventRouter({ sourceText: FIXTURE }).text,
  );

  // Import attributes on an import the extraction keeps.
  assert.throws(
    () =>
      extractEventRouter({
        sourceText: FIXTURE.replace(
          'from "./-rootHelper";',
          'from "./-rootHelper" with { type: "json" };',
        ),
      }),
    /import of "\.\/-rootHelper" at .*:\d+ has import attributes/,
  );

  // A top-level statement that assigns to a binding the extraction includes.
  const mutable = FIXTURE.replace("const LIMIT = 4;", "let LIMIT = 4;");
  assert.throws(
    () =>
      extractEventRouter({
        sourceText: mutable.replace("const UNRELATED", "LIMIT = 8;\nconst UNRELATED"),
      }),
    /top-level statement at .*:\d+ uses extracted binding LIMIT and would be dropped/,
  );
  // … including one hidden in an excluded declaration or function.
  assert.throws(
    () =>
      extractEventRouter({
        sourceText: mutable.replace("const UNRELATED = 9;", "const UNRELATED = (LIMIT += 5);"),
      }),
    /assigns to extracted binding LIMIT/,
  );
  assert.throws(
    () =>
      extractEventRouter({
        sourceText: mutable.replace("const [value] = useState(UNRELATED);", "LIMIT++;"),
      }),
    /assigns to extracted binding LIMIT/,
  );
  // A top-level call that touches an included binding (registration, mutation).
  assert.throws(
    () =>
      extractEventRouter({
        sourceText: FIXTURE.replace(
          "const UNRELATED",
          "Object.freeze(selectLate);\nconst UNRELATED",
        ),
      }),
    /uses extracted binding selectLate/,
  );
  // Reading an included binding from excluded code is not initialization.
  assert.doesNotThrow(() =>
    extractEventRouter({
      sourceText: FIXTURE.replace("const UNRELATED = 9;", "const UNRELATED = LIMIT * 2;"),
    }),
  );
});

const withEventRouterBody = (body) => `
import { useEffect } from "react";

function EventRouter() {
  useEffect(() => {
${body}
  }, []);
  return null;
}
`;

test("binds a ported browser global to its Lynx module and leaves the body verbatim", () => {
  const body = `    const timer = window.setTimeout(() => undefined, 5);
    const interval = window.setInterval(() => undefined, 5);
    return () => {
      window.clearTimeout(timer);
      window.clearInterval(interval);
    };`;
  const result = extractEventRouter({ sourceText: withEventRouterBody(body) });

  assert.deepEqual(result.globalPorts, [
    'import { lynxWindowTimers as window } from "../platform/windowTimers";',
  ]);
  assert.ok(result.text.includes(body));
  // The port line follows upstream's own imports.
  assert.ok(
    result.text.indexOf('from "react";') <
      result.text.indexOf("import { lynxWindowTimers as window }"),
  );

  // Without a use, nothing is bound.
  const plain = extractEventRouter({
    sourceText: withEventRouterBody("    const timer = setTimeout(() => undefined, 5);"),
  });
  assert.deepEqual(plain.globalPorts, []);
  assert.ok(!plain.text.includes("windowTimers"));
});

test("the window port module provides every member the generator lets through", () => {
  const portSource = fs.readFileSync(
    path.join(
      repoRoot,
      path.dirname(EVENT_ROUTER_OUTPUT),
      `${EVENT_ROUTER_GLOBAL_PORTS.window.module}.ts`,
    ),
    "utf8",
  );
  assert.ok(portSource.includes(`export const ${EVENT_ROUTER_GLOBAL_PORTS.window.exportName}`));
  for (const member of EVENT_ROUTER_GLOBAL_PORTS.window.members) {
    assert.match(portSource, new RegExp(`\\b${member}: \\(`), member);
  }
});

test("fails loudly on a browser global or member that no Lynx port provides", () => {
  const unported = (body, expected) =>
    assert.throws(
      () => extractEventRouter({ sourceText: withEventRouterBody(body) }),
      (error) =>
        error instanceof EventRouterGenerationError &&
        error.message.includes("browser globals with no value on Lynx") &&
        error.message.includes(expected),
    );
  unported("    window.addEventListener('focus', () => undefined);", "window.addEventListener");
  unported("    const view = window;\n    void view;", "window (");
  unported("    document.title = 'x';", "document.title");
  unported("    void localStorage.getItem('k');", "localStorage.getItem");

  // A local binding of the same name is an ordinary reference, and `typeof`
  // reads no member.
  const shadowed = extractEventRouter({
    sourceText: withEventRouterBody(
      "    const document = { title: 'x' };\n    void document.title;\n    void (typeof window);",
    ),
  });
  assert.deepEqual(shadowed.globalPorts, []);
});

// ---------------------------------------------------------------------------
// Guarded patches (event-router-patches.mjs)

const PATCH_FIXTURE = `
function EventRouter() {
  useEffect(() => {
    let pendingDomainEvents: OrchestrationEvent[] = [];
    const flushPendingDomainEvents = () => {
      apply(pendingDomainEvents);
      pendingDomainEvents = [];
    };
    const queueDomainEvent = (event: OrchestrationEvent) => {
      pendingDomainEvents.push(event);
    };
    const reconcileThreadProjection = async (threadId: ThreadId) => {
      const snapshot = await api.getThreadDetailSnapshot({ threadId });
      syncServerThreadDetailHotPath(snapshot.thread, snapshot.snapshotSequence);
    };
    const unsub = api.onThreadEvent((item) => {
      if (item.kind === "snapshot") {
        syncServerThreadDetailHotPath(item.snapshot.thread, item.snapshot.snapshotSequence);
        return;
      }
      queueDomainEvent(item.event);
      flushPendingDomainEvents();
    });
    return unsub;
  }, []);
  return null;
}
`;

function patch(sourceText) {
  return applyEventRouterPatches({ sourceText, sourcePath: "apps/web/src/routes/__root.tsx" });
}

test("the queued-event patch filters the queue right before both snapshot applies", () => {
  const result = patch(PATCH_FIXTURE);
  assert.deepEqual(result.applied, [QUEUED_EVENT_PATCH]);
  assert.deepEqual(result.upstreamFixed, []);
  const lines = result.text.split("\n");
  for (const snapshot of ["snapshot", "item.snapshot"]) {
    const apply = lines.findIndex((line) =>
      line.includes(`syncServerThreadDetailHotPath(${snapshot}.thread`),
    );
    assert.ok(apply > 0);
    assert.deepEqual(
      lines.slice(apply - 5, apply).map((line) => line.trim()),
      [
        "pendingDomainEvents = pendingDomainEvents.filter(",
        "(queuedEvent) =>",
        `String(queuedEvent.aggregateId) !== ${snapshot}.thread.id ||`,
        `queuedEvent.sequence > ${snapshot}.snapshotSequence,`,
        ");",
      ],
    );
    // Same indentation as the statement it guards.
    assert.equal(lines[apply - 5].match(/^ */)[0], lines[apply].match(/^ */)[0]);
  }
  // Everything else is byte-identical.
  const inserted = (line, index, all) =>
    line.includes("LYNX PATCH") ||
    line.includes("// the snapshot already") ||
    line.includes("// sequence; flushing") ||
    line.includes("pendingDomainEvents = pendingDomainEvents.filter(") ||
    line.includes("queuedEvent") ||
    (line.trim() === ");" && all[index - 1].includes("queuedEvent.sequence"));
  assert.equal(
    lines.filter((line, index, all) => !inserted(line, index, all)).join("\n"),
    PATCH_FIXTURE,
  );
});

test("the queued-event patch is applied to the upstream file and named in the artifact", () => {
  const result = generateEventRouter({ sourceText: upstreamSource });
  assert.deepEqual(result.appliedPatches, [QUEUED_EVENT_PATCH]);
  assert.deepEqual(result.upstreamFixedPatches, []);
  assert.equal(result.text.split(`// LYNX PATCH ${QUEUED_EVENT_PATCH}`).length - 1, 2);
  assert.match(result.text.split("\n").slice(0, 10).join("\n"), new RegExp(QUEUED_EVENT_PATCH));
  // Without the patch the extraction is upstream's text, verbatim.
  const verbatim = generateEventRouter({ sourceText: upstreamSource, applyPatches: null });
  assert.doesNotMatch(verbatim.text, /LYNX PATCH/);
});

test("the queued-event patch stops generation on a queue use it does not recognize", () => {
  const before = (statement) =>
    PATCH_FIXTURE.replaceAll(/^( *)(syncServerThreadDetailHotPath\()/gm, `$1${statement}\n$1$2`);
  // A read is not a fix: stepping aside here would bring the duplicate back.
  assert.throws(() => patch(before("void pendingDomainEvents.length;")), /does not recognize/);
  // Neither is a flush that only runs in a callback or under a condition.
  assert.throws(
    () => patch(before("queueMicrotask(() => flushPendingDomainEvents());")),
    /does not recognize/,
  );
  assert.throws(() => patch(before("if (keep) flushPendingDomainEvents();")), /does not recognize/);
});

test("the queued-event patch steps aside once upstream handles the queue itself", () => {
  // Upstream filters the queue before applying, in both paths.
  const filtered = PATCH_FIXTURE.replaceAll(
    /^( *)(syncServerThreadDetailHotPath\()/gm,
    "$1pendingDomainEvents = pendingDomainEvents.filter(keep);\n$1$2",
  );
  assert.deepEqual(patch(filtered), {
    text: filtered,
    applied: [],
    upstreamFixed: [QUEUED_EVENT_PATCH],
  });
  // Or flushes it first.
  const flushed = PATCH_FIXTURE.replaceAll(
    /^( *)(syncServerThreadDetailHotPath\()/gm,
    "$1flushPendingDomainEvents();\n$1$2",
  ).replace(
    "const reconcileThreadProjection",
    "const hoisted = 0;\n    const reconcileThreadProjection",
  );
  assert.deepEqual(patch(flushed).upstreamFixed, [QUEUED_EVENT_PATCH]);

  const messages = [];
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "event-router-patch-"));
  try {
    const sourceFile = path.join(directory, "__root.tsx");
    fs.writeFileSync(
      sourceFile,
      `import { useEffect } from "react";\ndeclare const api: any; declare const keep: any; declare const apply: any;\n` +
        `declare const syncServerThreadDetailHotPath: any;\ntype OrchestrationEvent = unknown; type ThreadId = string;\n${filtered}`,
    );
    const code = runEventRouterGenerator({
      sourceFile,
      outputFile: path.join(directory, "out.tsx"),
      log: (line) => messages.push(String(line)),
      logError: (line) => messages.push(String(line)),
    });
    assert.equal(code, 0, messages.join("\n"));
    assert.ok(
      messages.some((line) => line.includes("Delete the patch")),
      messages.join("\n"),
    );
    assert.doesNotMatch(fs.readFileSync(path.join(directory, "out.tsx"), "utf8"), /LYNX PATCH/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("the queued-event patch stops the generator when upstream's shape changed", () => {
  const cases = [
    // A third place applies snapshots.
    PATCH_FIXTURE.replace(
      "return unsub;",
      "syncServerThreadDetailHotPath(other.thread, other.snapshotSequence);\n    return unsub;",
    ),
    // One of the two is gone.
    PATCH_FIXTURE.replace(
      "syncServerThreadDetailHotPath(snapshot.thread, snapshot.snapshotSequence);",
      "",
    ),
    // The call no longer passes the snapshot's own sequence.
    PATCH_FIXTURE.replace("snapshot.thread, snapshot.snapshotSequence", "snapshot.thread"),
    PATCH_FIXTURE.replace("item.snapshot.thread, item.snapshot.snapshotSequence", "thread, seq"),
    // The queue was renamed, made constant, or is no longer an array.
    PATCH_FIXTURE.replaceAll("pendingDomainEvents", "queuedDomainEvents"),
    PATCH_FIXTURE.replace("let pendingDomainEvents", "const pendingDomainEvents"),
    PATCH_FIXTURE.replace("OrchestrationEvent[] = [];", "Set<OrchestrationEvent> = new Set();"),
    // Only one path was fixed upstream.
    PATCH_FIXTURE.replace(
      "syncServerThreadDetailHotPath(snapshot.thread",
      "flushPendingDomainEvents();\n      syncServerThreadDetailHotPath(snapshot.thread",
    ),
    // The apply is no longer a statement of its own.
    PATCH_FIXTURE.replace(
      "syncServerThreadDetailHotPath(snapshot.thread, snapshot.snapshotSequence);",
      "const applied = syncServerThreadDetailHotPath(snapshot.thread, snapshot.snapshotSequence);",
    ),
  ];
  for (const sourceText of cases) {
    assert.throws(() => patch(sourceText), EventRouterPatchError, sourceText);
  }

  const errors = [];
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "event-router-patch-"));
  try {
    const sourceFile = path.join(directory, "__root.tsx");
    const outputFile = path.join(directory, "out.tsx");
    fs.writeFileSync(sourceFile, cases[0]);
    const code = runEventRouterGenerator({
      sourceFile,
      outputFile,
      log: () => undefined,
      logError: (line) => errors.push(line),
    });
    assert.equal(code, 1);
    assert.match(errors[0], /drop-queued-thread-events-covered-by-snapshot/);
    assert.equal(fs.existsSync(outputFile), false, "nothing is written");
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("a source without EventRouter is left for the extractor to reject", () => {
  assert.deepEqual(patch("const nothing = 1;\n").applied, []);
  assert.throws(
    () => generateEventRouter({ sourceText: "const nothing = 1;\n" }),
    EventRouterGenerationError,
  );
});
