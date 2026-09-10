import { describe, expect, it } from "vitest";

import { emphasizePairedDiffTokens } from "./diffLineEmphasis.logic";

describe("emphasizePairedDiffTokens", () => {
  it("uses Pierre's word-with-space semantics and preserves syntax token colors", () => {
    const token = (content: string, color: string) => ({
      color,
      content,
      fontStyle: 0,
    });
    const result = emphasizePairedDiffTokens({
      deletion: {
        text: "  return true;",
        tokens: [token("  return", "#D73A49"), token(" true", "#005CC5"), token(";", "#24292E")],
      },
      addition: {
        text: "  return false;",
        tokens: [token("  return", "#D73A49"), token(" false", "#005CC5"), token(";", "#24292E")],
      },
    });

    expect(result.deletion.map(({ content, emphasized }) => ({ content, emphasized }))).toEqual([
      { content: "  return", emphasized: false },
      { content: " ", emphasized: false },
      { content: "true", emphasized: true },
      { content: ";", emphasized: false },
    ]);
    expect(result.addition.map(({ content, emphasized }) => ({ content, emphasized }))).toEqual([
      { content: "  return", emphasized: false },
      { content: " ", emphasized: false },
      { content: "false", emphasized: true },
      { content: ";", emphasized: false },
    ]);
  });
});
