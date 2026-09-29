import { describe, expect, it } from "vitest";
import {
  formatTimePickerPart,
  parseTimePickerValue,
  TIME_PICKER_HOURS,
  TIME_PICKER_MINUTES,
} from "./timePicker";

describe("time picker contract", () => {
  it("provides complete hour and minute domains", () => {
    expect(TIME_PICKER_HOURS).toHaveLength(24);
    expect(TIME_PICKER_MINUTES).toHaveLength(60);
  });
  it("parses, clamps, and formats values deterministically", () => {
    expect(parseTimePickerValue("09:07")).toEqual({ hour: 9, minute: 7 });
    expect(parseTimePickerValue("99:-2")).toEqual({ hour: 23, minute: 0 });
    expect(formatTimePickerPart(7)).toBe("07");
  });
});
