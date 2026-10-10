import { describe, expect, it } from "@rstest/core";

import {
  landingProjectHeadingLabel,
  registerLandingProjectPickerOpener,
  requestLandingProjectPicker,
} from "./landingProjectPickerRequest.logic";

describe("landing project picker request", () => {
  it("names the project heading as upstream's aria-label does", () => {
    expect(landingProjectHeadingLabel("synara-fixture-app")).toBe(
      "What should we do in synara-fixture-app?",
    );
  });

  it("reports that nothing opened when no landing composer is mounted", () => {
    expect(requestLandingProjectPicker()).toBe(false);
  });

  it("opens the most recently mounted picker and falls back when it unmounts", () => {
    const opened: string[] = [];
    const unregisterFirst = registerLandingProjectPickerOpener(() => opened.push("first"));
    const unregisterSecond = registerLandingProjectPickerOpener(() => opened.push("second"));

    expect(requestLandingProjectPicker()).toBe(true);
    unregisterSecond();
    expect(requestLandingProjectPicker()).toBe(true);
    unregisterFirst();
    expect(requestLandingProjectPicker()).toBe(false);
    expect(opened).toEqual(["second", "first"]);
  });

  it("ignores a repeated unregister", () => {
    const opened: string[] = [];
    const unregister = registerLandingProjectPickerOpener(() => opened.push("only"));
    const unregisterOther = registerLandingProjectPickerOpener(() => opened.push("other"));
    unregister();
    unregister();
    expect(requestLandingProjectPicker()).toBe(true);
    unregisterOther();
    expect(opened).toEqual(["other"]);
  });
});
