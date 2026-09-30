import { afterEach, describe, expect, it, vi } from "vitest";

describe("projectAppearance emoji detection", () => {
  const intl = globalThis.Intl;

  afterEach(() => {
    globalThis.Intl = intl;
    vi.resetModules();
  });

  it("finds a leading emoji with grapheme segmentation", async () => {
    const { firstEmoji } = await import("./projectAppearance");
    expect(firstEmoji("🚀 Launch")).toBe("🚀");
  });

  // Lynx renders project glyphs on its main-thread engine, which has no Intl at all.
  it("falls back to code points when the engine has no Intl", async () => {
    vi.resetModules();
    // @ts-expect-error -- simulate an engine without the Intl namespace
    delete globalThis.Intl;
    const { firstEmoji } = await import("./projectAppearance");
    expect(firstEmoji("🚀 Launch")).toBe("🚀");
    expect(firstEmoji("plain")).toBeNull();
  });
});
