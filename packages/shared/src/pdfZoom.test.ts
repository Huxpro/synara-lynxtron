import { describe, expect, it } from "vitest";

import {
  clampPdfScale,
  formatZoomPercent,
  nextZoomScale,
  PDF_MAX_SCALE,
  PDF_MIN_SCALE,
  previousZoomScale,
  resolvePdfScale,
} from "./pdfZoom";

describe("shared PDF zoom policy", () => {
  const page = { width: 100, height: 200 };

  it("clamps invalid and out-of-range custom scales", () => {
    expect(clampPdfScale(Number.NaN)).toBe(1);
    expect(clampPdfScale(0.01)).toBe(PDF_MIN_SCALE);
    expect(clampPdfScale(10)).toBe(PDF_MAX_SCALE);
  });

  it("uses the same margin-aware fit math for every renderer", () => {
    expect(resolvePdfScale({ type: "fit-width" }, page, { width: 148, height: 999 })).toBe(1);
    expect(resolvePdfScale({ type: "fit-page" }, page, { width: 148, height: 148 })).toBe(0.5);
  });

  it("steps through the canonical presets and formats the result", () => {
    expect(nextZoomScale(1)).toBe(1.25);
    expect(previousZoomScale(1)).toBe(0.75);
    expect(formatZoomPercent(1.25)).toBe("125%");
  });
});
