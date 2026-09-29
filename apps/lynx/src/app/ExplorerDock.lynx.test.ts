import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx Explorer dock", () => {
  it("imports every React hook required by the editor explorer surface", () => {
    const source = readFileSync(new URL("./ExplorerDock.lynx.tsx", import.meta.url), "utf8");

    expect(source).toContain("import { useRef, useState, type ReactNode } from '@lynx-js/react';");
  });
});
