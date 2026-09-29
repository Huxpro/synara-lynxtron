import { describe, expect, it } from "@rstest/core";

import { isRspeedyDevAsset } from "./rspeedyDevProxy.logic";

describe("Rspeedy development proxy", () => {
  it("proxies Lynx bundles and Rspeedy runtime endpoints", () => {
    expect(isRspeedyDevAsset("/main.web.bundle")).toBe(true);
    expect(isRspeedyDevAsset("/web/main.web.bundle")).toBe(true);
    expect(isRspeedyDevAsset("/main.web.bundle.map")).toBe(true);
    expect(isRspeedyDevAsset("/__rspeedy__/events")).toBe(true);
  });

  it("keeps Rsbuild host assets on the host server", () => {
    expect(isRspeedyDevAsset("/static/css/web-host.css")).toBe(false);
    expect(isRspeedyDevAsset("/static/wasm/client.module.wasm")).toBe(false);
    expect(isRspeedyDevAsset("/web-host.js.map")).toBe(false);
  });
});
