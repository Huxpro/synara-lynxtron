import { describe, expect, it } from "vitest";

import { appTypographyCssVariables } from "./appTypography";

describe("app typography variables", () => {
  it("derives every UI and chat size from the base size", () => {
    const variables = appTypographyCssVariables(12, 13);
    expect(variables["--app-font-size-ui"]).toBe("12px");
    expect(variables["--app-font-size-ui-sm"]).toBe("11px");
    expect(variables["--app-font-size-terminal"]).toBe("13px");
    expect(Object.keys(variables)).toHaveLength(13);
    expect(appTypographyCssVariables(16, 13)["--app-font-size-ui-sm"]).toBe("15px");
  });
});
