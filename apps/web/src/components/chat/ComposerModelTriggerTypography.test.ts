import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("composer model trigger typography", () => {
  it("keeps effort metadata smaller than the model label", () => {
    const source = readFileSync(
      new URL("./ComposerModelTriggerCompositionElements.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain('"shrink-0 text-[10px] leading-[15px]"');
  });
});
