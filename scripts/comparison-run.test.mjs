import { describe, expect, it } from "vitest";

import {
  isTransientCdpContextError,
  nativeBackendConnectionsFromLsof,
  nativeBuildStampProblems,
} from "./comparison-run.mjs";

describe("comparison run identity", () => {
  it("accepts Native sockets only when every loopback peer is the certified backend", () => {
    const output = [
      "COMMAND   PID      USER   FD   TYPE DEVICE SIZE/OFF NODE NAME",
      "lynxtron 4101 bytedance   31u  IPv4 0x1      0t0  TCP 127.0.0.1:61001->127.0.0.1:56730 (ESTABLISHED)",
      "lynxtron 4101 bytedance   32u  IPv4 0x2      0t0  TCP 127.0.0.1:8901->127.0.0.1:62000 (ESTABLISHED)",
      "lynxtron 4102 bytedance   33u  IPv4 0x3      0t0  TCP 10.0.0.2:61002->140.82.112.3:443 (ESTABLISHED)",
    ].join("\n");

    expect(
      nativeBackendConnectionsFromLsof(output, { runtimePort: 56730, devtoolPort: 8901 }),
    ).toEqual({
      backend: [{ pid: 4101, local: "127.0.0.1:61001", remote: "127.0.0.1:56730" }],
      violations: [],
      external: [{ pid: 4102, local: "10.0.0.2:61002", remote: "140.82.112.3:443" }],
    });
  });

  it("reports a Native socket that reached a stale backend port", () => {
    const output =
      "lynxtron 4101 bytedance 31u IPv4 0x1 0t0 TCP 127.0.0.1:61001->127.0.0.1:53477 (ESTABLISHED)";

    expect(
      nativeBackendConnectionsFromLsof(output, { runtimePort: 58090, devtoolPort: null }),
    ).toMatchObject({
      backend: [],
      violations: [{ remote: "127.0.0.1:53477" }],
    });
  });

  it("refuses a reused Native bundle unless source and bundle identity both match", () => {
    const source = { commit: "abc", digest: "d1" };
    const bundles = { lynxBundle: "b1", mainScript: "m1" };
    const stamp = { source, bundles };

    expect(nativeBuildStampProblems(stamp, source, bundles)).toEqual([]);
    expect(nativeBuildStampProblems(null, source, bundles)).toEqual([
      "no Native build stamp exists; run without --skip-build",
    ]);
    // Committing identical content changes the commit, not the inputs.
    expect(nativeBuildStampProblems(stamp, { commit: "def", digest: "d1" }, bundles)).toEqual([]);
    expect(nativeBuildStampProblems(stamp, { commit: "abc", digest: "d2" }, bundles)).toEqual([
      "Native sources changed since the bundle was built",
    ]);
    expect(
      nativeBuildStampProblems(stamp, source, { lynxBundle: "other", mainScript: "m1" }),
    ).toEqual(["lynxBundle differs from the stamped build"]);
  });

  it("treats only execution-context loss as a transient CDP failure", () => {
    expect(isTransientCdpContextError("Promise was collected")).toBe(true);
    expect(isTransientCdpContextError("Execution context was destroyed.")).toBe(true);
    expect(isTransientCdpContextError("Cannot find context with specified id")).toBe(true);
    expect(isTransientCdpContextError("Failed reading: ReferenceError: x is not defined")).toBe(
      false,
    );
  });
});
