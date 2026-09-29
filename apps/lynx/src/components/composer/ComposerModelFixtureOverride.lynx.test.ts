import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Composer model deterministic catalog override", () => {
  it("lets Components Lab bypass product custom-model merging", () => {
    const source = readFileSync(
      new URL("./ComposerModelControl.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("readonly modelOptionsOverride?: ReadonlyArray<ProviderModelOption>");
    expect(source).toContain(
      "props.modelOptionsOverride ??\n      resolveLynxProviderModelOptions",
    );
  });
});
