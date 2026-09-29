import { describe, expect, it } from "@rstest/core";

import { buildThreadRelaunchUrl } from "./relaunchSurface.logic";

describe("thread relaunch surface snapshot", () => {
  it("preserves Editor and single-file dock state without changing the route", () => {
    expect(
      buildThreadRelaunchUrl({
        threadId: "thread one",
        editorMode: true,
        editorCenterMode: "diff",
        editorChatOpen: false,
        editorSearchActive: true,
        environmentOpen: false,
        diffFileTreeOpen: true,
        terminalOpen: false,
        explorerOpen: true,
        explorerPresentationMode: "single-file",
        explorerPath: "src/example file.js",
        explorerQuery: "example",
        explorerExpandedDirectories: ["src", "src/nested"],
      }),
    ).toBe(
      "synara://thread/thread%20one?diffFileTree=open&editor=open&editorMode=diff&editorChat=hidden&editorSearch=open&explorer=open&explorerMode=single-file&explorerPath=src%2Fexample+file.js&explorerQuery=example&explorerExpanded=src&explorerExpanded=src%2Fnested",
    );
  });
});
