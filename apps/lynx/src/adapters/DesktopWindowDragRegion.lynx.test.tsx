import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@rstest/core";

const chatHeaderSource = fs.readFileSync(
  path.resolve(__dirname, "ChatSurfaceHeaderFrameElements.lynx.tsx"),
  "utf8",
);
const sharedChatHeaderSource = fs.readFileSync(
  path.resolve(__dirname, "../../../web/src/components/chat/ChatSurfaceHeaderFrame.tsx"),
  "utf8",
);
const webChatHeaderSource = fs.readFileSync(
  path.resolve(__dirname, "../../../web/src/components/chat/ChatSurfaceHeaderFrameElements.tsx"),
  "utf8",
);
const appStyles = fs.readFileSync(path.resolve(__dirname, "../app/App.css"), "utf8");
const routerSource = fs.readFileSync(path.resolve(__dirname, "../app/router.tsx"), "utf8");
const sidebarStyles = fs.readFileSync(
  path.resolve(__dirname, "../components/sidebar/sidebar.css"),
  "utf8",
);

describe("desktop window drag regions", () => {
  it("marks the shared chat header frame as draggable", () => {
    expect(chatHeaderSource).toContain("AppWindowDragRegion");
  });

  it("maps the standard header padding to the same physical 20px", () => {
    expect(sharedChatHeaderSource).toContain("padded={!editorRail}");
    expect(webChatHeaderSource).toContain("padded: _padded");
    expect(chatHeaderSource).toContain("AppWindowDragRegion--padded");
    expect(appStyles).toMatch(
      /\.AppWindowDragRegion--padded\s*\{[^}]*padding-left:\s*20px;[^}]*padding-right:\s*20px;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.AppMain--sidebar-closed\s+\.ThreadsLandingHeader,[\s\S]*?\.SliceRoot--viewport-compact\s+\.AppMain--sidebar-closed\s+\.ThreadPageHeader\s*\{[^}]*height:\s*92px;[^}]*padding:\s*46px 20px 0;/s,
    );
    expect(routerSource).toContain('<ChatSurfaceHeaderFrame className="ThreadsLandingHeader">');
    expect(routerSource).toContain("<OpenThreadTabStrip activeThreadId={null} />");
    // Upstream's top bar is 44px on every route (`CHAT_SURFACE_HEADER_HEIGHT_CLASS`).
    expect(appStyles).toMatch(
      /\.ThreadsLandingHeader\s*\{[^}]*height:\s*44px;[^}]*min-height:\s*44px;[^}]*flex-shrink:\s*0;/s,
    );
    expect(routerSource).toContain('<ChatSurfaceHeaderFrame className="ThreadPageHeader">');
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadPageHeader\s+\.SharedChatHeaderIdentityTitle\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
  });

  it("aligns the sidebar titlebar with the shared 46px desktop chrome", () => {
    expect(sidebarStyles).toMatch(
      /\.AppSidebarTitlebar\s*\{[^}]*height:\s*46px;[^}]*padding:\s*0 12px 0 14px;/s,
    );
  });

  it("uses the Lynxtron app-region property and protects controls", () => {
    expect(appStyles).toMatch(/\.AppWindowDragRegion\s*\{[^}]*-x-app-region:\s*drag;/s);
    expect(appStyles).toMatch(
      /\.AppWindowDragRegion \.LxButton,[^{]*\.AppWindowDragRegion \[focusable=["']true["']\],[^{]*\{[^}]*-x-app-region:\s*no-drag;/s,
    );
  });
});
