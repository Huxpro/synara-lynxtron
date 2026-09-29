import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { TranscriptStatusIcon } from "./TranscriptStatusIcon.lynx";

describe("Transcript status icon fidelity", () => {
  it("embeds concrete status colors in generated SVGs", () => {
    const { rerender } = render(<TranscriptStatusIcon kind="error" tone="error" />);
    expect(
      elementTree.root?.querySelector(".TranscriptStatusIcon")?.getAttribute("content"),
    ).toContain("#e02e2a");

    rerender(<TranscriptStatusIcon kind="search" tone="info" />);
    expect(
      elementTree.root?.querySelector(".TranscriptStatusIcon")?.getAttribute("content"),
    ).toContain("#626262");
  });

  it("uses Webs Alert, Bot, Check, and Zap identities for work tones", () => {
    const source = readFileSync(
      new URL("./TranscriptStatusIcon.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(source).toContain('import botSvg from "@synara-central-icons/robot.svg?raw";');
    expect(source).toContain('import toolSvg from "@synara-central-icons/zap.svg?raw";');
    expect(source).toContain("<CircleAlertIcon");
    expect(source).toContain("<CheckIcon");
    expect(source).toContain('props.kind === "error" || props.tone === "error"');
    expect(source).toContain("? svgColors.statusError");
    expect(source).toContain(": svgColors.statusNeutral");
    expect(source).not.toContain("if (tone === 'tool') return '›'");
    expect(source).not.toContain("return '✓'");
    expect(styles).toMatch(
      /\.TranscriptStatusIcon\s*\{[^}]*width:\s*13px;[^}]*height:\s*13px;[^}]*flex-shrink:\s*0;/,
    );
    const transcript = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    expect(transcript).toContain('<TranscriptStatusIcon kind="search" tone={props.entry.tone} />');
    expect(transcript).toContain('<TranscriptStatusIcon kind="edit" tone={props.entry.tone} />');
    expect(transcript).toContain(
      "<TranscriptStatusIcon kind={props.entry.tone} tone={props.entry.tone} />",
    );
  });
});
