import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";

import { KEYBINDINGS_ICON_NAME } from "./webIcons.lynx";

describe("Lynx target of the Web icon module", () => {
  it("keeps the icon-name constants equal to upstream's", () => {
    const upstream = readFileSync(
      new URL("../../../web/src/lib/icons.tsx", import.meta.url),
      "utf8",
    );
    expect(upstream).toContain(
      `export const KEYBINDINGS_ICON_NAME = ${JSON.stringify(KEYBINDINGS_ICON_NAME)};`,
    );
  });
});
