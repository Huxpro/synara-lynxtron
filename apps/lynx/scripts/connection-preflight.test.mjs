import assert from "node:assert/strict";
import test from "node:test";

import { parseRuntimeWsUrl } from "./connection-preflight.mjs";

test("reads the same-origin Lynx runtime endpoint", () => {
  assert.equal(
    parseRuntimeWsUrl(
      '<html><head><script>globalThis.__SYNARA_LYNX_RUNTIME__={"wsUrl":"ws://127.0.0.1:58133"};</script></head></html>',
    ),
    "ws://127.0.0.1:58133",
  );
});

test("rejects a page without a runtime endpoint", () => {
  assert.equal(parseRuntimeWsUrl("<html><head></head></html>"), null);
});
