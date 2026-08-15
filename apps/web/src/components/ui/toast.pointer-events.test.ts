import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("toast pointer event ownership", () => {
  it("lets page controls receive background clicks while toast actions remain interactive", () => {
    const source = readFileSync(new URL("./toast.tsx", import.meta.url), "utf8");

    expect(source).toContain(
      '"pointer-events-none relative flex overflow-hidden transition-opacity duration-250 data-expanded:opacity-100"',
    );
    expect(source).toContain(
      '"pointer-events-none absolute z-[calc(9999-var(--toast-index))]',
    );
    expect(source).toContain(
      '<div className="mt-2 flex flex-wrap items-center gap-1.5">',
    );
    expect(source).toContain(
      '"pointer-events-auto self-start rounded-md border-[var(--notification-fg)]/20',
    );
    expect(source).toContain(
      '"pointer-events-auto z-10 inline-flex shrink-0 items-center justify-center',
    );
  });
});
