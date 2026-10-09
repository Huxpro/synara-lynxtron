import assert from "node:assert/strict";
import { test } from "node:test";

import { rewriteZeroBigIntLiterals } from "./zero-bigint-literal-loader.mjs";

test("rewrites zero BigInt literals in every radix", () => {
  assert.equal(
    rewriteZeroBigIntLiterals("export const a = check(0n), b = 0x0n + 0b0n + 0o0n + 0x0_0n;"),
    "export const a = check(globalThis.BigInt(0)), b = globalThis.BigInt(0) + globalThis.BigInt(0) + globalThis.BigInt(0) + globalThis.BigInt(0);",
  );
});

test("keeps non-zero BigInt literals and plain numbers", () => {
  const source = "const hash = 0xcbf29ce484222325n * 1099511628211n + 10n + 0 + 0.0;";
  assert.equal(rewriteZeroBigIntLiterals(source), source);
});

test("leaves strings, templates, regexes, and comments alone", () => {
  const source = "const s = '0n', t = `0n ${1}`, r = /0n/.test(s); // 0n\nexport { s, t, r };";
  assert.equal(rewriteZeroBigIntLiterals(source), source);
});

test("keeps property keys valid", () => {
  assert.equal(
    rewriteZeroBigIntLiterals("const o = { 0n: 1, [0n]: 2 }; class C { 0n() {} }"),
    "const o = { 0: 1, [globalThis.BigInt(0)]: 2 }; class C { 0() {} }",
  );
});

test("does not resolve to a module-local BigInt binding", () => {
  assert.equal(
    rewriteZeroBigIntLiterals("const BigInt = schema(); export const zero = check(0n);"),
    "const BigInt = schema(); export const zero = check(globalThis.BigInt(0));",
  );
});

test("handles CommonJS scripts", () => {
  assert.equal(
    rewriteZeroBigIntLiterals("with (scope) { module.exports = 0n; }"),
    "with (scope) { module.exports = globalThis.BigInt(0); }",
  );
});
