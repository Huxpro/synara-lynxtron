import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SidebarChatsSection } from "./SidebarChatsSection";
import { SidebarProjectsSection } from "./SidebarProjectsSection";
import { SidebarProvider } from "./ui/sidebar";

function renderInSidebar(node: ReactNode) {
  return renderToStaticMarkup(<SidebarProvider>{node}</SidebarProvider>);
}

describe("Sidebar system states", () => {
  it("exposes loading, error and loaded-empty projects with bounded live semantics", () => {
    const loading = renderInSidebar(
      <SidebarProjectsSection rows={[]} renderRow={() => null} state="loading" />,
    );
    const error = renderInSidebar(
      <SidebarProjectsSection rows={[]} renderRow={() => null} state="error" />,
    );
    const empty = renderInSidebar(
      <SidebarProjectsSection rows={[]} renderRow={() => null} state="empty" />,
    );

    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-live="polite"');
    expect(loading).toContain("Loading projects...");
    expect(error).toContain('role="alert"');
    expect(error).toContain('aria-live="assertive"');
    expect(empty).toContain('role="status"');
    expect(empty).toContain("No projects yet");
  });

  it("announces the chats loaded-empty result without changing populated rows", () => {
    const empty = renderInSidebar(
      <SidebarChatsSection
        visible
        expanded
        rows={[]}
        renderRow={() => null}
        onToggle={() => undefined}
      />,
    );
    const populated = renderInSidebar(
      <SidebarChatsSection
        visible
        expanded
        rows={["Thread"]}
        renderRow={(row) => <span>{row}</span>}
        onToggle={() => undefined}
      />,
    );

    expect(empty).toContain('role="status"');
    expect(empty).toContain('aria-live="polite"');
    expect(empty).toContain("No chats yet");
    expect(populated).not.toContain('role="status"');
    expect(populated).toContain("Thread");
  });
});
