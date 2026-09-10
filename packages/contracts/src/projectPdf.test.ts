import { describe, expect, it } from "vitest";
import { Schema } from "effect";

import { ProjectInspectPdfResult } from "./project";

const decode = Schema.decodeUnknownSync(ProjectInspectPdfResult);

describe("ProjectInspectPdfResult", () => {
  it("requires positive first-page geometry with the page count", () => {
    expect(decode({ pageCount: 2, width: 612, height: 792 })).toEqual({
      pageCount: 2,
      width: 612,
      height: 792,
    });
    expect(() => decode({ pageCount: 2, width: 0, height: 792 })).toThrow();
    expect(() => decode({ pageCount: 2 })).toThrow();
  });
});
