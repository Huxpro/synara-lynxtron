import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { useState } from "@lynx-js/react";
import { describe, expect, it, rs } from "@rstest/core";

import { SelectionNewChatComposer } from "./SelectionNewChatComposer.lynx";

// Web compositions resolve the JSX runtime from apps/web, which rstest cannot load; the send
// element keeps its own adapter tests.
rs.mock("@synara-web/components/chat/ComposerInputComposition", () => ({
  ComposerPrimaryActionComposition: (props: {
    readonly accessibleLabel: string;
    readonly disabled: boolean;
    readonly onActivate: () => void;
  }) => (
    <view
      aria-label={props.accessibleLabel}
      className={`ComposerPrimaryActionLynx${
        props.disabled ? " ComposerPrimaryActionLynx--disabled" : ""
      }`}
      bindtap={props.onActivate}
    />
  ),
}));

// The composer opens from a toolbar press, never on the first render: its native field
// syncs its value on mount, which the test host only supports after the initial flush.
function OpenOnTap(props: { readonly children: JSX.Element }) {
  const [open, setOpen] = useState(false);
  return open ? props.children : <view className="OpenComposer" bindtap={() => setOpen(true)} />;
}

function renderComposer(onSubmit = rs.fn(async () => undefined)) {
  const onClose = rs.fn();
  render(
    <OpenOnTap>
      <SelectionNewChatComposer
        selection={{ assistantMessageId: "m1", text: "Use const" }}
        anchor={{ left: 243, top: 49, placement: "top" }}
        defaultEnvMode="local"
        canUseWorktree
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </OpenOnTap>,
  );
  const opener = elementTree.root?.querySelector(".OpenComposer");
  if (!opener) throw new Error("expected the opener");
  fireEvent.tap(opener);
  return { onSubmit, onClose };
}

function byLabel(label: string): Element {
  const element = Array.from(elementTree.root?.querySelectorAll("[aria-label]") ?? []).find(
    (node) => node.getAttribute("aria-label") === label,
  );
  if (!element) throw new Error(`expected ${label}`);
  return element;
}

describe("Lynx selection new-chat composer", () => {
  it("quotes the selection and offers Open in chat, close, Local, and send", () => {
    renderComposer();
    expect(elementTree.root?.textContent).toContain("1 selection");
    expect(byLabel("New chat from selection")).toBeTruthy();
    expect(byLabel("Open in chat")).toBeTruthy();
    expect(byLabel("Close new chat composer")).toBeTruthy();
    expect(byLabel("Local")).toBeTruthy();
    expect(byLabel("Send to new chat").getAttribute("class")).toContain(
      "ComposerPrimaryActionLynx--disabled",
    );
  });

  it("opens the quote in a new chat composer without a message", async () => {
    const { onSubmit, onClose } = renderComposer();
    fireEvent.tap(byLabel("Open in chat"));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith("", "local", "compose");
  });

  it("stays open and shows the error when starting the chat fails", async () => {
    const { onClose } = renderComposer(
      rs.fn(async () => {
        throw new Error("Check out a branch before starting a new worktree.");
      }),
    );
    fireEvent.tap(byLabel("Open in chat"));
    await waitFor(() =>
      expect(elementTree.root?.textContent).toContain(
        "Check out a branch before starting a new worktree.",
      ),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes from the backdrop", () => {
    const { onClose } = renderComposer();
    const backdrop = elementTree.root?.querySelector(".SelectionChatBackdrop");
    if (!backdrop) throw new Error("expected the backdrop");
    fireEvent(backdrop, new Event("catchEvent:tap", { bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
