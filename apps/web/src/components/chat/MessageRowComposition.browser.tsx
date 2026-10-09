import "../../index.css";

import { page, userEvent } from "vitest/browser";
import { afterEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { CopyIcon } from "~/lib/icons";
import { MessageActionButton, MESSAGE_ACTION_ICON_CLASS_NAME } from "./MessageActionButton";
import {
  MESSAGE_ROW_HOVER_REVEAL_CLASS_NAME,
  MessageAssistantRowComposition,
} from "./MessageRowComposition";

describe("MessageAssistantRowComposition hover actions", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reveals and activates the real message action on pointer hover", async () => {
    const onCopy = vi.fn();
    await render(
      <div style={{ paddingTop: 240, paddingLeft: 240 }}>
        <MessageAssistantRowComposition>
          <p>Assistant response</p>
          <div data-message-footer className={MESSAGE_ROW_HOVER_REVEAL_CLASS_NAME}>
            <MessageActionButton label="Copy message" tooltip="Copy message" onClick={onCopy}>
              <CopyIcon className={MESSAGE_ACTION_ICON_CLASS_NAME} />
            </MessageActionButton>
          </div>
        </MessageAssistantRowComposition>
      </div>,
    );

    const row = page.getByText("Assistant response", { exact: true });
    // The pointer stays where an earlier file in the same shard left it, which can be
    // over this row. Park it on the page corner so the test starts from "not hovered".
    await userEvent.unhover(document.body);
    const footer = document.querySelector<HTMLElement>("[data-message-footer]");
    expect(footer).not.toBeNull();
    expect(getComputedStyle(footer!).opacity).toBe("0");
    expect(getComputedStyle(footer!).pointerEvents).toBe("none");

    await row.hover();

    await vi.waitFor(() => {
      expect(getComputedStyle(footer!).opacity).toBe("1");
      expect(getComputedStyle(footer!).pointerEvents).toBe("auto");
    });
    await page.getByRole("button", { name: "Copy message" }).click();
    expect(onCopy).toHaveBeenCalledOnce();
  });
});
