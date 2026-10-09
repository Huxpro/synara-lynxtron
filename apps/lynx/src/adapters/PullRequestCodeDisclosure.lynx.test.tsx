import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { PullRequestCodeFileHeaderElement } from "./PullRequestCodeCompositionElements.lynx";

describe("Pull Request Code disclosure fidelity", () => {
  it("embeds the semantic secondary paint in the generated file chevron", () => {
    render(
      <PullRequestCodeFileHeaderElement
        path="src/example.ts"
        previousPath={null}
        relation={null}
        additions={2}
        deletions={1}
        expanded={false}
        onActivate={() => {}}
      />,
    );

    expect(
      elementTree.root?.querySelector(".SharedPrCodeFileChevron")?.getAttribute("content"),
    ).toContain("rgba(13, 13, 13, 0.598)");
  });

  it("uses the shared SVG and 220ms disclosure contract", () => {
    const lynxElements = readFileSync(
      new URL("./PullRequestCodeCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const lynxStyles = readFileSync(
      new URL("./pull-request-code-composition-elements.css", import.meta.url),
      "utf8",
    );
    const webElements = readFileSync(
      new URL(
        "../../../web/src/components/pullRequest/PullRequestCodeCompositionElements.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const composition = readFileSync(
      new URL(
        "../../../web/src/components/pullRequest/PullRequestCodeComposition.tsx",
        import.meta.url,
      ),
      "utf8",
    );

    expect(lynxElements).toContain("<ChevronRightIcon");
    expect(lynxElements).toContain("disclosureChevronClassName(");
    expect(lynxElements).toContain('color={semanticIconColor("secondary")}');
    expect(lynxElements).toContain("useLynxDisclosurePresence(props.expanded)");
    expect(lynxElements).toContain("disclosureContentClassName(");
    expect(lynxElements).toContain("aria-expanded={props.expanded}");
    expect(lynxElements).not.toMatch(/[▸▾]/);
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFileChevron\s*\{[^}]*width:\s*10px;[^}]*height:\s*10px;[^}]*flex-shrink:\s*0;/s,
    );
    expect(lynxStyles).toMatch(/\.SharedPrCodeRoot\s*\{[^}]*gap:\s*12px;[^}]*padding:\s*12px;/s);
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFile\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-radius:\s*6px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFileHeader\s*\{[^}]*gap:\s*8px;[^}]*padding:\s*8px 12px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFileHeader\s*\{[^}]*background-color:\s*rgba\(13,\s*13,\s*13,\s*0\.014\);/s,
    );
    expect(lynxStyles).toMatch(
      /\.SliceRoot--theme-dark \.SharedPrCodeFileHeader\s*\{[^}]*background-color:\s*rgba\(252,\s*252,\s*252,\s*0\.0021\);/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeStatsText,[^{]*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeNotice\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ThreadPage[\s\S]*?> \.DiffDock[\s\S]*?\.SharedPrCodeNotice\s*\{[^}]*font-size:\s*10px;[^}]*line-height:\s*12px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFilePath\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeFilePrevious\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeMoreText\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--addition\s*\{[^}]*background-color:\s*rgba\(0,\s*162,\s*64,\s*0\.01\);[^}]*background-color:\s*color-mix\(in srgb, var\(--background\) 92%, var\(--success\)\);/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--deletion\s*\{[^}]*background-color:\s*rgba\(224,\s*46,\s*42,\s*0\.01\);[^}]*background-color:\s*color-mix\([\s\S]*?var\(--background\) 92%,[\s\S]*?var\(--destructive\)[\s\S]*?\);/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--hunk\s*\{[^}]*background-color:\s*rgba\(13,\s*13,\s*13,\s*0\.024\);/s,
    );
    expect(lynxStyles).toMatch(
      /\.SliceRoot--theme-dark \.SharedPrCodeLine--hunk\s*\{[^}]*background-color:\s*rgba\(252,\s*252,\s*252,\s*0\.0036\);/s,
    );
    expect(lynxElements).toContain('props.kind.startsWith("no-newline-")');
    expect(lynxElements).toContain('? "\\\\"');
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--no-newline-addition,[^{]*\{[^}]*color:\s*var\(--muted-foreground\);[^}]*font-style:\s*italic;/s,
    );
    expect(lynxStyles).toContain(".SharedPrCodeLine--no-newline-context");
    expect(webElements).toContain('props.kind.startsWith("no-newline-")');
    expect(webElements).toContain('? "\\\\"');
    expect(lynxStyles).toMatch(/\.SharedPrCodeLine\s*\{[^}]*min-height:\s*20px;/s);
    expect(lynxElements).toContain('className="SharedPrCodeLines"');
    expect(lynxElements).toContain('scroll-orientation="horizontal"');
    expect(lynxElements).toContain('className="SharedPrCodeLinesContent"');
    expect(lynxStyles).toMatch(/\.SharedPrCodeLinesContent\s*\{[^}]*min-width:\s*100%;/s);
    expect(lynxStyles).toMatch(/\.SharedPrCodeLine\s*\{[^}]*min-width:\s*100%;/s);
    expect(lynxStyles).not.toMatch(/\.SharedPrCodeDisclosure\s*\{[^}]*(?:height|max-height):/s);
    expect(lynxStyles).not.toMatch(/\.SharedPrCodeLine\s*\{[^}]*border-left:/);
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLineNumber\s*\{[^}]*width:\s*40px;[^}]*line-height:\s*20px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLinePrefix\s*\{[^}]*width:\s*20px;[^}]*line-height:\s*20px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLineText\s*\{[^}]*padding-right:\s*12px;[^}]*line-height:\s*20px;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeSplitSide \.SharedPrCodeLineNumber\s*\{[^}]*width:\s*25px;[^}]*border-right:\s*2px solid transparent;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeSplitSide \.SharedPrCodeLineText\s*\{[^}]*padding-left:\s*7px;/s,
    );
    expect(lynxStyles).not.toMatch(
      /\.SharedPrCodeFileHeader\.ui-(?:hover|pressed)[^{]*\{[^}]*background-color:/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeMore\.ui-hover \.SharedPrCodeMoreText,[^{]*\{[^}]*color:\s*var\(--foreground\);/s,
    );
    expect(lynxStyles).not.toMatch(
      /\.SharedPrCodeMore\.ui-(?:hover|pressed)[^{]*\{[^}]*background-color:/s,
    );

    expect(webElements).toContain(
      'import { DisclosureChevron } from "~/components/ui/DisclosureChevron";',
    );
    expect(webElements).toContain(
      'import { DisclosureRegion } from "~/components/ui/DisclosureRegion";',
    );
    expect(webElements).not.toMatch(/[▸▾]/);
    expect(composition).toContain("<PullRequestCodeDisclosureElement expanded>");
    expect(composition).toContain("<PullRequestCodeDisclosureElement expanded={isExpanded}>");
    expect(composition).toContain("file.binary ? (");
    expect(composition).toContain("Binary file changed.");
    expect(composition).toContain("file.modeChange ? (");
    expect(composition).toContain(
      "File mode changed from {file.modeChange.previous} to {file.modeChange.next}.",
    );
    expect(composition).toContain("file.lifecycle ? (");
    expect(composition).toContain('file.lifecycle === "added" ? "File added." : "File deleted."');
    expect(composition).toContain("relation={file.relation}");
    expect(lynxElements).toContain('props.relation === "copied"');
    expect(lynxElements).toContain('"copied from"');
    expect(lynxElements).toContain('props.relation === "renamed"');
    expect(lynxElements).toContain('"renamed from"');
    expect(webElements).toContain('props.relation === "copied"');
    expect(webElements).toContain('"copied from"');
    expect(webElements).toContain('props.relation === "renamed"');
    expect(webElements).toContain('"renamed from"');
    expect(composition).not.toContain("{isExpanded ? (");
    expect(composition).toContain("disabled={props.retrying}");
    expect(composition).toContain("onActivate={props.onRetry}");
    expect(composition).not.toContain("props.retrying ? () => {} : props.onRetry");
    expect(lynxElements).toContain("disabled: props.disabled");
    expect(lynxStyles).toMatch(/\.SharedPrCodeMore--disabled\s*\{[^}]*opacity:\s*0\.64;/s);
  });
});
