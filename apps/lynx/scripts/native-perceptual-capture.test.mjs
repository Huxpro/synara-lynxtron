import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clientMatchesOwnedPorts,
  collectDescendantPids,
  findFirstNodeByClass,
  parseListeningPorts,
  quadBounds,
} from "./native-perceptual-capture.mjs";

test("collects a PID tree without duplicating descendants", () => {
  const children = new Map([
    [10, [11, 12]],
    [11, [13]],
    [12, [13]],
    [13, []],
  ]);
  assert.deepEqual(
    collectDescendantPids(10, (pid) => children.get(pid) ?? []),
    [10, 11, 12, 13],
  );
});

test("parses listening ports and matches only PID-owned clients", () => {
  const ports = parseListeningPorts("p1\nn127.0.0.1:8904\nn*:59132\n");
  assert.deepEqual([...ports], [8904, 59132]);
  assert.equal(
    clientMatchesOwnedPorts({ id: "localhost:8904", name: "Synara" }, ports),
    true,
  );
  assert.equal(
    clientMatchesOwnedPorts({ id: "localhost:8903", name: "Other" }, ports),
    false,
  );
});

test("finds a class token without substring matches", () => {
  const root = {
    nodeId: 1,
    attributes: ["class", "Root"],
    children: [
      {
        nodeId: 2,
        attributes: ["class", "Targetish"],
        children: [],
      },
      {
        nodeId: 3,
        attributes: ["class", "Before Target After"],
        children: [],
      },
    ],
  };
  assert.equal(findFirstNodeByClass(root, "Target")?.nodeId, 3);
  assert.equal(findFirstNodeByClass(root, "Missing"), null);
});

test("normalizes a CDP quad into a geometry box", () => {
  assert.deepEqual(quadBounds([10, 20, 30, 20, 30, 50, 10, 50]), {
    x: 10,
    y: 20,
    width: 20,
    height: 30,
  });
  assert.equal(quadBounds([1, 2]), null);
});
