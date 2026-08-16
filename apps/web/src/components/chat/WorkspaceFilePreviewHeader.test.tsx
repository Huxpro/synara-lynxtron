// FILE: WorkspaceFilePreviewHeader.test.tsx
// Purpose: Pins large-file partial-read disclosure in the fixed preview header.
// Layer: Chat workspace file preview regression test

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { WorkspaceFilePreviewHeader } from "./WorkspaceFilePreviewHeader";

describe("WorkspaceFilePreviewHeader", () => {
  it("keeps partial-read disclosure available at every header width", () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const markup = renderToStaticMarkup(
      <QueryClientProvider client={queryClient}>
        <WorkspaceFilePreviewHeader
          workspaceRoot="/tmp/workspace"
          filePath="large.txt"
          isMarkdown={false}
          markdownPreviewEnabled={false}
          onMarkdownPreviewChange={() => undefined}
          truncated
        />
      </QueryClientProvider>,
    );

    expect(markup).toContain('aria-label="Preview truncated at 1 MB."');
    expect(markup).toContain("@sm/header-actions:hidden");
    expect(markup).toContain(">Partial</span>");
    expect(markup).toContain("hidden @sm/header-actions:inline");
    expect(markup).toContain(">Shown partially</span>");
  });
});
