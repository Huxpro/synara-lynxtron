import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("chat surface header identity fidelity", () => {
  it("keeps constrained Native titles on one truncatable line", () => {
    const source = readFileSync(
      new URL("./ChatSurfaceHeaderIdentityElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain('text-maxline="1"');
    expect(source).toContain("{props.displayTitle ?? props.title}");
    expect(source).toContain("`Rename thread ${props.title}`");
    const styles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.SharedChatHeaderIdentity\s*\{[^}]*flex:\s*1;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;/s,
    );
    expect(styles).toMatch(
      /\.SharedChatHeaderIdentityTitle\s*\{[^}]*flex:\s*1;[^}]*flex-shrink:\s*1;[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
  });

  it("uses the Web title typography across Landing and Thread headers", () => {
    const styles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("../app/router.tsx", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.SharedChatHeaderIdentityTitle\s*\{[^}]*font-size:\s*var\(--app-font-size-ui-sm, 12px\);[^}]*line-height:\s*var\(--app-line-height-ui-sm-18, 18px\);[^}]*font-weight:\s*400;/s,
    );
    // Upstream's chat header shows the open threads as tabs in place of the title; the
    // landing (an unsent draft) shows the strip without a tab of its own.
    expect(routerSource).toContain("<OpenThreadTabStrip activeThreadId={null} />");
    expect(routerSource).toContain("<OpenThreadTabStrip\n      activeThreadId={threadId}");
    // The Editor rail keeps the titled identity.
    expect(routerSource).toContain('title="New chat"');
  });

  it("publishes the shared rename action instead of dropping it", () => {
    const adapterSource = readFileSync(
      new URL("./ChatSurfaceHeaderIdentityElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const routerSource = readFileSync(new URL("../app/router.tsx", import.meta.url), "utf8");
    expect(adapterSource).toContain("function RenamableChatSurfaceHeaderIdentityTitle(");
    expect(adapterSource).toContain("onActivate: props.onRename");
    expect(adapterSource).toContain("`Rename thread ${props.title}`");
    expect(adapterSource).toContain("if (!props.onRename) {");
    expect(adapterSource).not.toContain("disabled: !props.onRename");
    expect(routerSource).toContain('type: "thread.meta.update"');
    // The active tab carries the rename action (upstream: double-click on the tab title).
    expect(routerSource).toContain(
      "onRenameActiveThread={currentThread ? beginThreadRename : undefined}",
    );
    expect(routerSource).toContain("onConfirm={() => void commitThreadRename()}");
  });
});
