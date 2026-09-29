import { describe, expect, it } from "@rstest/core";

import {
  claimComposerInputFocus,
  confirmTerminalInputFocus,
  releaseTerminalInputFocus,
  requestTerminalInputFocus,
  subscribeTerminalInputFocusOwner,
} from "./inputFocusOwnership.lynx";

describe("input focus ownership", () => {
  it("requires an explicit terminal intent before accepting Native focus", () => {
    claimComposerInputFocus();
    expect(confirmTerminalInputFocus("thread\0terminal")).toBe(false);
    requestTerminalInputFocus("thread\0terminal");
    expect(confirmTerminalInputFocus("thread\0terminal")).toBe(true);
  });

  it("prevents a stale terminal focus callback after Composer claims focus", () => {
    const owners: Array<string | null> = [];
    const dispose = subscribeTerminalInputFocusOwner((owner) => owners.push(owner));
    requestTerminalInputFocus("thread\0terminal");
    claimComposerInputFocus();
    expect(confirmTerminalInputFocus("thread\0terminal")).toBe(false);
    expect(owners.at(-1)).toBe(null);
    dispose();
  });

  it("releases only the matching terminal owner", () => {
    claimComposerInputFocus();
    requestTerminalInputFocus("a");
    expect(confirmTerminalInputFocus("a")).toBe(true);
    releaseTerminalInputFocus("b");
    const owners: Array<string | null> = [];
    const dispose = subscribeTerminalInputFocusOwner((owner) => owners.push(owner));
    expect(owners.at(-1)).toBe("a");
    releaseTerminalInputFocus("a");
    expect(owners.at(-1)).toBe(null);
    dispose();
  });
});
