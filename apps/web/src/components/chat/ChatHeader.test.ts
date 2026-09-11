// FILE: ChatHeader.test.ts
// Purpose: Covers chat header presentation helpers that choose thread identity chrome.
// Layer: Component unit tests
// Depends on: ChatHeader pure helpers and Vitest assertions.

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { resolveThreadHeaderIconKind } from "@synara/shared/threadHeaderIdentity";

describe("resolveThreadHeaderIconKind", () => {
  it("uses the terminal icon for terminal-first threads", () => {
    expect(resolveThreadHeaderIconKind("terminal", "New terminal")).toBe("terminal");
  });

  it("keeps provider branding for chat-first threads", () => {
    expect(resolveThreadHeaderIconKind("chat", "Fix auth flow")).toBe("provider");
  });

  it("hides provider branding for untouched new chat threads", () => {
    expect(resolveThreadHeaderIconKind("chat", "New thread")).toBe("none");
  });
});

describe("editor rail independent tabs", () => {
  it("keeps chat tabs in the shared scroll lane and actions in the fixed lane", () => {
    const source = readFileSync(new URL("./ChatHeader.tsx", import.meta.url), "utf8");
    expect(source).toContain('import { IndependentTabRow } from "./IndependentTabRow"');
    expect(source).toContain('<IndependentTabRow');
    expect(source).toContain('actionPlacement="start"');
    expect(source).toContain('tabsClassName="justify-end"');
    expect(source).not.toContain('const shouldShowTabs =');
  });
});
