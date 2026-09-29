import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import { SynaraLogo } from "./SynaraLogo.lynx";

const source = fs.readFileSync(path.resolve(__dirname, "SynaraLogo.lynx.tsx"), "utf8");

describe("Synara logo adapter", () => {
  it("renders the shared Synara mark as a static image identity", () => {
    render(<SynaraLogo className="size-10 pointer-events-none" aria-label="Synara" />);

    const logo = elementTree.root?.querySelector(".LynxBrandMark");
    if (!logo) throw new Error("expected Lynx brand mark");

    expect(logo.getAttribute("class")).not.toContain("pointer-events-none");
    expect(logo.getAttribute("accessibility-trait")).toBe("image");
    expect(logo.getAttribute("accessibility-label")).toBe("Synara");
    expect(logo.querySelectorAll(".LynxBrandMarkLynx")).toHaveLength(1);
  });

  it("hides an unnamed mark from accessibility like the web svg", () => {
    render(<SynaraLogo className="size-3.5" />);

    const logo = elementTree.root?.querySelector(".LynxBrandMark");
    expect(logo?.getAttribute("accessibility-label")).toBeNull();
    expect(logo?.getAttribute("accessibility-elements-hidden")).toBe("true");
  });

  it("preserves the shared non-shrinking foreground base classes", () => {
    expect(source).toContain('"shrink-0"');
    expect(source).toContain('"text-foreground"');
    expect(source).toContain("className={`${resolvedClassName} LynxBrandMark`}");
  });

  it("maps the Web 0.875rem sidebar size to the same physical 14px", () => {
    expect(source).toContain('classNames.includes("size-3.5")');
    expect(source).toContain('hasSharedSidebarSize ? { width: "14px", height: "14px" } : {}');
    expect(source).toContain('(value) => value !== "size-3.5" && value !== "pointer-events-none"');
    expect(source).toContain('accessibility-trait="image"');
  });

  it("embeds the exact secondary token for the titlebar mark", () => {
    expect(source).toContain(
      `classNames.includes(
    "text-[var(--color-text-foreground-secondary)]"`,
    );
    expect(source).toContain("svgColors.secondaryForeground");
  });

  it("uses the same shared path source as the Electron renderer", () => {
    const styles = fs.readFileSync(path.resolve(__dirname, "synara-logo.css"), "utf8");
    expect(source).toContain(
      'import { SYNARA_LOGO_PATHS } from "@synara-web/assets/synaraLogoPath"',
    );
    expect(source).toContain('viewBox="0 0 470 504"');
    expect(source).not.toContain("lynxtron-mark-");
    expect(source).not.toContain("useLynxInteractiveState");
    expect(styles).not.toContain("ui-hover");
    expect(styles).not.toContain("@keyframes");
  });
});
