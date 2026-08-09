import { describe, expect, it } from "vitest";

import { resolveInlineCodeFilePath } from "./markdownFileReferences";

describe("resolveInlineCodeFilePath", () => {
  it("accepts known files and strips author quoting", () => {
    expect(resolveInlineCodeFilePath("`src/app/router.tsx`")).toBe("src/app/router.tsx");
    expect(resolveInlineCodeFilePath("'README.md'")).toBe("README.md");
  });

  it("rejects prose, URLs, and oversized tokens", () => {
    expect(resolveInlineCodeFilePath("not a file")).toBeNull();
    expect(resolveInlineCodeFilePath("https://example.com/file.ts")).toBeNull();
    expect(resolveInlineCodeFilePath(`${"a".repeat(121)}.ts`)).toBeNull();
  });
});
