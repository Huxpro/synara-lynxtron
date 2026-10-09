import { describe, expect, it, rs } from "@rstest/core";
import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";

import { TranscriptUserMessageEditForm } from "./TranscriptUserMessageEditForm.lynx";

function editTextarea(): Element {
  const element = elementTree.root?.querySelector(".TranscriptUserEditTextarea");
  if (!element) throw new Error("expected user-message edit textarea");
  return element;
}

function editButtons(): Element[] {
  return Array.from(
    elementTree.root?.querySelectorAll(".TranscriptUserEditActions .LxButton") ?? [],
  );
}

describe("Lynx user-message edit form", () => {
  it("keeps the draft local and exposes cancel/send through native controls", async () => {
    const onCancel = rs.fn();
    const onDraftChange = rs.fn();
    const onSubmit = rs.fn();
    render(
      <TranscriptUserMessageEditForm
        chatFontSizePx={14}
        disabled={false}
        draft="Original prompt"
        error={null}
        onCancel={onCancel}
        onDraftChange={onDraftChange}
        onSubmit={onSubmit}
      />,
    );

    expect(editTextarea().getAttribute("accessibility-label")).toBe("Edit message");
    editTextarea().dispatchEvent(
      new CustomEvent("bindEvent:input", {
        bubbles: true,
        detail: { value: "Edited prompt" },
      }),
    );
    await waitFor(() => expect(onDraftChange).toHaveBeenCalledWith("Edited prompt"));

    const [cancel, send] = editButtons();
    fireEvent.tap(cancel!);
    fireEvent.tap(send!);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("retains and displays a failed draft while disabling pending actions", () => {
    render(
      <TranscriptUserMessageEditForm
        chatFontSizePx={14}
        disabled
        draft="Keep this draft"
        error="Provider unavailable"
        onCancel={() => undefined}
        onDraftChange={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(editTextarea().getAttribute("default-value")).toBe("Keep this draft");
    expect(elementTree.root?.querySelector(".TranscriptUserEditError")?.textContent).toBe(
      "Provider unavailable",
    );
    expect(
      editButtons().every(
        (button) => button.getAttribute("accessibility-state") === '{"disabled":true}',
      ),
    ).toBe(true);
  });
});
