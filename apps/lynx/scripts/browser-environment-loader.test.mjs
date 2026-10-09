import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
  BROWSER_ENVIRONMENT_GLOBALS,
  BROWSER_ENVIRONMENT_MODULE,
  injectBrowserEnvironment,
  planBrowserEnvironment,
} from "./browser-environment-loader.mjs";

const inject = (source) => injectBrowserEnvironment(source, { modulePath: "/env.ts" });

test("binds only the globals a file references, on the first line", () => {
  const source = 'import { a } from "./a";\nexport const w = window.innerWidth + a;\n';
  assert.equal(inject(source), `import { window } from "/env.ts";${source}`);
  assert.equal(inject(source).split("\n").length, source.split("\n").length);
});

test("covers typeof probes, called members and several globals", () => {
  const source =
    'if (typeof window !== "undefined") window.setTimeout(() => document.title, 0);\n' +
    "export const p = navigator.platform + localStorage.getItem(k) + sessionStorage.length;\n";
  assert.deepEqual(planBrowserEnvironment(source).bound, [
    "window",
    "document",
    "navigator",
    "localStorage",
    "sessionStorage",
  ]);
});

test("leaves files without browser globals untouched", () => {
  const source = "export const windowTitle = other.window + options?.document;\n";
  assert.equal(inject(source), source);
});

test("ignores comments, strings and member names", () => {
  const source =
    "// window.open is not used\n/* document */\n" +
    "export const b = a.window + a?.document + 'localStorage' + \"navigator\";\n";
  assert.equal(inject(source), source);
});

test("binds a global that only appears in a conditional branch", () => {
  assert.deepEqual(planBrowserEnvironment("export const w = ok ? window : undefined;").bound, [
    "window",
  ]);
});

test("sees globals inside template literal expressions", () => {
  assert.deepEqual(planBrowserEnvironment("export const a = `x ${location.origin}`;").bound, [
    "location",
  ]);
});

test("does not bind a name the file declares itself", () => {
  const source =
    "export function f() { const location = useLocation(); return location.pathname; }\n" +
    "export const origin = window.location.origin;\n";
  assert.deepEqual(planBrowserEnvironment(source), { bound: ["window"], declared: ["location"] });
  assert.equal(inject(source), `import { window } from "/env.ts";${source}`);
  const destructured = "const { location, history } = source;\nexport const p = location.href;\n";
  assert.equal(inject(destructured), destructured);
  const imported = 'import crypto from "node:crypto";\nexport const id = crypto.randomUUID();\n';
  assert.equal(inject(imported), imported);
});

test("the environment module exports every name the loader binds", () => {
  const moduleSource = readFileSync(BROWSER_ENVIRONMENT_MODULE, "utf8");
  for (const name of BROWSER_ENVIRONMENT_GLOBALS) {
    assert.match(moduleSource, new RegExp(`^export const ${name}\\b`, "m"), name);
  }
  const declared = moduleSource
    .slice(moduleSource.indexOf("export const BROWSER_ENVIRONMENT_GLOBALS"))
    .match(/"([a-zA-Z]+)"/g)
    .map((entry) => entry.slice(1, -1));
  assert.deepEqual(declared, [...BROWSER_ENVIRONMENT_GLOBALS]);
});
