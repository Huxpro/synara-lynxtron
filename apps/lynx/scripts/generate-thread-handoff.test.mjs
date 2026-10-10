import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { formatGeneratedText } from "./format-generated.mjs";
import { EventRouterGenerationError } from "./generate-event-router.mjs";
import {
  THREAD_HANDOFF_OUTPUT,
  THREAD_HANDOFF_REPLACED_IMPORTS,
  THREAD_HANDOFF_SOURCE,
  generateThreadHandoff,
  runThreadHandoffGenerator,
} from "./generate-thread-handoff.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const upstreamSource = fs.readFileSync(path.join(repoRoot, THREAD_HANDOFF_SOURCE), "utf8");

const FIXTURE = `
import { useNavigate } from "@tanstack/react-router";
import { useComposerDraftStore } from "../composerDraftStore";
import { useProviderStatusesForLocalConfig } from "./useProviderStatusesForLocalConfig";
import { useRefreshProviderStatusesNow } from "./useProviderStatusRefresh";
import { resolveProviderHandoffOutcome } from "../lib/threadHandoff";
import { cn } from "../lib/utils";

const TIMEOUT_MS = 120_000;
const UNRELATED = cn("a");

function waitForOutcome(commandId: string): Promise<string> {
  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => resolve("pending"), TIMEOUT_MS);
    if (resolveProviderHandoffOutcome(undefined, commandId).status !== "pending") {
      window.clearTimeout(timeout);
      resolve("done");
    }
  });
}

export function useThreadHandoff() {
  const navigate = useNavigate();
  const statuses = useProviderStatusesForLocalConfig();
  const refresh = useRefreshProviderStatusesNow();
  return {
    continueThreadHandoff: async (threadId: string) => {
      useComposerDraftStore.getState();
      await refresh({ silent: true });
      await waitForOutcome(threadId + statuses.length);
      await navigate({ to: "/$threadId", params: { threadId } });
    },
  };
}

export function Unrelated() {
  return UNRELATED;
}
`;

test("extracts the hook with what it closes over and binds the window timers", () => {
  const result = generateThreadHandoff({ sourceText: FIXTURE });
  assert.deepEqual(
    result.declarations.map((declaration) => declaration.names),
    [["TIMEOUT_MS"], ["waitForOutcome"], ["useThreadHandoff"]],
  );
  assert.match(
    result.text,
    /import \{ lynxWindowTimers as window \} from "\.\.\/platform\/windowTimers";/,
  );
  assert.match(result.text, /from "~\/hooks\/useProviderStatusesForLocalConfig";/);
  assert.match(result.text, /from "~\/composerDraftStore";/);
  assert.doesNotMatch(result.text, /UNRELATED|Unrelated|\bcn\b/);
  assert.match(result.text, /generate-thread-handoff\.mjs/);
});

test("the committed artifact is the extraction of the upstream hook", () => {
  const result = generateThreadHandoff({ sourceText: upstreamSource });
  const outputFile = path.join(repoRoot, THREAD_HANDOFF_OUTPUT);
  assert.equal(fs.readFileSync(outputFile, "utf8"), formatGeneratedText(outputFile, result.text));
  // Both destinations and the outcome wait, verbatim.
  assert.match(result.text, /type: "thread\.meta\.update",[\s\S]*providerHandoff: true/);
  assert.match(result.text, /type: "thread\.handoff\.create"/);
  assert.match(result.text, /function waitForProviderHandoffOutcome/);
  // The upstream hooks Lynx replaces are named by the specifiers its aliases answer.
  for (const specifier of THREAD_HANDOFF_REPLACED_IMPORTS) {
    assert.ok(result.text.includes(` from ${JSON.stringify(specifier)};`), specifier);
  }
});

test("the replaced specifiers are the ones lynx.config.ts aliases", () => {
  const config = fs.readFileSync(path.join(repoRoot, "apps/lynx/lynx.config.ts"), "utf8");
  for (const specifier of THREAD_HANDOFF_REPLACED_IMPORTS) {
    assert.ok(config.includes(`"${specifier}$":`), `${specifier} has no alias in lynx.config.ts`);
  }
});

test("--check fails when upstream's hook drifts from the generated file", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "thread-handoff-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const sourceFile = path.join(directory, "useThreadHandoff.ts");
  const outputFile = path.join(directory, "threadHandoff.generated.ts");
  const silent = { log: () => {}, logError: () => {} };
  fs.writeFileSync(sourceFile, FIXTURE);
  assert.equal(runThreadHandoffGenerator({ sourceFile, outputFile, ...silent }), 0);
  assert.equal(runThreadHandoffGenerator({ check: true, sourceFile, outputFile, ...silent }), 0);
  fs.writeFileSync(sourceFile, FIXTURE.replace("120_000", "60_000"));
  assert.equal(runThreadHandoffGenerator({ check: true, sourceFile, outputFile, ...silent }), 1);
});

test("stops when the hook is missing, reads another browser global, or drops a replaced import", () => {
  const stops = (sourceText, pattern) =>
    assert.throws(
      () => generateThreadHandoff({ sourceText }),
      (error) => error instanceof EventRouterGenerationError && pattern.test(error.message),
    );
  stops(
    FIXTURE.replace("function useThreadHandoff", "function useHandoff"),
    /function useThreadHandoff was not found/,
  );
  stops(
    FIXTURE.replace("useComposerDraftStore.getState();", "window.focus();"),
    /browser globals with no value on Lynx: window\.focus/,
  );
  stops(
    FIXTURE.replace(
      "const statuses = useProviderStatusesForLocalConfig();",
      "const statuses = [];",
    ),
    /no longer imports "~\/hooks\/useProviderStatusesForLocalConfig", which Lynx replaces/,
  );
});
