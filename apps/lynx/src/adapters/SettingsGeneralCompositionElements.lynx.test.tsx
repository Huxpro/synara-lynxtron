import { describe, expect, it } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import {
  SettingsGeneralBooleanControlElement,
  SettingsGeneralSectionElement,
  SettingsGeneralSelectControlElement,
} from "./SettingsGeneralCompositionElements.lynx";

describe("Settings General fidelity", () => {
  it("preserves deep-link targets and provider option identity", () => {
    const styles = readFileSync(
      new URL("./settings-general-composition-elements.css", import.meta.url),
      "utf8",
    );

    render(
      <>
        <SettingsGeneralSectionElement title="Environment panel" targetId="environment-panel">
          <text>Rows</text>
        </SettingsGeneralSectionElement>
        <SettingsGeneralSelectControlElement
          settingKey="defaultProvider"
          value="codex"
          ariaLabel="Default provider"
          options={[
            { value: "codex", label: "Codex" },
            { value: "future-provider", label: "Future provider" },
          ]}
          onChange={() => {}}
        />
      </>,
    );

    expect(elementTree.root?.querySelector("#environment-panel")?.textContent).toContain(
      "Environment panel",
    );
    expect(elementTree.root?.querySelector(".OpenAIProviderIcon")).not.toBeNull();
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.SharedSettingsGeneralSelectPopup\s*\{[^}]*height:\s*calc\(100vh - 16px\);[^}]*max-height:\s*calc\(100vh - 16px\);[^}]*overflow-y:\s*scroll;/s,
    );
    expect(
      elementTree.root?.querySelector(".SharedSettingsGeneralProviderLabel")?.textContent,
    ).toBe("Codex");

    const trigger = elementTree.root?.querySelector(".LxMenuTrigger");
    if (!trigger) throw new Error("expected provider select trigger");
    expect(trigger.getAttribute("aria-label")).toBe("Default provider");
    expect(trigger.querySelector(".LxButton")?.getAttribute("accessibility-element")).toBe("false");
    fireEvent.tap(trigger);

    const options =
      elementTree.root?.querySelectorAll(".SharedSettingsGeneralProviderOption") ?? [];
    expect(options).toHaveLength(3);
    expect(
      elementTree.root?.querySelector(".SharedSettingsGeneralProviderFallbackText")?.textContent,
    ).toBe("F");
    expect(styles).toMatch(/\.SharedSettingsGeneralProviderOption\s*\{[^}]*gap:\s*8px;/s);
    expect(styles).toMatch(
      /\.SharedSettingsGeneralProviderOption \.OpenAIProviderIcon,\s*\.SharedSettingsGeneralProviderFallback\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsGeneralProviderLabel\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
    expect(styles).toMatch(/\.SharedSettingsGeneralRowTitleLine\s*\{[^}]*min-height:\s*20px;/s);
  });

  it("keeps unavailable switches visible but inert", () => {
    let changes = 0;
    render(
      <SettingsGeneralBooleanControlElement
        checked
        disabled
        ariaLabel="Desktop activity notifications"
        onChange={() => {
          changes += 1;
        }}
      />,
    );

    const control = elementTree.root?.querySelector(".SharedSettingsGeneralSwitch--disabled");
    if (!control) throw new Error("expected disabled settings switch");
    expect(control.getAttribute("focusable")).toBe("false");
    expect(control.getAttribute("aria-disabled")).toBe("true");
    expect(control.getAttribute("aria-checked")).toBe("true");
    expect(control.getAttribute("accessibility-role")).toBe("switch");
    expect(control.getAttribute("accessibility-state")).toBe('{"checked":true,"disabled":true}');
    fireEvent.tap(control);
    expect(changes).toBe(0);
  });

  it("stacks private General rows at compact widths like the shared Web row", () => {
    const styles = readFileSync(
      new URL("./settings-general-composition-elements.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsGeneralRow\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;[^}]*gap:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsGeneralRowCopy\s*\{[^}]*padding-right:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsGeneralRowControl\s*\{[^}]*width:\s*100%;[^}]*justify-content:\s*flex-start;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SharedSettingsGeneralRow\s*\{[^}]*flex-direction:\s*row;[^}]*align-items:\s*center;[^}]*gap:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SharedSettingsGeneralRowControl\s*\{[^}]*width:\s*auto;[^}]*justify-content:\s*flex-end;/s,
    );
  });
});
