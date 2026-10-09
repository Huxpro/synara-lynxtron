import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";

// Upstream's `EventRouter` has async continuations that do not check whether
// the component was unmounted (review finding 3; unfixed on upstream/main
// 6f54f53c6): a reconcile that resumes after cleanup can open a thread lease
// nobody listens to. The engine is run verbatim, so Lynx keeps that path
// unreachable instead: session sync mounts once per renderer lifetime and is
// never unmounted or re-keyed. A LynxView reload is a new renderer generation,
// and the host cancels the previous generation's streams.
describe("session sync mount lifetime", () => {
  const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
  const sessionSyncSource = readFileSync(
    new URL("./SessionSync.lynx.tsx", import.meta.url),
    "utf8",
  );

  it("is mounted once, behind a gate that only ever opens", () => {
    expect(appSource.match(/<SessionSync\b/g)).toHaveLength(1);
    expect(appSource).toContain("{storageReady ? <SessionSync /> : null}");
    // `storageReady` goes false → true exactly once and is never reset.
    expect(appSource.match(/setStorageReady\(/g)).toHaveLength(1);
    expect(appSource).toContain("setStorageReady(true);");
    expect(appSource).toContain("const [storageReady, setStorageReady] = useState(false);");
  });

  it("never swaps or drops the engine once it is loaded", () => {
    // One state write, from the loader; nothing sets it back to null.
    expect(sessionSyncSource.match(/setEventRouter\(/g)).toHaveLength(1);
    expect(sessionSyncSource).toContain("if (active) setEventRouter(() => component);");
    expect(sessionSyncSource).toContain("return EventRouter ? <EventRouter /> : null;");
    // The effect that loads it has no dependencies, so it cannot re-run.
    expect(sessionSyncSource).toMatch(/unbindHistory\(\);\n\s*\};\n\s*\}, \[\]\);/);
  });
});
