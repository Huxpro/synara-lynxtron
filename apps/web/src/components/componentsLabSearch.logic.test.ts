import { describe, expect, it } from "vitest";
import { resolveComponentsLabSearch } from "./componentsLabSearch.logic";

describe("Components Lab search identity", () => {
  it("prefers router search and falls back to comparison outer search", () => {
    expect(
      resolveComponentsLabSearch(
        {},
        "?story=editor-rail%2Fadd-menu&state=open&variant=chat-and-terminal&embed=electron",
      ),
    ).toEqual({
      embed: "electron",
      story: "editor-rail/add-menu",
      state: "open",
      variant: "chat-and-terminal",
    });
    expect(
      resolveComponentsLabSearch(
        { story: "sidebar/navigation-row", state: "hover" },
        "?story=ignored&state=open",
      ),
    ).toEqual({
      embed: undefined,
      story: "sidebar/navigation-row",
      state: "hover",
      variant: undefined,
    });
  });

  it("treats the Components Lab hash query as the Electron URL authority", () => {
    expect(
      resolveComponentsLabSearch(
        { story: "sidebar/project-row", state: "default" },
        "?story=sidebar%2Fproject-row&state=default",
        "#/components-lab?story=sidebar%2Fproject-row&state=active-hover&variant=pinned",
      ),
    ).toEqual({
      embed: undefined,
      story: "sidebar/project-row",
      state: "active-hover",
      variant: "pinned",
    });
  });
});
