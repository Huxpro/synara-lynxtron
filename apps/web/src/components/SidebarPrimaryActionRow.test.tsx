import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SidebarPrimaryActionRow } from "./SidebarPrimaryActionRow";
import { SidebarProvider } from "./ui/sidebar";

describe("SidebarPrimaryActionRow", () => {
  it("projects the canonical label and active state onto the interactive element", () => {
    const markup = renderToStaticMarkup(
      <SidebarProvider>
        <SidebarPrimaryActionRow
          active
          icon={<span aria-hidden>+</span>}
          label="New chat"
          onActivate={() => undefined}
        />
      </SidebarProvider>,
    );

    expect(markup).toContain('aria-label="New chat"');
    expect(markup).toContain('aria-current="page"');
    expect(markup).toContain(">New chat<");
  });

  it("preserves disabled semantics while keeping a stable accessible name", () => {
    const markup = renderToStaticMarkup(
      <SidebarProvider>
        <SidebarPrimaryActionRow
          disabled
          icon={<span aria-hidden>!</span>}
          label="Pull requests"
        />
      </SidebarProvider>,
    );

    expect(markup).toContain('aria-label="Pull requests"');
    expect(markup).toContain("disabled");
  });
});
