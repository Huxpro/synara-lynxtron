// Lynxtron's main-thread engine loads the bundle as precompiled bytecode and
// rejects any bytecode holding a zero BigInt constant ("Decode error: Context
// construct failed"); non-zero BigInt constants load fine. Rewrite `0n`
// literals to an equivalent constructor call so the constant never reaches the
// bytecode. The call goes through `globalThis` because modules may bind their
// own `BigInt` (Effect's Schema exports one). Runs as a post loader, so the
// input is already plain JS.

import { parse } from "acorn";

// Cheap pre-filter: a numeric token made only of zero digits (any radix
// prefix, optional separators) with a BigInt suffix.
const ZERO_BIGINT_CANDIDATE = /(?<![\w$.])0[xob]?[0_]*n(?![\w$])/i;

const ZERO_BIGINT_CALL = "globalThis.BigInt(0)";

function parseProgram(source) {
  const options = { ecmaVersion: "latest", allowHashBang: true };
  try {
    return parse(source, { ...options, sourceType: "module" });
  } catch {
    return parse(source, { ...options, sourceType: "script" });
  }
}

function isUncomputedKey(node, parent) {
  if (parent === null || parent.key !== node || parent.computed) return false;
  return (
    parent.type === "Property" ||
    parent.type === "PropertyDefinition" ||
    parent.type === "MethodDefinition"
  );
}

function collectZeroBigIntLiterals(node, parent, edits) {
  if (node.type === "Literal" && typeof node.bigint === "string" && node.value === 0n) {
    edits.push({
      start: node.start,
      end: node.end,
      // `{ 0n: x }` names the property "0"; a call is not valid in key position.
      text: isUncomputedKey(node, parent) ? "0" : ZERO_BIGINT_CALL,
    });
    return;
  }
  for (const key in node) {
    const value = node[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child.type === "string") collectZeroBigIntLiterals(child, node, edits);
      }
    } else if (value && typeof value.type === "string") {
      collectZeroBigIntLiterals(value, node, edits);
    }
  }
}

export function rewriteZeroBigIntLiterals(source) {
  if (!ZERO_BIGINT_CANDIDATE.test(source)) return source;
  const edits = [];
  collectZeroBigIntLiterals(parseProgram(source), null, edits);
  if (edits.length === 0) return source;
  edits.sort((left, right) => left.start - right.start);
  let output = "";
  let cursor = 0;
  for (const edit of edits) {
    output += source.slice(cursor, edit.start) + edit.text;
    cursor = edit.end;
  }
  return output + source.slice(cursor);
}

export default function zeroBigIntLiteralLoader(source, map, meta) {
  this.callback(null, rewriteZeroBigIntLiterals(source), map, meta);
}
