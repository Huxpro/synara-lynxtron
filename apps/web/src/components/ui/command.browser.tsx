import "../../index.css";

import { page } from "vitest/browser";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { Command, CommandInput, CommandItem, CommandList, CommandPanel } from "./command";

async function renderCommand(autoHighlight: false | "always") {
  return render(
    <Command autoHighlight={autoHighlight} value="">
      <CommandPanel>
        <CommandInput placeholder="Search commands" />
        <CommandList>
          <CommandItem value="new-chat">New chat</CommandItem>
          <CommandItem value="settings">Settings</CommandItem>
        </CommandList>
      </CommandPanel>
    </Command>,
  );
}

describe("Command initial highlight", () => {
  it("keeps the default fixture unhighlighted", async () => {
    const screen = await renderCommand(false);
    try {
      await expect
        .element(page.getByRole("option", { name: "New chat" }))
        .not.toHaveAttribute("data-highlighted");
    } finally {
      await screen.unmount();
    }
  });

  it("highlights the first item for the highlighted fixture", async () => {
    const screen = await renderCommand("always");
    try {
      await expect
        .element(page.getByRole("option", { name: "New chat" }))
        .toHaveAttribute("data-highlighted");
    } finally {
      await screen.unmount();
    }
  });
});
