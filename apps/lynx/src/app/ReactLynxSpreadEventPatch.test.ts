import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("ReactLynx spread event patch", () => {
  it("preserves background handler functions while committing transformed ids", () => {
    const spreadRuntime = readFileSync(
      new URL(
        "../../node_modules/@lynx-js/react/runtime/lib/snapshot/snapshot/spread.js",
        import.meta.url,
      ),
      "utf8",
    );
    const eventRuntime = readFileSync(
      new URL(
        "../../node_modules/@lynx-js/react/runtime/lib/snapshot/snapshot/event.js",
        import.meta.url,
      ),
      "utf8",
    );
    const rootPackage = readFileSync(new URL("../../../../package.json", import.meta.url), "utf8");

    expect(spreadRuntime).toContain(
      "const transformed = transformSpread(snapshot, index, newValue);",
    );
    expect(spreadRuntime).toContain(
      "if (!snapshot.__elements) {\n            retainSpreadWorkletCtx(transformed, oldValue);\n            return;",
    );
    expect(spreadRuntime).toContain("snapshot.__values[index] = transformed;");
    expect(eventRuntime).toContain("if (!snapshot.__elements)\n        return;");
    expect(eventRuntime).toContain(
      "__AddEvent(snapshot.__elements[elementIndex], eventType, eventName, event);",
    );
    expect(rootPackage).toContain(
      '"@lynx-js/react@0.123.1": "patches/@lynx-js%2Freact@0.123.1.patch"',
    );
  });
});
