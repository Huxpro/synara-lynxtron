import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx transcript Markdown width", () => {
  it("lets assistant Markdown and fenced code fill the shared transcript frame", () => {
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");
    const source = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");

    expect(source).toContain('className="TranscriptAssistantTypography"');
    expect(source).toContain('<ComposerColumnFrameSurface className="TranscriptRowFrame">');

    expect(styles).toMatch(/\.TranscriptListItem\s*\{[^}]*width:\s*100%;/s);
    expect(styles).toMatch(/\.TranscriptRowFrame\s*\{[^}]*width:\s*calc\(100% - 24px\);/s);
    expect(styles).toMatch(
      /\.TranscriptAssistantContent\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.TranscriptAssistantTypography\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s,
    );
  });
});
