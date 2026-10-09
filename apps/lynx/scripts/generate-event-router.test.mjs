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
  runEventRouterGenerator,
} from "./generate-event-router.mjs";

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
  const first = extractEventRouter({ sourceText: upstreamSource });
  const second = extractEventRouter({ sourceText: upstreamSource });
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
