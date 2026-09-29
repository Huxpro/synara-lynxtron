import { describe, expect, it } from "@rstest/core";

import {
  highlightCodeForNativePreview,
  highlightCodeThemesForNativePreview,
} from "./syntaxHighlightingHost";

const CODE = "export const ready = true;";

describe("Native syntax highlighting host", () => {
  it("returns real GitHub light and dark Shiki tokens", async () => {
    const [light, dark] = await Promise.all([
      highlightCodeForNativePreview({
        code: CODE,
        path: "src/example.ts",
        theme: "light",
      }),
      highlightCodeForNativePreview({
        code: CODE,
        path: "src/example.ts",
        theme: "dark",
      }),
    ]);

    expect(light).toMatchObject({
      language: "typescript",
      theme: "light",
    });
    expect(light?.lines.flat()).toContainEqual({
      color: "#D73A49",
      content: "export",
      fontStyle: 0,
    });
    expect(light?.lines.flat()).toContainEqual({
      color: "#005CC5",
      content: "ready",
      fontStyle: 0,
    });
    expect(dark).toMatchObject({
      language: "typescript",
      theme: "dark",
    });
    expect(dark?.lines.flat()).toContainEqual({
      color: "#F97583",
      content: "export",
      fontStyle: 0,
    });
    expect(dark?.lines.flat()).toContainEqual({
      color: "#79B8FF",
      content: "ready",
      fontStyle: 0,
    });
  });

  it("returns plain-text fallback signals for unsupported files", async () => {
    await expect(
      highlightCodeForNativePreview({
        code: "binary-like contents",
        path: "archive.bin",
        theme: "light",
      }),
    ).resolves.toBeNull();
  });

  it("returns both themes in one race-free Host projection", async () => {
    const themes = await highlightCodeThemesForNativePreview({
      code: CODE,
      path: "src/example.ts",
    });

    expect(themes?.light.theme).toBe("light");
    expect(themes?.dark.theme).toBe("dark");
    expect(themes?.light.lines.flat()).toContainEqual({
      color: "#D73A49",
      content: "export",
      fontStyle: 0,
    });
    expect(themes?.dark.lines.flat()).toContainEqual({
      color: "#F97583",
      content: "export",
      fontStyle: 0,
    });
  });
});
