import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
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
  assert.doesNotMatch(first.text, /from "\.{1,2}\//, "no relative import survives the rewrite");

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
