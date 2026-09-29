import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx diff word wrap setting", () => {
  const diffDockSource = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
  const compositionSource = readFileSync(
    new URL(
      "../../../web/src/components/pullRequest/PullRequestCodeComposition.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const lynxElementsSource = readFileSync(
    new URL("../adapters/PullRequestCodeCompositionElements.lynx.tsx", import.meta.url),
    "utf8",
  );
  const lynxStyles = readFileSync(
    new URL("../adapters/pull-request-code-composition-elements.css", import.meta.url),
    "utf8",
  );
  const webElementsSource = readFileSync(
    new URL(
      "../../../web/src/components/pullRequest/PullRequestCodeCompositionElements.tsx",
      import.meta.url,
    ),
    "utf8",
  );

  it("reads the canonical Behavior projection for working-tree diffs", () => {
    expect(diffDockSource).toContain("readSettingsBehaviorProjection(");
    expect(diffDockSource).toContain("webStorage.getItem(APP_SETTINGS_STORAGE_KEY)");
    expect(diffDockSource).toContain("wordWrap={diffWordWrap}");
    expect(diffDockSource).toContain(
      'const [diffRenderMode, setDiffRenderMode] = useState<"stacked" | "split">',
    );
    expect(diffDockSource).toContain('props.presentation !== "editor" ? diffRenderMode : "split"');
    expect(diffDockSource).toContain("onDiffWordWrapChange={setDiffWordWrap}");
    expect(diffDockSource).toContain("onCheckedChange={props.onDiffWordWrapChange}");
  });

  it("keeps word wrapping in the host-neutral code composition contract", () => {
    expect(compositionSource).toContain("readonly wordWrap?: boolean;");
    expect(compositionSource).toContain(
      "<PullRequestCodeLinesElement wordWrap={props.wordWrap ?? false}>",
    );
    expect(compositionSource).toContain("wordWrap={props.wordWrap ?? false}");
  });

  it("switches Web and Lynx hosts between horizontal scroll and wrapping", () => {
    expect(webElementsSource).toContain('props.wordWrap ? "overflow-x-hidden" : "overflow-x-auto"');
    expect(webElementsSource).toContain(
      'props.wordWrap ? "whitespace-pre-wrap wrap-break-word" : "whitespace-pre"',
    );
    expect(lynxElementsSource).toContain(
      '<view className="SharedPrCodeLines SharedPrCodeLines--wrap">',
    );
    expect(lynxElementsSource).toContain('props.wordWrap ? " SharedPrCodeLine--wrap" : ""');
    expect(lynxElementsSource).toContain("export function PullRequestCodeSplitRowElement");
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeSplitRow\s*\{[^}]*display:\s*flex;[^}]*width:\s*100%;[^}]*flex-direction:\s*row;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeSplitSide\s*\{[^}]*width:\s*50%;[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*100%;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLineText\s*\{[^}]*flex-shrink:\s*0;[^}]*white-space:\s*pre;/s,
    );
    expect(lynxStyles).toMatch(
      /\.SharedPrCodeLine--wrap \.SharedPrCodeLineText\s*\{[^}]*flex:\s*1;[^}]*min-width:\s*0;[^}]*white-space:\s*pre-wrap;/s,
    );
  });
});
