// FILE: ChatHeader.test.ts
// Purpose: Covers chat header presentation helpers that choose thread identity chrome.
// Layer: Component unit tests
// Depends on: ChatHeader pure helpers and Vitest assertions.

import { describe, expect, it } from "vitest";

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
