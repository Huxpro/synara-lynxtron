import path from "node:path";

import { describe, expect, it } from "vitest";

import { injectLynxRuntimeConfig, resolveLynxDevAssetPath } from "./lynxDevSurface";

describe("Lynx dev surface", () => {
  it("injects the current server endpoint before the host bundle runs", () => {
    expect(
      injectLynxRuntimeConfig(
        "<html><head><title>Lynx</title></head><body></body></html>",
        "ws://127.0.0.1:58133",
      ),
    ).toContain(
      '<script>globalThis.__SYNARA_LYNX_RUNTIME__={"wsUrl":"ws://127.0.0.1:58133"};</script></head>',
    );
  });

  it("serves only files below the nested Lynx prefix", () => {
    const root = "/tmp/synara-lynx-dist";
    expect(resolveLynxDevAssetPath("/lynx/", root)).toBe(path.join(root, "index.html"));
    expect(resolveLynxDevAssetPath("/lynx/main.web.bundle?fresh=1", root)).toBe(
      path.join(root, "main.web.bundle"),
    );
    expect(resolveLynxDevAssetPath("/assets/app.js", root)).toBeNull();
    expect(resolveLynxDevAssetPath("/lynx/../../settings.json", root)).toBeNull();
  });
});
